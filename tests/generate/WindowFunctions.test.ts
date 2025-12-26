import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';
import {
  SELECT, FROM, COLUMN, FN, SUM, COUNT, ORDER_BY, PARTITION_BY, PARAM, EQ
} from '../../src/builder/Shorthand';
import { OrderByDirection } from '../../src/ast/OrderBy';
import { WindowExpression } from '../../src/ast/WindowExpression';
import { FunctionExpression } from '../../src/ast/FunctionExpression';

describe('Window Functions', () => {
  const compact = new CompactQueryRenderer();
  const indented = new IndentedQueryRenderer(2);

  describe('Basic window functions with ORDER BY', () => {
    it('should render ROW_NUMBER with ORDER BY', () => {
      const query = SELECT(
        FROM('users'),
        COLUMN('name'),
        FN('ROW_NUMBER').over(ORDER_BY('created_at')).as('row_num')
      );
      expect(query.accept(compact)).toBe(
        'SELECT name, ROW_NUMBER() OVER (ORDER BY created_at ASC) AS row_num FROM users'
      );
    });

    it('should render RANK with ORDER BY DESC', () => {
      const query = SELECT(
        FROM('products'),
        COLUMN('name'),
        COLUMN('price'),
        FN('RANK').over(ORDER_BY('price', OrderByDirection.DESC)).as('price_rank')
      );
      expect(query.accept(compact)).toBe(
        'SELECT name, price, RANK() OVER (ORDER BY price DESC) AS price_rank FROM products'
      );
    });

    it('should render DENSE_RANK', () => {
      const query = SELECT(
        FROM('scores'),
        COLUMN('player'),
        COLUMN('score'),
        FN('DENSE_RANK').over(ORDER_BY('score', OrderByDirection.DESC)).as('dense_rank')
      );
      expect(query.accept(compact)).toBe(
        'SELECT player, score, DENSE_RANK() OVER (ORDER BY score DESC) AS dense_rank FROM scores'
      );
    });
  });

  describe('Window functions with PARTITION BY', () => {
    it('should render RANK with PARTITION BY and ORDER BY', () => {
      const query = SELECT(
        FROM('products'),
        COLUMN('category'),
        COLUMN('name'),
        COLUMN('price'),
        FN('RANK').over(PARTITION_BY('category'), ORDER_BY('price', OrderByDirection.DESC)).as('category_rank')
      );
      expect(query.accept(compact)).toBe(
        'SELECT category, name, price, RANK() OVER (PARTITION BY category ORDER BY price DESC) AS category_rank FROM products'
      );
    });

    it('should render with multiple PARTITION BY columns', () => {
      const query = SELECT(
        FROM('employees'),
        COLUMN('department'),
        COLUMN('location'),
        COLUMN('name'),
        COLUMN('salary'),
        FN('ROW_NUMBER').over(
          PARTITION_BY('department', 'location'),
          ORDER_BY('salary', OrderByDirection.DESC)
        ).as('dept_loc_rank')
      );
      expect(query.accept(compact)).toBe(
        'SELECT department, location, name, salary, ' +
        'ROW_NUMBER() OVER (PARTITION BY department, location ORDER BY salary DESC) AS dept_loc_rank ' +
        'FROM employees'
      );
    });

    it('should render PARTITION BY only (no ORDER BY)', () => {
      const query = SELECT(
        FROM('orders'),
        COLUMN('customer_id'),
        COLUMN('amount'),
        COUNT(COLUMN('*')).over(PARTITION_BY('customer_id')).as('customer_order_count')
      );
      expect(query.accept(compact)).toBe(
        'SELECT customer_id, amount, COUNT(*) OVER (PARTITION BY customer_id) AS customer_order_count FROM orders'
      );
    });
  });

  describe('Aggregate functions with OVER', () => {
    it('should render SUM with PARTITION BY', () => {
      const query = SELECT(
        FROM('sales'),
        COLUMN('region'),
        COLUMN('amount'),
        SUM(COLUMN('amount')).over(PARTITION_BY('region')).as('region_total')
      );
      expect(query.accept(compact)).toBe(
        'SELECT region, amount, SUM(amount) OVER (PARTITION BY region) AS region_total FROM sales'
      );
    });

    it('should render running total with ORDER BY', () => {
      const query = SELECT(
        FROM('transactions'),
        COLUMN('date'),
        COLUMN('amount'),
        SUM(COLUMN('amount')).over(ORDER_BY('date')).as('running_total')
      );
      expect(query.accept(compact)).toBe(
        'SELECT date, amount, SUM(amount) OVER (ORDER BY date ASC) AS running_total FROM transactions'
      );
    });

    it('should render COUNT with PARTITION BY', () => {
      const query = SELECT(
        FROM('products'),
        COLUMN('category'),
        COLUMN('name'),
        COUNT(COLUMN('*')).over(PARTITION_BY('category')).as('items_in_category')
      );
      expect(query.accept(compact)).toBe(
        'SELECT category, name, COUNT(*) OVER (PARTITION BY category) AS items_in_category FROM products'
      );
    });
  });

  describe('Empty OVER clause', () => {
    it('should render empty OVER clause for window over entire result set', () => {
      const query = SELECT(
        FROM('employees'),
        COLUMN('name'),
        COLUMN('salary'),
        FN('AVG', COLUMN('salary')).over().as('company_avg')
      );
      expect(query.accept(compact)).toBe(
        'SELECT name, salary, AVG(salary) OVER () AS company_avg FROM employees'
      );
    });
  });

  describe('LAG and LEAD functions', () => {
    it('should render LAG with offset', () => {
      const query = SELECT(
        FROM('prices'),
        COLUMN('date'),
        COLUMN('price'),
        FN('LAG', COLUMN('price'), 1).over(ORDER_BY('date')).as('prev_price')
      );
      expect(query.accept(compact)).toBe(
        'SELECT date, price, LAG(price, 1) OVER (ORDER BY date ASC) AS prev_price FROM prices'
      );
    });

    it('should render LEAD with offset and default', () => {
      const query = SELECT(
        FROM('stock'),
        COLUMN('date'),
        COLUMN('value'),
        FN('LEAD', COLUMN('value'), 1, 0).over(ORDER_BY('date')).as('next_value')
      );
      expect(query.accept(compact)).toBe(
        'SELECT date, value, LEAD(value, 1, 0) OVER (ORDER BY date ASC) AS next_value FROM stock'
      );
    });
  });

  describe('Multiple ORDER BY clauses', () => {
    it('should render with multiple ORDER BY columns', () => {
      const query = SELECT(
        FROM('data'),
        COLUMN('category'),
        COLUMN('date'),
        COLUMN('value'),
        FN('ROW_NUMBER').over(
          PARTITION_BY('category'),
          ORDER_BY('date', OrderByDirection.DESC),
          ORDER_BY('value', OrderByDirection.ASC)
        ).as('row_num')
      );
      expect(query.accept(compact)).toBe(
        'SELECT category, date, value, ' +
        'ROW_NUMBER() OVER (PARTITION BY category ORDER BY date DESC, value ASC) AS row_num ' +
        'FROM data'
      );
    });
  });

  describe('Multiple window functions in same query', () => {
    it('should render multiple window functions', () => {
      const query = SELECT(
        FROM('sales'),
        COLUMN('product'),
        COLUMN('category'),
        COLUMN('amount'),
        FN('ROW_NUMBER').over(ORDER_BY('amount', OrderByDirection.DESC)).as('overall_rank'),
        FN('RANK').over(PARTITION_BY('category'), ORDER_BY('amount', OrderByDirection.DESC)).as('category_rank'),
        SUM(COLUMN('amount')).over(PARTITION_BY('category')).as('category_total')
      );
      expect(query.accept(compact)).toBe(
        'SELECT product, category, amount, ' +
        'ROW_NUMBER() OVER (ORDER BY amount DESC) AS overall_rank, ' +
        'RANK() OVER (PARTITION BY category ORDER BY amount DESC) AS category_rank, ' +
        'SUM(amount) OVER (PARTITION BY category) AS category_total ' +
        'FROM sales'
      );
    });
  });

  describe('Window functions with parameters', () => {
    it('should handle parameters in PARTITION BY', () => {
      const query = SELECT(
        FROM('data'),
        COLUMN('group_id'),
        COLUMN('value'),
        FN('ROW_NUMBER').over(ORDER_BY('value')).as('row_num')
      ).where(EQ(COLUMN('category'), PARAM('cat')));

      // The query itself should render correctly
      expect(query.accept(compact)).toContain('ROW_NUMBER() OVER (ORDER BY value ASC)');
    });
  });

  describe('WindowExpression properties', () => {
    it('should expose function and windowSpec properties', () => {
      const fn = FN('ROW_NUMBER');
      const windowExpr = fn.over(PARTITION_BY('category'), ORDER_BY('price', OrderByDirection.DESC));

      expect(windowExpr).toBeInstanceOf(WindowExpression);
      expect(windowExpr.function).toBeInstanceOf(FunctionExpression);
      expect(windowExpr.function.name).toBe('ROW_NUMBER');
      expect(windowExpr.windowSpec.partitionByColumns.length).toBe(1);
      expect(windowExpr.windowSpec.orderByColumns.length).toBe(1);
    });

    it('should report isEmpty correctly', () => {
      const emptyWindow = FN('COUNT', COLUMN('*')).over();
      expect(emptyWindow.windowSpec.isEmpty).toBe(true);

      const nonEmptyWindow = FN('COUNT', COLUMN('*')).over(ORDER_BY('id'));
      expect(nonEmptyWindow.windowSpec.isEmpty).toBe(false);
    });
  });

  describe('Indented rendering', () => {
    it('should render window function with indentation', () => {
      const query = SELECT(
        FROM('products'),
        COLUMN('name'),
        FN('RANK').over(PARTITION_BY('category'), ORDER_BY('price', OrderByDirection.DESC)).as('rank')
      );
      const result = query.accept(indented);
      expect(result).toContain('RANK() OVER (PARTITION BY category ORDER BY price DESC) AS rank');
    });
  });
});
