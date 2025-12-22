import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';
import { COLUMN, FROM, NOT_IN, SELECT } from '../../src/builder/Shorthand';

describe('Select with NOT IN List', () => {
  test('builds and renders SELECT with NOT IN list', () => {
    const query = SELECT(FROM('users'), COLUMN('name')).where(NOT_IN(COLUMN('id'), 4, 5, 6));

    const expectedCompact = 'SELECT name FROM users WHERE (id NOT IN (4, 5, 6))';
    const expectedIndented = `
SELECT
  name
FROM users
WHERE (id NOT IN (4, 5, 6))
`.trim();

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(expectedIndented);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(expectedCompact);
  });
});