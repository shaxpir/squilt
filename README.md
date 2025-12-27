# Squilt

A lightweight, zero-dependency TypeScript library for building SQL queries through a fluent AST API. Constructs type-safe query objects and serializes them to clean SQL strings—no database interaction, just pure query building for SQLite (and beyond).

## Installation

```bash
npm install @shaxpir/squilt
```

## Usage

### Using the Shorthand API

The shorthand API provides a concise, SQL-like syntax for building queries:

```typescript
import { SELECT, FROM, COLUMN, EQ, JOIN, ORDER_BY } from '@shaxpir/squilt';
import { OrderByDirection } from '@shaxpir/squilt';

const query = SELECT(
  FROM('users').as('u'),
  COLUMN('u', 'id'),
  COLUMN('u', 'name'),
  JOIN('orders', 'o', EQ(COLUMN('u', 'id'), COLUMN('o', 'user_id')))
)
.where(EQ(COLUMN('u', 'active'), true))
.orderBy(COLUMN('u', 'name'), OrderByDirection.ASC)
.limit(10);

console.log(query.toSQL());
// SELECT
//   u.id,
//   u.name
// FROM users u
// INNER JOIN orders o ON (u.id = o.user_id)
// WHERE (u.active = 1)
// ORDER BY u.name ASC
// LIMIT 10
```

### Using the QueryBuilder API

For more control, use the fluent QueryBuilder API:

```typescript
import { QueryBuilder, Column, TableFrom, Alias } from '@shaxpir/squilt';

const query = QueryBuilder.select()
  .from(new Alias(new TableFrom('users'), 'u'))
  .column(new Column('u', 'id'))
  .column(new Column('u', 'name'))
  .limit(10);
```

### Rendering Options

Squilt supports both compact and indented rendering:

```typescript
import { CompactQueryRenderer, IndentedQueryRenderer } from '@shaxpir/squilt';

// Compact output (single line)
query.toSQL(new CompactQueryRenderer());
// SELECT u.id, u.name FROM users u LIMIT 10

// Indented output (multi-line, 2-space indent)
query.toSQL(new IndentedQueryRenderer(2));
// SELECT
//   u.id,
//   u.name
// FROM users u
// LIMIT 10
```

### Delete Queries

Build DELETE statements with optional WHERE clauses:

```typescript
import { DELETE_FROM, EQ, COLUMN, PARAM, AND, LT } from '@shaxpir/squilt';

// Simple delete
const deleteAll = DELETE_FROM('temp_files');
console.log(deleteAll.toSQL());
// DELETE FROM temp_files

// Delete with conditions
const deleteOld = DELETE_FROM('logs')
  .where(AND(
    EQ(COLUMN('level'), 'debug'),
    LT(COLUMN('created_at'), PARAM('cutoffDate'))
  ));
console.log(deleteOld.toSQL());
// DELETE FROM logs WHERE ((level = 'debug') AND (created_at < ?))
```

DELETE queries support subqueries in WHERE clauses:

```typescript
import { DELETE_FROM, SELECT, FROM, COLUMN, IN, EXISTS, EQ } from '@shaxpir/squilt';

// Delete using IN with subquery
const bannedUsers = SELECT(FROM('banned_users'), COLUMN('id'));
const deleteComments = DELETE_FROM('comments')
  .where(IN(COLUMN('user_id'), bannedUsers));
console.log(deleteComments.toSQL());
// DELETE FROM comments WHERE (user_id IN (SELECT id FROM banned_users))

// Delete using EXISTS with correlated subquery
const deleteOrders = DELETE_FROM('orders')
  .where(EXISTS(
    SELECT(FROM('refunds'), COLUMN('*'))
      .where(EQ(COLUMN('refunds', 'order_id'), COLUMN('orders', 'id')))
  ));
console.log(deleteOrders.toSQL());
// DELETE FROM orders WHERE EXISTS (SELECT * FROM refunds WHERE (refunds.order_id = orders.id))
```

