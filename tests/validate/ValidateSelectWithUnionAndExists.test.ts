import { SelectQuery } from '../../src/ast/SelectQuery';
import { COLUMN, EXISTS, FROM, SELECT } from '../../src/builder/Shorthand';
import { CommonQueryValidator } from '../../src/validate/CommonQueryValidator';
import { SQLiteQueryValidator } from '../../src/validate/SQLiteQueryValidator';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';

const EXPECTED_QUERY_COMPACT = 'SELECT abc, xyz FROM my_table UNION SELECT abc, xyz FROM my_other_table WHERE EXISTS (SELECT x FROM y)';

const EXPECTED_QUERY_INDENTED = `
SELECT
  abc,
  xyz
FROM my_table
UNION
  SELECT
    abc,
    xyz
  FROM my_other_table
  WHERE EXISTS (
    SELECT
      x
    FROM y
  )
`.trim();

describe('Validate Select Query with UNION and EXISTS', () => {
  let query: SelectQuery;

  beforeEach(() => {
    query = SELECT(
      COLUMN('abc'),
      COLUMN('xyz'),
      FROM('my_table')
    ).union(
      SELECT(
        COLUMN('abc'),
        COLUMN('xyz'),
        FROM('my_other_table')
      ).where(
        EXISTS(
          SELECT(
            COLUMN('x'),
            FROM('y')
          )
        )
      )
    );
  });

  test('valid query with UNION and EXISTS passes CommonQueryValidator', () => {
    expect(() => query.accept(new CommonQueryValidator())).not.toThrow();
    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });

  test('valid query with UNION and EXISTS passes SQLiteQueryValidator', () => {
    expect(() => query.accept(new SQLiteQueryValidator())).not.toThrow();
    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });
});