import { Alias } from '../../src/ast/Alias';
import { BinaryExpression } from '../../src/ast/BinaryExpression';
import { Column } from '../../src/ast/Column';
import { JsonEachFrom } from '../../src/ast/From';
import { Join, JoinType } from '../../src/ast/Join';
import { NumberLiteral } from '../../src/ast/Literals';
import { Operator } from '../../src/ast/Operator';
import { SelectQuery } from '../../src/ast/SelectQuery';
import { COLUMN, EQ, JOIN } from '../../src/builder/Shorthand';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';

const EXPECTED_QUERY_COMPACT = 'SELECT value FROM json_each(u.preferences) prefs INNER JOIN users u ON (u.id = 1)';

const EXPECTED_QUERY_INDENTED = `
SELECT
  value
FROM json_each(u.preferences) prefs
INNER JOIN users u ON (u.id = 1)
`.trim();

describe('Select Query with Simple json_each', () => {

  test('builds and renders query with json_each and column reference', () => {
    const query = SelectQuery.create()
      .from(new Alias(new JsonEachFrom(new Column('u', 'preferences')), 'prefs'))
      .column(new Column('value'))
      .join(
        new Join(
          JoinType.INNER,
          'users',
          'u',
          new BinaryExpression(
            new Column('u', 'id'),
            Operator.EQUALS,
            new NumberLiteral(1)
          )
        )
      );

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });

  test('builds and renders query with json_each and column reference using Shorthand API', () => {
    const query = SelectQuery.create()
      .from(new Alias(new JsonEachFrom(COLUMN('u', 'preferences')), 'prefs'))
      .column(COLUMN('value'))
      .join(JOIN('users', 'u', EQ(COLUMN('u', 'id'), 1)));

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });
});