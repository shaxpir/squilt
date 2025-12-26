import { DELETE_FROM } from '../../src/builder/Shorthand';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';
import { QueryBuilder } from '../../src/builder/QueryBuilder';

describe('DeleteSimpleQuery', () => {
  it('generates a simple DELETE query using shorthand', () => {
    const query = DELETE_FROM('users');
    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe('DELETE FROM users');
  });

  it('generates a simple DELETE query using QueryBuilder', () => {
    const query = QueryBuilder.deleteFrom('users');
    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe('DELETE FROM users');
  });

  it('generates indented DELETE query', () => {
    const query = DELETE_FROM('orders');
    const renderer = new IndentedQueryRenderer(2);
    const sql = query.toSQL(renderer);
    expect(sql).toBe('DELETE\nFROM orders');
  });

  it('uses IndentedQueryRenderer by default', () => {
    const query = DELETE_FROM('products');
    const sql = query.toSQL();
    expect(sql).toBe('DELETE\nFROM products');
  });

  it('quotes reserved keyword table names', () => {
    const query = DELETE_FROM('order');
    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe('DELETE FROM "order"');
  });

  it('quotes table names with special characters', () => {
    const query = DELETE_FROM('my-table');
    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe('DELETE FROM "my-table"');
  });
});
