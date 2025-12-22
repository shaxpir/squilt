import { Alias } from '../../src/ast/Alias';
import { BinaryExpression } from '../../src/ast/BinaryExpression';
import { Column } from '../../src/ast/Column';
import { TableFrom } from '../../src/ast/From';
import { Param } from '../../src/ast/Literals';
import { Operator } from '../../src/ast/Operator';
import { SelectQuery } from '../../src/ast/SelectQuery';
import { AND, COLUMN, FROM, GT, LT, PARAM, SELECT } from '../../src/builder/Shorthand';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';
import { ParamCollectingVisitor } from '../../src/visitor/ParamCollector';

const EXPECTED_QUERY_COMPACT = 'SELECT name FROM products p WHERE ((p.price > ?) AND (p.price < ?))';

const EXPECTED_QUERY_INDENTED = `
SELECT
  name
FROM products p
WHERE ((p.price > ?) AND (p.price < ?))
`.trim();

describe('Select Query with Duplicate Parameters', () => {

  test('handles duplicate parameter names in query', () => {
    const query = SelectQuery.create()
      .from(new Alias(new TableFrom('products'), 'p'))
      .column(new Column('name'))
      .where(
        new BinaryExpression(
          new BinaryExpression(
            new Column('p', 'price'),
            Operator.GREATER_THAN,
            new Param('threshold')
          ),
          Operator.AND,
          new BinaryExpression(
            new Column('p', 'price'),
            Operator.LESS_THAN,
            new Param('threshold')
          )
        )
      );

    const keyValuePairs = {
      threshold: 50,
    };

    const paramCollector = new ParamCollectingVisitor(keyValuePairs);
    const params = query.accept(paramCollector);

    expect(params).toEqual([50, 50]);

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });

  test('handles duplicate parameter names in query using Shorthand API', () => {
    const query = SELECT(
      FROM('products').as('p'),
      COLUMN('name')
    )
    .where(
      AND(
        GT(COLUMN('p', 'price'), PARAM('threshold')),
        LT(COLUMN('p', 'price'), PARAM('threshold'))
      )
    );

    const keyValuePairs = {
      threshold: 50,
    };

    const paramCollector = new ParamCollectingVisitor(keyValuePairs);
    const params = query.accept(paramCollector);

    expect(params).toEqual([50, 50]);

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });
});