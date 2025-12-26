import { SELECT, FROM, COLUMN, BETWEEN, NOT_BETWEEN, PARAM, AND } from '../../src/builder/Shorthand';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';
import { ParamCollectingVisitor } from '../../src/visitor/ParamCollector';

describe('SelectWithBetween', () => {
  it('generates SELECT with BETWEEN using literals', () => {
    const query = SELECT(FROM('products'), COLUMN('*'))
      .where(BETWEEN(COLUMN('price'), 10, 100));
    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe('SELECT * FROM products WHERE (price BETWEEN 10 AND 100)');
  });

  it('generates SELECT with BETWEEN using parameters', () => {
    const query = SELECT(FROM('orders'), COLUMN('*'))
      .where(BETWEEN(COLUMN('total'), PARAM('minTotal'), PARAM('maxTotal')));
    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe('SELECT * FROM orders WHERE (total BETWEEN ? AND ?)');
  });

  it('generates SELECT with NOT BETWEEN', () => {
    const query = SELECT(FROM('employees'), COLUMN('*'))
      .where(NOT_BETWEEN(COLUMN('salary'), 50000, 100000));
    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe('SELECT * FROM employees WHERE (salary NOT BETWEEN 50000 AND 100000)');
  });

  it('generates SELECT with BETWEEN and string bounds', () => {
    const query = SELECT(FROM('events'), COLUMN('*'))
      .where(BETWEEN(COLUMN('event_date'), '2025-01-01', '2025-12-31'));
    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe("SELECT * FROM events WHERE (event_date BETWEEN '2025-01-01' AND '2025-12-31')");
  });

  it('generates SELECT with BETWEEN in complex WHERE', () => {
    const query = SELECT(FROM('products'), COLUMN('*'))
      .where(AND(
        BETWEEN(COLUMN('price'), 10, 100),
        BETWEEN(COLUMN('quantity'), 1, 50)
      ));
    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe('SELECT * FROM products WHERE ((price BETWEEN 10 AND 100) AND (quantity BETWEEN 1 AND 50))');
  });

  it('generates indented SELECT with BETWEEN', () => {
    const query = SELECT(FROM('items'), COLUMN('name'), COLUMN('price'))
      .where(BETWEEN(COLUMN('price'), 5, 20));
    const renderer = new IndentedQueryRenderer(2);
    const sql = query.toSQL(renderer);
    expect(sql).toContain('WHERE (price BETWEEN 5 AND 20)');
  });

  it('collects parameters from BETWEEN expression', () => {
    const query = SELECT(FROM('products'), COLUMN('*'))
      .where(BETWEEN(COLUMN('price'), PARAM('minPrice'), PARAM('maxPrice')));

    const params = query.accept(new ParamCollectingVisitor({
      minPrice: 10,
      maxPrice: 100
    }));

    expect(params).toEqual([10, 100]);
  });

  it('collects parameters from NOT BETWEEN expression', () => {
    const query = SELECT(FROM('items'), COLUMN('*'))
      .where(NOT_BETWEEN(COLUMN('stock'), PARAM('low'), PARAM('high')));

    const params = query.accept(new ParamCollectingVisitor({
      low: 0,
      high: 5
    }));

    expect(params).toEqual([0, 5]);
  });

  it('collects parameters in correct order with BETWEEN and other conditions', () => {
    const query = SELECT(FROM('products'), COLUMN('*'))
      .where(AND(
        BETWEEN(COLUMN('price'), PARAM('minPrice'), PARAM('maxPrice')),
        BETWEEN(COLUMN('rating'), PARAM('minRating'), PARAM('maxRating'))
      ));

    const params = query.accept(new ParamCollectingVisitor({
      minPrice: 10,
      maxPrice: 100,
      minRating: 3,
      maxRating: 5
    }));

    expect(params).toEqual([10, 100, 3, 5]);
  });
});
