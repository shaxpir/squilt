# Squilt Roadmap

A comprehensive feature roadmap for the squilt SQL query builder library.

## Priority Features

| Feature | Category | Complexity | Status |
|---------|----------|------------|--------|
| UPSERT (ON CONFLICT) | DML | Medium | Planned |
| CREATE TABLE | DDL | High | Planned |
| Window Functions | DML | High | Planned |
| INSERT ... SELECT | DML | Low | Planned |
| RETURNING Clause | DML | Low | ✅ Done |
| DROP TABLE | DDL | Low | Planned |
| ALTER TABLE | DDL | Medium | Planned |
| CREATE INDEX | DDL | Medium | Planned |
| Full-Text Search | DDL/DML | High | Planned |

---

## Data Definition Language (DDL)

### CREATE TABLE

Table creation with column definitions, constraints, and SQLite-specific options.

```typescript
// Desired API
CREATE_TABLE('users')
  .column('id', 'INTEGER', { primaryKey: true, autoIncrement: true })
  .column('email', 'TEXT', { notNull: true, unique: true })
  .column('name', 'TEXT', { notNull: true })
  .column('created_at', 'TEXT', { default: "CURRENT_TIMESTAMP" })
  .column('team_id', 'INTEGER', { references: { table: 'teams', column: 'id' } })
  .ifNotExists();

// Would generate:
// CREATE TABLE IF NOT EXISTS users (
//   id INTEGER PRIMARY KEY AUTOINCREMENT,
//   email TEXT NOT NULL UNIQUE,
//   name TEXT NOT NULL,
//   created_at TEXT DEFAULT CURRENT_TIMESTAMP,
//   team_id INTEGER REFERENCES teams(id)
// )
```

**Features to support:**
- Column types: INTEGER, TEXT, REAL, BLOB, NUMERIC
- Constraints: PRIMARY KEY, NOT NULL, UNIQUE, CHECK, DEFAULT, REFERENCES
- Table constraints: composite PRIMARY KEY, FOREIGN KEY with ON DELETE/UPDATE
- Modifiers: IF NOT EXISTS, WITHOUT ROWID, STRICT (SQLite 3.37+)

### ALTER TABLE

Schema modifications for existing tables.

```typescript
// Add column
ALTER_TABLE('users').addColumn('bio', 'TEXT');

// Rename column (SQLite 3.25+)
ALTER_TABLE('users').renameColumn('name', 'full_name');

// Drop column (SQLite 3.35+)
ALTER_TABLE('users').dropColumn('legacy_field');

// Rename table
ALTER_TABLE('old_name').renameTo('new_name');
```

### DROP TABLE

```typescript
DROP_TABLE('temp_data');
DROP_TABLE('cache').ifExists();
```

### CREATE INDEX / DROP INDEX

```typescript
// Simple index
CREATE_INDEX('idx_users_email').on('users', 'email');

// Composite index
CREATE_INDEX('idx_orders_user_date')
  .on('orders', ['user_id', 'created_at']);

// Unique index
CREATE_INDEX('idx_users_email')
  .on('users', 'email')
  .unique();

// Partial index (filtered)
CREATE_INDEX('idx_active_users')
  .on('users', 'email')
  .where(EQ(COLUMN('active'), true));

// Drop index
DROP_INDEX('idx_old_index');
DROP_INDEX('idx_maybe_exists').ifExists();
```

### CREATE VIEW / DROP VIEW

```typescript
// Create view from SELECT query
CREATE_VIEW('active_users').as(
  SELECT(FROM('users'), COLUMN('*'))
    .where(EQ(COLUMN('active'), true))
);

DROP_VIEW('old_view').ifExists();
```

### Full-Text Search (FTS5)

SQLite's FTS5 virtual tables enable powerful text search capabilities.

```typescript
// Create FTS table
CREATE_VIRTUAL_TABLE('documents_fts')
  .using('fts5', {
    columns: ['title', 'content', 'author'],
    contentTable: 'documents',  // External content mode
    tokenizer: 'porter unicode61'
  });

// Full-text search query
SELECT(FROM('documents_fts'), COLUMN('*'))
  .where(MATCH('documents_fts', 'sqlite AND database'));

// Ranked results with BM25
SELECT(
  FROM('documents_fts'),
  COLUMN('title'),
  COLUMN('content'),
  FN('bm25', COLUMN('documents_fts')).as('rank')
)
.where(MATCH('documents_fts', 'query terms'))
.orderBy('rank');

// Highlight snippets
SELECT(
  FROM('documents_fts'),
  FN('highlight', COLUMN('documents_fts'), 0, '<b>', '</b>').as('title'),
  FN('snippet', COLUMN('documents_fts'), 1, '<b>', '</b>', '...', 20).as('excerpt')
)
.where(MATCH('documents_fts', 'search query'));
```

