import { AlterTableQuery } from "../ast/AlterTableQuery";
import { CreateIndexQuery } from "../ast/CreateIndexQuery";
import { CreateTableQuery } from "../ast/CreateTableQuery";
import { CreateViewQuery } from "../ast/CreateViewQuery";
import { DeleteQuery } from "../ast/DeleteQuery";
import { DropIndexQuery } from "../ast/DropIndexQuery";
import { DropTableQuery } from "../ast/DropTableQuery";
import { DropViewQuery } from "../ast/DropViewQuery";
import { InsertQuery } from "../ast/InsertQuery";
import { UpdateQuery } from "../ast/UpdateQuery";
import { SelectQuery } from "../ast/SelectQuery";
import { SqlTreeNodeVisitor } from "../visitor/SqlTreeNodeVisitor";


// Comprehensive list of SQLite reserved keywords (case-insensitive)
const RESERVED_KEYWORDS = new Set([
  'ABORT', 'ACTION', 'ADD', 'AFTER', 'ALL', 'ALTER', 'ALWAYS', 'ANALYZE', 'AND',
  'AS', 'ASC', 'ATTACH', 'AUTOINCREMENT', 'BEFORE', 'BEGIN', 'BETWEEN', 'BY',
  'CASCADE', 'CASE', 'CAST', 'CHECK', 'COLLATE', 'COLUMN', 'COMMIT', 'CONFLICT',
  'CONSTRAINT', 'CREATE', 'CROSS', 'CURRENT', 'CURRENT_DATE', 'CURRENT_TIME',
  'CURRENT_TIMESTAMP', 'DATABASE', 'DEFAULT', 'DEFERRED', 'DEFERRABLE', 'DELETE',
  'DESC', 'DETACH', 'DISTINCT', 'DO', 'DROP', 'EACH', 'ELSE', 'END', 'ESCAPE',
  'EXCEPT', 'EXCLUDE', 'EXCLUSIVE', 'EXISTS', 'EXPLAIN', 'FAIL', 'FILTER', 'FIRST',
  'FOLLOWING', 'FOR', 'FOREIGN', 'FROM', 'FULL', 'GENERATED', 'GLOB', 'GROUP',
  'GROUPS', 'HAVING', 'IF', 'IGNORE', 'IMMEDIATE', 'IN', 'INDEX', 'INDEXED',
  'INITIALLY', 'INNER', 'INSERT', 'INSTEAD', 'INTERSECT', 'INTO', 'IS', 'ISNULL',
  'JOIN', 'KEY', 'LAST', 'LEFT', 'LIKE', 'LIMIT', 'MATCH', 'MATERIALIZED', 'NATURAL',
  'NO', 'NOT', 'NOTHING', 'NOTNULL', 'NULL', 'NULLS', 'OF', 'OFFSET', 'ON', 'OR',
  'ORDER', 'OTHERS', 'OUTER', 'OVER', 'PARTITION', 'PLAN', 'PRAGMA', 'PRECEDING',
  'PRIMARY', 'QUERY', 'RAISE', 'RANGE', 'RECURSIVE', 'REFERENCES', 'REGEXP',
  'REINDEX', 'RELEASE', 'RENAME', 'REPLACE', 'RESTRICT', 'RETURNING', 'RIGHT',
  'ROLLBACK', 'ROW', 'ROWS', 'SAVEPOINT', 'SELECT', 'SET', 'TABLE', 'TEMP',
  'TEMPORARY', 'THEN', 'TIES', 'TO', 'TRANSACTION', 'TRIGGER', 'UNBOUNDED',
  'UNION', 'UNIQUE', 'UPDATE', 'USING', 'VACUUM', 'VALUES', 'VIEW', 'VIRTUAL',
  'WHEN', 'WHERE', 'WINDOW', 'WITH', 'WITHOUT'
]);

// Utility function to quote identifiers, escaping inner quotes
export function quoteIdentifier(identifier: string): string {
  if (identifier === '*') {
    return identifier; // Do not quote '*'
  }

  // Handle database-qualified identifiers (e.g., "database.table")
  if (identifier.includes('.')) {
    const parts = identifier.split('.');
    if (parts.length === 2) {
      // Quote each part individually if needed (except for asterisk), then join with dot
      const quotedParts = parts.map(part => {
        if (part === '*') {
          return part; // Don't quote asterisk
        }
        return shouldQuoteIdentifier(part) ? `"${part.replace(/"/g, '""')}"` : part;
      });
      return quotedParts.join('.');
    }
  }

  if (shouldQuoteIdentifier(identifier)) {
    // Escape double-quotes by doubling them (e.g., " becomes "")
    const escaped = identifier.replace(/"/g, '""');
    return `"${escaped}"`;
  }
  return identifier; // Return unquoted if no quoting is needed
}

export type RenderableQuery =
  | SelectQuery
  | InsertQuery
  | UpdateQuery
  | DeleteQuery
  | CreateTableQuery
  | CreateIndexQuery
  | CreateViewQuery
  | AlterTableQuery
  | DropTableQuery
  | DropIndexQuery
  | DropViewQuery;

export interface QueryRenderer extends SqlTreeNodeVisitor<string> {
  render(node: RenderableQuery): string;
}

export function shouldQuoteIdentifier(identifier: string): boolean {
  // Check for empty or invalid input
  if (!identifier || identifier.trim() === '') {
    return true; // Empty or invalid identifiers should be quoted to avoid errors
  }

  // Check if the identifier is a reserved keyword (case-insensitive)
  if (RESERVED_KEYWORDS.has(identifier.toUpperCase())) {
      return true;
  }

  // Check if the identifier contains special characters or spaces
  // Valid unquoted identifiers: letters, digits, underscores; must not start with a digit
  const validIdentifierPattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
  if (!validIdentifierPattern.test(identifier)) {
      return true;
  }

  // Check for case sensitivity (if identifier has uppercase letters)
  // SQLite is case-insensitive by default, but quoting preserves case
  const hasUpperCase = /[A-Z]/.test(identifier);
  if (hasUpperCase) {
      return true; // Quote if case sensitivity is desired
  }

  // No quotes needed for simple, lowercase, non-reserved identifiers
  return false;
}
