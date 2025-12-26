import { SELECT, FROM, COLUMN, BETWEEN, NOT_BETWEEN, PARAM } from '../../src/builder/Shorthand';
import { QueryIdentityTransformer } from '../../src/visitor/QueryIdentityTransformer';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { SelectQuery } from '../../src/ast/SelectQuery';

describe('BetweenExpressionTransform', () => {
  it('transforms SELECT with BETWEEN', () => {
    const query = SELECT(FROM('products'), COLUMN('*'))
      .where(BETWEEN(COLUMN('price'), 10, 100));

    const transformer = new QueryIdentityTransformer();
    const cloned = transformer.transform(query) as SelectQuery;

    expect(cloned).not.toBe(query);
    expect(cloned).toBeInstanceOf(SelectQuery);

    const renderer = new CompactQueryRenderer();
    expect(cloned.toSQL(renderer)).toBe(query.toSQL(renderer));
  });

  it('transforms SELECT with NOT BETWEEN', () => {
    const query = SELECT(FROM('employees'), COLUMN('*'))
      .where(NOT_BETWEEN(COLUMN('salary'), 50000, 100000));

    const transformer = new QueryIdentityTransformer();
    const cloned = transformer.transform(query) as SelectQuery;

    expect(cloned).not.toBe(query);
    const renderer = new CompactQueryRenderer();
    expect(cloned.toSQL(renderer)).toBe(query.toSQL(renderer));
  });

  it('transforms SELECT with BETWEEN using parameters', () => {
    const query = SELECT(FROM('orders'), COLUMN('*'))
      .where(BETWEEN(COLUMN('total'), PARAM('min'), PARAM('max')));

    const transformer = new QueryIdentityTransformer();
    const cloned = transformer.transform(query) as SelectQuery;

    expect(cloned).not.toBe(query);
    const renderer = new CompactQueryRenderer();
    expect(cloned.toSQL(renderer)).toBe(query.toSQL(renderer));
  });

  it('preserves NOT flag when transforming', () => {
    const query = SELECT(FROM('data'), COLUMN('*'))
      .where(NOT_BETWEEN(COLUMN('value'), 0, 10));

    const transformer = new QueryIdentityTransformer();
    const cloned = transformer.transform(query) as SelectQuery;

    const renderer = new CompactQueryRenderer();
    const sql = cloned.toSQL(renderer);
    expect(sql).toContain('NOT BETWEEN');
  });
});
