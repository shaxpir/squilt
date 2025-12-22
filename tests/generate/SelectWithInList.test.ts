import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';
import { COLUMN, FROM, IN, SELECT } from '../../src/builder/Shorthand';

describe('Select with IN List', () => {
  test('builds and renders SELECT with IN list', () => {
    const query = SELECT(FROM('users'), COLUMN('name')).where(IN(COLUMN('id'), 1, 2, 3));

    const expectedCompact = 'SELECT name FROM users WHERE (id IN (1, 2, 3))';
    const expectedIndented = `
SELECT
  name
FROM users
WHERE (id IN (1, 2, 3))
`.trim();

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(expectedIndented);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(expectedCompact);
  });
});