import { Alias } from '../../src/ast/Alias';
import { BinaryExpression } from '../../src/ast/BinaryExpression';
import { Column } from '../../src/ast/Column';
import { TableFrom } from '../../src/ast/From';
import { FunctionExpression } from '../../src/ast/FunctionExpression';
import { NumberLiteral } from '../../src/ast/Literals';
import { Operator } from '../../src/ast/Operator';
import { SelectQuery } from '../../src/ast/SelectQuery';
import { COLUMN, FN, FROM, GT, HAVING, SELECT } from '../../src/builder/Shorthand';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';

const EXPECTED_QUERY_COMPACT =  'SELECT user_id, COUNT(id) AS order_count FROM orders GROUP BY user_id HAVING (COUNT(id) > 5)';

const EXPECTED_QUERY_INDENTED = `
SELECT
  user_id,
  COUNT(id) AS order_count
FROM orders
GROUP BY user_id
HAVING (COUNT(id) > 5)
`.trim();

describe('Select Query with GROUP BY and HAVING', () => {

  test('builds and renders query with GROUP BY and HAVING and quoted identifiers', () => {
    const query = SelectQuery.create()
      .from(new TableFrom('orders'))
      .column(new Column('user_id'))
      .column(new Alias(new FunctionExpression('COUNT', [new Column('id')]), 'order_count'))
      .groupBy(new Column('user_id'))
      .having(
        new BinaryExpression(
          new FunctionExpression('COUNT', [new Column('id')]),
          Operator.GREATER_THAN,
          new NumberLiteral(5)
        )
      );

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });

  test('builds and renders query with GROUP BY and HAVING and quoted identifiers using Shorthand API', () => {
    const query = SELECT(
      FROM('orders'), 
      COLUMN('user_id'),
      FN('COUNT', COLUMN('id')).as('order_count')
    )
    .groupBy('user_id')
    .having(HAVING(GT(FN('COUNT', COLUMN('id')), 5)));

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });
});