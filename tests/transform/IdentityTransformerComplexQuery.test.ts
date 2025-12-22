import { Alias } from '../../src/ast/Alias';
import { BinaryExpression } from '../../src/ast/BinaryExpression';
import { CaseExpression } from '../../src/ast/CaseExpression';
import { Column } from '../../src/ast/Column';
import { Concat } from '../../src/ast/Concat';
import { ExistsExpression } from '../../src/ast/ExistsExpression';
import { TableFrom, SubqueryFrom } from '../../src/ast/From';
import { FunctionExpression } from '../../src/ast/FunctionExpression';
import { JoinType } from '../../src/ast/Join';
import { NumberLiteral, StringLiteral } from '../../src/ast/Literals';
import { Operator } from '../../src/ast/Operator';
import { OrderByDirection } from '../../src/ast/OrderBy';
import { SelectQuery } from '../../src/ast/SelectQuery';
import { UnaryExpression } from '../../src/ast/UnaryExpression';
import { With } from '../../src/ast/With';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { QueryIdentityTransformer } from '../../src/visitor/QueryIdentityTransformer';

describe('QueryIdentityTransformer with Complex Query', () => {
  test('transforms complex query without changes', () => {
    // Build a complex query with various elements
    const subquery = new SelectQuery();
    subquery.from(new TableFrom('sub_table'));
    subquery.column(new Column('sub_id'));
    subquery.where(new BinaryExpression(new Column('sub_status'), Operator.EQUALS, new StringLiteral('active')));

    const withClause = new With('cte', subquery);

    const mainQuery = new SelectQuery();
    mainQuery.with(withClause);
    mainQuery.distinct();
    mainQuery.from(new Alias(new SubqueryFrom(subquery), 'sub'));
    mainQuery.column(new Alias(new Column('id'), 'user_id'));
    mainQuery.column(new Concat(new StringLiteral('Hello, '), new Column('name')).as('greeting'));
    mainQuery.column(new CaseExpression([
      { when: new UnaryExpression(Operator.NOT, new BinaryExpression(new Column('age'), Operator.GREATER_THAN, new NumberLiteral(18))), then: new StringLiteral('minor') }
    ], new StringLiteral('adult')).as('age_group'));
    mainQuery.column(new FunctionExpression('COUNT', [new Column('*')]).as('count'));
    mainQuery.join(JoinType.INNER, 'other_table', 'ot', new BinaryExpression(new Column('id'), Operator.EQUALS, new Column('ot', 'fk_id')));
    mainQuery.where(new ExistsExpression(subquery));
    mainQuery.groupBy('id');
    mainQuery.having(new BinaryExpression(new FunctionExpression('COUNT', [new Column('*')]), Operator.GREATER_THAN, new NumberLiteral(1)));
    mainQuery.orderBy(new Column('name'), OrderByDirection.DESC);
    mainQuery.limit(10);
    mainQuery.offset(5);

    const transformer = new QueryIdentityTransformer();
    const transformed = transformer.transform(mainQuery) as SelectQuery;

    // Render both original and transformed to compare
    const renderer = new CompactQueryRenderer();
    const originalSql = mainQuery.toSQL(renderer);
    const transformedSql = transformed.toSQL(renderer);

    expect(transformed).not.toBe(mainQuery); // New object
    expect(transformedSql).toBe(originalSql); // Same SQL output
  });
});