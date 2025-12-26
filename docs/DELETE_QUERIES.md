# DELETE Query Implementation Plan

## Background

The squilt library currently supports SELECT and INSERT queries, but lacks DELETE support. Since we're open-sourcing this library for public use, we should provide complete CRUD coverage. This document outlines how to add DELETE query support following the existing architectural patterns.

## Design Approach

The implementation will follow the same visitor pattern used throughout squilt. A DELETE query is conceptually simpler than SELECT or INSERT—it only needs a table name and an optional WHERE clause. The WHERE clause will reuse the same Expression system that SELECT queries already use, so there's no new expression handling needed.

The SQL we want to generate looks like this:

```sql
DELETE FROM users
DELETE FROM users WHERE id = ?
DELETE FROM orders WHERE status = 'cancelled' AND created_at < ?
```

## The DeleteQuery AST Node

We'll create a new `DeleteQuery` class in `src/ast/DeleteQuery.ts`. Like InsertQuery, it implements SqlTreeNode and stores its table name as a private field. The WHERE clause will be stored as an optional Expression, exactly like SelectQuery handles it.

The class will have a fluent `where()` method that accepts an Expression and returns `this` for chaining. The `toSQL()` method will delegate to a renderer (defaulting to IndentedQueryRenderer), and the `accept()` method will call `visitor.visitDeleteQuery(this)` to integrate with the visitor pattern.

## Visitor Pattern Updates

Since squilt uses the visitor pattern, every visitor implementation needs to know about DeleteQuery. We'll add `visitDeleteQuery(node: DeleteQuery): T` to the SqlTreeNodeVisitor interface, which will require updates to:

**Renderers:** Both CompactQueryRenderer and IndentedQueryRenderer need to implement the new method. The compact renderer will join "DELETE", "FROM tableName", and optionally "WHERE condition" with spaces. The indented renderer will put each clause on its own line with proper indentation.

**Validators:** CommonQueryValidator will validate the table name identifier and, if present, recursively validate the WHERE expression. SQLiteQueryValidator will call super and add any SQLite-specific checks if needed.

**Transformer:** QueryIdentityTransformer needs to clone DeleteQuery instances, preserving the table name and recursively transforming the WHERE expression if present.

## Builder and Shorthand Integration

We'll add a static `deleteFrom(tableName)` method to QueryBuilder, following the same naming pattern as `insertInto()`.

For the shorthand API, we'll add a `DELETE_FROM()` function. I'm using DELETE_FROM rather than just DELETE because "DELETE" alone doesn't read as naturally in the fluent API—`DELETE_FROM('users').where(...)` is clearer than `DELETE('users').where(...)`.

## Interface Updates

The QueryRenderer and QueryValidator interfaces include union types in their `render()` and `validate()` method signatures. We'll add DeleteQuery to these unions so the interfaces accurately describe what query types they can handle.

## Exports

The main `index.ts` file will export the DeleteQuery class and the DELETE_FROM shorthand function, making them available to library consumers.

## Testing Strategy

We'll create four test files following the existing test organization:

The first two test files in `tests/generate/` will verify SQL rendering. One will test basic delete queries without WHERE clauses, checking both compact and indented output. The other will test various WHERE conditions—simple equality, complex AND/OR expressions, and parameterized queries.

A validation test file in `tests/validate/` will verify that table name validation works correctly, that reserved keywords are handled properly, and that nested WHERE expressions get validated.

A transform test file in `tests/transform/` will verify that the identity transformer correctly clones DeleteQuery instances and that parameter rewriting works on WHERE clauses.

## Implementation Order

We'll implement this in dependency order to ensure the code compiles at each step:

1. Create the DeleteQuery class with its basic structure
2. Add visitDeleteQuery to the SqlTreeNodeVisitor interface
3. Implement the visitor method in all visitors (this is where the compiler will guide us—it will error until every visitor has the method)
4. Add the QueryBuilder and Shorthand functions
5. Update the interface type signatures
6. Add exports to index.ts
7. Write tests
8. Verify everything works with `npm test` and `tsc`
9. Update the README with DELETE examples

## Files Summary

**New files:**
- `src/ast/DeleteQuery.ts`
- `tests/generate/DeleteSimpleQuery.test.ts`
- `tests/generate/DeleteWithWhere.test.ts`
- `tests/validate/ValidateDeleteQuery.test.ts`
- `tests/transform/DeleteQueryTransform.test.ts`

**Modified files:**
- `src/visitor/SqlTreeNodeVisitor.ts`
- `src/renderer/CompactQueryRenderer.ts`
- `src/renderer/IndentedQueryRenderer.ts`
- `src/renderer/QueryRenderer.ts`
- `src/validate/CommonQueryValidator.ts`
- `src/validate/SQLiteQueryValidator.ts`
- `src/validate/QueryValidator.ts`
- `src/builder/QueryBuilder.ts`
- `src/builder/Shorthand.ts`
- `src/visitor/QueryIdentityTransformer.ts`
- `src/index.ts`
- `README.md`

## Usage Example

Once implemented, users will be able to write:

```typescript
import { DELETE_FROM, EQ, COLUMN, PARAM } from '@shaxpir/squilt';

const query = DELETE_FROM('users')
  .where(EQ(COLUMN('id'), PARAM('userId')));

console.log(query.toSQL());
// DELETE
//   FROM users
//   WHERE (id = ?)
```
