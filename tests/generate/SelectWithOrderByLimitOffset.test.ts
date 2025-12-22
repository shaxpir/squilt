import { Column } from '../../src/ast/Column';
import { TableFrom } from '../../src/ast/From';
import { OrderByDirection } from '../../src/ast/OrderBy';
import { SelectQuery } from '../../src/ast/SelectQuery';
import { COLUMN, FROM, SELECT } from '../../src/builder/Shorthand';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';

const EXPECTED_QUERY_COMPACT = 'SELECT name FROM products ORDER BY price DESC LIMIT 10 OFFSET 20';

const EXPECTED_QUERY_INDENTED = `
SELECT
  name
FROM products
ORDER BY price DESC
LIMIT 10
OFFSET 20
`.trim();

describe('Select Query with ORDER BY, LIMIT, and OFFSET', () => {

  test('builds and renders query with ORDER BY, LIMIT, and OFFSET and quoted identifiers', () => {
    const query = SelectQuery.create()
      .from(new TableFrom('products'))
      .column(new Column('name'))
      .orderBy(new Column('price'), OrderByDirection.DESC)
      .limit(10)
      .offset(20);

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });

  test('builds and renders query with ORDER BY, LIMIT, and OFFSET and quoted identifiers using Shorthand API', () => {
    const query = SELECT(
        FROM('products'),
        COLUMN('name')
      )
      .orderBy('price', OrderByDirection.DESC)
      .limit(10)
      .offset(20);

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });
});