### Update Queries

Build UPDATE statements with SET clauses and optional WHERE:

```typescript
import { UPDATE, EQ, COLUMN, PARAM } from '@shaxpir/squilt';
import { StringLiteral, NumberLiteral } from '@shaxpir/squilt';

// Simple update
const updateStatus = UPDATE('users')
  .set('status', new StringLiteral('active'))
  .set('last_login', PARAM('loginTime'))
  .where(EQ(COLUMN('id'), PARAM('userId')));
console.log(updateStatus.toSQL());
// UPDATE users SET status = 'active', last_login = ? WHERE (id = ?)

// Update multiple columns
const bulkUpdate = UPDATE('products')
  .set('price', new NumberLiteral(99))
  .set('on_sale', new NumberLiteral(1))
  .set('discount', new NumberLiteral(10))
  .where(EQ(COLUMN('category'), 'electronics'));
console.log(bulkUpdate.toSQL());
// UPDATE products SET price = 99, on_sale = 1, discount = 10 WHERE (category = 'electronics')
```

### RETURNING Clause (SQLite 3.35+)

Get back affected rows from INSERT, UPDATE, and DELETE statements:

```typescript
import { INSERT, UPDATE, DELETE_FROM, COLUMN, PARAM, EQ, ALIAS, FN } from '@shaxpir/squilt';

// INSERT with RETURNING
const createUser = INSERT('users', ['name', 'email'], [PARAM('name'), PARAM('email')])
  .returning(COLUMN('id'), COLUMN('created_at'));
console.log(createUser.toSQL());
// INSERT INTO users (name, email) VALUES (?, ?) RETURNING id, created_at

// UPDATE with RETURNING
const updateUser = UPDATE('users')
  .set('status', 'active')
  .where(EQ(COLUMN('id'), PARAM('userId')))
  .returning(COLUMN('id'), COLUMN('status'), COLUMN('updated_at'));
console.log(updateUser.toSQL());
// UPDATE users SET status = 'active' WHERE (id = ?) RETURNING id, status, updated_at

// DELETE with RETURNING
const deleteInactive = DELETE_FROM('users')
  .where(EQ(COLUMN('status'), 'inactive'))
  .returning(COLUMN('id'), COLUMN('email'));
console.log(deleteInactive.toSQL());
// DELETE FROM users WHERE (status = 'inactive') RETURNING id, email

// RETURNING with aliased expressions
const insertWithAlias = INSERT('orders', ['total'], [PARAM('total')])
  .returning(
    COLUMN('id'),
    ALIAS(FN('DATETIME', COLUMN('created_at')), 'order_time')
  );
console.log(insertWithAlias.toSQL());
// INSERT INTO orders (total) VALUES (?) RETURNING id, DATETIME(created_at) AS order_time
```

### INSERT ... SELECT

Insert rows from a query result:

```typescript
import { INSERT_INTO, SELECT, FROM, COLUMN, EQ, LT, PARAM } from '@shaxpir/squilt';

// Basic INSERT ... SELECT
const archiveOrders = INSERT_INTO('archive_orders')
  .columns('id', 'user_id', 'total')
  .fromSelect(
    SELECT(FROM('orders'), COLUMN('id'), COLUMN('user_id'), COLUMN('total'))
      .where(LT(COLUMN('created_at'), PARAM('cutoff')))
  );
console.log(archiveOrders.toSQL());
// INSERT INTO archive_orders (id, user_id, total)
// SELECT id, user_id, total FROM orders WHERE (created_at < ?)

// INSERT OR REPLACE ... SELECT
const syncData = INSERT_INTO('local_cache')
  .orReplace()
  .columns('id', 'data')
  .fromSelect(
    SELECT(FROM('remote_data'), COLUMN('id'), COLUMN('data'))
  );
console.log(syncData.toSQL());
// INSERT OR REPLACE INTO local_cache (id, data) SELECT id, data FROM remote_data

// With RETURNING clause
const copyWithIds = INSERT_INTO('new_table')
  .columns('name', 'value')
  .fromSelect(SELECT(FROM('old_table'), COLUMN('name'), COLUMN('value')))
  .returning(COLUMN('id'));
console.log(copyWithIds.toSQL());
// INSERT INTO new_table (name, value) SELECT name, value FROM old_table RETURNING id
```