**FTS5 features to support:**
- Virtual table creation with FTS5 module
- MATCH operator for full-text queries
- BM25 ranking function
- highlight() and snippet() auxiliary functions
- Boolean operators in search (AND, OR, NOT)
- Phrase queries and prefix queries
- Content tables (external content mode)
- Tokenizer configuration

---

## Advanced DML Features

### UPSERT (ON CONFLICT)

SQLite's upsert syntax for insert-or-update operations.

```typescript
INSERT('users', ['id', 'name', 'email'], [PARAM('id'), PARAM('name'), PARAM('email')])
  .onConflict('id')
  .doUpdate({ name: PARAM('name'), email: PARAM('email') });

// Would generate:
// INSERT INTO users (id, name, email) VALUES (?, ?, ?)
// ON CONFLICT (id) DO UPDATE SET name = ?, email = ?

// ON CONFLICT DO NOTHING variant
INSERT('events', ['id', 'data'], [PARAM('id'), PARAM('data')])
  .onConflict('id')
  .doNothing();
```

### Window Functions

Analytics functions with OVER clauses.

```typescript
SELECT(
  FROM('sales'),
  COLUMN('product'),
  COLUMN('amount'),
  FN('ROW_NUMBER').over(
    PARTITION_BY('category'),
    ORDER_BY('amount', DESC)
  ).as('rank'),
  FN('SUM', COLUMN('amount')).over(
    PARTITION_BY('category')
  ).as('category_total')
)

// Would generate:
// SELECT product, amount,
//   ROW_NUMBER() OVER (PARTITION BY category ORDER BY amount DESC) AS rank,
//   SUM(amount) OVER (PARTITION BY category) AS category_total
// FROM sales
```

**Window functions to support:**
- ROW_NUMBER(), RANK(), DENSE_RANK()
- LAG(), LEAD()
- FIRST_VALUE(), LAST_VALUE(), NTH_VALUE()
- Aggregate functions with OVER (SUM, COUNT, AVG, MIN, MAX)
- PARTITION BY clause
- ORDER BY within window
- Frame specifications (ROWS BETWEEN, RANGE BETWEEN)

### INSERT ... SELECT

Insert rows from a query result.

```typescript
INSERT_INTO('archive_orders')
  .columns('id', 'user_id', 'total', 'archived_at')
  .fromSelect(
    SELECT(
      FROM('orders'),
      COLUMN('id'),
      COLUMN('user_id'),
      COLUMN('total'),
      FN('datetime', 'now')
    ).where(LT(COLUMN('created_at'), PARAM('cutoff')))
  );

// Would generate:
// INSERT INTO archive_orders (id, user_id, total, archived_at)
// SELECT id, user_id, total, datetime('now')
// FROM orders
// WHERE (created_at < ?)
```

### RETURNING Clause

Return affected rows from INSERT, UPDATE, DELETE (SQLite 3.35+).

```typescript
INSERT('users', ['name', 'email'], [PARAM('name'), PARAM('email')])
  .returning(COLUMN('id'), COLUMN('created_at'));

UPDATE('users')
  .set('status', new StringLiteral('active'))
  .where(EQ(COLUMN('id'), PARAM('userId')))
  .returning(COLUMN('*'));

DELETE_FROM('sessions')
  .where(LT(COLUMN('expires_at'), FN('datetime', 'now')))
  .returning(COLUMN('user_id'));
```

### INTERSECT and EXCEPT

Complete the set operations (UNION already exists).

```typescript
// INTERSECT - rows in both queries
SELECT(FROM('subscribers'), COLUMN('email'))
  .intersect(
    SELECT(FROM('customers'), COLUMN('email'))
  );

// EXCEPT - rows in first but not second
SELECT(FROM('all_users'), COLUMN('id'))
  .except(
    SELECT(FROM('banned_users'), COLUMN('user_id'))
  );
```

---

