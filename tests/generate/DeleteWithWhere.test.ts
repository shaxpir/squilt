import { DELETE_FROM, EQ, COLUMN, PARAM, AND, OR, GT, LT, IN, LIKE } from '../../src/builder/Shorthand';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';
import { ParamCollectingVisitor } from '../../src/visitor/ParamCollector';

describe('DeleteWithWhere', () => {
  it('generates DELETE with simple WHERE condition', () => {
    const query = DELETE_FROM('users')
      .where(EQ(COLUMN('id'), PARAM('userId')));
    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe('DELETE FROM users WHERE (id = ?)');
  });

  it('generates DELETE with WHERE using literal value', () => {
    const query = DELETE_FROM('users')
      .where(EQ(COLUMN('status'), 'inactive'));
    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe("DELETE FROM users WHERE (status = 'inactive')");
  });

  it('generates DELETE with AND condition', () => {
    const query = DELETE_FROM('orders')
      .where(AND(
        EQ(COLUMN('status'), 'cancelled'),
        LT(COLUMN('created_at'), PARAM('cutoffDate'))
      ));
    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe("DELETE FROM orders WHERE ((status = 'cancelled') AND (created_at < ?))");
  });

  it('generates DELETE with OR condition', () => {
    const query = DELETE_FROM('logs')
      .where(OR(
        EQ(COLUMN('level'), 'debug'),
        EQ(COLUMN('level'), 'trace')
      ));
    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe("DELETE FROM logs WHERE ((level = 'debug') OR (level = 'trace'))");
  });

  it('generates DELETE with complex nested conditions', () => {
    const query = DELETE_FROM('events')
      .where(AND(
        EQ(COLUMN('archived'), true),
        OR(
          LT(COLUMN('date'), PARAM('oldDate')),
          EQ(COLUMN('type'), 'temporary')
        )
      ));
    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe("DELETE FROM events WHERE ((archived = 1) AND ((date < ?) OR (type = 'temporary')))");
  });

  it('generates DELETE with IN clause', () => {
    const query = DELETE_FROM('users')
      .where(IN(COLUMN('id'), 1, 2, 3));
    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe('DELETE FROM users WHERE (id IN (1, 2, 3))');
  });

  it('generates DELETE with LIKE clause', () => {
    const query = DELETE_FROM('temp_files')
      .where(LIKE(COLUMN('filename'), '%.tmp'));
    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe("DELETE FROM temp_files WHERE (filename LIKE '%.tmp')");
  });

  it('generates indented DELETE with WHERE', () => {
    const query = DELETE_FROM('users')
      .where(EQ(COLUMN('id'), PARAM('userId')));
    const renderer = new IndentedQueryRenderer(2);
    const sql = query.toSQL(renderer);
    expect(sql).toBe('DELETE\nFROM users\nWHERE (id = ?)');
  });

  it('collects parameters from DELETE query', () => {
    const query = DELETE_FROM('users')
      .where(AND(
        EQ(COLUMN('id'), PARAM('userId')),
        GT(COLUMN('age'), PARAM('minAge'))
      ));

    const params = query.accept(new ParamCollectingVisitor({
      userId: 42,
      minAge: 18
    }));

    expect(params).toEqual([42, 18]);
  });

  it('throws error for missing parameter', () => {
    const query = DELETE_FROM('users')
      .where(EQ(COLUMN('id'), PARAM('userId')));

    expect(() => {
      query.accept(new ParamCollectingVisitor({}));
    }).toThrow('No value provided for parameter: userId');
  });
});
