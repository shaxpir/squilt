import { DELETE_FROM, EQ, COLUMN, PARAM, AND } from '../../src/builder/Shorthand';
import { QueryIdentityTransformer } from '../../src/visitor/QueryIdentityTransformer';
import { QueryParamRewriteTransformer } from '../../src/visitor/QueryParamRewriteTransformer';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { DeleteQuery } from '../../src/ast/DeleteQuery';
import { NumberLiteral } from '../../src/ast/Literals';

describe('DeleteQueryTransform', () => {
  describe('QueryIdentityTransformer', () => {
    const transformer = new QueryIdentityTransformer();
    const renderer = new CompactQueryRenderer();

    it('clones simple DELETE query', () => {
      const original = DELETE_FROM('users');
      const cloned = transformer.transform(original) as DeleteQuery;

      expect(cloned).not.toBe(original);
      expect(cloned.toSQL(renderer)).toBe('DELETE FROM users');
    });

    it('clones DELETE query with WHERE clause', () => {
      const original = DELETE_FROM('users')
        .where(EQ(COLUMN('id'), PARAM('userId')));
      const cloned = transformer.transform(original) as DeleteQuery;

      expect(cloned).not.toBe(original);
      expect(cloned.toSQL(renderer)).toBe('DELETE FROM users WHERE (id = ?)');
    });

    it('clones DELETE query with complex WHERE clause', () => {
      const original = DELETE_FROM('orders')
        .where(AND(
          EQ(COLUMN('status'), 'cancelled'),
          EQ(COLUMN('user_id'), PARAM('userId'))
        ));
      const cloned = transformer.transform(original) as DeleteQuery;

      expect(cloned).not.toBe(original);
      expect(cloned.toSQL(renderer)).toBe("DELETE FROM orders WHERE ((status = 'cancelled') AND (user_id = ?))");
    });

    it('preserves table name after cloning', () => {
      const original = DELETE_FROM('my_special_table');
      const cloned = transformer.transform(original) as DeleteQuery;

      expect(cloned.tableName).toBe('my_special_table');
    });

    it('cloned query WHERE clause is independent', () => {
      const original = DELETE_FROM('users')
        .where(EQ(COLUMN('id'), 1));
      const cloned = transformer.transform(original) as DeleteQuery;

      // Modifying the clone shouldn't affect the original
      expect(cloned.whereClause).not.toBe(original.whereClause);
    });
  });

  describe('QueryParamRewriteTransformer', () => {
    const renderer = new CompactQueryRenderer();

    it('rewrites single parameter in WHERE clause', () => {
      const original = DELETE_FROM('users')
        .where(EQ(COLUMN('id'), PARAM('userId')));

      const transformer = new QueryParamRewriteTransformer({
        userId: new NumberLiteral(42)
      });
      const rewritten = transformer.transform(original) as DeleteQuery;

      expect(rewritten.toSQL(renderer)).toBe('DELETE FROM users WHERE (id = 42)');
    });

    it('rewrites multiple parameters in WHERE clause', () => {
      const original = DELETE_FROM('users')
        .where(AND(
          EQ(COLUMN('id'), PARAM('userId')),
          EQ(COLUMN('status'), PARAM('status'))
        ));

      const transformer = new QueryParamRewriteTransformer({
        userId: new NumberLiteral(42),
        status: new NumberLiteral(1)
      });
      const rewritten = transformer.transform(original) as DeleteQuery;

      expect(rewritten.toSQL(renderer)).toBe('DELETE FROM users WHERE ((id = 42) AND (status = 1))');
    });

    it('leaves unreferenced parameters unchanged', () => {
      const original = DELETE_FROM('users')
        .where(EQ(COLUMN('id'), PARAM('userId')));

      const transformer = new QueryParamRewriteTransformer({
        otherParam: new NumberLiteral(99)
      });
      const rewritten = transformer.transform(original) as DeleteQuery;

      expect(rewritten.toSQL(renderer)).toBe('DELETE FROM users WHERE (id = ?)');
    });
  });
});
