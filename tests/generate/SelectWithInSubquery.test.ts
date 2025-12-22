import { COLUMN, EQ, FROM, IN, SELECT } from '../../src/builder/Shorthand';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';

describe('Select with IN Subquery', () => {
  test('builds and renders SELECT with IN subquery', () => {
    const subquery = SELECT(FROM("orders"), COLUMN("user_id")).where(EQ(COLUMN("status"), "active"));

    const query = SELECT(FROM("users"), COLUMN("name")).where(IN(COLUMN("id"), subquery));

    const expectedCompact = 'SELECT name FROM users WHERE (id IN (SELECT user_id FROM orders WHERE (status = \'active\')))';
    const expectedIndented = `
SELECT
  name
FROM users
WHERE (id IN (
  SELECT
    user_id
  FROM orders
  WHERE (status = 'active')
))
`.trim();

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(expectedIndented);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(expectedCompact);
  });
});