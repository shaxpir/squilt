import { CREATE_INDEX, EQ, COLUMN } from '../../src/builder/Shorthand';
import { CommonQueryValidator } from '../../src/validate/CommonQueryValidator';
import { NumberLiteral } from '../../src/ast/Literals';

describe('Validate CREATE INDEX', () => {
  const validator = new CommonQueryValidator();

  describe('Basic validation', () => {
    it('should validate a simple CREATE INDEX', () => {
      const query = CREATE_INDEX('idx_users_email')
        .on('users', 'email');

      expect(() => validator.validate(query)).not.toThrow();
    });

    it('should validate a composite index', () => {
      const query = CREATE_INDEX('idx_orders_user_date')
        .on('orders', ['user_id', 'created_at']);

      expect(() => validator.validate(query)).not.toThrow();
    });

    it('should validate a unique index', () => {
      const query = CREATE_INDEX('idx_users_email')
        .on('users', 'email')
        .unique();

      expect(() => validator.validate(query)).not.toThrow();
    });

    it('should validate a partial index', () => {
      const query = CREATE_INDEX('idx_active_users')
        .on('users', 'email')
        .where(EQ(COLUMN('active'), new NumberLiteral(1)));

      expect(() => validator.validate(query)).not.toThrow();
    });
  });

  describe('Reserved keyword validation', () => {
    it('should fail with reserved keyword as index name', () => {
      const query = CREATE_INDEX('SELECT')
        .on('users', 'email');

      expect(() => validator.validate(query)).toThrow("'SELECT' is a reserved SQLite keyword");
    });

    it('should fail with reserved keyword as table name', () => {
      const query = CREATE_INDEX('idx_test')
        .on('SELECT', 'email');

      expect(() => validator.validate(query)).toThrow("'SELECT' is a reserved SQLite keyword");
    });

    it('should fail with reserved keyword as column name', () => {
      const query = CREATE_INDEX('idx_test')
        .on('users', 'SELECT');

      expect(() => validator.validate(query)).toThrow("'SELECT' is a reserved SQLite keyword");
    });

    it('should fail with reserved keyword in column list', () => {
      const query = CREATE_INDEX('idx_test')
        .on('users', ['id', 'SELECT']);

      expect(() => validator.validate(query)).toThrow("'SELECT' is a reserved SQLite keyword");
    });
  });

  describe('Empty validation', () => {
    it('should fail with no columns', () => {
      const query = CREATE_INDEX('idx_test')
        .on('users', []);

      expect(() => validator.validate(query)).toThrow('CreateIndexQuery must have at least one column');
    });
  });
});
