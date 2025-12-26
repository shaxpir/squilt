import { DROP_TABLE } from '../../src/builder/Shorthand';
import { DropTableQuery } from '../../src/ast/DropTableQuery';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';
import { QueryIdentityTransformer } from '../../src/visitor/QueryIdentityTransformer';
import { CommonQueryValidator } from '../../src/validate/CommonQueryValidator';

describe('DropTable', () => {
  describe('basic DROP TABLE', () => {
    it('generates simple DROP TABLE', () => {
      const query = DROP_TABLE('users');

      const renderer = new CompactQueryRenderer();
      const sql = query.toSQL(renderer);
      expect(sql).toBe('DROP TABLE users');
    });

    it('generates DROP TABLE with quoted table name', () => {
      const query = DROP_TABLE('user_sessions');

      const renderer = new CompactQueryRenderer();
      const sql = query.toSQL(renderer);
      expect(sql).toBe('DROP TABLE user_sessions');
    });
  });

  describe('IF EXISTS', () => {
    it('generates DROP TABLE IF EXISTS', () => {
      const query = DROP_TABLE('temp_data').ifExists();

      const renderer = new CompactQueryRenderer();
      const sql = query.toSQL(renderer);
      expect(sql).toBe('DROP TABLE IF EXISTS temp_data');
    });

    it('generates DROP TABLE IF EXISTS with complex name', () => {
      const query = DROP_TABLE('old_archive_2023').ifExists();

      const renderer = new CompactQueryRenderer();
      const sql = query.toSQL(renderer);
      expect(sql).toBe('DROP TABLE IF EXISTS old_archive_2023');
    });
  });

  describe('indented rendering', () => {
    it('renders DROP TABLE with indented renderer', () => {
      const query = DROP_TABLE('users');

      const renderer = new IndentedQueryRenderer(2);
      const sql = query.toSQL(renderer);
      expect(sql).toBe('DROP TABLE users');
    });

    it('renders DROP TABLE IF EXISTS with indented renderer', () => {
      const query = DROP_TABLE('cache').ifExists();

      const renderer = new IndentedQueryRenderer(2);
      const sql = query.toSQL(renderer);
      expect(sql).toBe('DROP TABLE IF EXISTS cache');
    });
  });

  describe('identity transformation', () => {
    it('transforms DROP TABLE correctly', () => {
      const query = DROP_TABLE('users');

      const transformer = new QueryIdentityTransformer();
      const transformed = transformer.transform(query) as DropTableQuery;

      const renderer = new CompactQueryRenderer();
      expect(transformed.toSQL(renderer)).toBe(query.toSQL(renderer));
    });

    it('transforms DROP TABLE IF EXISTS correctly', () => {
      const query = DROP_TABLE('cache').ifExists();

      const transformer = new QueryIdentityTransformer();
      const transformed = transformer.transform(query) as DropTableQuery;

      const renderer = new CompactQueryRenderer();
      expect(transformed.toSQL(renderer)).toBe(query.toSQL(renderer));
      expect(transformed.hasIfExists).toBe(true);
    });
  });

  describe('validation', () => {
    it('validates DROP TABLE successfully', () => {
      const query = DROP_TABLE('users');

      const validator = new CommonQueryValidator();
      expect(() => validator.validate(query)).not.toThrow();
    });

    it('validates DROP TABLE IF EXISTS successfully', () => {
      const query = DROP_TABLE('cache').ifExists();

      const validator = new CommonQueryValidator();
      expect(() => validator.validate(query)).not.toThrow();
    });

    it('rejects DROP TABLE with empty table name', () => {
      const query = DROP_TABLE('');

      const validator = new CommonQueryValidator();
      expect(() => validator.validate(query)).toThrow('DropTableQuery name cannot be empty');
    });
  });

  describe('getter methods', () => {
    it('returns table name via getter', () => {
      const query = DROP_TABLE('my_table');

      expect(query.tableName).toBe('my_table');
    });

    it('returns hasIfExists flag via getter', () => {
      const query1 = DROP_TABLE('table1');
      const query2 = DROP_TABLE('table2').ifExists();

      expect(query1.hasIfExists).toBe(false);
      expect(query2.hasIfExists).toBe(true);
    });
  });
});
