import { AliasableExpression } from "../ast/Abstractions";
import { Alias } from "../ast/Alias";
import { AlterTableQuery } from "../ast/AlterTableQuery";
import { BetweenExpression } from "../ast/BetweenExpression";
import { BinaryExpression } from "../ast/BinaryExpression";
import { CaseExpression } from "../ast/CaseExpression";
import { CastExpression } from "../ast/CastExpression";
import { CollateExpression } from "../ast/CollateExpression";
import { SubqueryExpression } from "../ast/SubqueryExpression";
import { WindowExpression } from "../ast/WindowExpression";
import { Column } from "../ast/Column";
import { Concat } from "../ast/Concat";
import { CreateIndexQuery } from "../ast/CreateIndexQuery";
import { CreateTableQuery, ColumnDefinition, TableConstraint } from "../ast/CreateTableQuery";
import { CreateVirtualTableQuery } from "../ast/CreateVirtualTableQuery";
import { CreateViewQuery } from "../ast/CreateViewQuery";
import { DeleteQuery } from "../ast/DeleteQuery";
import { DropIndexQuery } from "../ast/DropIndexQuery";
import { DropTableQuery } from "../ast/DropTableQuery";
import { DropViewQuery } from "../ast/DropViewQuery";
import { ExistsExpression } from "../ast/ExistsExpression";
import { From, JsonEachFrom, SubqueryFrom, TableFrom } from "../ast/From";
import { FunctionExpression } from "../ast/FunctionExpression";
import { InExpression } from "../ast/InExpression";
import { InsertQuery } from "../ast/InsertQuery";
import { UpdateQuery } from "../ast/UpdateQuery";
import { Join } from "../ast/Join";
import { NullLiteral, NumberLiteral, Param, StringLiteral } from "../ast/Literals";
import { Operator } from "../ast/Operator";
import { OrderBy } from "../ast/OrderBy";
import { SelectQuery } from "../ast/SelectQuery";
import { UnaryExpression } from "../ast/UnaryExpression";
import { With } from "../ast/With";
import { ColumnLikeVisitorAcceptor, FromLikeAndJoinVisitorAcceptor, SqlTreeNodeVisitor } from "../visitor/SqlTreeNodeVisitor";
import { QueryRenderer, RenderableQuery, quoteIdentifier } from "./QueryRenderer";

