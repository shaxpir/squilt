import { Alias } from '../../src/ast/Alias';
import { BinaryExpression } from '../../src/ast/BinaryExpression';
import { Column } from '../../src/ast/Column';
import { TableFrom } from '../../src/ast/From';
import { NumberLiteral } from '../../src/ast/Literals';
import { Operator } from '../../src/ast/Operator';
import { SelectQuery } from '../../src/ast/SelectQuery';
import { COLUMN, EQ, FROM, SELECT, WITH } from '../../src/builder/Shorthand';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';

const EXPECTED_QUERY_COMPACT = 'WITH active_users AS (SELECT id FROM users WHERE (active = 1)) SELECT id FROM active_users au';

const EXPECTED_QUERY_INDENTED = `
WITH
  active_users AS (
    SELECT
      id
    FROM users
    WHERE (active = 1)
  )
SELECT
  id
FROM active_users au
`.trim();

describe('Select Query with WITH Clause', () => {

  test('builds and renders query with WITH clause and subquery and quoted identifiers', () => {
    const subquery = SelectQuery.create()
      .from(new TableFrom('users'))
      .column(new Column('id'))
      .where(
        new BinaryExpression(
          new Column('active'),
          Operator.EQUALS,
          new NumberLiteral(1)
        )
      );

    const query = SelectQuery.create()
      .with('active_users', subquery)
      .from(new Alias(new TableFrom('active_users'), 'au'))
      .column(new Column('id'));

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });

  test('builds and renders query with WITH clause and subquery and quoted identifiers using Shorthand API', () => {
    const subquery = SELECT(FROM('users'), COLUMN('id'))
      .where(EQ(COLUMN('active'), 1));

    const query = SELECT(
      FROM('active_users').as('au'),
      COLUMN('id')
    )
    .with(WITH('active_users', subquery));

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });
});