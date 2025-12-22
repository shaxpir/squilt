import { Alias } from '../../src/ast/Alias';
import { Column } from '../../src/ast/Column';
import { TableFrom } from '../../src/ast/From';
import { Operator } from '../../src/ast/Operator';
import { SelectQuery } from '../../src/ast/SelectQuery';
import { UnaryExpression } from '../../src/ast/UnaryExpression';
import { COLUMN, FROM, IS_NULL, SELECT } from '../../src/builder/Shorthand';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';

const EXPECTED_QUERY_COMPACT = 'SELECT name FROM users u WHERE (u.email IS NULL)';

const EXPECTED_QUERY_INDENTED = `
SELECT
  name
FROM users u
WHERE (u.email IS NULL)
`.trim();

describe('Select Query with Unary IS NULL', () => {
  let indentedRenderer: IndentedQueryRenderer;
  let compactRenderer: CompactQueryRenderer;

  beforeEach(() => {
    indentedRenderer = new IndentedQueryRenderer(2);
    compactRenderer = new CompactQueryRenderer();
  });

  test('builds and renders query with unary IS NULL expression', () => {
    const query = SelectQuery.create()
      .from(new Alias(new TableFrom('users'), 'u'))
      .column(new Column('name'))
      .where(
        new UnaryExpression(
          Operator.IS_NULL,
          new Column('u', 'email')
        )
      );

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });

  test('builds and renders query with unary IS NULL expression using Shorthand API', () => {
    const query = SELECT(
      FROM('users').as('u'),
      COLUMN('name'))
      .where(IS_NULL(COLUMN('u', 'email')));

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });
});