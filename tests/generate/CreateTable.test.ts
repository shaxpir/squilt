import { CREATE_TABLE, GT, COLUMN, PARAM } from '../../src/builder/Shorthand';
import { CreateTableQuery } from '../../src/ast/CreateTableQuery';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';
import { QueryBuilder } from '../../src/builder/QueryBuilder';

describe('CREATE TABLE', () => {
  describe('Basic table creation', () => {
    it('should create a simple table with one column', () => {
      const query = CREATE_TABLE('users')
        .column('id', 'INTEGER', { primaryKey: true });

      const sql = query.toSQL(new CompactQueryRenderer());
      expect(sql).toBe('CREATE TABLE users (id INTEGER PRIMARY KEY)');
    });

    it('should create a table with multiple columns', () => {
      const query = CREATE_TABLE('users')
        .column('id', 'INTEGER', { primaryKey: true })
        .column('name', 'TEXT', { notNull: true })
        .column('email', 'TEXT', { notNull: true, unique: true });

      const sql = query.toSQL(new CompactQueryRenderer());
      expect(sql).toBe('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE)');
    });

    it('should support IF NOT EXISTS', () => {
      const query = CREATE_TABLE('users')
        .column('id', 'INTEGER', { primaryKey: true })
        .ifNotExists();

      const sql = query.toSQL(new CompactQueryRenderer());
      expect(sql).toBe('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY)');
    });
  });

  describe('Column types', () => {
    it('should support all SQLite column types', () => {
      const query = CREATE_TABLE('test_types')
        .column('int_col', 'INTEGER')
        .column('text_col', 'TEXT')
        .column('real_col', 'REAL')
        .column('blob_col', 'BLOB')
        .column('numeric_col', 'NUMERIC');

      const sql = query.toSQL(new CompactQueryRenderer());
      expect(sql).toBe('CREATE TABLE test_types (int_col INTEGER, text_col TEXT, real_col REAL, blob_col BLOB, numeric_col NUMERIC)');
    });
  });

  describe('Column constraints', () => {
    it('should support PRIMARY KEY with AUTOINCREMENT', () => {
      const query = CREATE_TABLE('users')
        .column('id', 'INTEGER', { primaryKey: true, autoIncrement: true });

      const sql = query.toSQL(new CompactQueryRenderer());
      expect(sql).toBe('CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT)');
    });

    it('should support NOT NULL', () => {
      const query = CREATE_TABLE('users')
        .column('id', 'INTEGER', { primaryKey: true })
        .column('name', 'TEXT', { notNull: true });

      const sql = query.toSQL(new CompactQueryRenderer());
      expect(sql).toBe('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL)');
    });

    it('should support UNIQUE', () => {
      const query = CREATE_TABLE('users')
        .column('id', 'INTEGER', { primaryKey: true })
        .column('email', 'TEXT', { unique: true });

      const sql = query.toSQL(new CompactQueryRenderer());
      expect(sql).toBe('CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT UNIQUE)');
    });

    it('should support DEFAULT with string value', () => {
      const query = CREATE_TABLE('users')
        .column('id', 'INTEGER', { primaryKey: true })
        .column('status', 'TEXT', { default: 'active' });

      const sql = query.toSQL(new CompactQueryRenderer());
      expect(sql).toBe("CREATE TABLE users (id INTEGER PRIMARY KEY, status TEXT DEFAULT 'active')");
    });

    it('should support DEFAULT with numeric value', () => {
      const query = CREATE_TABLE('products')
        .column('id', 'INTEGER', { primaryKey: true })
        .column('quantity', 'INTEGER', { default: 0 });

      const sql = query.toSQL(new CompactQueryRenderer());
      expect(sql).toBe('CREATE TABLE products (id INTEGER PRIMARY KEY, quantity INTEGER DEFAULT 0)');
    });

    it('should support DEFAULT NULL', () => {
      const query = CREATE_TABLE('users')
        .column('id', 'INTEGER', { primaryKey: true })
        .column('bio', 'TEXT', { default: null });

      const sql = query.toSQL(new CompactQueryRenderer());
      expect(sql).toBe('CREATE TABLE users (id INTEGER PRIMARY KEY, bio TEXT DEFAULT NULL)');
    });

    it('should support DEFAULT CURRENT_TIMESTAMP', () => {
      const query = CREATE_TABLE('logs')
        .column('id', 'INTEGER', { primaryKey: true })
        .column('created_at', 'TEXT', { default: 'CURRENT_TIMESTAMP' });

      const sql = query.toSQL(new CompactQueryRenderer());
      expect(sql).toBe('CREATE TABLE logs (id INTEGER PRIMARY KEY, created_at TEXT DEFAULT CURRENT_TIMESTAMP)');
    });

    it('should support CHECK constraint on column', () => {
      const query = CREATE_TABLE('products')
        .column('id', 'INTEGER', { primaryKey: true })
        .column('price', 'REAL', { check: GT(COLUMN('price'), 0) });

      const sql = query.toSQL(new CompactQueryRenderer());
      expect(sql).toBe('CREATE TABLE products (id INTEGER PRIMARY KEY, price REAL CHECK (price > 0))');
    });

    it('should support column-level REFERENCES', () => {
      const query = CREATE_TABLE('orders')
        .column('id', 'INTEGER', { primaryKey: true })
        .column('user_id', 'INTEGER', { references: { table: 'users', column: 'id' } });

      const sql = query.toSQL(new CompactQueryRenderer());
      expect(sql).toBe('CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER REFERENCES users(id))');
    });

    it('should support REFERENCES with ON DELETE CASCADE', () => {
      const query = CREATE_TABLE('orders')
        .column('id', 'INTEGER', { primaryKey: true })
        .column('user_id', 'INTEGER', {
          references: {
            table: 'users',
            column: 'id',
            onDelete: 'CASCADE'
          }
        });

      const sql = query.toSQL(new CompactQueryRenderer());
      expect(sql).toBe('CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE)');
    });

    it('should support REFERENCES with ON UPDATE SET NULL', () => {
      const query = CREATE_TABLE('orders')
        .column('id', 'INTEGER', { primaryKey: true })
        .column('user_id', 'INTEGER', {
          references: {
            table: 'users',
            column: 'id',
            onUpdate: 'SET NULL'
          }
        });

      const sql = query.toSQL(new CompactQueryRenderer());
      expect(sql).toBe('CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON UPDATE SET NULL)');
    });

    it('should support REFERENCES with both ON DELETE and ON UPDATE', () => {
      const query = CREATE_TABLE('orders')
        .column('id', 'INTEGER', { primaryKey: true })
        .column('user_id', 'INTEGER', {
          references: {
            table: 'users',
            column: 'id',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
          }
        });

      const sql = query.toSQL(new CompactQueryRenderer());
      expect(sql).toBe('CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE)');
    });
  });

  describe('Table constraints', () => {
    it('should support composite PRIMARY KEY', () => {
      const query = CREATE_TABLE('user_roles')
        .column('user_id', 'INTEGER')
        .column('role_id', 'INTEGER')
        .primaryKey('user_id', 'role_id');

      const sql = query.toSQL(new CompactQueryRenderer());
      expect(sql).toBe('CREATE TABLE user_roles (user_id INTEGER, role_id INTEGER, PRIMARY KEY (user_id, role_id))');
    });

    it('should support UNIQUE constraint on multiple columns', () => {
      const query = CREATE_TABLE('users')
        .column('id', 'INTEGER', { primaryKey: true })
        .column('first_name', 'TEXT')
        .column('last_name', 'TEXT')
        .unique('first_name', 'last_name');

      const sql = query.toSQL(new CompactQueryRenderer());
      expect(sql).toBe('CREATE TABLE users (id INTEGER PRIMARY KEY, first_name TEXT, last_name TEXT, UNIQUE (first_name, last_name))');
    });

    it('should support table-level FOREIGN KEY', () => {
      const query = CREATE_TABLE('orders')
        .column('id', 'INTEGER', { primaryKey: true })
        .column('user_id', 'INTEGER')
        .foreignKey(['user_id'], { table: 'users', column: 'id' });

      const sql = query.toSQL(new CompactQueryRenderer());
      expect(sql).toBe('CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER, FOREIGN KEY (user_id) REFERENCES users(id))');
    });

    it('should support table-level FOREIGN KEY with actions', () => {
      const query = CREATE_TABLE('orders')
        .column('id', 'INTEGER', { primaryKey: true })
        .column('user_id', 'INTEGER')
        .foreignKey(['user_id'], {
          table: 'users',
          column: 'id',
          onDelete: 'CASCADE',
          onUpdate: 'SET NULL'
        });

      const sql = query.toSQL(new CompactQueryRenderer());
      expect(sql).toBe('CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE SET NULL)');
    });

    it('should support table-level CHECK constraint', () => {
      const query = CREATE_TABLE('products')
        .column('id', 'INTEGER', { primaryKey: true })
        .column('min_price', 'REAL')
        .column('max_price', 'REAL')
        .check(GT(COLUMN('max_price'), COLUMN('min_price')));

      const sql = query.toSQL(new CompactQueryRenderer());
      expect(sql).toBe('CREATE TABLE products (id INTEGER PRIMARY KEY, min_price REAL, max_price REAL, CHECK (max_price > min_price))');
    });

    it('should support named CHECK constraint', () => {
      const query = CREATE_TABLE('products')
        .column('id', 'INTEGER', { primaryKey: true })
        .column('price', 'REAL')
        .check(GT(COLUMN('price'), 0), 'positive_price');

      const sql = query.toSQL(new CompactQueryRenderer());
      expect(sql).toBe('CREATE TABLE products (id INTEGER PRIMARY KEY, price REAL, CONSTRAINT positive_price CHECK (price > 0))');
    });
  });

  describe('Table options', () => {
    it('should support WITHOUT ROWID', () => {
      const query = CREATE_TABLE('users')
        .column('id', 'INTEGER', { primaryKey: true })
        .column('name', 'TEXT')
        .withoutRowid();

      const sql = query.toSQL(new CompactQueryRenderer());
      expect(sql).toBe('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT) WITHOUT ROWID');
    });

    it('should support STRICT mode', () => {
      const query = CREATE_TABLE('users')
        .column('id', 'INTEGER', { primaryKey: true })
        .column('name', 'TEXT')
        .strict();

      const sql = query.toSQL(new CompactQueryRenderer());
      expect(sql).toBe('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT) STRICT');
    });

    it('should support both WITHOUT ROWID and STRICT', () => {
      const query = CREATE_TABLE('users')
        .column('id', 'INTEGER', { primaryKey: true })
        .column('name', 'TEXT')
        .withoutRowid()
        .strict();

      const sql = query.toSQL(new CompactQueryRenderer());
      expect(sql).toBe('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT) WITHOUT ROWID, STRICT');
    });
  });

  describe('Indented rendering', () => {
    it('should render with proper indentation', () => {
      const query = CREATE_TABLE('users')
        .column('id', 'INTEGER', { primaryKey: true, autoIncrement: true })
        .column('email', 'TEXT', { notNull: true, unique: true })
        .column('name', 'TEXT', { notNull: true })
        .column('created_at', 'TEXT', { default: 'CURRENT_TIMESTAMP' })
        .ifNotExists();

      const sql = query.toSQL(new IndentedQueryRenderer(2));
      expect(sql).toBe(
`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
)`
      );
    });

    it('should render table constraints with proper indentation', () => {
      const query = CREATE_TABLE('user_roles')
        .column('user_id', 'INTEGER')
        .column('role_id', 'INTEGER')
        .column('assigned_at', 'TEXT')
        .primaryKey('user_id', 'role_id')
        .foreignKey(['user_id'], { table: 'users', column: 'id', onDelete: 'CASCADE' });

      const sql = query.toSQL(new IndentedQueryRenderer(2));
      expect(sql).toBe(
`CREATE TABLE user_roles (
  user_id INTEGER,
  role_id INTEGER,
  assigned_at TEXT,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)`
      );
    });

    it('should render table options with proper indentation', () => {
      const query = CREATE_TABLE('strict_table')
        .column('id', 'INTEGER', { primaryKey: true })
        .column('value', 'TEXT')
        .withoutRowid()
        .strict();

      const sql = query.toSQL(new IndentedQueryRenderer(2));
      expect(sql).toBe(
`CREATE TABLE strict_table (
  id INTEGER PRIMARY KEY,
  value TEXT
) WITHOUT ROWID, STRICT`
      );
    });
  });

  describe('QueryBuilder API', () => {
    it('should create table via QueryBuilder', () => {
      const query = QueryBuilder.createTable('users')
        .column('id', 'INTEGER', { primaryKey: true })
        .column('name', 'TEXT');

      const sql = query.toSQL(new CompactQueryRenderer());
      expect(sql).toBe('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)');
    });
  });

  describe('Getters', () => {
    it('should expose tableName', () => {
      const query = CREATE_TABLE('users');
      expect(query.tableName).toBe('users');
    });

    it('should expose columns', () => {
      const query = CREATE_TABLE('users')
        .column('id', 'INTEGER', { primaryKey: true })
        .column('name', 'TEXT');

      expect(query.columns).toHaveLength(2);
      expect(query.columns[0].name).toBe('id');
      expect(query.columns[0].type).toBe('INTEGER');
      expect(query.columns[0].constraints.primaryKey).toBe(true);
    });

    it('should expose tableConstraints', () => {
      const query = CREATE_TABLE('users')
        .column('id', 'INTEGER')
        .column('name', 'TEXT')
        .primaryKey('id', 'name');

      expect(query.tableConstraints).toHaveLength(1);
      expect(query.tableConstraints[0].type).toBe('PRIMARY KEY');
      expect(query.tableConstraints[0].columns).toEqual(['id', 'name']);
    });

    it('should expose hasIfNotExists', () => {
      const query1 = CREATE_TABLE('users').column('id', 'INTEGER');
      expect(query1.hasIfNotExists).toBe(false);

      const query2 = CREATE_TABLE('users').column('id', 'INTEGER').ifNotExists();
      expect(query2.hasIfNotExists).toBe(true);
    });

    it('should expose hasWithoutRowid', () => {
      const query1 = CREATE_TABLE('users').column('id', 'INTEGER', { primaryKey: true });
      expect(query1.hasWithoutRowid).toBe(false);

      const query2 = CREATE_TABLE('users').column('id', 'INTEGER', { primaryKey: true }).withoutRowid();
      expect(query2.hasWithoutRowid).toBe(true);
    });

    it('should expose isStrict', () => {
      const query1 = CREATE_TABLE('users').column('id', 'INTEGER');
      expect(query1.isStrict).toBe(false);

      const query2 = CREATE_TABLE('users').column('id', 'INTEGER').strict();
      expect(query2.isStrict).toBe(true);
    });
  });

  describe('Static create method', () => {
    it('should create table using static create method', () => {
      const query = CreateTableQuery.create('users')
        .column('id', 'INTEGER', { primaryKey: true });

      const sql = query.toSQL(new CompactQueryRenderer());
      expect(sql).toBe('CREATE TABLE users (id INTEGER PRIMARY KEY)');
    });
  });

  describe('Complex table example', () => {
    it('should create a complex table matching the TODO.md example', () => {
      const query = CREATE_TABLE('users')
        .column('id', 'INTEGER', { primaryKey: true, autoIncrement: true })
        .column('email', 'TEXT', { notNull: true, unique: true })
        .column('name', 'TEXT', { notNull: true })
        .column('created_at', 'TEXT', { default: 'CURRENT_TIMESTAMP' })
        .column('team_id', 'INTEGER', { references: { table: 'teams', column: 'id' } })
        .ifNotExists();

      const sql = query.toSQL(new CompactQueryRenderer());
      expect(sql).toBe(
        'CREATE TABLE IF NOT EXISTS users (' +
        'id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
        'email TEXT NOT NULL UNIQUE, ' +
        'name TEXT NOT NULL, ' +
        'created_at TEXT DEFAULT CURRENT_TIMESTAMP, ' +
        'team_id INTEGER REFERENCES teams(id))'
      );
    });
  });
});
