import { Alias } from '../../src/ast/Alias';
import { Column } from '../../src/ast/Column';
import { TableFrom } from '../../src/ast/From';
import { SelectQuery } from '../../src/ast/SelectQuery';
import { COLUMN, FROM, SELECT } from '../../src/builder/Shorthand';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';
import { CommonQueryValidator } from '../../src/validate/CommonQueryValidator';
import { SQLiteQueryValidator } from '../../src/validate/SQLiteQueryValidator';

const EXPECTED_QUERY_COMPACT = "SELECT u.id AS user_id, name FROM users u";

const EXPECTED_QUERY_INDENTED = `
SELECT
  u.id AS user_id,
  name
FROM users u
`.trim();

describe('Validate Simple Select Query', () => {

  test('valid simple SELECT query passes both validators', () => {
    const query = SelectQuery.create()
      .from(new Alias(new TableFrom('users'), 'u'))
      .column(new Alias(new Column('u', 'id'), 'user_id'))
      .column(new Column('name'));
      
    expect(() => query.accept(new CommonQueryValidator())).not.toThrow();
    expect(() => query.accept(new SQLiteQueryValidator())).not.toThrow();

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });

  test('valid simple SELECT query passes both validators using Shorthand API', () => {
    const query = SELECT(
      FROM('users').as('u'), 
      COLUMN('u', 'id').as('user_id'),
      COLUMN('name')
    );
    
    expect(() => query.accept(new CommonQueryValidator())).not.toThrow();
    expect(() => query.accept(new SQLiteQueryValidator())).not.toThrow();

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });
});