import { Alias } from '../../src/ast/Alias';
import { Column } from '../../src/ast/Column';
import { TableFrom } from '../../src/ast/From';
import { SelectQuery } from '../../src/ast/SelectQuery';
import { COLUMN, FROM, SELECT } from '../../src/builder/Shorthand';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';

const EXPECTED_QUERY_COMPACT = 'SELECT "col""quote""" AS c FROM "table""with""quote" t';

const EXPECTED_QUERY_INDENTED = `
SELECT
  "col""quote""" AS c
FROM "table""with""quote" t
`.trim();

describe('Select Query with Quotes in Identifiers', () => {

  test('renders query with quotes in identifiers', () => {
    const query = SelectQuery.create()
      .from(new Alias(new TableFrom('table"with"quote'), 't'))
      .column(new Alias(new Column('col"quote"'), 'c'));

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });

  test('renders query with quotes in identifiers using Shorthand API', () => {
    const query = SELECT(
      FROM('table"with"quote').as('t'),
      COLUMN('col"quote"').as('c')
    );

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });
});