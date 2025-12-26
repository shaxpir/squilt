import { INSERT_INTO, SELECT, FROM, COLUMN, PARAM, EQ, LT, FN } from '../../src/builder/Shorthand';
import { InsertQuery } from '../../src/ast/InsertQuery';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';
import { ParamCollectingVisitor } from '../../src/visitor/ParamCollector';
import { QueryIdentityTransformer } from '../../src/visitor/QueryIdentityTransformer';
import { CommonQueryValidator } from '../../src/validate/CommonQueryValidator';

describe('InsertFromSelect', () => {
  it('generates INSERT ... SELECT with simple query', () => {
    const selectQuery = SELECT(FROM('source_table'), COLUMN('id'), COLUMN('name'));
    const query = INSERT_INTO('dest_table')
      .columns('id', 'name')
      .fromSelect(selectQuery);

    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe('INSERT INTO dest_table (id, name) SELECT id, name FROM source_table');
  });

  it('generates INSERT ... SELECT with WHERE clause', () => {
    const selectQuery = SELECT(FROM('orders'), COLUMN('id'), COLUMN('user_id'), COLUMN('total'))
      .where(EQ(COLUMN('status'), 'completed'));
    const query = INSERT_INTO('archive_orders')
      .columns('id', 'user_id', 'total')
      .fromSelect(selectQuery);

    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe("INSERT INTO archive_orders (id, user_id, total) SELECT id, user_id, total FROM orders WHERE (status = 'completed')");
  });

  it('generates INSERT ... SELECT with parameters', () => {
    const selectQuery = SELECT(FROM('events'), COLUMN('id'), COLUMN('data'))
      .where(LT(COLUMN('created_at'), PARAM('cutoff')));
    const query = INSERT_INTO('archived_events')
      .columns('id', 'data')
      .fromSelect(selectQuery);

    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe('INSERT INTO archived_events (id, data) SELECT id, data FROM events WHERE (created_at < ?)');
  });

  it('generates INSERT ... SELECT with function in SELECT', () => {
    const selectQuery = SELECT(
      FROM('users'),
      COLUMN('id'),
      COLUMN('name'),
      FN('DATETIME', 'now')
    );
    const query = INSERT_INTO('user_snapshots')
      .columns('user_id', 'user_name', 'snapshot_time')
      .fromSelect(selectQuery);

    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe("INSERT INTO user_snapshots (user_id, user_name, snapshot_time) SELECT id, name, DATETIME('now') FROM users");
  });

  it('generates INSERT OR REPLACE ... SELECT', () => {
    const selectQuery = SELECT(FROM('temp_data'), COLUMN('id'), COLUMN('value'));
    const query = INSERT_INTO('permanent_data')
      .orReplace()
      .columns('id', 'value')
      .fromSelect(selectQuery);

    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe('INSERT OR REPLACE INTO permanent_data (id, value) SELECT id, value FROM temp_data');
  });

  it('generates INSERT ... SELECT with RETURNING', () => {
    const selectQuery = SELECT(FROM('source'), COLUMN('id'), COLUMN('data'));
    const query = INSERT_INTO('dest')
      .columns('id', 'data')
      .fromSelect(selectQuery)
      .returning(COLUMN('id'));

    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe('INSERT INTO dest (id, data) SELECT id, data FROM source RETURNING id');
  });

  it('generates indented INSERT ... SELECT', () => {
    const selectQuery = SELECT(FROM('source'), COLUMN('id'), COLUMN('name'))
      .where(EQ(COLUMN('active'), true));
    const query = INSERT_INTO('dest')
      .columns('id', 'name')
      .fromSelect(selectQuery);

    const renderer = new IndentedQueryRenderer(2);
    const sql = query.toSQL(renderer);
    expect(sql).toContain('INSERT');
    expect(sql).toContain('INTO dest');
    expect(sql).toContain('SELECT');
    expect(sql).toContain('FROM source');
    expect(sql).toContain('WHERE');
  });

  it('collects parameters from INSERT ... SELECT', () => {
    const selectQuery = SELECT(FROM('orders'), COLUMN('*'))
      .where(EQ(COLUMN('user_id'), PARAM('userId')));
    const query = INSERT_INTO('archive')
      .columns('id', 'user_id', 'total')
      .fromSelect(selectQuery);

    const params = query.accept(new ParamCollectingVisitor({ userId: 42 }));
    expect(params).toEqual([42]);
  });

  it('transforms INSERT ... SELECT through identity transformer', () => {
    const selectQuery = SELECT(FROM('source'), COLUMN('id'), COLUMN('data'));
    const query = INSERT_INTO('dest')
      .columns('id', 'data')
      .fromSelect(selectQuery);

    const transformer = new QueryIdentityTransformer();
    const transformed = transformer.transform(query) as InsertQuery;

    const renderer = new CompactQueryRenderer();
    expect(transformed.toSQL(renderer)).toBe(query.toSQL(renderer));
  });

  it('validates INSERT ... SELECT successfully', () => {
    const selectQuery = SELECT(FROM('source'), COLUMN('id'), COLUMN('name'));
    const query = INSERT_INTO('dest')
      .columns('id', 'name')
      .fromSelect(selectQuery);

    const validator = new CommonQueryValidator();
    expect(() => validator.validate(query)).not.toThrow();
  });

  it('rejects INSERT with both VALUES and SELECT', () => {
    const selectQuery = SELECT(FROM('source'), COLUMN('id'));
    const query = INSERT_INTO('dest')
      .columns('id')
      .values(PARAM('id'))
      .fromSelect(selectQuery);

    // Force set both to test validation
    (query as any)['_values'] = [PARAM('id')];
    (query as any)['_fromSelect'] = selectQuery;

    const validator = new CommonQueryValidator();
    expect(() => validator.validate(query)).toThrow('InsertQuery cannot have both VALUES and SELECT');
  });

  it('returns selectQuery through getter', () => {
    const selectQuery = SELECT(FROM('source'), COLUMN('id'));
    const query = INSERT_INTO('dest')
      .columns('id')
      .fromSelect(selectQuery);

    expect(query.selectQuery).toBe(selectQuery);
  });

  it('returns null selectQuery when not set', () => {
    const query = INSERT_INTO('dest')
      .columns('id')
      .values(PARAM('id'));

    expect(query.selectQuery).toBeNull();
  });
});