### Set Operations: UNION, INTERSECT, EXCEPT

Combine query results with set operations:

```typescript
import { SELECT, FROM, COLUMN, EQ } from '@shaxpir/squilt';

// UNION - combine results from multiple queries (already supported)
const allEmails = SELECT(FROM('customers'), COLUMN('email'))
  .union(SELECT(FROM('subscribers'), COLUMN('email')));
console.log(allEmails.toSQL());
// SELECT email FROM customers UNION SELECT email FROM subscribers

// INTERSECT - rows that appear in both queries
const commonEmails = SELECT(FROM('subscribers'), COLUMN('email'))
  .intersect(SELECT(FROM('customers'), COLUMN('email')));
console.log(commonEmails.toSQL());
// SELECT email FROM subscribers INTERSECT SELECT email FROM customers

// EXCEPT - rows in first query but not in second
const activeUsers = SELECT(FROM('all_users'), COLUMN('id'))
  .except(SELECT(FROM('banned_users'), COLUMN('user_id')));
console.log(activeUsers.toSQL());
// SELECT id FROM all_users EXCEPT SELECT user_id FROM banned_users

// Combine multiple set operations
const complexSet = SELECT(FROM('set_a'), COLUMN('id'))
  .union(SELECT(FROM('set_b'), COLUMN('id')))
  .intersect(SELECT(FROM('set_c'), COLUMN('id')))
  .except(SELECT(FROM('set_d'), COLUMN('id')));
```

### UPSERT (ON CONFLICT) (SQLite 3.24+)

Insert-or-update operations using SQLite's upsert syntax:

```typescript
import { INSERT, PARAM, COLUMN, EQ } from '@shaxpir/squilt';

// ON CONFLICT DO UPDATE - update existing rows on conflict
const upsertUser = INSERT('users', ['id', 'name', 'email'], [PARAM('id'), PARAM('name'), PARAM('email')])
  .onConflict('id')
  .doUpdate({ name: PARAM('name'), email: PARAM('email') });
console.log(upsertUser.toSQL());
// INSERT INTO users (id, name, email) VALUES (?, ?, ?)
// ON CONFLICT (id) DO UPDATE SET name = ?, email = ?

// ON CONFLICT DO NOTHING - silently ignore conflicts
const insertIfNotExists = INSERT('events', ['id', 'data'], [PARAM('id'), PARAM('data')])
  .onConflict('id')
  .doNothing();
console.log(insertIfNotExists.toSQL());
// INSERT INTO events (id, data) VALUES (?, ?) ON CONFLICT (id) DO NOTHING

// Multiple conflict columns
const upsertRole = INSERT('user_roles', ['user_id', 'role_id', 'assigned_at'], [PARAM('userId'), PARAM('roleId'), PARAM('now')])
  .onConflict('user_id', 'role_id')
  .doUpdate({ assigned_at: PARAM('now') });
console.log(upsertRole.toSQL());
// INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES (?, ?, ?)
// ON CONFLICT (user_id, role_id) DO UPDATE SET assigned_at = ?

// With WHERE clause on conflict (conditional upsert)
const conditionalUpsert = INSERT('users', ['id', 'name'], [PARAM('id'), PARAM('name')])
  .onConflict('id')
  .onConflictWhere(EQ(COLUMN('active'), true))
  .doUpdate({ name: PARAM('name') });
console.log(conditionalUpsert.toSQL());
// INSERT INTO users (id, name) VALUES (?, ?)
// ON CONFLICT (id) WHERE (active = 1) DO UPDATE SET name = ?

// With RETURNING clause
const upsertWithReturn = INSERT('counters', ['counter_key', 'value'], [PARAM('key'), PARAM('value')])
  .onConflict('counter_key')
  .doUpdate({ value: PARAM('value') })
  .returning(COLUMN('counter_key'), COLUMN('value'));
console.log(upsertWithReturn.toSQL());
// INSERT INTO counters (counter_key, value) VALUES (?, ?)
// ON CONFLICT (counter_key) DO UPDATE SET value = ?
// RETURNING counter_key, value
```

