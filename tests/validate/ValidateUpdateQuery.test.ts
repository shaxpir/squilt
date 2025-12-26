import { UPDATE, EQ, COLUMN, PARAM } from '../../src/builder/Shorthand';
import { SQLiteQueryValidator } from '../../src/validate/SQLiteQueryValidator';
import { CommonQueryValidator } from '../../src/validate/CommonQueryValidator';
import { StringLiteral, NumberLiteral } from '../../src/ast/Literals';
import { UpdateQuery } from '../../src/ast/UpdateQuery';

describe('ValidateUpdateQuery', () => {
  describe('CommonQueryValidator', () => {
    it('validates a simple UPDATE query', () => {
      const query = UPDATE('users')
        .set('name', new StringLiteral('John'));
      const validator = new CommonQueryValidator();
      expect(() => validator.validate(query)).not.toThrow();
    });

    it('validates UPDATE with WHERE clause', () => {
      const query = UPDATE('users')
        .set('status', new StringLiteral('active'))
        .where(EQ(COLUMN('id'), PARAM('userId')));
      const validator = new CommonQueryValidator();
      expect(() => validator.validate(query)).not.toThrow();
    });

    it('rejects UPDATE with empty table name', () => {
      const query = new UpdateQuery('');
      query.set('name', new StringLiteral('John'));
      const validator = new CommonQueryValidator();
      expect(() => validator.validate(query)).toThrow('UpdateQuery name cannot be empty');
    });

    it('rejects UPDATE with no SET clauses', () => {
      const query = UPDATE('users');
      const validator = new CommonQueryValidator();
      expect(() => validator.validate(query)).toThrow('UpdateQuery must have at least one SET clause');
    });

    it('rejects UPDATE with reserved keyword table name', () => {
      const query = UPDATE('SELECT')
        .set('name', new StringLiteral('John'));
      const validator = new CommonQueryValidator();
      expect(() => validator.validate(query)).toThrow("UpdateQuery name 'SELECT' is a reserved SQLite keyword");
    });

    it('rejects UPDATE with reserved keyword column name', () => {
      const query = UPDATE('users')
        .set('SELECT', new StringLiteral('value'));
      const validator = new CommonQueryValidator();
      expect(() => validator.validate(query)).toThrow("UpdateQuery column name 'SELECT' is a reserved SQLite keyword");
    });

    it('validates expressions in SET values', () => {
      const query = UPDATE('users')
        .set('score', new NumberLiteral(NaN));
      const validator = new CommonQueryValidator();
      expect(() => validator.validate(query)).toThrow('NumberLiteral value must be a valid number');
    });

    it('validates expressions in WHERE clause', () => {
      const query = UPDATE('users')
        .set('name', new StringLiteral('John'))
        .where(EQ(COLUMN(''), new StringLiteral('value')));
      const validator = new CommonQueryValidator();
      expect(() => validator.validate(query)).toThrow('Column name cannot be empty');
    });
  });

  describe('SQLiteQueryValidator', () => {
    it('validates a simple UPDATE query', () => {
      const query = UPDATE('users')
        .set('name', new StringLiteral('John'));
      const validator = new SQLiteQueryValidator();
      expect(() => validator.validate(query)).not.toThrow();
    });

    it('validates UPDATE with multiple SET clauses', () => {
      const query = UPDATE('users')
        .set('name', new StringLiteral('John'))
        .set('age', new NumberLiteral(30))
        .set('active', new NumberLiteral(1));
      const validator = new SQLiteQueryValidator();
      expect(() => validator.validate(query)).not.toThrow();
    });

    it('validates UPDATE with WHERE clause', () => {
      const query = UPDATE('users')
        .set('status', new StringLiteral('active'))
        .where(EQ(COLUMN('id'), PARAM('userId')));
      const validator = new SQLiteQueryValidator();
      expect(() => validator.validate(query)).not.toThrow();
    });
  });
});
