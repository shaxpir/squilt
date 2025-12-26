import { CommonQueryValidator } from "../../src/validate/CommonQueryValidator";
import { ALTER_TABLE, GT, VAL, COLUMN } from "../../src/builder/Shorthand";

describe('ValidateAlterTable', () => {
  const validator = new CommonQueryValidator();

  describe('ADD COLUMN validation', () => {
    it('should validate basic ADD COLUMN', () => {
      const query = ALTER_TABLE('users')
        .addColumn('email', 'TEXT');

      expect(() => validator.validate(query)).not.toThrow();
    });

    it('should validate ADD COLUMN with all constraints', () => {
      const query = ALTER_TABLE('orders')
        .addColumn('user_id', 'INTEGER', {
          notNull: true,
          unique: true,
          default: 0,
          references: { table: 'users', column: 'id', onDelete: 'CASCADE' },
          check: GT(COLUMN('user_id'), VAL(0))
        });

      expect(() => validator.validate(query)).not.toThrow();
    });

    it('should fail with reserved keyword as column name', () => {
      const query = ALTER_TABLE('users')
        .addColumn('SELECT', 'TEXT');

      expect(() => validator.validate(query)).toThrow("'SELECT' is a reserved SQLite keyword");
    });

    it('should fail with reserved keyword as table name', () => {
      const query = ALTER_TABLE('SELECT')
        .addColumn('email', 'TEXT');

      expect(() => validator.validate(query)).toThrow("'SELECT' is a reserved SQLite keyword");
    });
  });

  describe('RENAME COLUMN validation', () => {
    it('should validate RENAME COLUMN', () => {
      const query = ALTER_TABLE('users')
        .renameColumn('old_name', 'new_name');

      expect(() => validator.validate(query)).not.toThrow();
    });

    it('should fail with reserved keyword as new column name', () => {
      const query = ALTER_TABLE('users')
        .renameColumn('old_name', 'SELECT');

      expect(() => validator.validate(query)).toThrow("'SELECT' is a reserved SQLite keyword");
    });
  });

  describe('DROP COLUMN validation', () => {
    it('should validate DROP COLUMN', () => {
      const query = ALTER_TABLE('users')
        .dropColumn('unused_column');

      expect(() => validator.validate(query)).not.toThrow();
    });

    it('should fail with reserved keyword as column name', () => {
      const query = ALTER_TABLE('users')
        .dropColumn('SELECT');

      expect(() => validator.validate(query)).toThrow("'SELECT' is a reserved SQLite keyword");
    });
  });

  describe('RENAME TABLE validation', () => {
    it('should validate RENAME TO', () => {
      const query = ALTER_TABLE('old_table')
        .renameTo('new_table');

      expect(() => validator.validate(query)).not.toThrow();
    });

    it('should fail with reserved keyword as new table name', () => {
      const query = ALTER_TABLE('old_table')
        .renameTo('SELECT');

      expect(() => validator.validate(query)).toThrow("'SELECT' is a reserved SQLite keyword");
    });
  });

  describe('No operation validation', () => {
    it('should fail when no operation is specified', () => {
      const query = ALTER_TABLE('users');

      expect(() => validator.validate(query)).toThrow('AlterTableQuery must have an operation');
    });
  });
});
