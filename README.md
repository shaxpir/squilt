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
| `INSERT`, `INSERT_OR_REPLACE` | Insert statements |
| `UPDATE(table)` | Update statements |
| `DELETE_FROM(table)` | Delete statements |

### Renderers

- `CompactQueryRenderer`: Single-line output
- `IndentedQueryRenderer(spaces)`: Multi-line output with configurable indentation

### Validators

- `CommonQueryValidator`: General SQL validation
- `SQLiteQueryValidator`: SQLite-specific validation

## License

Apache 2.0
