import { DeleteQuery } from "../ast/DeleteQuery";
import { JsonEachFrom, TableFrom } from "../ast/From";
import { UpdateQuery } from "../ast/UpdateQuery";
import { FunctionExpression } from "../ast/FunctionExpression";
import { FunctionName } from "../ast/FunctionName";
import { InExpression } from "../ast/InExpression";
import { InsertQuery } from "../ast/InsertQuery";
import { Join, JoinType } from "../ast/Join";
import { Operator } from "../ast/Operator";
import { SelectQuery } from "../ast/SelectQuery";
import { UnaryExpression } from "../ast/UnaryExpression";
import { With } from "../ast/With";
import { SqlTreeNodeVisitor } from "../visitor/SqlTreeNodeVisitor";
import { CommonQueryValidator } from "./CommonQueryValidator";
import { QueryValidator } from "./QueryValidator";

export class SQLiteQueryValidator
  extends CommonQueryValidator
  implements QueryValidator, SqlTreeNodeVisitor<void>
{
  private supportedFunctions: Set<FunctionName> = new Set([
    // Core scalar functions
    'ABS', 'CEIL', 'FLOOR', 'ROUND', 'TRUNC', 'RANDOM', 'RANDOMBLOB',
    'LOWER', 'UPPER', 'LENGTH', 'SUBSTR', 'TRIM', 'LTRIM', 'RTRIM',
    'REPLACE', 'INSTR', 'QUOTE', 'CHAR', 'UNICODE', 'HEX', 'ZEROBLOB',
    'COALESCE', 'IFNULL', 'NULLIF', 'TYPEOF', 'TOTAL_CHANGES', 'CHANGES',
    'LAST_INSERT_ROWID',
    // Aggregate functions
    'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'TOTAL', 'GROUP_CONCAT',
    // Date and time functions
    'DATE', 'TIME', 'DATETIME', 'JULIANDAY', 'STRFTIME',
    // JSON1 functions
    'json', 'json_array', 'json_object', 'json_extract', 'json_insert',
    'json_replace', 'json_set', 'json_remove', 'json_type', 'json_valid',
    'json_quote', 'json_patch', 'json_array_length', 'json_group_array',
    'json_group_object', 'json_each', 'json_tree'
  ]);

  private supportedUnaryOperators: Set<string> = new Set([
    Operator.NOT, Operator.PLUS, Operator.MINUS,
    Operator.IS_NULL, Operator.IS_NOT_NULL,
  ]);

  private isWithRecursive: boolean = false;

  public validate(query: SelectQuery | InsertQuery | UpdateQuery | DeleteQuery): void {
    this.reset();
    query.accept(this);
  }

  protected reset(): void {
    super.reset();
    this.isWithRecursive = false;
  }

  visitInsertQuery(node: InsertQuery): void {
    super.visitInsertQuery(node);
    // SQLite-specific validation (if any) can be added here
  }

  visitDeleteQuery(node: DeleteQuery): void {
    super.visitDeleteQuery(node);
    // SQLite-specific validation (if any) can be added here
  }

  visitUpdateQuery(node: UpdateQuery): void {
    super.visitUpdateQuery(node);
    // SQLite-specific validation (if any) can be added here
  }

  visitSelectQuery(node: SelectQuery): void {
    super.visitSelectQuery(node);
    if (node['_limit'] !== null && node['_limit'] !== undefined && !Number.isInteger(node['_limit'])) {
      throw new Error('SQLite LIMIT must be an integer');
    }
    if (node['_offset'] !== null && node['_offset'] !== undefined && !Number.isInteger(node['_offset'])) {
      throw new Error('SQLite OFFSET must be an integer');
    }
  }

  visitJoinClause(node: Join): void {
    if (node.type === JoinType.RIGHT || node.type === JoinType.FULL) {
      throw new Error(`SQLite does not support ${node.type} JOIN`);
    }
    super.visitJoinClause(node);
  }

  visitWithClause(node: With): void {
    const prevRecursive = this.isWithRecursive;
    this.isWithRecursive = false;
    node.query.accept(this);
    if (this.isWithRecursive) {
      throw new Error('Recursive WITH clauses are not supported in this validator');
    }
    this.isWithRecursive = prevRecursive;
    super.visitWithClause(node);
  }

  visitFunctionExpression(node: FunctionExpression): void {
    if (!this.supportedFunctions.has(node.name)) {
      throw new Error(`Function ${node.name} is not supported in SQLite`);
    }
    super.visitFunctionExpression(node);
  }

  visitTableFrom(node: TableFrom): void {
    if (this.isWithRecursive) {
      throw new Error('Recursive reference to WITH clause detected');
    }
    super.visitTableFrom(node);
  }

  visitJsonEachFrom(node: JsonEachFrom): void {
    super.visitJsonEachFrom(node);
  }

  visitUnaryExpression(node: UnaryExpression): void {
    if (!this.supportedUnaryOperators.has(node.operator)) {
      throw new Error(`Unary operator ${node.operator} is not supported in SQLite`);
    }
    super.visitUnaryExpression(node);
  }

  visitInExpression(node: InExpression): void {
    super.visitInExpression(node);
  }
}