### CREATE TABLE

Create tables with columns, constraints, and SQLite options:

```typescript
import { CREATE_TABLE } from '@shaxpir/squilt';

// Simple table with primary key
const createUsers = CREATE_TABLE('users')
  .column('id', 'INTEGER', { primaryKey: true })
  .column('name', 'TEXT', { notNull: true })
  .column('email', 'TEXT', { unique: true })
  .ifNotExists();
console.log(createUsers.toSQL());
// CREATE TABLE IF NOT EXISTS users (
//   id INTEGER PRIMARY KEY,
//   name TEXT NOT NULL,
//   email TEXT UNIQUE
// )

// Table with foreign key
const createOrders = CREATE_TABLE('orders')
  .column('id', 'INTEGER', { primaryKey: true })
  .column('user_id', 'INTEGER')
  .column('total', 'REAL')
  .foreignKey(['user_id'], { table: 'users', column: 'id' });
```

### CREATE INDEX

Create indexes with support for expressions:

```typescript
import { CREATE_INDEX, COLUMN, FN, EQ } from '@shaxpir/squilt';
import { StringLiteral } from '@shaxpir/squilt';

// Simple column index
const simpleIndex = CREATE_INDEX('idx_users_email')
  .on('users', 'email');
// CREATE INDEX idx_users_email ON users (email)

// Composite index
const compositeIndex = CREATE_INDEX('idx_orders_user_date')
  .on('orders', ['user_id', 'created_at']);
// CREATE INDEX idx_orders_user_date ON orders (user_id, created_at)

// Expression index (JSON fields)
const jsonIndex = CREATE_INDEX('idx_data_field')
  .on('docs', FN('json_extract', COLUMN('data'), new StringLiteral('$.type')));
// CREATE INDEX idx_data_field ON docs (json_extract(data, '$.type'))

// Expression index (case-insensitive)
const lowerIndex = CREATE_INDEX('idx_email_lower')
  .on('users', FN('LOWER', COLUMN('email')));
// CREATE INDEX idx_email_lower ON users (LOWER(email))

// Mixed columns and expressions
const mixedIndex = CREATE_INDEX('idx_composite')
  .on('users', ['id', FN('LOWER', COLUMN('name'))]);
// CREATE INDEX idx_composite ON users (id, LOWER(name))

// Unique index
const uniqueIndex = CREATE_INDEX('idx_email')
  .on('users', 'email')
  .unique();
// CREATE UNIQUE INDEX idx_email ON users (email)

// Partial index (filtered)
const partialIndex = CREATE_INDEX('idx_active_users')
  .on('users', 'email')
  .where(EQ(COLUMN('active'), true));
// CREATE INDEX idx_active_users ON users (email) WHERE (active = 1)
```

### DROP TABLE and DROP INDEX

Remove tables and indexes from the database:

```typescript
import { DROP_TABLE, DROP_INDEX } from '@shaxpir/squilt';

// Simple DROP TABLE
const dropUsers = DROP_TABLE('users');
console.log(dropUsers.toSQL());
// DROP TABLE users

// DROP TABLE IF EXISTS
const dropCache = DROP_TABLE('cache').ifExists();
console.log(dropCache.toSQL());
// DROP TABLE IF EXISTS cache

// Simple DROP INDEX
const dropIndex = DROP_INDEX('idx_users_email');
console.log(dropIndex.toSQL());
// DROP INDEX idx_users_email

// DROP INDEX IF EXISTS
const dropOldIndex = DROP_INDEX('idx_old').ifExists();
console.log(dropOldIndex.toSQL());
// DROP INDEX IF EXISTS idx_old
```

