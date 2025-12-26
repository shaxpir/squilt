import { DROP_INDEX } from '../../src/builder/Shorthand';
import { DropIndexQuery } from '../../src/ast/DropIndexQuery';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';
import { QueryIdentityTransformer } from '../../src/visitor/QueryIdentityTransformer';
import { CommonQueryValidator } from '../../src/validate/CommonQueryValidator';

describe('DropIndex', () => {
  describe('basic DROP INDEX', () => {
    it('generates simple DROP INDEX', () => {
      const query = DROP_INDEX('idx_users_email');

      const renderer = new CompactQueryRenderer();
      const sql = query.toSQL(renderer);
      expect(sql).toBe('DROP INDEX idx_users_email');
    });

    it('generates DROP INDEX with complex name', () => {
      const query = DROP_INDEX('idx_orders_user_id_created_at');

      const renderer = new CompactQueryRenderer();
      const sql = query.toSQL(renderer);
      expect(sql).toBe('DROP INDEX idx_orders_user_id_created_at');
    });
  });

  describe('IF EXISTS', () => {
    it('generates DROP INDEX IF EXISTS', () => {
      const query = DROP_INDEX('idx_old_index').ifExists();

      const renderer = new CompactQueryRenderer();
      const sql = query.toSQL(renderer);
      expect(sql).toBe('DROP INDEX IF EXISTS idx_old_index');
    });

    it('generates DROP INDEX IF EXISTS with complex name', () => {
      const query = DROP_INDEX('idx_archive_data_2023').ifExists();

      const renderer = new CompactQueryRenderer();
      const sql = query.toSQL(renderer);
      expect(sql).toBe('DROP INDEX IF EXISTS idx_archive_data_2023');
    });
  });

  describe('indented rendering', () => {
    it('renders DROP INDEX with indented renderer', () => {
      const query = DROP_INDEX('idx_users_name');

      const renderer = new IndentedQueryRenderer(2);
      const sql = query.toSQL(renderer);
      expect(sql).toBe('DROP INDEX idx_users_name');
    });

    it('renders DROP INDEX IF EXISTS with indented renderer', () => {
      const query = DROP_INDEX('idx_temp').ifExists();

      const renderer = new IndentedQueryRenderer(2);
      const sql = query.toSQL(renderer);
      expect(sql).toBe('DROP INDEX IF EXISTS idx_temp');
    });
  });

  describe('identity transformation', () => {
    it('transforms DROP INDEX correctly', () => {
      const query = DROP_INDEX('idx_users_email');

      const transformer = new QueryIdentityTransformer();
      const transformed = transformer.transform(query) as DropIndexQuery;

      const renderer = new CompactQueryRenderer();
      expect(transformed.toSQL(renderer)).toBe(query.toSQL(renderer));
    });

    it('transforms DROP INDEX IF EXISTS correctly', () => {
      const query = DROP_INDEX('idx_cache').ifExists();

      const transformer = new QueryIdentityTransformer();
      const transformed = transformer.transform(query) as DropIndexQuery;

      const renderer = new CompactQueryRenderer();
      expect(transformed.toSQL(renderer)).toBe(query.toSQL(renderer));
      expect(transformed.hasIfExists).toBe(true);
    });
  });

  describe('validation', () => {
    it('validates DROP INDEX successfully', () => {
      const query = DROP_INDEX('idx_users_email');

      const validator = new CommonQueryValidator();
      expect(() => validator.validate(query)).not.toThrow();
    });

    it('validates DROP INDEX IF EXISTS successfully', () => {
      const query = DROP_INDEX('idx_cache').ifExists();

      const validator = new CommonQueryValidator();
      expect(() => validator.validate(query)).not.toThrow();
    });

    it('rejects DROP INDEX with empty index name', () => {
      const query = DROP_INDEX('');

      const validator = new CommonQueryValidator();
      expect(() => validator.validate(query)).toThrow('DropIndexQuery name cannot be empty');
    });
  });

  describe('getter methods', () => {
    it('returns index name via getter', () => {
      const query = DROP_INDEX('idx_my_index');

      expect(query.indexName).toBe('idx_my_index');
    });

    it('returns hasIfExists flag via getter', () => {
      const query1 = DROP_INDEX('idx_1');
      const query2 = DROP_INDEX('idx_2').ifExists();

      expect(query1.hasIfExists).toBe(false);
      expect(query2.hasIfExists).toBe(true);
    });
  });
});
