import { DELETE_FROM, EQ, COLUMN, PARAM } from '../../src/builder/Shorthand';
import { DeleteQuery } from '../../src/ast/DeleteQuery';
import { CommonQueryValidator } from '../../src/validate/CommonQueryValidator';
import { SQLiteQueryValidator } from '../../src/validate/SQLiteQueryValidator';

describe('ValidateDeleteQuery', () => {
  describe('CommonQueryValidator', () => {
    const validator = new CommonQueryValidator();

    it('validates simple DELETE query', () => {
      const query = DELETE_FROM('users');
      expect(() => validator.validate(query)).not.toThrow();
    });

    it('validates DELETE with WHERE clause', () => {
      const query = DELETE_FROM('users')
        .where(EQ(COLUMN('id'), PARAM('userId')));
      expect(() => validator.validate(query)).not.toThrow();
    });

    it('throws for empty table name', () => {
      const query = new DeleteQuery('');
      expect(() => validator.validate(query)).toThrow('DeleteQuery name cannot be empty');
    });

    it('throws for reserved keyword table name', () => {
      const query = DELETE_FROM('select');
      expect(() => validator.validate(query)).toThrow("DeleteQuery name 'select' is a reserved SQLite keyword");
    });

    it('validates nested WHERE expressions', () => {
      const query = DELETE_FROM('orders')
        .where(EQ(
          COLUMN('user_id'),
          PARAM('userId')
        ));
      expect(() => validator.validate(query)).not.toThrow();
    });
  });

  describe('SQLiteQueryValidator', () => {
    const validator = new SQLiteQueryValidator();

    it('validates simple DELETE query', () => {
      const query = DELETE_FROM('users');
      expect(() => validator.validate(query)).not.toThrow();
    });

    it('validates DELETE with WHERE clause', () => {
      const query = DELETE_FROM('users')
        .where(EQ(COLUMN('id'), 42));
      expect(() => validator.validate(query)).not.toThrow();
    });

    it('throws for empty table name', () => {
      const query = new DeleteQuery('');
      expect(() => validator.validate(query)).toThrow('DeleteQuery name cannot be empty');
    });
  });
});
