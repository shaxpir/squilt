import { Param } from '../../src/ast/Literals';
import { QueryBuilder } from '../../src/builder/QueryBuilder';
import { INSERT, PARAM } from '../../src/builder/Shorthand';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';
import { CommonQueryValidator } from '../../src/validate/CommonQueryValidator';
import { SQLiteQueryValidator } from '../../src/validate/SQLiteQueryValidator';

const EXPECTED_QUERY_COMPACT = "INSERT INTO user_dictionary (id, data) VALUES (?, ?)";

const EXPECTED_QUERY_INDENTED = `
INSERT
INTO user_dictionary
(id, data)
VALUES
(?, ?)
`.trim();

describe('Validate Simple Insert Query', () => {

  test('valid simple INSERT query passes both validators', () => {
    const query = QueryBuilder.insertInto('user_dictionary')
      .columns('id', 'data')
      .values(new Param('id'), new Param('data'));
        
    expect(() => query.accept(new CommonQueryValidator())).not.toThrow();
    expect(() => query.accept(new SQLiteQueryValidator())).not.toThrow();

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });

  test('valid simple INSERT query passes both validators using Shorthand API', () => {
    const query = INSERT('user_dictionary', ['id', 'data'], [PARAM('id'), PARAM('data')]);
        
    expect(() => query.accept(new CommonQueryValidator())).not.toThrow();
    expect(() => query.accept(new SQLiteQueryValidator())).not.toThrow();

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });
});