import { Column } from '../../src/ast/Column';
import { TableFrom } from '../../src/ast/From';
import { SelectQuery } from '../../src/ast/SelectQuery';
import { UnaryExpression } from '../../src/ast/UnaryExpression';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';
import { CommonQueryValidator } from '../../src/validate/CommonQueryValidator';
import { SQLiteQueryValidator } from '../../src/validate/SQLiteQueryValidator';

const EXPECTED_ERROR_MESSAGE = 'Unary operator INVALID is not supported in SQLite';

const EXPECTED_QUERY_COMPACT = "SELECT * FROM users WHERE (INVALIDid)";

const EXPECTED_QUERY_INDENTED = `
SELECT
  *
FROM users
WHERE (INVALIDid)
`.trim();

describe('Validate Invalid Unary Operator', () => {

  test('Invalid unary operator fails SQLite validation', () => {
    const query = SelectQuery.create()
      .from(new TableFrom('users'))
      .where(
        new UnaryExpression('INVALID' as any, new Column('id'))
      );
        
    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);

    expect(() => query.accept(new CommonQueryValidator())).not.toThrow();
    expect(() => query.accept(new SQLiteQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
  });

  // Note: Shorthand API does not support arbitrary unary operators like 'INVALID', so no equivalent test is added.
  // The Shorthand API only supports specific operators (e.g., IS_NULL, IS_NOT_NULL, PLUS, MINUS, NOT).
  // Adding a test with an invalid operator would require modifying Shorthand.ts to allow such cases, which is not practical.
});