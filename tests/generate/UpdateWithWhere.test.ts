import { UPDATE, EQ, COLUMN, PARAM, AND, OR, GT, LT, IN, LIKE, VAL } from '../../src/builder/Shorthand';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';
import { ParamCollectingVisitor } from '../../src/visitor/ParamCollector';
import { StringLiteral, NumberLiteral } from '../../src/ast/Literals';

describe('UpdateWithWhere', () => {
  it('generates UPDATE with simple WHERE condition', () => {
    const query = UPDATE('users')
      .set('status', new StringLiteral('active'))
      .where(EQ(COLUMN('id'), PARAM('userId')));
    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe("UPDATE users SET status = 'active' WHERE (id = ?)");
  });

  it('generates UPDATE with WHERE using literal value', () => {
    const query = UPDATE('users')
      .set('last_login', new StringLiteral('2025-01-01'))
      .where(EQ(COLUMN('email'), 'john@example.com'));
    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe("UPDATE users SET last_login = '2025-01-01' WHERE (email = 'john@example.com')");
  });

  it('generates UPDATE with AND condition', () => {
    const query = UPDATE('orders')
      .set('status', new StringLiteral('archived'))
      .where(AND(
        EQ(COLUMN('status'), 'shipped'),
        LT(COLUMN('created_at'), PARAM('cutoffDate'))
      ));
    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe("UPDATE orders SET status = 'archived' WHERE ((status = 'shipped') AND (created_at < ?))");
  });

  it('generates UPDATE with OR condition', () => {
    const query = UPDATE('logs')
      .set('processed', new NumberLiteral(1))
      .where(OR(
        EQ(COLUMN('level'), 'error'),
        EQ(COLUMN('level'), 'warning')
      ));
    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe("UPDATE logs SET processed = 1 WHERE ((level = 'error') OR (level = 'warning'))");
  });

  it('generates UPDATE with complex nested conditions', () => {
    const query = UPDATE('events')
      .set('archived', new NumberLiteral(1))
      .where(AND(
        EQ(COLUMN('processed'), true),
        OR(
          LT(COLUMN('date'), PARAM('oldDate')),
          EQ(COLUMN('type'), 'temporary')
        )
      ));
    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe("UPDATE events SET archived = 1 WHERE ((processed = 1) AND ((date < ?) OR (type = 'temporary')))");
  });

  it('generates UPDATE with IN clause', () => {
    const query = UPDATE('users')
      .set('verified', new NumberLiteral(1))
      .where(IN(COLUMN('id'), 1, 2, 3));
    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe('UPDATE users SET verified = 1 WHERE (id IN (1, 2, 3))');
  });

  it('generates UPDATE with LIKE clause', () => {
    const query = UPDATE('files')
      .set('category', new StringLiteral('temp'))
      .where(LIKE(COLUMN('filename'), '%.tmp'));
    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe("UPDATE files SET category = 'temp' WHERE (filename LIKE '%.tmp')");
  });

  it('generates indented UPDATE with WHERE', () => {
    const query = UPDATE('users')
      .set('status', new StringLiteral('inactive'))
      .where(EQ(COLUMN('id'), PARAM('userId')));
    const renderer = new IndentedQueryRenderer(2);
    const sql = query.toSQL(renderer);
    expect(sql).toBe("UPDATE users\nSET status = 'inactive'\nWHERE (id = ?)");
  });

  it('generates UPDATE with multiple SET and WHERE', () => {
    const query = UPDATE('products')
      .set('price', new NumberLiteral(99))
      .set('on_sale', new NumberLiteral(1))
      .set('discount', new NumberLiteral(10))
      .where(EQ(COLUMN('category'), 'electronics'));
    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe("UPDATE products SET price = 99, on_sale = 1, discount = 10 WHERE (category = 'electronics')");
  });

  it('collects parameters from UPDATE query SET values', () => {
    const query = UPDATE('users')
      .set('name', PARAM('newName'))
      .set('age', PARAM('newAge'))
      .where(EQ(COLUMN('id'), PARAM('userId')));

    const params = query.accept(new ParamCollectingVisitor({
      newName: 'John',
      newAge: 30,
      userId: 42
    }));

    expect(params).toEqual(['John', 30, 42]);
  });

  it('throws error for missing parameter', () => {
    const query = UPDATE('users')
      .set('name', PARAM('newName'))
      .where(EQ(COLUMN('id'), PARAM('userId')));

    expect(() => {
      query.accept(new ParamCollectingVisitor({ newName: 'John' }));
    }).toThrow('No value provided for parameter: userId');
  });
});
