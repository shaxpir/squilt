import { BinaryExpression } from '../../src/ast/BinaryExpression';
import { Column } from '../../src/ast/Column';
import { TableFrom } from '../../src/ast/From';
import { Param } from '../../src/ast/Literals';
import { Operator } from '../../src/ast/Operator';
import { SelectQuery } from '../../src/ast/SelectQuery';
import { COLUMN, FROM, GT, PARAM, SELECT } from '../../src/builder/Shorthand';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';

const EXPECTED_QUERY_COMPACT = 'SELECT name FROM products WHERE (products.price > ?)';

const EXPECTED_QUERY_INDENTED = `
SELECT
  name
FROM products
WHERE (products.price > ?)
`.trim();

describe('Select Query with WHERE Clause', () => {
  let indentedRenderer: IndentedQueryRenderer;
  let compactRenderer: CompactQueryRenderer;

  beforeEach(() => {
    indentedRenderer = new IndentedQueryRenderer(2);
    compactRenderer = new CompactQueryRenderer();
  });

  test('builds and renders query with WHERE clause and quoted identifiers', () => {
    const query = SelectQuery.create()
      .from(new TableFrom('products'))
      .column(new Column('name'))
      .where(
        new BinaryExpression(
          new Column('products', 'price'),
          Operator.GREATER_THAN,
          new Param('minPrice')
        )
      );

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });

  test('builds and renders query with WHERE clause and quoted identifiers using Shorthand API', () => {
    const query = SELECT(FROM('products'), COLUMN('name'))
      .where(GT(COLUMN('products', 'price'), PARAM('minPrice')));

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });
});