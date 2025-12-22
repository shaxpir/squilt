import { Alias } from '../../src/ast/Alias';
import { Column } from '../../src/ast/Column';
import { TableFrom } from '../../src/ast/From';
import { Operator } from '../../src/ast/Operator';
import { SelectQuery } from '../../src/ast/SelectQuery';
import { UnaryExpression } from '../../src/ast/UnaryExpression';
import { COLUMN, FROM, MINUS, SELECT } from '../../src/builder/Shorthand';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';

const EXPECTED_QUERY_COMPACT = 'SELECT (-p.price) AS negated_price FROM products p';

const EXPECTED_QUERY_INDENTED = `
SELECT
  (-p.price) AS negated_price
FROM products p
`.trim();

describe('Select Query with Unary MINUS', () => {

  test('builds and renders query with unary MINUS expression', () => {
    const query = SelectQuery.create()
      .from(new Alias(new TableFrom('products'), 'p'))
      .column(
        new Alias(
          new UnaryExpression(
            Operator.MINUS,
            new Column('p', 'price')
          ),
          'negated_price'
        )
      );

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });

  test('builds and renders query with unary MINUS expression using Shorthand API', () => {
    const query = SELECT(
      FROM('products').as('p'),
      new Alias(MINUS(COLUMN('p', 'price')), 'negated_price')
    );

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });
});