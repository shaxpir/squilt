import { Alias } from '../../src/ast/Alias';
import { Column } from '../../src/ast/Column';
import { TableFrom } from '../../src/ast/From';
import { SelectQuery } from '../../src/ast/SelectQuery';
import { COLUMN, SELECT, FROM } from '../../src/builder/Shorthand';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';

const EXPECTED_QUERY_COMPACT = 'SELECT id FROM "TABLE" t';

const EXPECTED_QUERY_INDENTED = `
SELECT
  id
FROM "TABLE" t
`.trim();

describe('Select Query with Reserved Keyword Table', () => {

  test('renders query with reserved keyword as table name', () => {
    const query = SelectQuery.create()
      .from(new Alias(new TableFrom('TABLE'), 't'))
      .column(new Column('id'));

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });

  test('renders query with reserved keyword as table name using Shorthand API', () => {
    const query = SELECT(
      FROM('TABLE').as('t'),
      COLUMN('id')
    );

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });
});