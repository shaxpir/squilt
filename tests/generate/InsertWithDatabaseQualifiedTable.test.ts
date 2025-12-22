import { INSERT_OR_REPLACE, PARAM } from '../../src/builder/Shorthand';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';
import { ParamCollectingVisitor } from '../../src/visitor/ParamCollector';

const EXPECTED_QUERY_COMPACT = 'INSERT OR REPLACE INTO userdata.progress (ref, data) VALUES (?, ?)';

const EXPECTED_QUERY_INDENTED = `
INSERT OR REPLACE
INTO userdata.progress
(ref, data)
VALUES
(?, ?)
`.trim();

describe('Insert With Database-Qualified Table', () => {

  test('builds and renders INSERT OR REPLACE query with two-argument form for database-qualified table', () => {
    const query = INSERT_OR_REPLACE('userdata', 'progress', ['ref', 'data'], [PARAM('ref'), PARAM('data')]);

    const keyValuePairs = { ref: 'BIsdCbiCImAJJbJn', data: '{"skill_level": 1500, "cognitive_load": 42.5}' };
    const paramCollector = new ParamCollectingVisitor(keyValuePairs);
    const params = query.accept(paramCollector);
    expect(params).toEqual(['BIsdCbiCImAJJbJn', '{"skill_level": 1500, "cognitive_load": 42.5}']);

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });

  test('builds and renders INSERT OR REPLACE query with string-based database-qualified table (backward compatibility)', () => {
    const query = INSERT_OR_REPLACE('userdata.progress', ['ref', 'data'], [PARAM('ref'), PARAM('data')]);

    const keyValuePairs = { ref: 'BIsdCbiCImAJJbJn', data: '{"skill_level": 1500, "cognitive_load": 42.5}' };
    const paramCollector = new ParamCollectingVisitor(keyValuePairs);
    const params = query.accept(paramCollector);
    expect(params).toEqual(['BIsdCbiCImAJJbJn', '{"skill_level": 1500, "cognitive_load": 42.5}']);

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });

  test('builds and renders INSERT OR REPLACE query for term table with multiple columns', () => {
    const expectedCompact = 'INSERT OR REPLACE INTO userdata.term (ref, data, created_at) VALUES (?, ?, ?)';
    const expectedIndented = `
INSERT OR REPLACE
INTO userdata.term
(ref, data, created_at)
VALUES
(?, ?, ?)
    `.trim();

    const query = INSERT_OR_REPLACE('userdata', 'term', ['ref', 'data', 'created_at'], [PARAM(), PARAM(), PARAM()]);

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(expectedIndented);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(expectedCompact);
  });

  test('handles reserved keywords in database and table names for INSERT', () => {
    const expectedCompact = 'INSERT OR REPLACE INTO "DATABASE"."TABLE" (id, name) VALUES (?, ?)';
    const expectedIndented = `
INSERT OR REPLACE
INTO "DATABASE"."TABLE"
(id, name)
VALUES
(?, ?)
    `.trim();

    const query = INSERT_OR_REPLACE('DATABASE', 'TABLE', ['id', 'name'], [PARAM(), PARAM()]);

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(expectedIndented);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(expectedCompact);
  });

  test('validates argument types and throws error for invalid arguments', () => {
    // This should throw an error for invalid argument combination
    expect(() => {
      INSERT_OR_REPLACE('invalid' as any, 123 as any, 'not-array' as any, 'also-not-array' as any);
    }).toThrow('Invalid arguments for INSERT_OR_REPLACE');
  });
});