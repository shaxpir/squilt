import { CREATE_TABLE, GT, COLUMN } from '../../src/builder/Shorthand';
import { CommonQueryValidator } from '../../src/validate/CommonQueryValidator';

describe('Validate CREATE TABLE', () => {
  const validator = new CommonQueryValidator();

  describe('Basic validation', () => {
    it('should validate a simple CREATE TABLE', () => {
      const query = CREATE_TABLE('users')
        .column('id', 'INTEGER', { primaryKey: true });

      expect(() => validator.validate(query)).not.toThrow();
    });

    it('should fail with no columns', () => {
      const query = CREATE_TABLE('users');

      expect(() => validator.validate(query)).toThrow('CreateTableQuery must have at least one column');
    });

    it('should fail with reserved keyword as table name', () => {
      const query = CREATE_TABLE('SELECT')
        .column('id', 'INTEGER');

      expect(() => validator.validate(query)).toThrow("'SELECT' is a reserved SQLite keyword");
    });

    it('should fail with reserved keyword as column name', () => {
      const query = CREATE_TABLE('users')
        .column('SELECT', 'INTEGER');

      expect(() => validator.validate(query)).toThrow("'SELECT' is a reserved SQLite keyword");
    });
  });

  describe('Duplicate column validation', () => {
    it('should fail with duplicate column names', () => {
      const query = CREATE_TABLE('users')
        .column('id', 'INTEGER', { primaryKey: true })
        .column('id', 'TEXT');

      expect(() => validator.validate(query)).toThrow("Duplicate column name 'id'");
    });

    it('should fail with duplicate column names (case insensitive)', () => {
      const query = CREATE_TABLE('users')
        .column('ID', 'INTEGER', { primaryKey: true })
        .column('id', 'TEXT');

      expect(() => validator.validate(query)).toThrow("Duplicate column name 'id'");
    });
  });

  describe('AUTOINCREMENT validation', () => {
    it('should fail when AUTOINCREMENT is used without PRIMARY KEY', () => {
      const query = CREATE_TABLE('users')
        .column('id', 'INTEGER', { autoIncrement: true });

      expect(() => validator.validate(query)).toThrow('AUTOINCREMENT can only be used with PRIMARY KEY');
    });

    it('should fail when AUTOINCREMENT is used with non-INTEGER type', () => {
      const query = CREATE_TABLE('users')
        .column('id', 'TEXT', { primaryKey: true, autoIncrement: true });

      expect(() => validator.validate(query)).toThrow('AUTOINCREMENT can only be used with INTEGER type');
    });

    it('should pass when AUTOINCREMENT is used correctly', () => {
      const query = CREATE_TABLE('users')
        .column('id', 'INTEGER', { primaryKey: true, autoIncrement: true });

      expect(() => validator.validate(query)).not.toThrow();
    });
  });

  describe('Table constraint validation', () => {
    it('should fail when table constraint references unknown column', () => {
      const query = CREATE_TABLE('users')
        .column('id', 'INTEGER')
        .primaryKey('nonexistent');

      expect(() => validator.validate(query)).toThrow("Constraint references unknown column 'nonexistent'");
    });

    it('should fail when composite primary key references unknown column', () => {
      const query = CREATE_TABLE('user_roles')
        .column('user_id', 'INTEGER')
        .column('role_id', 'INTEGER')
        .primaryKey('user_id', 'bad_column');

      expect(() => validator.validate(query)).toThrow("Constraint references unknown column 'bad_column'");
    });

    it('should pass when composite primary key references valid columns', () => {
      const query = CREATE_TABLE('user_roles')
        .column('user_id', 'INTEGER')
        .column('role_id', 'INTEGER')
        .primaryKey('user_id', 'role_id');

      expect(() => validator.validate(query)).not.toThrow();
    });

    it('should validate unique constraint columns', () => {
      const query = CREATE_TABLE('users')
        .column('id', 'INTEGER', { primaryKey: true })
        .column('email', 'TEXT')
        .unique('email', 'nonexistent');

      expect(() => validator.validate(query)).toThrow("Constraint references unknown column 'nonexistent'");
    });

    it('should fail when constraint name is reserved keyword', () => {
      const query = CREATE_TABLE('users')
        .column('id', 'INTEGER', { primaryKey: true })
        .column('price', 'REAL')
        .check(GT(COLUMN('price'), 0), 'SELECT');

      expect(() => validator.validate(query)).toThrow("'SELECT' is a reserved SQLite keyword");
    });
  });

  describe('Foreign key validation', () => {
    it('should validate foreign key reference table name', () => {
      const query = CREATE_TABLE('orders')
        .column('id', 'INTEGER', { primaryKey: true })
        .column('user_id', 'INTEGER', {
          references: { table: 'SELECT', column: 'id' }
        });

      expect(() => validator.validate(query)).toThrow("'SELECT' is a reserved SQLite keyword");
    });

    it('should validate foreign key reference column name', () => {
      const query = CREATE_TABLE('orders')
        .column('id', 'INTEGER', { primaryKey: true })
        .column('user_id', 'INTEGER', {
          references: { table: 'users', column: 'SELECT' }
        });

      expect(() => validator.validate(query)).toThrow("'SELECT' is a reserved SQLite keyword");
    });

    it('should validate table-level foreign key reference', () => {
      const query = CREATE_TABLE('orders')
        .column('id', 'INTEGER', { primaryKey: true })
        .column('user_id', 'INTEGER')
        .foreignKey(['user_id'], { table: 'SELECT', column: 'id' });

      expect(() => validator.validate(query)).toThrow("'SELECT' is a reserved SQLite keyword");
    });
  });

  describe('CHECK constraint validation', () => {
    it('should validate CHECK constraint expression', () => {
      const query = CREATE_TABLE('products')
        .column('id', 'INTEGER', { primaryKey: true })
        .column('price', 'REAL', { check: GT(COLUMN('price'), 0) });

      expect(() => validator.validate(query)).not.toThrow();
    });

    it('should validate table-level CHECK constraint expression', () => {
      const query = CREATE_TABLE('products')
        .column('id', 'INTEGER', { primaryKey: true })
        .column('min_price', 'REAL')
        .column('max_price', 'REAL')
        .check(GT(COLUMN('max_price'), COLUMN('min_price')));

      expect(() => validator.validate(query)).not.toThrow();
    });
  });
});
