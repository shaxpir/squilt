import { Alias } from '../../src/ast/Alias';
import { Column } from '../../src/ast/Column';
import { TableFrom } from '../../src/ast/From';
import { SelectQuery } from '../../src/ast/SelectQuery';
import { COLUMN, FROM, SELECT } from '../../src/builder/Shorthand';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';

const EXPECTED_QUERY_COMPACT = 'SELECT "column name" AS col FROM "table-name" t';

const EXPECTED_QUERY_INDENTED = `
SELECT
  "column name" AS col
FROM "table-name" t
`.trim();

describe('Select Query with Special Characters', () => {

  test('renders query with special characters in identifiers', () => {
    const query = SelectQuery.create()
      .from(new Alias(new TableFrom('table-name'), 't'))
      .column(new Alias(new Column('column name'), 'col'));

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });

  test('renders query with special characters in identifiers using Shorthand API', () => {
    const query = SELECT(
      FROM('table-name').as('t'),
      COLUMN('column name').as('col')
    );

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });
});