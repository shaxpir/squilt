import { Alias } from '../../src/ast/Alias';
import { BinaryExpression } from '../../src/ast/BinaryExpression';
import { Column } from '../../src/ast/Column';
import { TableFrom } from '../../src/ast/From';
import { JoinType } from '../../src/ast/Join';
import { Operator } from '../../src/ast/Operator';
import { SelectQuery } from '../../src/ast/SelectQuery';
import { COLUMN, EQ, FROM, JOIN, SELECT } from '../../src/builder/Shorthand';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';

const EXPECTED_QUERY_COMPACT = 'SELECT id FROM orders o INNER JOIN users u ON (o.user_id = u.id)';

const EXPECTED_QUERY_INDENTED = `
SELECT
  id
FROM orders o
INNER JOIN users u ON (o.user_id = u.id)
`.trim();

describe('Select Query with JOIN', () => {

  test('builds and renders query with JOIN and quoted identifiers', () => {
    const query = SelectQuery.create()
      .from(new Alias(new TableFrom('orders'), 'o'))
      .column(new Column('id'))
      .join(
        JoinType.INNER,
        'users',
        'u',
        new BinaryExpression(
          new Column('o', 'user_id'),
          Operator.EQUALS,
          new Column('u', 'id')
        )
      );

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });

  test('builds and renders query with JOIN and quoted identifiers using Shorthand API', () => {
    const query = SELECT(
      FROM('orders').as('o'),
      COLUMN('id'))
      .join(JOIN('users', 'u',
        EQ(COLUMN('o', 'user_id'), COLUMN('u', 'id'))
      ));

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });
});