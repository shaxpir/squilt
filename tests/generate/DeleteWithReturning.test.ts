import { DELETE_FROM, EQ, COLUMN, PARAM, AND, IN, ALIAS, FN } from '../../src/builder/Shorthand';
import { DeleteQuery } from '../../src/ast/DeleteQuery';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';
import { ParamCollectingVisitor } from '../../src/visitor/ParamCollector';
import { QueryIdentityTransformer } from '../../src/visitor/QueryIdentityTransformer';

describe('DeleteWithReturning', () => {
  it('generates DELETE with single RETURNING column', () => {
    const query = DELETE_FROM('users')
      .where(EQ(COLUMN('id'), PARAM('userId')))
      .returning(COLUMN('id'));
    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe('DELETE FROM users WHERE (id = ?) RETURNING id');
  });

  it('generates DELETE with multiple RETURNING columns', () => {
    const query = DELETE_FROM('users')
      .where(EQ(COLUMN('id'), PARAM('userId')))
      .returning(COLUMN('id'), COLUMN('name'), COLUMN('email'));
    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe('DELETE FROM users WHERE (id = ?) RETURNING id, name, email');
  });

  it('generates DELETE with RETURNING * (all columns)', () => {
    const query = DELETE_FROM('sessions')
      .where(EQ(COLUMN('user_id'), PARAM('userId')))
      .returning(COLUMN('*'));
    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe('DELETE FROM sessions WHERE (user_id = ?) RETURNING *');
  });

  it('generates DELETE with RETURNING aliased column', () => {
    const query = DELETE_FROM('logs')
      .where(EQ(COLUMN('level'), 'debug'))
      .returning(ALIAS(COLUMN('id'), 'deleted_id'));
    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe("DELETE FROM logs WHERE (level = 'debug') RETURNING id AS deleted_id");
  });

  it('generates DELETE with RETURNING function expression', () => {
    const query = DELETE_FROM('events')
      .where(EQ(COLUMN('processed'), true))
      .returning(COLUMN('id'), ALIAS(FN('DATETIME', COLUMN('created_at')), 'event_time'));
    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe('DELETE FROM events WHERE (processed = 1) RETURNING id, DATETIME(created_at) AS event_time');
  });

  it('generates DELETE with IN clause and RETURNING', () => {
    const query = DELETE_FROM('users')
      .where(IN(COLUMN('id'), 1, 2, 3))
      .returning(COLUMN('id'), COLUMN('name'));
    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe('DELETE FROM users WHERE (id IN (1, 2, 3)) RETURNING id, name');
  });

  it('generates DELETE with complex WHERE and RETURNING', () => {
    const query = DELETE_FROM('orders')
      .where(AND(
        EQ(COLUMN('status'), 'cancelled'),
        EQ(COLUMN('user_id'), PARAM('userId'))
      ))
      .returning(COLUMN('id'), COLUMN('total'), COLUMN('status'));
    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe("DELETE FROM orders WHERE ((status = 'cancelled') AND (user_id = ?)) RETURNING id, total, status");
  });

  it('generates indented DELETE with RETURNING', () => {
    const query = DELETE_FROM('users')
      .where(EQ(COLUMN('id'), PARAM('userId')))
      .returning(COLUMN('id'), COLUMN('name'));
    const renderer = new IndentedQueryRenderer(2);
    const sql = query.toSQL(renderer);
    expect(sql).toBe(`DELETE
FROM users
WHERE (id = ?)
RETURNING id, name`);
  });

  it('collects parameters from DELETE with RETURNING', () => {
    const query = DELETE_FROM('users')
      .where(AND(
        EQ(COLUMN('id'), PARAM('userId')),
        EQ(COLUMN('status'), PARAM('status'))
      ))
      .returning(COLUMN('id'));

    const params = query.accept(new ParamCollectingVisitor({
      userId: 42,
      status: 'inactive'
    }));

    expect(params).toEqual([42, 'inactive']);
  });

  it('transforms DELETE with RETURNING through identity transformer', () => {
    const query = DELETE_FROM('users')
      .where(EQ(COLUMN('id'), PARAM('userId')))
      .returning(COLUMN('id'), COLUMN('name'));

    const transformer = new QueryIdentityTransformer();
    const transformed = transformer.transform(query) as DeleteQuery;

    const renderer = new CompactQueryRenderer();
    expect(transformed.toSQL(renderer)).toBe(query.toSQL(renderer));
  });

  it('returns empty RETURNING clause getter when not set', () => {
    const query = DELETE_FROM('users')
      .where(EQ(COLUMN('id'), PARAM('userId')));
    expect(query.returningClause).toEqual([]);
  });

  it('returns RETURNING clause through getter', () => {
    const query = DELETE_FROM('users')
      .where(EQ(COLUMN('id'), PARAM('userId')))
      .returning(COLUMN('id'));
    expect(query.returningClause).toHaveLength(1);
  });
});
