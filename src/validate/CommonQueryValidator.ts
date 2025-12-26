import { AliasableExpression } from "../ast/Abstractions";
import { Alias } from "../ast/Alias";
import { BinaryExpression } from "../ast/BinaryExpression";
import { CaseExpression } from "../ast/CaseExpression";
import { Column } from "../ast/Column";
import { Concat } from "../ast/Concat";
import { DeleteQuery } from "../ast/DeleteQuery";
import { ExistsExpression } from "../ast/ExistsExpression";
import { From, JsonEachFrom, SubqueryFrom, TableFrom } from "../ast/From";
import { FunctionExpression } from "../ast/FunctionExpression";
import { InExpression } from "../ast/InExpression";
import { InsertQuery } from "../ast/InsertQuery";
import { Join } from "../ast/Join";
import { NullLiteral, NumberLiteral, Param, StringLiteral } from "../ast/Literals";
import { OrderBy } from "../ast/OrderBy";
import { SelectQuery } from "../ast/SelectQuery";
import { UnaryExpression } from "../ast/UnaryExpression";
import { With } from "../ast/With";
import { ColumnLikeVisitorAcceptor, FromLikeAndJoinVisitorAcceptor, SqlTreeNodeVisitor } from "../visitor/SqlTreeNodeVisitor";
import { QueryValidator } from "./QueryValidator";

const RESERVED_KEYWORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'JOIN', 'ON', 'GROUP', 'BY', 'HAVING', 'UNION',
  'ORDER', 'LIMIT', 'OFFSET', 'TABLE', 'INDEX', 'VIEW', 'TRIGGER', 'KEY',
  'COLUMN', 'CONSTRAINT', 'PRIMARY', 'FOREIGN', 'CHECK', 'DEFAULT', 'NULL',
  'NOT', 'AND', 'OR', 'LIKE', 'IN', 'IS', 'BETWEEN', 'CASE', 'WHEN', 'THEN',
  'ELSE', 'END', 'INSERT', 'INTO', 'VALUES', 'EXISTS'
]);

export class CommonQueryValidator implements QueryValidator, SqlTreeNodeVisitor<void> {
  protected fromLikeAndJoinAcceptor = new FromLikeAndJoinVisitorAcceptor<void>();
  protected columnLikeAcceptor = new ColumnLikeVisitorAcceptor<void>();

  private columnCount: number | null = null;
  private isGrouped: boolean = false;

  public validate(query: SelectQuery | InsertQuery | DeleteQuery): void {
    this.reset();
    query.accept(this);
  }

  protected reset(): void {
    this.columnCount = null;
    this.isGrouped = false;
  }

  private validateAlias(alias: string | undefined, context: string): void {
    if (alias && !alias.trim()) {
      throw new Error(`Empty alias in ${context}`);
    }
    if (alias && RESERVED_KEYWORDS.has(alias.toUpperCase())) {
      throw new Error(`Alias '${alias}' in ${context} is a reserved SQLite keyword`);
    }
  }

  private validateIdentifier(name: string, context: string): void {
    if (!name || !name.trim()) {
      throw new Error(`${context} name cannot be empty`);
    }
    if (RESERVED_KEYWORDS.has(name.toUpperCase())) {
      throw new Error(`${context} name '${name}' is a reserved SQLite keyword`);
    }
  }

  visitInsertQuery(node: InsertQuery): void {
    this.validateIdentifier(node['_tableName'], 'InsertQuery');
    if (node['_columns'].length === 0) {
      throw new Error('InsertQuery must specify at least one column');
    }
    if (node['_columns'].length !== node['_values'].length) {
      throw new Error('InsertQuery must have the same number of columns and values');
    }
    node['_columns'].forEach(col => this.validateIdentifier(col, 'InsertQuery column'));
    node['_values'].forEach(val => val.accept(this));
  }

  visitDeleteQuery(node: DeleteQuery): void {
    this.validateIdentifier(node['_tableName'], 'DeleteQuery');
    if (node['_where']) {
      node['_where'].accept(this);
    }
  }

  visitSelectQuery(node: SelectQuery): void {
    if (node['_columns'].length > 0 && node['_fromsAndJoins'].length === 0) {
      throw new Error('SELECT query with columns must have at least one FROM clause');
    }

    const prevCount = this.columnCount;
    this.columnCount = node['_columns'].length > 0 ? node['_columns'].length : 1;

    node['_with'].forEach(w => w.accept(this));
    node['_fromsAndJoins'].forEach(item => this.fromLikeAndJoinAcceptor.accept(this, item));
    node['_columns'].forEach(c => this.columnLikeAcceptor.accept(this, c));
    if (node['_where']) {
      node['_where'].accept(this);
    }
    if (node['_groupBy'].length > 0) {
      this.isGrouped = true;
      node['_groupBy'].forEach(c => c.accept(this));
    }
    if (node['_having'] && !this.isGrouped) {
      throw new Error('HAVING clause requires GROUP BY');
    }
    if (node['_having']) {
      node['_having'].accept(this);
    }
    if (node['_union'].length > 0) {
      if (node['_columns'].length === 0 && node['_fromsAndJoins'].length === 0) {
        throw new Error("A query with UNION subqueries must have columns and a FROM clause in the main query");
      }
      let columnCounts = [];
      if (node['_columns'].length > 0) {
        columnCounts.push(node['_columns'].length); // Include main query
      }
      columnCounts = columnCounts.concat(node['_union'].map(u => u['_columns'].length || 1));
      if (columnCounts.length > 1) {
        const firstCount = columnCounts[0];
        if (columnCounts.some(count => count !== firstCount)) {
          throw new Error('UNION queries must have the same number of columns');
        }
      }
    }
    node['_orderBy'].forEach(o => o.accept(this));
    if (node['_limit'] !== null && node['_limit'] !== undefined && node['_limit'] < 0) {
      throw new Error('LIMIT must be non-negative');
    }
    if (node['_offset'] !== null && node['_offset'] !== undefined && node['_offset'] < 0) {
      throw new Error('OFFSET must be non-negative');
    }

    this.columnCount = prevCount; // Restore parent context if nested
  }

