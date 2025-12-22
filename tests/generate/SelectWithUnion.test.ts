import { BinaryExpression } from '../../src/ast/BinaryExpression';
import { Column } from '../../src/ast/Column';
import { TableFrom } from '../../src/ast/From';
import { StringLiteral } from '../../src/ast/Literals';
import { Operator } from '../../src/ast/Operator';
import { SelectQuery } from '../../src/ast/SelectQuery';
import { COLUMN, EQ, FROM, SELECT, UNION } from '../../src/builder/Shorthand';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';

const EXPECTED_QUERY_COMPACT = `SELECT * UNION SELECT name FROM users WHERE (type = 'admin') UNION SELECT name FROM users WHERE (type = 'manager')`;

const EXPECTED_QUERY_INDENTED = `
SELECT
  *
UNION
  SELECT
    name
  FROM users
  WHERE (type = 'admin')
UNION
  SELECT
    name
  FROM users
  WHERE (type = 'manager')
`.trim();

describe('Select Query with UNION', () => {

  test('builds and renders query with UNION and quoted identifiers', () => {
    const query1 = SelectQuery.create()
      .from(new TableFrom('users'))
      .column(new Column('name'))
      .where(
        new BinaryExpression(
          new Column('type'),
          Operator.EQUALS,
          new StringLiteral('admin')
        )
      );

    const query2 = SelectQuery.create()
      .from(new TableFrom('users'))
      .column(new Column('name'))
      .where(
        new BinaryExpression(
          new Column('type'),
          Operator.EQUALS,
          new StringLiteral('manager')
        )
      );

    const query = SelectQuery.create()
      .union(query1)
      .union(query2);

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });

  test('builds and renders query with UNION and quoted identifiers using Shorthand API', () => {

    // NOTE: table name before column name
    const query1 = SELECT(
      FROM('users'),
      COLUMN('name')
    )
    .where(EQ(COLUMN('type'), 'admin'));

    // NOTE: column name before table name
    const query2 = SELECT(
      COLUMN('name'),
      FROM('users')
    )
    .where(EQ(COLUMN('type'), 'manager'));

    const query = UNION(query1, query2);

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });
});