## Expression Enhancements

### CAST Expressions

Type conversion in expressions.

```typescript
CAST(COLUMN('price'), 'INTEGER')
CAST(COLUMN('json_data'), 'TEXT')

// Would generate: CAST(price AS INTEGER)
```

### GLOB Operator

Unix-style pattern matching (case-sensitive, unlike LIKE).

```typescript
GLOB(COLUMN('filename'), '*.txt')
NOT_GLOB(COLUMN('path'), '/tmp/*')

// Would generate: (filename GLOB '*.txt')
```

### COLLATE Operator

Specify collation for string comparisons.

```typescript
ORDER_BY(COLUMN('name').collate('NOCASE'))
EQ(COLUMN('a').collate('BINARY'), COLUMN('b'))

// Would generate: ORDER BY name COLLATE NOCASE
```

### Subquery Expressions

Scalar subqueries anywhere expressions are allowed.

```typescript
// Scalar subquery in SELECT
SELECT(
  FROM('orders'),
  COLUMN('id'),
  SUBQUERY(
    SELECT(FROM('users'), COLUMN('name'))
      .where(EQ(COLUMN('users', 'id'), COLUMN('orders', 'user_id')))
  ).as('user_name')
)

// Subquery in CASE
CASE([
  { WHEN: GT(SUBQUERY(SELECT(...)), 10), THEN: 'high' },
  { ELSE: 'low' }
])
```

---

## Multi-Dialect Support

### PostgreSQL Dialect

```typescript
// Different quoting rules (double quotes for identifiers)
// SERIAL/BIGSERIAL types
// RETURNING clause on all statements
// Array types and operators
// JSON/JSONB operators (->, ->>, @>, etc.)
// LIMIT ... OFFSET vs OFFSET ... FETCH syntax

const pgRenderer = new PostgreSQLQueryRenderer();
const pgValidator = new PostgreSQLQueryValidator();
```

### MySQL Dialect

```typescript
// Backtick quoting for identifiers
// AUTO_INCREMENT instead of AUTOINCREMENT
// Different LIMIT syntax
// No RETURNING clause
// Different date/time functions

const mysqlRenderer = new MySQLQueryRenderer();
const mysqlValidator = new MySQLQueryValidator();
```

---

## Developer Experience

### Query Debugging

```typescript
// Get human-readable query explanation
const query = SELECT(FROM('users'), COLUMN('*')).where(...);
console.log(query.explain());
// Outputs: SELECT * FROM users WHERE (condition)
//          └─ BinaryExpression: id = ?

// List all parameters
console.log(query.getParameterNames());
// ['userId', 'status']
```

### Conditional Query Building

Utilities for dynamically constructing queries based on runtime conditions.

```typescript
// Builder with conditional clauses
const query = SELECT(FROM('products'), COLUMN('*'))
  .whereIf(categoryId, EQ(COLUMN('category_id'), categoryId))
  .whereIf(minPrice, GTE(COLUMN('price'), minPrice))
  .whereIf(maxPrice, LTE(COLUMN('price'), maxPrice))
  .orderByIf(sortField, COLUMN(sortField), sortDirection);

// Conditional column selection
const columns = ['id', 'name'];
if (includeDetails) columns.push('description', 'specs');
SELECT(FROM('products'), ...columns.map(COLUMN));
```

### Schema Type Generation

Generate TypeScript types from table definitions.

```typescript
// From CREATE TABLE definition, generate:
interface UsersRow {
  id: number;
  email: string;
  name: string;
  created_at: string;
  team_id: number | null;
}
```

---

## Completed Features

- [x] SELECT queries with joins, subqueries, CTEs, and aggregations
- [x] INSERT and INSERT OR REPLACE queries
- [x] DELETE queries with WHERE conditions and subqueries
- [x] UPDATE queries with SET clauses and WHERE conditions
- [x] RETURNING clause for INSERT, UPDATE, DELETE (SQLite 3.35+)
- [x] BETWEEN and NOT BETWEEN operators for range queries
- [x] Comprehensive expression system (binary, unary, functions, literals)
- [x] Parameter binding with named parameters
- [x] SQLite-specific features (json_each, database-qualified tables)
- [x] Query validation (CommonQueryValidator, SQLiteQueryValidator)
- [x] Compact and indented rendering modes
- [x] Query cloning and transformation (QueryIdentityTransformer)
