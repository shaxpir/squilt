import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';
import { CAST, COLUMN, SELECT, FROM, PARAM, FN, AND, GT } from '../../src/builder/Shorthand';
import { CastExpression } from '../../src/ast/CastExpression';

describe('CAST Expression Generation', () => {
  const compact = new CompactQueryRenderer();
  const indented = new IndentedQueryRenderer(2);

  describe('Compact Rendering', () => {
    it('should render a basic CAST expression', () => {
      const query = SELECT(
        FROM('users'),
        CAST(COLUMN('age'), 'TEXT')
      );
      expect(query.accept(compact)).toBe('SELECT CAST(age AS TEXT) FROM users');
    });

    it('should render CAST with column reference', () => {
      const query = SELECT(
        FROM('orders'),
        CAST(COLUMN('total'), 'INTEGER')
      );
      expect(query.accept(compact)).toBe('SELECT CAST(total AS INTEGER) FROM orders');
    });

    it('should render CAST with numeric literal', () => {
      const query = SELECT(
        FROM('data'),
        CAST(123.45, 'INTEGER')
      );
      expect(query.accept(compact)).toBe('SELECT CAST(123.45 AS INTEGER) FROM data');
    });

    it('should render CAST with string literal', () => {
      const query = SELECT(
        FROM('data'),
        CAST('42', 'INTEGER')
      );
      expect(query.accept(compact)).toBe("SELECT CAST('42' AS INTEGER) FROM data");
    });

    it('should render CAST with parameter', () => {
      const query = SELECT(
        FROM('users'),
        CAST(PARAM('value'), 'REAL')
      );
      expect(query.accept(compact)).toBe('SELECT CAST(? AS REAL) FROM users');
    });

    it('should render nested CAST in function', () => {
      const query = SELECT(
        FROM('products'),
        FN('ROUND', CAST(COLUMN('price'), 'REAL'), 2)
      );
      expect(query.accept(compact)).toBe('SELECT ROUND(CAST(price AS REAL), 2) FROM products');
    });

    it('should render CAST in WHERE clause', () => {
      const query = SELECT(FROM('events'), COLUMN('name'))
        .where(GT(CAST(COLUMN('timestamp'), 'INTEGER'), 1000));
      expect(query.accept(compact)).toBe('SELECT name FROM events WHERE (CAST(timestamp AS INTEGER) > 1000)');
    });

    it('should render multiple CAST expressions', () => {
      const query = SELECT(
        FROM('mixed'),
        CAST(COLUMN('a'), 'TEXT'),
        CAST(COLUMN('b'), 'INTEGER')
      );
      expect(query.accept(compact)).toBe('SELECT CAST(a AS TEXT), CAST(b AS INTEGER) FROM mixed');
    });

    it('should render CAST with BLOB type', () => {
      const query = SELECT(
        FROM('files'),
        CAST(COLUMN('content'), 'BLOB')
      );
      expect(query.accept(compact)).toBe('SELECT CAST(content AS BLOB) FROM files');
    });

    it('should render CAST with complex expression', () => {
      const query = SELECT(
        FROM('data'),
        CAST(FN('SUBSTR', COLUMN('value'), 1, 10), 'INTEGER')
      );
      expect(query.accept(compact)).toBe('SELECT CAST(SUBSTR(value, 1, 10) AS INTEGER) FROM data');
    });
  });

  describe('Indented Rendering', () => {
    it('should render a CAST expression with indentation', () => {
      const query = SELECT(
        FROM('users'),
        CAST(COLUMN('age'), 'TEXT')
      );
      expect(query.accept(indented)).toBe(
        'SELECT\n' +
        '  CAST(age AS TEXT)\n' +
        'FROM users'
      );
    });
  });

  describe('CastExpression AST', () => {
    it('should have correct expression and targetType properties', () => {
      const cast = CAST(COLUMN('value'), 'INTEGER');
      expect(cast).toBeInstanceOf(CastExpression);
      expect(cast.targetType).toBe('INTEGER');
    });
  });
});
