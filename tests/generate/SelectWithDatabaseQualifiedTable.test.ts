import { COLUMN, FROM, SELECT, PARAM, EQ, IN } from '../../src/builder/Shorthand';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';

const EXPECTED_QUERY_COMPACT = 'SELECT data FROM userdata.progress WHERE (ref = ?)';

const EXPECTED_QUERY_INDENTED = `
SELECT
  data
FROM userdata.progress
WHERE (ref = ?)
`.trim();

describe('Select With Database-Qualified Table', () => {

  test('builds and renders SELECT query with two-argument FROM for database-qualified table', () => {
    const query = SELECT(COLUMN('data'))
      .from(FROM('userdata', 'progress'))
      .where(EQ(COLUMN('ref'), PARAM()));

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });

  test('builds and renders SELECT query with string-based database-qualified table (backward compatibility)', () => {
    const query = SELECT(COLUMN('data'))
      .from(FROM('userdata.progress'))
      .where(EQ(COLUMN('ref'), PARAM()));

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });

  test('builds and renders SELECT query with multiple columns from database-qualified table', () => {
    const expectedCompact = 'SELECT ref, data FROM userdata.term WHERE (ref IN (?, ?, ?))';
    const expectedIndented = `
SELECT
  ref,
  data
FROM userdata.term
WHERE (ref IN (?, ?, ?))
    `.trim();

    const query = SELECT(COLUMN('ref'), COLUMN('data'))
      .from(FROM('userdata', 'term'))
      .where(IN(COLUMN('ref'), PARAM(), PARAM(), PARAM()));

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(expectedIndented);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(expectedCompact);
  });

  test('builds and renders SELECT query with database-qualified table and alias', () => {
    const expectedCompact = 'SELECT t.ref, t.data FROM userdata.term t WHERE (t.ref = ?)';
    const expectedIndented = `
SELECT
  t.ref,
  t.data
FROM userdata.term t
WHERE (t.ref = ?)
    `.trim();

    const query = SELECT(COLUMN('t', 'ref'), COLUMN('t', 'data'))
      .from(FROM('userdata', 'term').as('t'))
      .where(EQ(COLUMN('t', 'ref'), PARAM()));

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(expectedIndented);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(expectedCompact);
  });

  test('handles reserved keywords in database and table names', () => {
    const expectedCompact = 'SELECT data FROM "DATABASE"."TABLE"';
    const expectedIndented = `
SELECT
  data
FROM "DATABASE"."TABLE"
    `.trim();

    const query = SELECT(COLUMN('data'))
      .from(FROM('DATABASE', 'TABLE'));

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(expectedIndented);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(expectedCompact);
  });
});