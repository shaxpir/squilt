import { SELECT, FROM, COLUMN, EQ, PARAM } from '../../src/builder/Shorthand';
import { SelectQuery } from '../../src/ast/SelectQuery';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';
import { ParamCollectingVisitor } from '../../src/visitor/ParamCollector';
import { QueryIdentityTransformer } from '../../src/visitor/QueryIdentityTransformer';
import { CommonQueryValidator } from '../../src/validate/CommonQueryValidator';

describe('SelectWithExcept', () => {
  it('generates simple EXCEPT query', () => {
    const query = SELECT(FROM('all_users'), COLUMN('id'))
      .except(SELECT(FROM('banned_users'), COLUMN('user_id')));

    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe('SELECT id FROM all_users EXCEPT SELECT user_id FROM banned_users');
  });

  it('generates EXCEPT with multiple columns', () => {
    const query = SELECT(FROM('products'), COLUMN('id'), COLUMN('name'))
      .except(SELECT(FROM('discontinued'), COLUMN('product_id'), COLUMN('product_name')));

    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe('SELECT id, name FROM products EXCEPT SELECT product_id, product_name FROM discontinued');
  });

  it('generates EXCEPT with WHERE clauses', () => {
    const query = SELECT(FROM('orders'), COLUMN('id'))
      .where(EQ(COLUMN('year'), 2024))
      .except(
        SELECT(FROM('refunds'), COLUMN('order_id'))
          .where(EQ(COLUMN('processed'), true))
      );

    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe('SELECT id FROM orders WHERE (year = 2024) EXCEPT SELECT order_id FROM refunds WHERE (processed = 1)');
  });

  it('generates multiple EXCEPT queries', () => {
    const query = SELECT(FROM('all_items'), COLUMN('id'))
      .except(SELECT(FROM('sold_items'), COLUMN('id')))
      .except(SELECT(FROM('reserved_items'), COLUMN('id')));

    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe('SELECT id FROM all_items EXCEPT SELECT id FROM sold_items EXCEPT SELECT id FROM reserved_items');
  });

  it('generates indented EXCEPT query', () => {
    const query = SELECT(FROM('table_a'), COLUMN('id'))
      .except(SELECT(FROM('table_b'), COLUMN('id')));

    const renderer = new IndentedQueryRenderer(2);
    const sql = query.toSQL(renderer);
    expect(sql).toContain('EXCEPT');
    expect(sql).toContain('SELECT');
  });

  it('collects parameters from EXCEPT queries', () => {
    const query = SELECT(FROM('users'), COLUMN('id'))
      .where(EQ(COLUMN('created_at'), PARAM('date1')))
      .except(
        SELECT(FROM('deleted_users'), COLUMN('id'))
          .where(EQ(COLUMN('deleted_at'), PARAM('date2')))
      );

    const params = query.accept(new ParamCollectingVisitor({
      date1: '2024-01-01',
      date2: '2024-06-01'
    }));
    expect(params).toEqual(['2024-01-01', '2024-06-01']);
  });

  it('transforms EXCEPT through identity transformer', () => {
    const query = SELECT(FROM('table_a'), COLUMN('id'))
      .except(SELECT(FROM('table_b'), COLUMN('id')));

    const transformer = new QueryIdentityTransformer();
    const transformed = transformer.transform(query) as SelectQuery;

    const renderer = new CompactQueryRenderer();
    expect(transformed.toSQL(renderer)).toBe(query.toSQL(renderer));
  });

  it('validates EXCEPT successfully', () => {
    const query = SELECT(FROM('table_a'), COLUMN('id'))
      .except(SELECT(FROM('table_b'), COLUMN('id')));

    const validator = new CommonQueryValidator();
    expect(() => validator.validate(query)).not.toThrow();
  });

  it('rejects EXCEPT with mismatched column counts', () => {
    const query = SELECT(FROM('table_a'), COLUMN('id'), COLUMN('name'))
      .except(SELECT(FROM('table_b'), COLUMN('id')));

    const validator = new CommonQueryValidator();
    expect(() => validator.validate(query)).toThrow('EXCEPT queries must have the same number of columns');
  });

  it('rejects EXCEPT without main query columns', () => {
    const query = new SelectQuery();
    (query as any)['_except'] = [SELECT(FROM('table_b'), COLUMN('id'))];

    const validator = new CommonQueryValidator();
    expect(() => validator.validate(query)).toThrow('A query with EXCEPT subqueries must have columns and a FROM clause in the main query');
  });

  it('can combine UNION, INTERSECT, and EXCEPT', () => {
    const query = SELECT(FROM('set_a'), COLUMN('id'))
      .union(SELECT(FROM('set_b'), COLUMN('id')))
      .intersect(SELECT(FROM('set_c'), COLUMN('id')))
      .except(SELECT(FROM('set_d'), COLUMN('id')));

    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe('SELECT id FROM set_a UNION SELECT id FROM set_b INTERSECT SELECT id FROM set_c EXCEPT SELECT id FROM set_d');
  });
});
