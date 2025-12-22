import { Alias } from '../../src/ast/Alias';
import { Column } from '../../src/ast/Column';
import { TableFrom } from '../../src/ast/From';
import { SelectQuery } from '../../src/ast/SelectQuery';
import { COLUMN, FROM, SELECT_DISTINCT } from '../../src/builder/Shorthand';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';

const EXPECTED_QUERY_COMPACT = 'SELECT DISTINCT name FROM users u';

const EXPECTED_QUERY_INDENTED = `
SELECT DISTINCT
  name
FROM users u
`.trim();

describe('Select Query with DISTINCT', () => {

  test('builds and renders query with DISTINCT', () => {
    const query = SelectQuery.create()
      .distinct()
      .from(new Alias(new TableFrom('users'), 'u'))
      .column(new Column('name'));

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });

  test('builds and renders query with DISTINCT using Shorthand API', () => {
    const query = SELECT_DISTINCT(
      FROM('users').as('u'),
      COLUMN('name')
    );

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });
});