import { UPDATE } from '../../src/builder/Shorthand';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';
import { QueryBuilder } from '../../src/builder/QueryBuilder';
import { StringLiteral, NumberLiteral } from '../../src/ast/Literals';

describe('UpdateSimpleQuery', () => {
  it('generates a simple UPDATE query using shorthand', () => {
    const query = UPDATE('users')
      .set('name', new StringLiteral('John'));
    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe("UPDATE users SET name = 'John'");
  });

  it('generates a simple UPDATE query using QueryBuilder', () => {
    const query = QueryBuilder.update('users')
      .set('name', new StringLiteral('John'));
    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe("UPDATE users SET name = 'John'");
  });

  it('generates UPDATE with multiple SET clauses', () => {
    const query = UPDATE('users')
      .set('name', new StringLiteral('John'))
      .set('age', new NumberLiteral(30))
      .set('active', new NumberLiteral(1));
    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe("UPDATE users SET name = 'John', age = 30, active = 1");
  });

  it('generates indented UPDATE query', () => {
    const query = UPDATE('orders')
      .set('status', new StringLiteral('shipped'));
    const renderer = new IndentedQueryRenderer(2);
    const sql = query.toSQL(renderer);
    expect(sql).toBe("UPDATE orders\nSET status = 'shipped'");
  });

  it('uses IndentedQueryRenderer by default', () => {
    const query = UPDATE('products')
      .set('price', new NumberLiteral(99));
    const sql = query.toSQL();
    expect(sql).toBe('UPDATE products\nSET price = 99');
  });

  it('quotes reserved keyword table names', () => {
    const query = UPDATE('order')
      .set('status', new StringLiteral('pending'));
    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe('UPDATE "order" SET status = \'pending\'');
  });

  it('quotes table names with special characters', () => {
    const query = UPDATE('my-table')
      .set('value', new NumberLiteral(42));
    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe('UPDATE "my-table" SET value = 42');
  });

  it('quotes reserved keyword column names', () => {
    const query = UPDATE('data')
      .set('select', new StringLiteral('value'))
      .set('from', new NumberLiteral(1));
    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe('UPDATE data SET "select" = \'value\', "from" = 1');
  });
});
