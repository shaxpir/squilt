import { COLUMN, EQ, FROM, IN, SELECT } from '../../src/builder/Shorthand';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';

describe('Select with Multi-Column IN Subquery', () => {
  test('builds and renders SELECT with multi-column IN subquery', () => {
    const subquery = SELECT(FROM("v"), COLUMN("d"), COLUMN("e")).where(EQ(COLUMN("status"), "active"));

    const query = SELECT(FROM("t"), COLUMN('a'), COLUMN('b'), COLUMN('c'))
      .where(IN([COLUMN('d'), COLUMN('e')], subquery));

    const expectedCompact = 'SELECT a, b, c FROM t WHERE ((d, e) IN (SELECT d, e FROM v WHERE (status = \'active\')))';
    const expectedIndented = `
SELECT
  a,
  b,
  c
FROM t
WHERE ((d, e) IN (
  SELECT
    d,
    e
  FROM v
  WHERE (status = 'active')
))
`.trim();

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(expectedIndented);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(expectedCompact);
  });
});