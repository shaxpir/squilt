import { Column } from '../../src/ast/Column';
import { OrderByDirection } from '../../src/ast/OrderBy';
import { SelectQuery } from '../../src/ast/SelectQuery';
import { COLUMN, EQ, FROM, SELECT, UNION_ALL } from '../../src/builder/Shorthand';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';

const EXPECTED_QUERY_COMPACT = `SELECT * UNION ALL SELECT name FROM users WHERE (type = 'admin') UNION ALL SELECT name FROM users WHERE (type = 'manager')`;

const EXPECTED_QUERY_INDENTED = `
SELECT
  *
UNION ALL
  SELECT
    name
  FROM users
  WHERE (type = 'admin')
UNION ALL
  SELECT
    name
  FROM users
  WHERE (type = 'manager')
`.trim();

describe('Select Query with UNION ALL', () => {

  test('builds and renders query with UNION ALL via the method API', () => {
    const query1 = SELECT(COLUMN('name'), FROM('users')).where(EQ(COLUMN('type'), 'admin'));
    const query2 = SELECT(COLUMN('name'), FROM('users')).where(EQ(COLUMN('type'), 'manager'));

    const query = SelectQuery.create()
      .unionAll(query1)
      .unionAll(query2);

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });

  test('builds and renders query with UNION ALL via the Shorthand API', () => {
    const query1 = SELECT(COLUMN('name'), FROM('users')).where(EQ(COLUMN('type'), 'admin'));
    const query2 = SELECT(COLUMN('name'), FROM('users')).where(EQ(COLUMN('type'), 'manager'));

    const query = UNION_ALL(query1, query2);

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });

  test('UNION and UNION ALL render distinctly (UNION ALL keeps duplicates)', () => {
    const a = SELECT(COLUMN('id'), FROM('a'));
    const b = SELECT(COLUMN('id'), FROM('b'));

    expect(SelectQuery.create().union(a).union(b).toSQL(new CompactQueryRenderer()))
      .toBe(`SELECT * UNION SELECT id FROM a UNION SELECT id FROM b`);
    expect(SelectQuery.create().unionAll(a).unionAll(b).toSQL(new CompactQueryRenderer()))
      .toBe(`SELECT * UNION ALL SELECT id FROM a UNION ALL SELECT id FROM b`);
  });

  test('per-arm WHERE/ORDER BY/LIMIT inside each UNION ALL arm (the dictionary-search shape)', () => {
    // Each arm filters + orders + limits its own table, then the outer query
    // re-sorts and applies the real LIMIT/OFFSET — the pattern buildEntriesUnion
    // uses so each arm can hit its table's indexes.
    const wordArm = SELECT(COLUMN('*'), new Column('learn_rank'), FROM('word'))
      .where(EQ(COLUMN('text'), '好'))
      .orderBy('learn_rank', OrderByDirection.ASC)
      .limit(5);
    const phraseArm = SELECT(COLUMN('*'), new Column('learn_rank'), FROM('phrase'))
      .where(EQ(COLUMN('text'), '好'))
      .orderBy('learn_rank', OrderByDirection.ASC)
      .limit(5);

    const merged = SelectQuery.create()
      .unionAll(wordArm)
      .unionAll(phraseArm)
      .orderBy('learn_rank', OrderByDirection.ASC)
      .limit(5);

    const sql = merged.toSQL(new CompactQueryRenderer());
    // both arms present, each with its own WHERE + ORDER BY + LIMIT
    expect(sql).toContain('FROM word WHERE');
    expect(sql).toContain('FROM phrase WHERE');
    expect((sql.match(/UNION ALL/g) || []).length).toBe(2);
    expect((sql.match(/ORDER BY/g) || []).length).toBe(3); // 2 arms + outer
    // no plain "UNION " (dedup) anywhere — must be UNION ALL
    expect(/UNION(?! ALL)/.test(sql)).toBe(false);
  });
});