  visitTableFrom(node: TableFrom): void {
    this.validateIdentifier(node.tableName, 'TableFrom');
  }

  visitSubqueryFrom(node: SubqueryFrom): void {
    const prevCount = this.columnCount;
    this.columnCount = null; // Reset for subquery
    node.subquery.accept(this);
    this.columnCount = prevCount; // Restore parent count
  }

  visitJsonEachFrom(node: JsonEachFrom): void {
    node.jsonExpression.accept(this);
    if (node.jsonPath) {
      node.jsonPath.accept(this);
    }
  }

  visitColumn(node: Column): void {
    if (node.hasTableName()) {
      this.validateIdentifier(node.tableName as string, 'Column');
    }
    this.validateIdentifier(node.columnName, 'Column');
  }

  visitAlias(node: Alias<From | AliasableExpression>): void {
    if (!node.alias || !node.alias.trim()) {
      throw new Error('Alias must have a non-empty name');
    }
    if (node.referent instanceof Join) {
      this.validateAlias(node.alias, 'Join');
    } else if (node.referent instanceof Column) {
      this.validateAlias(node.alias, 'Column');
    } else if (node.referent instanceof TableFrom) {
      this.validateAlias(node.alias, 'TableFrom');
    } else if (node.referent instanceof SubqueryFrom) {
      this.validateAlias(node.alias, 'SubqueryFrom');
    } else if (node.referent instanceof JsonEachFrom) {
      this.validateAlias(node.alias, 'JsonEachFrom');
    } else if (node.referent instanceof AliasableExpression) {
      this.validateAlias(node.alias, 'Expression');
    }
    node.referent.accept(this);
  }

  visitJoinClause(node: Join): void {
    this.validateIdentifier(node.tableName, 'JoinClause');
    if (!node.on) {
      throw new Error('JoinClause must have an ON condition');
    }
    node.on.accept(this);
  }

  visitOrderBy(node: OrderBy): void {
    node.column.accept(this);
  }

  visitWithClause(node: With): void {
    this.validateIdentifier(node.name, 'WithClause');
    const prevCount = this.columnCount;
    this.columnCount = null; // Reset for subquery
    node.query.accept(this);
    this.columnCount = prevCount; // Restore parent count
  }

  visitBinaryExpression(node: BinaryExpression): void {
    if (!node.operator) {
      throw new Error('BinaryExpression must have a valid operator');
    }
    if (!node.left) {
      throw new Error('BinaryExpression must have a valid left operand');
    }
    if (!node.right) {
      throw new Error('BinaryExpression must have a valid right operand');
    }
    node.left.accept(this);
    node.right.accept(this);
  }

  visitUnaryExpression(node: UnaryExpression): void {
    if (!node.operator) {
      throw new Error('UnaryExpression must have a valid operator');
    }
    if (!node.operand) {
      throw new Error('UnaryExpression must have a valid operand');
    }
    node.operand.accept(this);
  }

  visitInExpression(node: InExpression): void {
    if (node.left.length === 0) {
      throw new Error('IN expression must have at least one left expression');
    }
    node.left.forEach(l => l.accept(this));
    if (node.values instanceof SelectQuery) {
      node.values.accept(this);
    } else {
      if (node.values.length === 0) {
        throw new Error('IN expression must have at least one value set');
      }
      node.values.forEach(set => {
        if (set.length !== node.left.length) {
          throw new Error('Value sets in IN expression must match the number of left expressions');
        }
        set.forEach(v => v.accept(this));
      });
    }
  }

  visitConcat(node: Concat): void {
    if (node.expressions.length < 2) {
      throw new Error('Concat must have at least two expressions');
    }
    node.expressions.forEach(e => e.accept(this));
  }

  visitCaseExpression(node: CaseExpression): void {
    if (node.cases.length === 0) {
      throw new Error('CaseExpression must have at least one WHEN/THEN pair');
    }
    node.cases.forEach(c => {
      c.when.accept(this);
      c.then.accept(this);
    });
    if (node.else) {
      node.else.accept(this);
    }
  }

  visitFunctionExpression(node: FunctionExpression): void {
    const noArgFunctions = ['RANDOM'];
    if (!noArgFunctions.includes(node.name) && node.args.length === 0) {
      throw new Error(`Function ${node.name} requires at least one argument`);
    }
    node.args.forEach(a => a.accept(this));
  }

  visitParamExpression(_node: Param): void {
    // No specific validation needed
  }

  visitStringLiteral(node: StringLiteral): void {
    if (node.value === null || node.value === undefined) {
      throw new Error('StringLiteral value cannot be null or undefined');
    }
  }

  visitNumberLiteral(node: NumberLiteral): void {
    if (isNaN(node.value)) {
      throw new Error('NumberLiteral value must be a valid number');
    }
  }

  visitNullLiteral(_node: NullLiteral): void {
    // No specific validation needed
  }

  visitExistsExpression(node: ExistsExpression): void {
    if (!node.subquery) {
      throw new Error('ExistsExpression must have a valid subquery');
    }
    const prevCount = this.columnCount;
    this.columnCount = null; // Reset for subquery
    node.subquery.accept(this);
    this.columnCount = prevCount; // Restore parent count
  }
}
