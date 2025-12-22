import { BinaryExpression } from '../../src/ast/BinaryExpression';
import { Column } from '../../src/ast/Column';
import { TableFrom } from '../../src/ast/From';
import { NumberLiteral, Param, StringLiteral } from '../../src/ast/Literals';
import { Operator } from '../../src/ast/Operator';
import { SelectQuery } from '../../src/ast/SelectQuery';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { QueryParamRewriteTransformer } from '../../src/visitor/QueryParamRewriteTransformer';

describe('QueryParamRewriteTransformer with Single Expression Replacement', () => {
  test('replaces named param in WHERE with single expression in complex query', () => {
    // Complex query with param in WHERE
    const query = new SelectQuery();
    query.from(new TableFrom('t'));
    query.column(new Column('*'));
    query.where(new Param('expr'));

    const replacement = new BinaryExpression(new Column('a'), Operator.EQUALS, new Column('b'));

    const transformer = new QueryParamRewriteTransformer('expr', replacement);
    const transformed = transformer.transform(query) as SelectQuery;

    const renderer = new CompactQueryRenderer();
    const transformedSql = transformed.toSQL(renderer);

    expect(transformedSql).toBe('SELECT * FROM t WHERE (a = b)');
  });

  test('replaces multiple params in single pass using object syntax', () => {
    // Query with multiple params
    const query = new SelectQuery();
    query.from(new TableFrom('users'));
    query.column(new Column('*'));
    query.where(
      new BinaryExpression(
        new BinaryExpression(
          new Column('name'),
          Operator.EQUALS,
          new Param('nameParam')
        ),
        Operator.AND,
        new BinaryExpression(
          new Column('age'),
          Operator.GREATER_THAN,
          new Param('ageParam')
        )
      )
    );

    const transformer = new QueryParamRewriteTransformer({
      'nameParam': new StringLiteral('John'),
      'ageParam': new NumberLiteral(18)
    });
    const transformed = transformer.transform(query) as SelectQuery;

    const renderer = new CompactQueryRenderer();
    const transformedSql = transformed.toSQL(renderer);

    expect(transformedSql).toBe("SELECT * FROM users WHERE ((name = 'John') AND (age > 18))");
  });

  test('legacy single-parameter constructor still works', () => {
    const query = new SelectQuery();
    query.from(new TableFrom('t'));
    query.column(new Column('*'));
    query.where(new Param('expr'));

    const replacement = new BinaryExpression(new Column('a'), Operator.EQUALS, new Column('b'));

    // Using legacy constructor
    const transformer = new QueryParamRewriteTransformer('expr', replacement);
    const transformed = transformer.transform(query) as SelectQuery;

    const renderer = new CompactQueryRenderer();
    const transformedSql = transformed.toSQL(renderer);

    expect(transformedSql).toBe('SELECT * FROM t WHERE (a = b)');
  });

  test('handles params that do not exist in replacement map', () => {
    const query = new SelectQuery();
    query.from(new TableFrom('t'));
    query.column(new Column('*'));
    query.where(new Param('unknown'));

    const transformer = new QueryParamRewriteTransformer({
      'known': new StringLiteral('value')
    });
    const transformed = transformer.transform(query) as SelectQuery;

    const renderer = new CompactQueryRenderer();
    const transformedSql = transformed.toSQL(renderer);

    // Should leave unknown param as-is
    expect(transformedSql).toBe('SELECT * FROM t WHERE ?');
  });
});