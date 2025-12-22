import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';
import { COLUMN, FROM, NOT_IN, SELECT } from '../../src/builder/Shorthand';

describe('Select with Multi-Column NOT IN List', () => {
  test('builds and renders SELECT with multi-column NOT IN list', () => {
    const query = SELECT(FROM('t'), COLUMN('a'))
      .where(NOT_IN([COLUMN('d'), COLUMN('e')], [['val1', 'val2'], ['val3', 'val4']]));

    const expectedCompact = 'SELECT a FROM t WHERE ((d, e) NOT IN ((\'val1\', \'val2\'), (\'val3\', \'val4\')))';
    const expectedIndented = `
SELECT
  a
FROM t
WHERE ((d, e) NOT IN (('val1', 'val2'), ('val3', 'val4')))
`.trim();

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(expectedIndented);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(expectedCompact);
  });
});