### Range Queries with BETWEEN

Use BETWEEN for range comparisons:

```typescript
import { SELECT, FROM, COLUMN, BETWEEN, NOT_BETWEEN, PARAM, AND } from '@shaxpir/squilt';

// Price range query
const priceFilter = SELECT(FROM('products'), COLUMN('*'))
  .where(BETWEEN(COLUMN('price'), 10, 100));
console.log(priceFilter.toSQL());
// SELECT * FROM products WHERE (price BETWEEN 10 AND 100)

// Date range with parameters
const dateFilter = SELECT(FROM('orders'), COLUMN('*'))
  .where(BETWEEN(COLUMN('created_at'), PARAM('startDate'), PARAM('endDate')));
console.log(dateFilter.toSQL());
// SELECT * FROM orders WHERE (created_at BETWEEN ? AND ?)

// Exclude a range with NOT BETWEEN
const excludeRange = SELECT(FROM('employees'), COLUMN('*'))
  .where(NOT_BETWEEN(COLUMN('salary'), 50000, 100000));
console.log(excludeRange.toSQL());
// SELECT * FROM employees WHERE (salary NOT BETWEEN 50000 AND 100000)
```

### Parameterized Queries

Use named parameters for safe value binding:

```typescript
import { SELECT, FROM, COLUMN, EQ, PARAM, ParamCollectingVisitor } from '@shaxpir/squilt';

const query = SELECT(FROM('users'), COLUMN('*'))
  .where(EQ(COLUMN('id'), PARAM('userId')));

const sql = query.toSQL();  // SELECT * FROM users WHERE (id = ?)

// Collect parameter values in order
const params = query.accept(new ParamCollectingVisitor({ userId: 42 }));
// params = [42]
```

## Features

- **Type-safe AST**: Build queries programmatically with full TypeScript support
- **Fluent API**: Chain methods for readable query construction
- **Two rendering modes**: Compact for production, indented for debugging
- **SQLite-focused**: Supports SQLite-specific features like `json_each`
- **Query validation**: Detect errors before execution
- **Zero dependencies**: No external runtime dependencies

## API Reference

### Shorthand Functions

| Function | Description |
|----------|-------------|
| `SELECT(...args)` | Create a SELECT query |
| `SELECT_DISTINCT(...args)` | Create a SELECT DISTINCT query |
| `FROM(table)` | Create a FROM clause |
| `COLUMN(name)` or `COLUMN(table, name)` | Reference a column |
| `ALIAS(expr, name)` | Create an aliased expression |
| `EQ`, `NOT_EQ`, `GT`, `LT`, `GTE`, `LTE` | Comparison operators |
| `BETWEEN`, `NOT_BETWEEN` | Range operators |
| `AND`, `OR`, `NOT` | Logical operators |
| `LIKE`, `IN`, `NOT_IN` | Pattern matching |
| `JOIN`, `LEFT_JOIN`, `CROSS_JOIN` | Join clauses |
| `FN(name, ...args)` | Function calls |
| `CASE([...cases])` | CASE expressions |
| `WITH(name, query)` | Common Table Expressions |
| `UNION`, `INTERSECT`, `EXCEPT` | Set operations |
| `INSERT`, `INSERT_INTO`, `INSERT_OR_REPLACE` | Insert statements |
| `UPDATE(table)` | Update statements |
| `DELETE_FROM(table)` | Delete statements |
| `DROP_TABLE(table)` | Drop table statements |
| `DROP_INDEX(index)` | Drop index statements |

### Renderers

- `CompactQueryRenderer`: Single-line output
- `IndentedQueryRenderer(spaces)`: Multi-line output with configurable indentation

### Validators

- `CommonQueryValidator`: General SQL validation
- `SQLiteQueryValidator`: SQLite-specific validation

## License

Apache 2.0
