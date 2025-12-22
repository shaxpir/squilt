import { Alias } from '../../src/ast/Alias';
import { BinaryExpression } from '../../src/ast/BinaryExpression';
import { Column } from '../../src/ast/Column';
import { TableFrom } from '../../src/ast/From';
import { Param } from '../../src/ast/Literals';
import { Operator } from '../../src/ast/Operator';
import { SelectQuery } from '../../src/ast/SelectQuery';
import { AND, COLUMN, FROM, GT, LIKE, PARAM, SELECT } from '../../src/builder/Shorthand';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';
import { ParamCollectingVisitor } from '../../src/visitor/ParamCollector';

const EXPECTED_QUERY_COMPACT = 'SELECT name FROM products p WHERE ((p.price > ?) AND (p.color LIKE ?))';

const EXPECTED_QUERY_INDENTED = `
SELECT
  name
FROM products p
WHERE ((p.price > ?) AND (p.color LIKE ?))
`.trim();

describe('Select Query with Named Parameters', () => {

  test('collects named parameters in correct order', () => {
    const query = SelectQuery.create()
      .from(new Alias(new TableFrom('products'), 'p'))
      .column(new Column('name'))
      .where(
        new BinaryExpression(
          new BinaryExpression(
            new Column('p', 'price'),
            Operator.GREATER_THAN,
            new Param('minPrice')
          ),
          Operator.AND,
          new BinaryExpression(
            new Column('p', 'color'),
            Operator.LIKE,
            new Param('colorPattern')
          )
        )
      );

    const keyValuePairs = {
      minPrice: 9.99,
      colorPattern: '%blue%',
    };

    const paramCollector = new ParamCollectingVisitor(keyValuePairs);
    const params = query.accept(paramCollector);

    expect(params).toEqual([9.99, '%blue%']);

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });

  test('collects named parameters in correct order using Shorthand API', () => {
    const query = SELECT(
      FROM('products').as('p'),
      COLUMN('name')
    )
    .where(
      AND(
        GT(COLUMN('p', 'price'), PARAM('minPrice')),
        LIKE(COLUMN('p', 'color'), PARAM('colorPattern'))
      )
    );

    const keyValuePairs = {
      minPrice: 9.99,
      colorPattern: '%blue%',
    };

    const paramCollector = new ParamCollectingVisitor(keyValuePairs);
    const params = query.accept(paramCollector);

    expect(params).toEqual([9.99, '%blue%']);

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });
});