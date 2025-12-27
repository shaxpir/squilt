import { CREATE_INDEX, EQ, COLUMN, FN } from '../../src/builder/Shorthand';
import { CreateIndexQuery } from '../../src/ast/CreateIndexQuery';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';
import { QueryBuilder } from '../../src/builder/QueryBuilder';
import { NumberLiteral, StringLiteral } from '../../src/ast/Literals';

describe('CREATE INDEX', () => {
  describe('Basic index creation', () => {
    it('should create a simple index on one column', () => {
      const query = CREATE_INDEX('idx_users_email')
        .on('users', 'email');

      const sql = query.toSQL(new CompactQueryRenderer());
      expect(sql).toBe('CREATE INDEX idx_users_email ON users (email)');
    });

    it('should create an index on multiple columns', () => {
      const query = CREATE_INDEX('idx_orders_user_date')
        .on('orders', ['user_id', 'created_at']);

      const sql = query.toSQL(new CompactQueryRenderer());
      expect(sql).toBe('CREATE INDEX idx_orders_user_date ON orders (user_id, created_at)');
    });

    it('should support IF NOT EXISTS', () => {
      const query = CREATE_INDEX('idx_users_email')
        .on('users', 'email')
        .ifNotExists();

      const sql = query.toSQL(new CompactQueryRenderer());
      expect(sql).toBe('CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)');
    });
  });

  describe('Unique indexes', () => {
    it('should create a unique index', () => {
      const query = CREATE_INDEX('idx_users_email')
        .on('users', 'email')
        .unique();

      const sql = query.toSQL(new CompactQueryRenderer());
      expect(sql).toBe('CREATE UNIQUE INDEX idx_users_email ON users (email)');
    });

    it('should create a unique index with IF NOT EXISTS', () => {
      const query = CREATE_INDEX('idx_users_email')
        .on('users', 'email')
        .unique()
        .ifNotExists();

      const sql = query.toSQL(new CompactQueryRenderer());
      expect(sql).toBe('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (email)');
    });
  });

  describe('Partial indexes', () => {
    it('should create a partial index with WHERE clause', () => {
      const query = CREATE_INDEX('idx_active_users')
        .on('users', 'email')
        .where(EQ(COLUMN('active'), new NumberLiteral(1)));

      const sql = query.toSQL(new CompactQueryRenderer());
      expect(sql).toBe('CREATE INDEX idx_active_users ON users (email) WHERE (active = 1)');
    });

    it('should create a unique partial index', () => {
      const query = CREATE_INDEX('idx_active_emails')
        .on('users', 'email')
        .unique()
        .where(EQ(COLUMN('active'), new NumberLiteral(1)));

      const sql = query.toSQL(new CompactQueryRenderer());
      expect(sql).toBe('CREATE UNIQUE INDEX idx_active_emails ON users (email) WHERE (active = 1)');
    });

    it('should create a partial index on multiple columns', () => {
      const query = CREATE_INDEX('idx_active_user_orders')
        .on('orders', ['user_id', 'status'])
        .where(EQ(COLUMN('active'), new NumberLiteral(1)));

      const sql = query.toSQL(new CompactQueryRenderer());
      expect(sql).toBe('CREATE INDEX idx_active_user_orders ON orders (user_id, status) WHERE (active = 1)');
    });
  });

  describe('Indented rendering', () => {
    it('should render simple index the same as compact', () => {
      const query = CREATE_INDEX('idx_users_email')
        .on('users', 'email');

      const sql = query.toSQL(new IndentedQueryRenderer(2));
      expect(sql).toBe('CREATE INDEX idx_users_email ON users (email)');
    });

    it('should render partial index with WHERE', () => {
      const query = CREATE_INDEX('idx_active_users')
        .on('users', 'email')
        .where(EQ(COLUMN('active'), new NumberLiteral(1)));

      const sql = query.toSQL(new IndentedQueryRenderer(2));
      expect(sql).toBe('CREATE INDEX idx_active_users ON users (email) WHERE (active = 1)');
    });
  });

  describe('QueryBuilder API', () => {
    it('should create index via QueryBuilder', () => {
      const query = QueryBuilder.createIndex('idx_users_email')
        .on('users', 'email');

      const sql = query.toSQL(new CompactQueryRenderer());
      expect(sql).toBe('CREATE INDEX idx_users_email ON users (email)');
    });
  });

  describe('Getters', () => {
    it('should expose indexName', () => {
      const query = CREATE_INDEX('idx_users_email');
      expect(query.indexName).toBe('idx_users_email');
    });

    it('should expose tableName', () => {
      const query = CREATE_INDEX('idx_users_email')
        .on('users', 'email');
      expect(query.tableName).toBe('users');
    });

    it('should expose columns as array', () => {
      const query = CREATE_INDEX('idx_test')
        .on('users', ['col1', 'col2']);
      expect(query.columns).toEqual(['col1', 'col2']);
    });

    it('should expose single column as array', () => {
      const query = CREATE_INDEX('idx_test')
        .on('users', 'email');
      expect(query.columns).toEqual(['email']);
    });

    it('should expose isUnique', () => {
      const query1 = CREATE_INDEX('idx_test').on('users', 'email');
      expect(query1.isUnique).toBe(false);

      const query2 = CREATE_INDEX('idx_test').on('users', 'email').unique();
      expect(query2.isUnique).toBe(true);
    });

    it('should expose hasIfNotExists', () => {
      const query1 = CREATE_INDEX('idx_test').on('users', 'email');
      expect(query1.hasIfNotExists).toBe(false);

      const query2 = CREATE_INDEX('idx_test').on('users', 'email').ifNotExists();
      expect(query2.hasIfNotExists).toBe(true);
    });

    it('should expose whereExpression', () => {
      const query1 = CREATE_INDEX('idx_test').on('users', 'email');
      expect(query1.whereExpression).toBeNull();

      const whereExpr = EQ(COLUMN('active'), new NumberLiteral(1));
      const query2 = CREATE_INDEX('idx_test').on('users', 'email').where(whereExpr);
      expect(query2.whereExpression).toBe(whereExpr);
    });
  });

  describe('Static create method', () => {
    it('should create index using static create method', () => {
      const query = CreateIndexQuery.create('idx_users_email')
        .on('users', 'email');

      const sql = query.toSQL(new CompactQueryRenderer());
      expect(sql).toBe('CREATE INDEX idx_users_email ON users (email)');
    });
  });

  describe('Examples from TODO.md', () => {
    it('should match simple index example', () => {
      const query = CREATE_INDEX('idx_users_email')
        .on('users', 'email');

      const sql = query.toSQL(new CompactQueryRenderer());
      expect(sql).toBe('CREATE INDEX idx_users_email ON users (email)');
    });

    it('should match composite index example', () => {
      const query = CREATE_INDEX('idx_orders_user_date')
        .on('orders', ['user_id', 'created_at']);

      const sql = query.toSQL(new CompactQueryRenderer());
      expect(sql).toBe('CREATE INDEX idx_orders_user_date ON orders (user_id, created_at)');
    });

    it('should match unique index example', () => {
      const query = CREATE_INDEX('idx_users_email')
        .on('users', 'email')
        .unique();

      const sql = query.toSQL(new CompactQueryRenderer());
      expect(sql).toBe('CREATE UNIQUE INDEX idx_users_email ON users (email)');
    });

    it('should match partial index example', () => {
      const query = CREATE_INDEX('idx_active_users')
        .on('users', 'email')
        .where(EQ(COLUMN('active'), true));

      const sql = query.toSQL(new CompactQueryRenderer());
      expect(sql).toBe('CREATE INDEX idx_active_users ON users (email) WHERE (active = 1)');
    });
  });

  describe('Expression indexes', () => {
    it('should create an index on a function expression', () => {
      const query = CREATE_INDEX('idx_name_lower')
        .on('users', FN('LOWER', COLUMN('name')));

      const sql = query.toSQL(new CompactQueryRenderer());
      expect(sql).toBe('CREATE INDEX idx_name_lower ON users (LOWER(name))');
    });

    it('should create an index on json_extract', () => {
      const query = CREATE_INDEX('idx_data_field')
        .on('docs', FN('json_extract', COLUMN('data'), new StringLiteral('$.field')));

      const sql = query.toSQL(new CompactQueryRenderer());
      expect(sql).toBe("CREATE INDEX idx_data_field ON docs (json_extract(data, '$.field'))");
    });

    it('should create a composite index with mixed columns and expressions', () => {
      const query = CREATE_INDEX('idx_users_composite')
        .on('users', ['id', FN('LOWER', COLUMN('email'))]);

      const sql = query.toSQL(new CompactQueryRenderer());
      expect(sql).toBe('CREATE INDEX idx_users_composite ON users (id, LOWER(email))');
    });

    it('should create an expression index with IF NOT EXISTS', () => {
      const query = CREATE_INDEX('idx_data_field')
        .on('docs', FN('json_extract', COLUMN('data'), new StringLiteral('$.type')))
        .ifNotExists();

      const sql = query.toSQL(new CompactQueryRenderer());
      expect(sql).toBe("CREATE INDEX IF NOT EXISTS idx_data_field ON docs (json_extract(data, '$.type'))");
    });

    it('should create a unique expression index', () => {
      const query = CREATE_INDEX('idx_email_lower')
        .on('users', FN('LOWER', COLUMN('email')))
        .unique();

      const sql = query.toSQL(new CompactQueryRenderer());
      expect(sql).toBe('CREATE UNIQUE INDEX idx_email_lower ON users (LOWER(email))');
    });

    it('should create an expression index with WHERE clause', () => {
      const query = CREATE_INDEX('idx_active_data')
        .on('docs', FN('json_extract', COLUMN('data'), new StringLiteral('$.status')))
        .where(EQ(COLUMN('active'), new NumberLiteral(1)));

      const sql = query.toSQL(new CompactQueryRenderer());
      expect(sql).toBe("CREATE INDEX idx_active_data ON docs (json_extract(data, '$.status')) WHERE (active = 1)");
    });

    it('should work with indented renderer', () => {
      const query = CREATE_INDEX('idx_data_field')
        .on('docs', FN('json_extract', COLUMN('data'), new StringLiteral('$.field')));

      const sql = query.toSQL(new IndentedQueryRenderer(2));
      expect(sql).toBe("CREATE INDEX idx_data_field ON docs (json_extract(data, '$.field'))");
    });

    it('should allow COLUMN expression for column reference', () => {
      const query = CREATE_INDEX('idx_users_email')
        .on('users', COLUMN('email'));

      const sql = query.toSQL(new CompactQueryRenderer());
      expect(sql).toBe('CREATE INDEX idx_users_email ON users (email)');
    });
  });
});
