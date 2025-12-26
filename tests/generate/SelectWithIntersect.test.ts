import { SELECT, FROM, COLUMN, EQ, PARAM } from '../../src/builder/Shorthand';
import { SelectQuery } from '../../src/ast/SelectQuery';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';
import { ParamCollectingVisitor } from '../../src/visitor/ParamCollector';
import { QueryIdentityTransformer } from '../../src/visitor/QueryIdentityTransformer';
import { CommonQueryValidator } from '../../src/validate/CommonQueryValidator';

describe('SelectWithIntersect', () => {
  it('generates simple INTERSECT query', () => {
    const query = SELECT(FROM('subscribers'), COLUMN('email'))
      .intersect(SELECT(FROM('customers'), COLUMN('email')));

    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe('SELECT email FROM subscribers INTERSECT SELECT email FROM customers');
  });

  it('generates INTERSECT with multiple columns', () => {
    const query = SELECT(FROM('table_a'), COLUMN('id'), COLUMN('name'))
      .intersect(SELECT(FROM('table_b'), COLUMN('id'), COLUMN('name')));

    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe('SELECT id, name FROM table_a INTERSECT SELECT id, name FROM table_b');
  });

  it('generates INTERSECT with WHERE clauses', () => {
    const query = SELECT(FROM('users'), COLUMN('email'))
      .where(EQ(COLUMN('active'), true))
      .intersect(
        SELECT(FROM('admins'), COLUMN('email'))
          .where(EQ(COLUMN('role'), 'admin'))
      );

    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe("SELECT email FROM users WHERE (active = 1) INTERSECT SELECT email FROM admins WHERE (role = 'admin')");
  });

  it('generates multiple INTERSECT queries', () => {
    const query = SELECT(FROM('set_a'), COLUMN('id'))
      .intersect(SELECT(FROM('set_b'), COLUMN('id')))
      .intersect(SELECT(FROM('set_c'), COLUMN('id')));

    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe('SELECT id FROM set_a INTERSECT SELECT id FROM set_b INTERSECT SELECT id FROM set_c');
  });

  it('generates indented INTERSECT query', () => {
    const query = SELECT(FROM('table_a'), COLUMN('id'))
      .intersect(SELECT(FROM('table_b'), COLUMN('id')));

    const renderer = new IndentedQueryRenderer(2);
    const sql = query.toSQL(renderer);
    expect(sql).toContain('INTERSECT');
    expect(sql).toContain('SELECT');
  });

  it('collects parameters from INTERSECT queries', () => {
    const query = SELECT(FROM('users'), COLUMN('id'))
      .where(EQ(COLUMN('status'), PARAM('status1')))
      .intersect(
        SELECT(FROM('admins'), COLUMN('id'))
          .where(EQ(COLUMN('status'), PARAM('status2')))
      );

    const params = query.accept(new ParamCollectingVisitor({
      status1: 'active',
      status2: 'verified'
    }));
    expect(params).toEqual(['active', 'verified']);
  });

  it('transforms INTERSECT through identity transformer', () => {
    const query = SELECT(FROM('table_a'), COLUMN('id'))
      .intersect(SELECT(FROM('table_b'), COLUMN('id')));

    const transformer = new QueryIdentityTransformer();
    const transformed = transformer.transform(query) as SelectQuery;

    const renderer = new CompactQueryRenderer();
    expect(transformed.toSQL(renderer)).toBe(query.toSQL(renderer));
  });

  it('validates INTERSECT successfully', () => {
    const query = SELECT(FROM('table_a'), COLUMN('id'))
      .intersect(SELECT(FROM('table_b'), COLUMN('id')));

    const validator = new CommonQueryValidator();
    expect(() => validator.validate(query)).not.toThrow();
  });

  it('rejects INTERSECT with mismatched column counts', () => {
    const query = SELECT(FROM('table_a'), COLUMN('id'), COLUMN('name'))
      .intersect(SELECT(FROM('table_b'), COLUMN('id')));

    const validator = new CommonQueryValidator();
    expect(() => validator.validate(query)).toThrow('INTERSECT queries must have the same number of columns');
  });

  it('rejects INTERSECT without main query columns', () => {
    const query = new SelectQuery();
    (query as any)['_intersect'] = [SELECT(FROM('table_b'), COLUMN('id'))];

    const validator = new CommonQueryValidator();
    expect(() => validator.validate(query)).toThrow('A query with INTERSECT subqueries must have columns and a FROM clause in the main query');
  });
});
