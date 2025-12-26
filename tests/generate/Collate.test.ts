import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { COLLATE, COLUMN, SELECT, FROM, EQ, ORDER_BY } from '../../src/builder/Shorthand';
import { OrderByDirection } from '../../src/ast/OrderBy';
import { CollateExpression } from '../../src/ast/CollateExpression';

describe('COLLATE Operator Generation', () => {
  const compact = new CompactQueryRenderer();

  it('should render a basic COLLATE expression', () => {
    const query = SELECT(FROM('users'), COLUMN('name'))
      .where(EQ(COLLATE(COLUMN('name'), 'NOCASE'), 'john'));
    expect(query.accept(compact)).toBe("SELECT name FROM users WHERE (name COLLATE NOCASE = 'john')");
  });

  it('should render COLLATE with BINARY collation', () => {
    const query = SELECT(FROM('data'), COLUMN('value'))
      .where(EQ(COLLATE(COLUMN('value'), 'BINARY'), 'Test'));
    expect(query.accept(compact)).toBe("SELECT value FROM data WHERE (value COLLATE BINARY = 'Test')");
  });

  it('should render COLLATE with RTRIM collation', () => {
    const query = SELECT(FROM('strings'), COLUMN('text'))
      .where(EQ(COLLATE(COLUMN('text'), 'RTRIM'), 'hello'));
    expect(query.accept(compact)).toBe("SELECT text FROM strings WHERE (text COLLATE RTRIM = 'hello')");
  });

  it('should render COLLATE in ORDER BY clause', () => {
    const query = SELECT(FROM('names'), COLUMN('name'))
      .orderBy(COLLATE(COLUMN('name'), 'NOCASE'), OrderByDirection.ASC);
    expect(query.accept(compact)).toBe('SELECT name FROM names ORDER BY name COLLATE NOCASE ASC');
  });

  it('should render COLLATE in SELECT column', () => {
    const query = SELECT(
      FROM('users'),
      COLLATE(COLUMN('name'), 'NOCASE')
    );
    expect(query.accept(compact)).toBe('SELECT name COLLATE NOCASE FROM users');
  });

  describe('CollateExpression AST', () => {
    it('should have correct expression and collation properties', () => {
      const collate = COLLATE(COLUMN('name'), 'NOCASE');
      expect(collate).toBeInstanceOf(CollateExpression);
      expect(collate.collation).toBe('NOCASE');
    });
  });
});
