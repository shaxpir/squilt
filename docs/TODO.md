# Squilt TODO

Ideas and planned features for future development.

## Planned Features

### UPSERT Support

SQLite's `INSERT ... ON CONFLICT` syntax enables upsert operations—inserting a row if it doesn't exist, or updating it if it does. This is a common pattern for syncing data or maintaining caches.

```typescript
// Desired API
INSERT('users', ['id', 'name', 'email'], [PARAM('id'), PARAM('name'), PARAM('email')])
  .onConflict('id')
  .doUpdate({ name: PARAM('name'), email: PARAM('email') });

// Would generate:
// INSERT INTO users (id, name, email) VALUES (?, ?, ?)
// ON CONFLICT (id) DO UPDATE SET name = ?, email = ?
```

### Window Functions

Window functions like `ROW_NUMBER()`, `RANK()`, `LAG()`, and `LEAD()` are essential for analytics queries. SQLite has supported these since version 3.25.0.

```typescript
// Desired API
SELECT(
  FROM('sales'),
  COLUMN('product'),
  COLUMN('amount'),
  FN('ROW_NUMBER').over(PARTITION_BY('product'), ORDER_BY('amount', DESC))
)

// Would generate:
// SELECT product, amount, ROW_NUMBER() OVER (PARTITION BY product ORDER BY amount DESC)
// FROM sales
```

### Subqueries in FROM Clause

While squilt already supports subqueries in WHERE clauses (via IN and EXISTS), first-class support for derived tables in FROM would be useful for complex queries.

```typescript
// Desired API
SELECT(
  FROM(
    SELECT(FROM('orders'), COLUMN('user_id'), SUM(COLUMN('total')).as('order_total'))
      .groupBy('user_id')
  ).as('user_totals'),
  COLUMN('user_id'),
  COLUMN('order_total')
)
```

### Additional Operators

- **GLOB** - SQLite's case-sensitive pattern matching (similar to LIKE but uses Unix glob syntax)
- **REGEXP** - Regular expression matching (requires SQLite extension)
- **IS DISTINCT FROM** - NULL-safe inequality comparison

### Query Composition Utilities

Helper functions for dynamically building queries based on runtime conditions:

```typescript
// Desired API
let query = SELECT(FROM('users'), COLUMN('*'));

if (nameFilter) {
  query = query.where(LIKE(COLUMN('name'), nameFilter));
}

if (sortBy) {
  query = query.orderBy(COLUMN(sortBy));
}
```

The current fluent API already supports this, but dedicated utilities for conditional clause addition could make it more ergonomic.

### PostgreSQL Dialect

While squilt is SQLite-focused, the AST architecture could support multiple SQL dialects. A PostgreSQL renderer and validator would expand the library's usefulness.

## Completed

- [x] SELECT queries with joins, subqueries, CTEs, and aggregations
- [x] INSERT and INSERT OR REPLACE queries
- [x] DELETE queries with WHERE conditions and subqueries
- [x] UPDATE queries with SET clauses and WHERE conditions
- [x] BETWEEN and NOT BETWEEN operators for range queries
