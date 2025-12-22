import { Alias } from '../../src/ast/Alias';
import { Column } from '../../src/ast/Column';
import { JsonEachFrom } from '../../src/ast/From';
import { SelectQuery } from '../../src/ast/SelectQuery';
import { COLUMN } from '../../src/builder/Shorthand';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';
import { CommonQueryValidator } from '../../src/validate/CommonQueryValidator';
import { SQLiteQueryValidator } from '../../src/validate/SQLiteQueryValidator';

const EXPECTED_QUERY_COMPACT = "SELECT value FROM json_each(data) json_data";

const EXPECTED_QUERY_INDENTED = `
SELECT
  value
FROM json_each(data) json_data
`.trim();

describe('Validate Select Query with json_each', () => {

  test('valid json_each query passes both validators', () => {
    const query = SelectQuery.create()
      .from(new Alias(new JsonEachFrom(new Column('data')), 'json_data'))
      .column(new Column('value'));
      
      expect(() => query.accept(new CommonQueryValidator())).not.toThrow();
      expect(() => query.accept(new SQLiteQueryValidator())).not.toThrow();
  
      expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
      expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });

  test('valid json_each query passes both validators using Shorthand API', () => {
    const query = SelectQuery.create()
      .from(new Alias(new JsonEachFrom(COLUMN('data')), 'json_data'))
      .column(COLUMN('value'));
      
    expect(() => query.accept(new CommonQueryValidator())).not.toThrow();
    expect(() => query.accept(new SQLiteQueryValidator())).not.toThrow();

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });
});