import { Column } from '../../src/ast/Column';
import { TableFrom } from '../../src/ast/From';
import { Param, StringLiteral } from '../../src/ast/Literals';
import { SelectQuery } from '../../src/ast/SelectQuery';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { COUNT, FN_DISTINCT } from '../../src/builder/Shorthand';
import { QueryIdentityTransformer } from '../../src/visitor/QueryIdentityTransformer';
import { QueryParamRewriteTransformer } from '../../src/visitor/QueryParamRewriteTransformer';

describe('FunctionExpression DISTINCT preservation through transforms', () => {
  test('identity transform preserves DISTINCT', () => {
    const query = new SelectQuery();
    query.from(new TableFrom('t'));
    query.column(FN_DISTINCT('COUNT', new Column('x')));

    const transformed = new QueryIdentityTransformer().transform(query) as SelectQuery;
    const sql = transformed.toSQL(new CompactQueryRenderer());

    expect(sql).toBe('SELECT COUNT(DISTINCT x) FROM t');
  });

  test('param rewrite preserves DISTINCT on an unrelated function', () => {
    // Regression: visitFunctionExpression used to rebuild the node without the
    // distinct flag, silently turning COUNT(DISTINCT x) into COUNT(x) whenever
    // a query passed through the param-rewrite transformer.
    const query = new SelectQuery();
    query.from(new TableFrom('t'));
    query.column(FN_DISTINCT('COUNT', new Column('x')));
    query.where(new Param('cond'));

    const transformer = new QueryParamRewriteTransformer('cond', new StringLiteral('a'));
    const transformed = transformer.transform(query) as SelectQuery;
    const sql = transformed.toSQL(new CompactQueryRenderer());

    expect(sql).toContain('COUNT(DISTINCT x)');
  });

  test('non-distinct function is unaffected', () => {
    const query = new SelectQuery();
    query.from(new TableFrom('t'));
    query.column(COUNT(new Column('x')));

    const transformed = new QueryIdentityTransformer().transform(query) as SelectQuery;
    const sql = transformed.toSQL(new CompactQueryRenderer());

    expect(sql).toBe('SELECT COUNT(x) FROM t');
  });
});
