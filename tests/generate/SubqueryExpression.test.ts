import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import {
  SUBQUERY, SELECT, FROM, COLUMN, EQ, GT, LT, FN, CASE, PARAM, ALIAS, AND
} from '../../src/builder/Shorthand';
import { SubqueryExpression } from '../../src/ast/SubqueryExpression';

describe('Subquery Expression Generation', () => {
  const compact = new CompactQueryRenderer();

  describe('Scalar subquery in SELECT columns', () => {
    it('should render a scalar subquery as a column', () => {
      const query = SELECT(
        FROM('orders'),
        COLUMN('id'),
        SUBQUERY(
          SELECT(FROM('users'), COLUMN('name'))
            .where(EQ(COLUMN('users', 'id'), COLUMN('orders', 'user_id')))
        )
      );
      expect(query.accept(compact)).toBe(
        'SELECT id, (SELECT name FROM users WHERE (users.id = orders.user_id)) FROM orders'
      );
    });

    it('should render a scalar subquery with alias', () => {
      const query = SELECT(
        FROM('orders'),
        COLUMN('id'),
        ALIAS(
          SUBQUERY(
            SELECT(FROM('users'), COLUMN('name'))
              .where(EQ(COLUMN('users', 'id'), COLUMN('orders', 'user_id')))
          ),
          'user_name'
        )
      );
      expect(query.accept(compact)).toBe(
        'SELECT id, (SELECT name FROM users WHERE (users.id = orders.user_id)) AS user_name FROM orders'
      );
    });

    it('should render multiple scalar subqueries', () => {
      const query = SELECT(
        FROM('products'),
        COLUMN('id'),
        ALIAS(
          SUBQUERY(
            SELECT(FROM('categories'), COLUMN('name'))
              .where(EQ(COLUMN('categories', 'id'), COLUMN('products', 'category_id')))
          ),
          'category_name'
        ),
        ALIAS(
          SUBQUERY(
            SELECT(FROM('reviews'), FN('AVG', COLUMN('rating')))
              .where(EQ(COLUMN('reviews', 'product_id'), COLUMN('products', 'id')))
          ),
          'avg_rating'
        )
      );
      expect(query.accept(compact)).toBe(
        'SELECT id, ' +
        '(SELECT name FROM categories WHERE (categories.id = products.category_id)) AS category_name, ' +
        '(SELECT AVG(rating) FROM reviews WHERE (reviews.product_id = products.id)) AS avg_rating ' +
        'FROM products'
      );
    });
  });

  describe('Scalar subquery in WHERE clause', () => {
    it('should render subquery in comparison', () => {
      const query = SELECT(FROM('products'), COLUMN('name'), COLUMN('price'))
        .where(GT(
          COLUMN('price'),
          SUBQUERY(SELECT(FROM('products'), FN('AVG', COLUMN('price'))))
        ));
      expect(query.accept(compact)).toBe(
        'SELECT name, price FROM products WHERE (price > (SELECT AVG(price) FROM products))'
      );
    });

    it('should render subquery with parameter', () => {
      const query = SELECT(FROM('orders'), COLUMN('*'))
        .where(GT(
          COLUMN('total'),
          SUBQUERY(
            SELECT(FROM('order_limits'), COLUMN('max_value'))
              .where(EQ(COLUMN('user_id'), PARAM('userId')))
          )
        ));
      expect(query.accept(compact)).toBe(
        'SELECT * FROM orders WHERE (total > (SELECT max_value FROM order_limits WHERE (user_id = ?)))'
      );
    });
  });

  describe('Scalar subquery in CASE expression', () => {
    it('should render subquery in CASE WHEN condition', () => {
      const query = SELECT(
        FROM('users'),
        COLUMN('name'),
        CASE([
          {
            WHEN: GT(
              SUBQUERY(SELECT(FROM('orders'), FN('COUNT', COLUMN('*')))
                .where(EQ(COLUMN('orders', 'user_id'), COLUMN('users', 'id')))),
              10
            ),
            THEN: 'VIP'
          },
          { ELSE: 'Regular' }
        ])
      );
      expect(query.accept(compact)).toBe(
        'SELECT name, CASE ' +
        'WHEN ((SELECT COUNT(*) FROM orders WHERE (orders.user_id = users.id)) > 10) THEN \'VIP\' ' +
        'ELSE \'Regular\' END ' +
        'FROM users'
      );
    });
  });

  describe('Scalar subquery in function arguments', () => {
    it('should render subquery as function argument', () => {
      const query = SELECT(
        FROM('products'),
        COLUMN('name'),
        FN('COALESCE',
          SUBQUERY(
            SELECT(FROM('discounts'), COLUMN('percentage'))
              .where(EQ(COLUMN('discounts', 'product_id'), COLUMN('products', 'id')))
          ),
          0
        )
      );
      expect(query.accept(compact)).toBe(
        'SELECT name, COALESCE((SELECT percentage FROM discounts WHERE (discounts.product_id = products.id)), 0) FROM products'
      );
    });
  });

  describe('Nested subqueries', () => {
    it('should render nested subqueries', () => {
      const query = SELECT(
        FROM('users'),
        COLUMN('name'),
        SUBQUERY(
          SELECT(
            FROM('orders'),
            FN('SUM', COLUMN('total'))
          )
          .where(AND(
            EQ(COLUMN('orders', 'user_id'), COLUMN('users', 'id')),
            GT(
              COLUMN('total'),
              SUBQUERY(SELECT(FROM('settings'), COLUMN('min_order_value')))
            )
          ))
        )
      );
      expect(query.accept(compact)).toBe(
        'SELECT name, ' +
        '(SELECT SUM(total) FROM orders ' +
        'WHERE ((orders.user_id = users.id) AND (total > (SELECT min_order_value FROM settings)))) ' +
        'FROM users'
      );
    });
  });

  describe('SubqueryExpression AST', () => {
    it('should have correct subquery property', () => {
      const innerQuery = SELECT(FROM('users'), COLUMN('name'));
      const subq = SUBQUERY(innerQuery);
      expect(subq).toBeInstanceOf(SubqueryExpression);
      expect(subq.subquery).toBe(innerQuery);
    });
  });
});
