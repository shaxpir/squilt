import { Alias } from '../../src/ast/Alias';
import { BinaryExpression } from '../../src/ast/BinaryExpression';
import { Column } from '../../src/ast/Column';
import { ExistsExpression } from '../../src/ast/ExistsExpression';
import { TableFrom } from '../../src/ast/From';
import { NumberLiteral, Param } from '../../src/ast/Literals';
import { Operator } from '../../src/ast/Operator';
import { SelectQuery } from '../../src/ast/SelectQuery';
import { COLUMN, EQ, EXISTS, FROM, SELECT, VAL } from '../../src/builder/Shorthand';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';
import { ParamCollectingVisitor } from '../../src/visitor/ParamCollector';

const EXPECTED_QUERY_COMPACT = 'SELECT name FROM products p WHERE EXISTS (SELECT 1 FROM inventory i WHERE ((i.product_id = p.id) AND (i.stock > ?)))';

const EXPECTED_QUERY_INDENTED = `
SELECT
  name
FROM products p
WHERE EXISTS (
  SELECT
    1
  FROM inventory i
  WHERE ((i.product_id = p.id) AND (i.stock > ?))
)
`.trim();

describe('Select Query with EXISTS', () => {
  test('builds and renders query with EXISTS and quoted identifiers', () => {
    const subquery = SelectQuery.create()
      .from(new Alias(new TableFrom('inventory'), 'i'))
      .column(new NumberLiteral(1))
      .where(
        new BinaryExpression(
          new BinaryExpression(
            new Column('i', 'product_id'),
            Operator.EQUALS,
            new Column('p', 'id')
          ),
          Operator.AND,
          new BinaryExpression(
            new Column('i', 'stock'),
            Operator.GREATER_THAN,
            new Param('minStock')
          )
        )
      );

    const query = SelectQuery.create()
      .from(new Alias(new TableFrom('products'), 'p'))
      .column(new Column('name'))
      .where(new ExistsExpression(subquery));

    const keyValuePairs = { minStock: 0 };
    const paramCollector = new ParamCollectingVisitor(keyValuePairs);
    const params = query.accept(paramCollector);
    expect(params).toEqual([0]);

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });

  test('builds and renders query with EXISTS and quoted identifiers using Shorthand API', () => {
    const subquery = SELECT(
      FROM('inventory').as('i'),
      VAL(1)
    ).where(
      new BinaryExpression(
        EQ(COLUMN('i', 'product_id'), COLUMN('p', 'id')),
        Operator.AND,
        new BinaryExpression(
          COLUMN('i', 'stock'),
          Operator.GREATER_THAN,
          new Param('minStock')
        )
      )
    );

    const query = SELECT(
      FROM('products').as('p'),
      COLUMN('name')
    ).where(EXISTS(subquery));

    const keyValuePairs = { minStock: 0 };
    const paramCollector = new ParamCollectingVisitor(keyValuePairs);
    const params = query.accept(paramCollector);
    expect(params).toEqual([0]);

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });
});