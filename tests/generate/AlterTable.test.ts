import { CompactQueryRenderer } from "../../src/renderer/CompactQueryRenderer";
import { ALTER_TABLE, EQ, GT, VAL, COLUMN } from "../../src/builder/Shorthand";

describe('AlterTable', () => {
  const renderer = new CompactQueryRenderer();

  describe('ADD COLUMN', () => {
    it('should render basic ADD COLUMN', () => {
      const query = ALTER_TABLE('users')
        .addColumn('email', 'TEXT');

      expect(renderer.render(query)).toBe(
        'ALTER TABLE users ADD COLUMN email TEXT'
      );
    });

    it('should render ADD COLUMN with NOT NULL', () => {
      const query = ALTER_TABLE('users')
        .addColumn('email', 'TEXT', { notNull: true });

      expect(renderer.render(query)).toBe(
        'ALTER TABLE users ADD COLUMN email TEXT NOT NULL'
      );
    });

    it('should render ADD COLUMN with DEFAULT string value', () => {
      const query = ALTER_TABLE('users')
        .addColumn('status', 'TEXT', { default: 'active' });

      expect(renderer.render(query)).toBe(
        `ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'`
      );
    });

    it('should render ADD COLUMN with DEFAULT number value', () => {
      const query = ALTER_TABLE('users')
        .addColumn('age', 'INTEGER', { default: 0 });

      expect(renderer.render(query)).toBe(
        'ALTER TABLE users ADD COLUMN age INTEGER DEFAULT 0'
      );
    });

    it('should render ADD COLUMN with UNIQUE constraint', () => {
      const query = ALTER_TABLE('users')
        .addColumn('email', 'TEXT', { unique: true });

      expect(renderer.render(query)).toBe(
        'ALTER TABLE users ADD COLUMN email TEXT UNIQUE'
      );
    });

    it('should render ADD COLUMN with CHECK constraint', () => {
      const query = ALTER_TABLE('products')
        .addColumn('price', 'REAL', {
          check: GT(COLUMN('price'), VAL(0))
        });

      expect(renderer.render(query)).toBe(
        'ALTER TABLE products ADD COLUMN price REAL CHECK (price > 0)'
      );
    });

    it('should render ADD COLUMN with REFERENCES', () => {
      const query = ALTER_TABLE('orders')
        .addColumn('user_id', 'INTEGER', {
          references: { table: 'users', column: 'id' }
        });

      expect(renderer.render(query)).toBe(
        'ALTER TABLE orders ADD COLUMN user_id INTEGER REFERENCES users(id)'
      );
    });

    it('should render ADD COLUMN with REFERENCES and ON DELETE', () => {
      const query = ALTER_TABLE('orders')
        .addColumn('user_id', 'INTEGER', {
          references: { table: 'users', column: 'id', onDelete: 'CASCADE' }
        });

      expect(renderer.render(query)).toBe(
        'ALTER TABLE orders ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE'
      );
    });

    it('should render ADD COLUMN with multiple constraints', () => {
      const query = ALTER_TABLE('users')
        .addColumn('email', 'TEXT', {
          notNull: true,
          unique: true,
          default: 'unknown@example.com'
        });

      expect(renderer.render(query)).toBe(
        `ALTER TABLE users ADD COLUMN email TEXT NOT NULL UNIQUE DEFAULT 'unknown@example.com'`
      );
    });
  });

  describe('RENAME COLUMN', () => {
    it('should render RENAME COLUMN', () => {
      const query = ALTER_TABLE('users')
        .renameColumn('email', 'email_address');

      expect(renderer.render(query)).toBe(
        'ALTER TABLE users RENAME COLUMN email TO email_address'
      );
    });

    it('should handle reserved words in column names', () => {
      const query = ALTER_TABLE('data')
        .renameColumn('select', 'selection');

      expect(renderer.render(query)).toBe(
        'ALTER TABLE data RENAME COLUMN "select" TO selection'
      );
    });
  });

  describe('DROP COLUMN', () => {
    it('should render DROP COLUMN', () => {
      const query = ALTER_TABLE('users')
        .dropColumn('temporary_field');

      expect(renderer.render(query)).toBe(
        'ALTER TABLE users DROP COLUMN temporary_field'
      );
    });
  });

  describe('RENAME TABLE', () => {
    it('should render RENAME TO', () => {
      const query = ALTER_TABLE('old_users')
        .renameTo('new_users');

      expect(renderer.render(query)).toBe(
        'ALTER TABLE old_users RENAME TO new_users'
      );
    });
  });

  describe('edge cases', () => {
    it('should handle table names with spaces', () => {
      const query = ALTER_TABLE('user accounts')
        .addColumn('id', 'INTEGER');

      expect(renderer.render(query)).toBe(
        'ALTER TABLE "user accounts" ADD COLUMN id INTEGER'
      );
    });

    it('should handle column names with special characters', () => {
      const query = ALTER_TABLE('users')
        .addColumn('full-name', 'TEXT');

      expect(renderer.render(query)).toBe(
        'ALTER TABLE users ADD COLUMN "full-name" TEXT'
      );
    });

    it('should handle reserved words in table names', () => {
      const query = ALTER_TABLE('select')
        .addColumn('name', 'TEXT');

      expect(renderer.render(query)).toBe(
        'ALTER TABLE "select" ADD COLUMN name TEXT'
      );
    });
  });
});