export class IndentedQueryRenderer
  implements QueryRenderer, SqlTreeNodeVisitor<string>
{
  protected fromLikeAndJoinAcceptor = new FromLikeAndJoinVisitorAcceptor<string>();
  protected columnLikeAcceptor = new ColumnLikeVisitorAcceptor<string>();

  private readonly spacesPerLevel: number;
  private indentationLevel: number = -1;

  public constructor(spacesPerLevel: number) {
    if (!Number.isInteger(spacesPerLevel) || spacesPerLevel <= 0) {
      throw new Error('spacesPerLevel must be a positive integer');
    }
    this.spacesPerLevel = spacesPerLevel;
  }

  public render(node: RenderableQuery): string {
    return node.accept(this);
  }

  private getIndent(): string {
    return ' '.repeat(this.indentationLevel * this.spacesPerLevel);
  }

  private indent(): void {
    this.indentationLevel++;
  }

  private dedent(): void {
    this.indentationLevel--;
  }

  visitInsertQuery(node: InsertQuery): string {
    this.indent();
    const parts: string[] = [];
    parts.push(`${this.getIndent()}INSERT${node.isOrReplace() ? ' OR REPLACE' : ''}`);
    parts.push(`${this.getIndent()}INTO ${quoteIdentifier(node['_tableName'])}`);
    if (node['_columns'].length > 0) {
      parts.push(`${this.getIndent()}(${node['_columns'].map(quoteIdentifier).join(', ')})`);
    }
    if (node['_fromSelect']) {
      parts.push(node['_fromSelect'].accept(this));
    } else {
      parts.push(`${this.getIndent()}VALUES`);
      parts.push(`${this.getIndent()}(${node['_values'].map(v => v.accept(this)).join(', ')})`);
    }
    // ON CONFLICT clause
    if (node['_onConflictColumns'].length > 0) {
      const conflictCols = node['_onConflictColumns'].map(quoteIdentifier).join(', ');
      if (node['_doNothing']) {
        parts.push(`${this.getIndent()}ON CONFLICT (${conflictCols}) DO NOTHING`);
      } else if (node['_doUpdateSets'].length > 0) {
        let onConflictLine = `${this.getIndent()}ON CONFLICT (${conflictCols})`;
        if (node['_onConflictWhere']) {
          onConflictLine += ` WHERE ${node['_onConflictWhere'].accept(this)}`;
        }
        parts.push(onConflictLine);
        const setClauses = node['_doUpdateSets'].map(s =>
          `${quoteIdentifier(s.column)} = ${s.value.accept(this)}`
        ).join(', ');
        parts.push(`${this.getIndent()}DO UPDATE SET ${setClauses}`);
      }
    }
    if (node['_returning'].length > 0) {
      parts.push(`${this.getIndent()}RETURNING ${node['_returning'].map(r => r.accept(this)).join(', ')}`);
    }
    this.dedent();
    return parts.join('\n');
  }

  visitDeleteQuery(node: DeleteQuery): string {
    this.indent();
    const parts: string[] = [];
    parts.push(`${this.getIndent()}DELETE`);
    parts.push(`${this.getIndent()}FROM ${quoteIdentifier(node['_tableName'])}`);
    if (node['_where']) {
      parts.push(`${this.getIndent()}WHERE ${node['_where'].accept(this)}`);
    }
    if (node['_returning'].length > 0) {
      parts.push(`${this.getIndent()}RETURNING ${node['_returning'].map(r => r.accept(this)).join(', ')}`);
    }
    this.dedent();
    return parts.join('\n');
  }

  visitUpdateQuery(node: UpdateQuery): string {
    this.indent();
    const parts: string[] = [];
    parts.push(`${this.getIndent()}UPDATE ${quoteIdentifier(node['_tableName'])}`);
    if (node['_set'].length > 0) {
      const setClauses = node['_set'].map(s =>
        `${quoteIdentifier(s.column)} = ${s.value.accept(this)}`
      ).join(', ');
      parts.push(`${this.getIndent()}SET ${setClauses}`);
    }
    if (node['_where']) {
      parts.push(`${this.getIndent()}WHERE ${node['_where'].accept(this)}`);
    }
    if (node['_returning'].length > 0) {
      parts.push(`${this.getIndent()}RETURNING ${node['_returning'].map(r => r.accept(this)).join(', ')}`);
    }
    this.dedent();
    return parts.join('\n');
  }

  visitDropTableQuery(node: DropTableQuery): string {
    const ifExists = node.hasIfExists ? ' IF EXISTS' : '';
    return `DROP TABLE${ifExists} ${quoteIdentifier(node.tableName)}`;
  }

  visitDropIndexQuery(node: DropIndexQuery): string {
    const ifExists = node.hasIfExists ? ' IF EXISTS' : '';
    return `DROP INDEX${ifExists} ${quoteIdentifier(node.indexName)}`;
  }

  visitDropViewQuery(node: DropViewQuery): string {
    const ifExists = node.hasIfExists ? ' IF EXISTS' : '';
    return `DROP VIEW${ifExists} ${quoteIdentifier(node.viewName)}`;
  }

  visitCreateViewQuery(node: CreateViewQuery): string {
    const parts: string[] = [];

    parts.push('CREATE');
    if (node.isTemporary) {
      parts.push('TEMPORARY');
    }
    parts.push('VIEW');
    if (node.hasIfNotExists) {
      parts.push('IF NOT EXISTS');
    }
    parts.push(quoteIdentifier(node.viewName));

    if (node.columns.length > 0) {
      parts.push(`(${node.columns.map(quoteIdentifier).join(', ')})`);
    }

    parts.push('AS');

    if (!node.selectQuery) {
      throw new Error('CreateViewQuery must have a SELECT query');
    }
    parts.push(node.selectQuery.accept(this));

    return parts.join(' ');
  }

  visitCreateIndexQuery(node: CreateIndexQuery): string {
    const unique = node.isUnique ? 'UNIQUE ' : '';
    const ifNotExists = node.hasIfNotExists ? ' IF NOT EXISTS' : '';

    // Render each column - strings are quoted, expressions are rendered
    const columnList = node.columns.map(col => {
      if (typeof col === 'string') {
        return quoteIdentifier(col);
      } else {
        // It's an Expression, render it
        return col.accept(this);
      }
    }).join(', ');

    let sql = `CREATE ${unique}INDEX${ifNotExists} ${quoteIdentifier(node.indexName)} ON ${quoteIdentifier(node.tableName)} (${columnList})`;

    if (node.whereExpression) {
      sql += ` WHERE ${node.whereExpression.accept(this)}`;
    }

    return sql;
  }

  visitAlterTableQuery(node: AlterTableQuery): string {
    const op = node.operation;
    if (!op) {
      throw new Error('AlterTableQuery must have an operation');
    }

    switch (op.type) {
      case 'ADD_COLUMN':
        return `ALTER TABLE ${quoteIdentifier(node.tableName)} ADD COLUMN ${this.renderColumnDefinition(op.column)}`;
      case 'RENAME_COLUMN':
        return `ALTER TABLE ${quoteIdentifier(node.tableName)} RENAME COLUMN ${quoteIdentifier(op.oldName)} TO ${quoteIdentifier(op.newName)}`;
      case 'DROP_COLUMN':
        return `ALTER TABLE ${quoteIdentifier(node.tableName)} DROP COLUMN ${quoteIdentifier(op.columnName)}`;
      case 'RENAME_TABLE':
        return `ALTER TABLE ${quoteIdentifier(node.tableName)} RENAME TO ${quoteIdentifier(op.newTableName)}`;
    }
  }

  visitCreateTableQuery(node: CreateTableQuery): string {
    this.indent();
    const parts: string[] = [];
    const ifNotExists = node.hasIfNotExists ? ' IF NOT EXISTS' : '';
    parts.push(`${this.getIndent()}CREATE TABLE${ifNotExists} ${quoteIdentifier(node.tableName)} (`);

    this.indent();
    const definitions: string[] = [];

    // Column definitions
    for (const col of node.columns) {
      definitions.push(`${this.getIndent()}${this.renderColumnDefinition(col)}`);
    }

    // Table constraints
    for (const constraint of node.tableConstraints) {
      definitions.push(`${this.getIndent()}${this.renderTableConstraint(constraint)}`);
    }

    parts.push(definitions.join(',\n'));
    this.dedent();

    // Table options
    const options: string[] = [];
    if (node.hasWithoutRowid) {
      options.push('WITHOUT ROWID');
    }
    if (node.isStrict) {
      options.push('STRICT');
    }

    if (options.length > 0) {
      parts.push(`${this.getIndent()}) ${options.join(', ')}`);
    } else {
      parts.push(`${this.getIndent()})`);
    }

    this.dedent();
    return parts.join('\n');
  }

  visitCreateVirtualTableQuery(node: CreateVirtualTableQuery): string {
    this.indent();
    const parts: string[] = [];
    const ifNotExists = node.hasIfNotExists ? ' IF NOT EXISTS' : '';
    parts.push(`${this.getIndent()}CREATE VIRTUAL TABLE${ifNotExists} ${quoteIdentifier(node.tableName)} USING ${node.module}(`);

    this.indent();
    const args: string[] = [];

    // Add columns (FTS5 columns don't have types)
    for (const col of node.columns) {
      args.push(`${this.getIndent()}${quoteIdentifier(col)}`);
    }

    // Add FTS5 options
    const opts = node.options;
    if (opts.tokenize) {
      args.push(`${this.getIndent()}tokenize = '${opts.tokenize}'`);
    }
    if (opts.content) {
      args.push(`${this.getIndent()}content = '${opts.content}'`);
    }
    if (opts.contentRowid) {
      args.push(`${this.getIndent()}content_rowid = '${opts.contentRowid}'`);
    }
    if (opts.prefix) {
      args.push(`${this.getIndent()}prefix = '${opts.prefix}'`);
    }

    parts.push(args.join(',\n'));
    this.dedent();
    parts.push(`${this.getIndent()})`);
    this.dedent();

    return parts.join('\n');
  }

  protected renderColumnDefinition(col: ColumnDefinition): string {
    const parts: string[] = [quoteIdentifier(col.name), col.type];

    if (col.constraints.primaryKey) {
      parts.push('PRIMARY KEY');
      if (col.constraints.autoIncrement) {
        parts.push('AUTOINCREMENT');
      }
    }
    if (col.constraints.notNull) {
      parts.push('NOT NULL');
    }
    if (col.constraints.unique) {
      parts.push('UNIQUE');
    }
    if (col.constraints.default !== undefined) {
      if (col.constraints.default === null) {
        parts.push('DEFAULT NULL');
      } else if (typeof col.constraints.default === 'string') {
        // Check if it's a SQL keyword/function like CURRENT_TIMESTAMP
        const sqlKeywords = ['CURRENT_TIMESTAMP', 'CURRENT_DATE', 'CURRENT_TIME', 'TRUE', 'FALSE'];
        if (sqlKeywords.includes(col.constraints.default.toUpperCase())) {
          parts.push(`DEFAULT ${col.constraints.default}`);
        } else {
          parts.push(`DEFAULT '${col.constraints.default.replace(/'/g, "''")}'`);
        }
      } else {
        parts.push(`DEFAULT ${col.constraints.default}`);
      }
    }
    if (col.constraints.check) {
      parts.push(`CHECK ${col.constraints.check.accept(this)}`);
    }
    if (col.constraints.references) {
      const ref = col.constraints.references;
      let refStr = `REFERENCES ${quoteIdentifier(ref.table)}(${quoteIdentifier(ref.column)})`;
      if (ref.onDelete) {
        refStr += ` ON DELETE ${ref.onDelete}`;
      }
      if (ref.onUpdate) {
        refStr += ` ON UPDATE ${ref.onUpdate}`;
      }
      parts.push(refStr);
    }

    return parts.join(' ');
  }

  protected renderTableConstraint(constraint: TableConstraint): string {
    const parts: string[] = [];

    if (constraint.name) {
      parts.push(`CONSTRAINT ${quoteIdentifier(constraint.name)}`);
    }

    switch (constraint.type) {
      case 'PRIMARY KEY':
        parts.push(`PRIMARY KEY (${constraint.columns!.map(quoteIdentifier).join(', ')})`);
        break;
      case 'UNIQUE':
        parts.push(`UNIQUE (${constraint.columns!.map(quoteIdentifier).join(', ')})`);
        break;
      case 'FOREIGN KEY':
        const ref = constraint.references!;
        let fkStr = `FOREIGN KEY (${constraint.columns!.map(quoteIdentifier).join(', ')}) REFERENCES ${quoteIdentifier(ref.table)}(${quoteIdentifier(ref.column)})`;
        if (ref.onDelete) {
          fkStr += ` ON DELETE ${ref.onDelete}`;
        }
        if (ref.onUpdate) {
          fkStr += ` ON UPDATE ${ref.onUpdate}`;
        }
        parts.push(fkStr);
        break;
      case 'CHECK':
        parts.push(`CHECK ${constraint.check!.accept(this)}`);
        break;
    }

    return parts.join(' ');
  }

  visitSelectQuery(node: SelectQuery): string {
    const parts: string[] = [];
    if (node['_with'].length > 0) {
      this.indent();
      parts.push('WITH');
      parts.push(node['_with'].map(w => w.accept(this)).join(',\n'));
      this.dedent();
    }
    this.indent();
    parts.push(`${this.getIndent()}SELECT${node.isDistinct() ? ' DISTINCT' : ''}`);
    if (node['_columns'].length > 0) {
      parts.push(node['_columns'].map(c => `${this.getIndent()}  ${this.columnLikeAcceptor.accept(this, c)}`).join(',\n'));
    } else {
      parts.push(`${this.getIndent()}  *`);
    }
    if (node['_fromsAndJoins'].length > 0) {
      let fromsAndJoinsText = '';
      for (const fromOrJoin of node['_fromsAndJoins']) {
        if (fromOrJoin instanceof Join) {
          fromsAndJoinsText += `\n${this.getIndent()}${fromOrJoin.accept(this)}`;
        } else if (
          fromOrJoin instanceof Alias ||
          fromOrJoin instanceof From ||
          fromOrJoin instanceof TableFrom ||
          fromOrJoin instanceof SubqueryFrom ||
          fromOrJoin instanceof JsonEachFrom
        ) {
          if (fromsAndJoinsText) {
            fromsAndJoinsText += `,\n${this.getIndent()}${fromOrJoin.accept(this)}`;
          } else {
            fromsAndJoinsText += `${this.getIndent()}FROM ${fromOrJoin.accept(this)}`;
          }
        }
      }
      parts.push(fromsAndJoinsText);
    }
    if (node['_where']) {
      parts.push(`${this.getIndent()}WHERE ${node['_where'].accept(this)}`);
    }
    if (node['_groupBy'].length > 0) {
      parts.push(`${this.getIndent()}GROUP BY ${node['_groupBy'].map(c => c.accept(this)).join(', ')}`);
    }
    if (node['_having']) {
      parts.push(`${this.getIndent()}HAVING ${node['_having'].accept(this)}`);
    }
    if (node['_union'].length > 0) {
      parts.push(node['_union'].map(u => `${this.getIndent()}UNION\n${u.accept(this)}`).join('\n'));
    }
    if (node['_intersect'].length > 0) {
      parts.push(node['_intersect'].map(i => `${this.getIndent()}INTERSECT\n${i.accept(this)}`).join('\n'));
    }
    if (node['_except'].length > 0) {
      parts.push(node['_except'].map(e => `${this.getIndent()}EXCEPT\n${e.accept(this)}`).join('\n'));
    }
    if (node['_orderBy'].length > 0) {
      parts.push(`${this.getIndent()}ORDER BY ${node['_orderBy'].map(o => o.accept(this)).join(', ')}`);
    }
    if (node['_limit'] !== null && node['_limit'] !== undefined) {
      parts.push(`${this.getIndent()}LIMIT ${node['_limit']}`);
      if (node['_offset'] !== null && node['_offset'] !== undefined) {
        parts.push(`${this.getIndent()}OFFSET ${node['_offset']}`);
      }
    }
    this.dedent();
    return parts.filter(p => p).join('\n');
  }

  visitTableFrom(node: TableFrom): string {
    return `${quoteIdentifier(node.tableName)}`;
  }

  visitSubqueryFrom(node: SubqueryFrom): string {
    this.indent();
    const result = `(\n${node.subquery.accept(this)}\n${this.getIndent()})`;
    this.dedent();
    return result;
  }

  visitJsonEachFrom(node: JsonEachFrom): string {
    const expr = node.jsonExpression.accept(this);
    const path = node.jsonPath ? `, ${node.jsonPath.accept(this)}` : '';
    return `json_each(${expr}${path})`;
  }

  visitColumn(node: Column): string {
    if (node.hasTableName()) {
      return `${quoteIdentifier(node.tableName as string)}.${quoteIdentifier(node.columnName)}`;
    } else {
      return `${quoteIdentifier(node.columnName)}`;
    }
  }

  visitAlias(node: Alias<From|AliasableExpression>): string {
    const renderedAliasName = quoteIdentifier(node.alias as string);
    if (node.referent instanceof From) {
      return `${node.referent.accept(this)} ${renderedAliasName}`;
    } else if (
      node.referent instanceof SubqueryFrom ||
      node.referent instanceof SelectQuery
    ) {
      this.indent();
      const renderedSubquery = `${node.referent.accept(this)}\n`;
      const result = `(\n${renderedSubquery}${this.getIndent()}) AS ${renderedAliasName}`;
      this.dedent();
      return result;
    } else {
      return `${node.referent.accept(this)} AS ${renderedAliasName}`;
    }
  }

  visitJoinClause(node: Join): string {
    return `${node.type} JOIN ${quoteIdentifier(node.tableName)} ${quoteIdentifier(node.alias)} ON ${node.on.accept(this)}`;
  }

  visitOrderBy(node: OrderBy): string {
    return `${node.column.accept(this)} ${node.direction}`;
  }

  visitWithClause(node: With): string {
    this.indent();
    const result = `${this.getIndent()}${quoteIdentifier(node.name)} AS (\n${node.query.accept(this)}\n${this.getIndent()})`;
    this.dedent();
    return result;
  }

  visitBinaryExpression(node: BinaryExpression): string {
    return `(${node.left.accept(this)} ${node.operator} ${node.right.accept(this)})`;
  }

  visitBetweenExpression(node: BetweenExpression): string {
    const not = node.not ? ' NOT' : '';
    return `(${node.operand.accept(this)}${not} BETWEEN ${node.low.accept(this)} AND ${node.high.accept(this)})`;
  }

  visitUnaryExpression(node: UnaryExpression): string {
    const operand = node.operand.accept(this);
    if (node.operator === Operator.IS_NULL || node.operator === Operator.IS_NOT_NULL) {
      return `(${operand} ${node.operator})`;
    } else if (node.operator === 'NOT') {
      return `(NOT ${operand})`;
    } else {
      return `(${node.operator}${operand})`;
    }
  }

  visitInExpression(node: InExpression): string {
    const leftStr = node.left.length > 1
      ? `(${node.left.map(l => l.accept(this)).join(', ')})`
      : node.left[0].accept(this);
    const not = node.not ? ' NOT' : '';
    let right: string;
    if (node.values instanceof SelectQuery) {
      right = `(\n${node.values.accept(this)}\n${this.getIndent()})`;
    } else {
      right = `(${node.values.map(set =>
        set.length > 1 ? `(${set.map(v => v.accept(this)).join(', ')})` : set[0].accept(this)
      ).join(', ')})`;
    }
    return `(${leftStr}${not} IN ${right})`;
  }

  visitConcat(node: Concat): string {
    return `(${node.expressions.map(e => e.accept(this)).join(' || ')})`;
  }

  visitCaseExpression(node: CaseExpression): string {
    const parts: string[] = [`${this.getIndent()}CASE`];
    this.indent();
    for (const c of node.cases) {
      this.indent();
      parts.push(`${this.getIndent()}WHEN ${c.when.accept(this)} THEN ${c.then.accept(this)}`);
      this.dedent();
    }
    if (node.else) {
      this.indent();
      parts.push(`${this.getIndent()}ELSE ${node.else.accept(this)}`);
      this.dedent();
    }
    parts.push(`${this.getIndent()}END`);
    this.dedent();
    return parts.join('\n');
  }

  visitCastExpression(node: CastExpression): string {
    return `CAST(${node.expression.accept(this)} AS ${node.targetType})`;
  }

  visitCollateExpression(node: CollateExpression): string {
    return `${node.expression.accept(this)} COLLATE ${node.collation}`;
  }

  visitSubqueryExpression(node: SubqueryExpression): string {
    return `(${node.subquery.accept(this)})`;
  }

  visitWindowExpression(node: WindowExpression): string {
    const fnPart = node.function.accept(this);
    const spec = node.windowSpec;

    const parts: string[] = [];
    if (spec.partitionByColumns.length > 0) {
      parts.push(`PARTITION BY ${spec.partitionByColumns.map(c => c.accept(this)).join(', ')}`);
    }
    if (spec.orderByColumns.length > 0) {
      parts.push(`ORDER BY ${spec.orderByColumns.map(o => o.accept(this)).join(', ')}`);
    }

    return `${fnPart} OVER (${parts.join(' ')})`;
  }

  visitFunctionExpression(node: FunctionExpression): string {
    const args = node.args.map(a => a.accept(this)).join(', ');
    const distinctPrefix = node.distinct ? 'DISTINCT ' : '';
    return `${node.name}(${distinctPrefix}${args})`;
  }

  visitParamExpression(_node: Param): string {
    return '?';
  }

  visitStringLiteral(node: StringLiteral): string {
    return `'${node.value.replace(/'/g, "''")}'`;
  }

  visitNumberLiteral(node: NumberLiteral): string {
    return node.value.toString();
  }

  visitNullLiteral(_node: NullLiteral): string {
    return 'NULL';
  }

  visitExistsExpression(node: ExistsExpression): string {
    const subquerySql = node.subquery.accept(this);
    return `EXISTS (\n${subquerySql}\n${this.getIndent()})`;
  }
}
