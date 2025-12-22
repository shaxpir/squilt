import { NumberLiteral, StringLiteral } from '../../src/ast/Literals';
import { QueryBuilder } from '../../src/builder/QueryBuilder';
import { INSERT } from '../../src/builder/Shorthand';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';
import { CommonQueryValidator } from '../../src/validate/CommonQueryValidator';
import { SQLiteQueryValidator } from '../../src/validate/SQLiteQueryValidator';

const EXPECTED_QUERY_COMPACT = "INSERT INTO users (id, name, active) VALUES (1, 'John Doe', 1)";

const EXPECTED_QUERY_INDENTED = `
INSERT
INTO users
(id, name, active)
VALUES
(1, 'John Doe', 1)
`.trim();

describe('Validate INSERT with Literals', () => {

  test('valid INSERT with literals passes both validators', () => {
    const query = QueryBuilder.insertInto('users')
      .columns('id', 'name', 'active')
      .values(new NumberLiteral(1), new StringLiteral('John Doe'), new NumberLiteral(1));
    
    expect(() => query.accept(new CommonQueryValidator())).not.toThrow();
    expect(() => query.accept(new SQLiteQueryValidator())).not.toThrow();

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });

  test('valid INSERT with literals passes both validators using Shorthand API', () => {
    const query = INSERT('users', ['id', 'name', 'active'], [1, 'John Doe', 1]);
    
    expect(() => query.accept(new CommonQueryValidator())).not.toThrow();
    expect(() => query.accept(new SQLiteQueryValidator())).not.toThrow();

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });
});