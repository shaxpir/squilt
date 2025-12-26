import { DELETE_FROM, SELECT, FROM, COLUMN, IN, NOT_IN, EXISTS, EQ, AND, PARAM } from '../../src/builder/Shorthand';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';
import { ParamCollectingVisitor } from '../../src/visitor/ParamCollector';

describe('DeleteWithSubquery', () => {
  const renderer = new CompactQueryRenderer();

  describe('IN subquery', () => {
    it('generates DELETE with IN subquery', () => {
      const subquery = SELECT(FROM('inactive_users'), COLUMN('id'));
      const query = DELETE_FROM('users').where(IN(COLUMN('id'), subquery));

      expect(query.toSQL(renderer)).toBe(
        'DELETE FROM users WHERE (id IN (SELECT id FROM inactive_users))'
      );
    });

    it('generates DELETE with IN subquery and WHERE in subquery', () => {
      const subquery = SELECT(FROM('users'), COLUMN('id'))
        .where(EQ(COLUMN('status'), 'banned'));
      const query = DELETE_FROM('sessions').where(IN(COLUMN('user_id'), subquery));

      expect(query.toSQL(renderer)).toBe(
        "DELETE FROM sessions WHERE (user_id IN (SELECT id FROM users WHERE (status = 'banned')))"
      );
    });

    it('generates DELETE with parameterized IN subquery', () => {
      const subquery = SELECT(FROM('audit_log'), COLUMN('record_id'))
        .where(EQ(COLUMN('event_type'), PARAM('actionType')));
      const query = DELETE_FROM('records').where(IN(COLUMN('id'), subquery));

      expect(query.toSQL(renderer)).toBe(
        'DELETE FROM records WHERE (id IN (SELECT record_id FROM audit_log WHERE (event_type = ?)))'
      );

      const params = query.accept(new ParamCollectingVisitor({ actionType: 'delete' }));
      expect(params).toEqual(['delete']);
    });
  });

  describe('NOT IN subquery', () => {
    it('generates DELETE with NOT IN subquery', () => {
      const subquery = SELECT(FROM('active_products'), COLUMN('product_id'));
      const query = DELETE_FROM('products').where(NOT_IN(COLUMN('id'), subquery));

      expect(query.toSQL(renderer)).toBe(
        'DELETE FROM products WHERE (id NOT IN (SELECT product_id FROM active_products))'
      );
    });

    it('generates DELETE with NOT IN subquery preserving active records', () => {
      const keepIds = SELECT(FROM('important_logs'), COLUMN('id'))
        .where(EQ(COLUMN('keep'), true));
      const query = DELETE_FROM('logs').where(NOT_IN(COLUMN('id'), keepIds));

      expect(query.toSQL(renderer)).toBe(
        'DELETE FROM logs WHERE (id NOT IN (SELECT id FROM important_logs WHERE (keep = 1)))'
      );
    });
  });

  describe('EXISTS subquery', () => {
    it('generates DELETE with EXISTS subquery', () => {
      const subquery = SELECT(FROM('cancelled_orders'), COLUMN('*'))
        .where(EQ(COLUMN('cancelled_orders', 'order_id'), COLUMN('orders', 'id')));
      const query = DELETE_FROM('orders').where(EXISTS(subquery));

      expect(query.toSQL(renderer)).toBe(
        'DELETE FROM orders WHERE EXISTS (SELECT * FROM cancelled_orders WHERE (cancelled_orders.order_id = orders.id))'
      );
    });

    it('generates DELETE with EXISTS and additional conditions', () => {
      const subquery = SELECT(FROM('refunds'), COLUMN('*'))
        .where(EQ(COLUMN('refunds', 'payment_id'), COLUMN('payments', 'id')));
      const query = DELETE_FROM('payments')
        .where(AND(
          EXISTS(subquery),
          EQ(COLUMN('status'), 'pending')
        ));

      expect(query.toSQL(renderer)).toBe(
        "DELETE FROM payments WHERE (EXISTS (SELECT * FROM refunds WHERE (refunds.payment_id = payments.id)) AND (status = 'pending'))"
      );
    });
  });

  describe('complex subquery patterns', () => {
    it('generates DELETE with multiple subquery conditions', () => {
      const bannedUsers = SELECT(FROM('banned_users'), COLUMN('id'));
      const oldDate = PARAM('cutoffDate');

      const query = DELETE_FROM('comments')
        .where(AND(
          IN(COLUMN('user_id'), bannedUsers),
          EQ(COLUMN('flagged'), true)
        ));

      expect(query.toSQL(renderer)).toBe(
        'DELETE FROM comments WHERE ((user_id IN (SELECT id FROM banned_users)) AND (flagged = 1))'
      );
    });

    it('generates DELETE with nested subquery', () => {
      // Delete orders from users who have been inactive
      const inactiveUsers = SELECT(FROM('users'), COLUMN('id'))
        .where(IN(
          COLUMN('id'),
          SELECT(FROM('activity_log'), COLUMN('user_id'))
            .where(EQ(COLUMN('last_seen'), PARAM('oldDate')))
        ));

      const query = DELETE_FROM('orders')
        .where(IN(COLUMN('user_id'), inactiveUsers));

      expect(query.toSQL(renderer)).toBe(
        'DELETE FROM orders WHERE (user_id IN (SELECT id FROM users WHERE (id IN (SELECT user_id FROM activity_log WHERE (last_seen = ?)))))'
      );
    });

    it('collects parameters from nested subqueries', () => {
      const subquery = SELECT(FROM('events'), COLUMN('entity_id'))
        .where(AND(
          EQ(COLUMN('type'), PARAM('eventType')),
          EQ(COLUMN('status'), PARAM('eventStatus'))
        ));

      const query = DELETE_FROM('entities')
        .where(AND(
          IN(COLUMN('id'), subquery),
          EQ(COLUMN('archived'), PARAM('isArchived'))
        ));

      const params = query.accept(new ParamCollectingVisitor({
        eventType: 'expired',
        eventStatus: 'processed',
        isArchived: false
      }));

      expect(params).toEqual(['expired', 'processed', false]);
    });
  });

  describe('indented rendering', () => {
    it('renders DELETE with subquery in indented format', () => {
      const subquery = SELECT(FROM('old_records'), COLUMN('id'));
      const query = DELETE_FROM('records').where(IN(COLUMN('id'), subquery));

      const indented = new IndentedQueryRenderer(2);
      const sql = query.toSQL(indented);

      expect(sql).toContain('DELETE');
      expect(sql).toContain('FROM records');
      expect(sql).toContain('WHERE');
      expect(sql).toContain('SELECT');
    });
  });
});
