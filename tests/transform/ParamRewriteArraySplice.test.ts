import { Column } from '../../src/ast/Column';
import { TableFrom } from '../../src/ast/From';
import { InExpression } from '../../src/ast/InExpression';
import { NumberLiteral, Param } from '../../src/ast/Literals';
import { SelectQuery } from '../../src/ast/SelectQuery';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { QueryParamRewriteTransformer } from '../../src/visitor/QueryParamRewriteTransformer';

describe('QueryParamRewriteTransformer with Array Splicing', () => {
  test('splices array replacement into IN values list', () => {
    const query = new SelectQuery();
    query.from(new TableFrom('t'));
    query.column(new Column('*'));
    query.where(new InExpression(new Column('a'), [new Param('list')]));

    const replacement = [new NumberLiteral(1), new NumberLiteral(2)];

    const transformer = new QueryParamRewriteTransformer('list', replacement);
    const transformed = transformer.transform(query) as SelectQuery;

    const renderer = new CompactQueryRenderer();
    const transformedSql = transformed.toSQL(renderer);

    expect(transformedSql).toBe('SELECT * FROM t WHERE (a IN (1, 2))');
  });

  test('throws when splicing array into non-list context', () => {
    const query = new SelectQuery();
    query.from(new TableFrom('t'));
    query.column(new Column('*'));
    query.where(new Param('single'));

    const replacement = [new NumberLiteral(1), new NumberLiteral(2)];

    const transformer = new QueryParamRewriteTransformer('single', replacement);

    expect(() => transformer.transform(query)).toThrow('Unexpected array in single-node context');
  });

  test('splices multiple array replacements using object syntax', () => {
    const query = new SelectQuery();
    query.from(new TableFrom('t'));
    query.column(new Column('*'));
    query.where(
      new InExpression(
        new Column('a'), 
        [new InExpression(new Column('b'), [new Param('list1')]), new Param('list2')]
      )
    );

    const transformer = new QueryParamRewriteTransformer({
      'list1': [new NumberLiteral(1), new NumberLiteral(2)],
      'list2': [new NumberLiteral(3), new NumberLiteral(4)]
    });
    const transformed = transformer.transform(query) as SelectQuery;

    const renderer = new CompactQueryRenderer();
    const transformedSql = transformed.toSQL(renderer);

    expect(transformedSql).toBe('SELECT * FROM t WHERE (a IN ((b IN (1, 2)), 3, 4))');
  });
});