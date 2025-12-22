import { Column } from '../../src/ast/Column';
import { TableFrom } from '../../src/ast/From';
import { SelectQuery } from '../../src/ast/SelectQuery';
import { COLUMN, FROM, SELECT, UNION } from '../../src/builder/Shorthand';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';
import { CommonQueryValidator } from '../../src/validate/CommonQueryValidator';
import { SQLiteQueryValidator } from '../../src/validate/SQLiteQueryValidator';

const EXPECTED_QUERY_COMPACT = "SELECT name FROM users UNION SELECT name FROM users";

const EXPECTED_QUERY_INDENTED = `
SELECT
  name
FROM users
UNION
  SELECT
    name
  FROM users
`.trim();

describe('Validate Select Query with UNION', () => {

  test('valid query with UNION passes both validators', () => {
    const query1 = SelectQuery.create()
      .from(new TableFrom('users'))
      .column(new Column('name'));

    const query2 = SelectQuery.create()
      .from(new TableFrom('users'))
      .column(new Column('name'));

    const query = query1.union(query2);
    
      expect(() => query.accept(new CommonQueryValidator())).not.toThrow();
      expect(() => query.accept(new SQLiteQueryValidator())).not.toThrow();
  
      expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
      expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });

  test('valid query with UNION passes both validators using Shorthand API', () => {

    const query = SELECT(
      FROM('users'),
      COLUMN('name')
    ).union(
      SELECT(
        FROM('users'),
        COLUMN('name')
      )
    );
    
    expect(() => query.accept(new CommonQueryValidator())).not.toThrow();
    expect(() => query.accept(new SQLiteQueryValidator())).not.toThrow();

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });
});