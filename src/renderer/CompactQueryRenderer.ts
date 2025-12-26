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

export class CompactQueryRenderer
  implements QueryRenderer, SqlTreeNodeVisitor<string>
{
  protected fromLikeAndJoinAcceptor = new FromLikeAndJoinVisitorAcceptor<void>();
  protected columnLikeAcceptor = new ColumnLikeVisitorAcceptor<string>();

  public render(node: RenderableQuery): string {
    return node.accept(this);
  }

  visitInsertQuery(node: InsertQuery): string {
    const parts: string[] = [];
    parts.push(`INSERT${node.isOrReplace() ? ' OR REPLACE' : ''}`);
    parts.push(`INTO ${quoteIdentifier(node['_tableName'])}`);
    if (node['_columns'].length > 0) {
      parts.push(`(${node['_columns'].map(quoteIdentifier).join(', ')})`);
    }
    if (node['_fromSelect']) {
      parts.push(node['_fromSelect'].accept(this));
    } else {
      parts.push(`VALUES (${node['_values'].map(v => v.accept(this)).join(', ')})`);
    }
    // ON CONFLICT clause
    if (node['_onConflictColumns'].length > 0) {
      const conflictCols = node['_onConflictColumns'].map(quoteIdentifier).join(', ');
      if (node['_doNothing']) {
        parts.push(`ON CONFLICT (${conflictCols}) DO NOTHING`);
      } else if (node['_doUpdateSets'].length > 0) {
        const setClauses = node['_doUpdateSets'].map(s =>
          `${quoteIdentifier(s.column)} = ${s.value.accept(this)}`
        ).join(', ');
        let onConflict = `ON CONFLICT (${conflictCols})`;
        if (node['_onConflictWhere']) {
          onConflict += ` WHERE ${node['_onConflictWhere'].accept(this)}`;
        }
        onConflict += ` DO UPDATE SET ${setClauses}`;
        parts.push(onConflict);
      }
    }
    if (node['_returning'].length > 0) {
      parts.push(`RETURNING ${node['_returning'].map(r => r.accept(this)).join(', ')}`);
    }
    return parts.join(' ');
  }

  visitDeleteQuery(node: DeleteQuery): string {
    const parts: string[] = [];
    parts.push('DELETE');
    parts.push(`FROM ${quoteIdentifier(node['_tableName'])}`);
    if (node['_where']) {
      parts.push(`WHERE ${node['_where'].accept(this)}`);
    }
    if (node['_returning'].length > 0) {
      parts.push(`RETURNING ${node['_returning'].map(r => r.accept(this)).join(', ')}`);
    }
    return parts.join(' ');
  }

  visitUpdateQuery(node: UpdateQuery): string {
    const parts: string[] = [];
    parts.push(`UPDATE ${quoteIdentifier(node['_tableName'])}`);
    if (node['_set'].length > 0) {
      const setClauses = node['_set'].map(s =>
        `${quoteIdentifier(s.column)} = ${s.value.accept(this)}`
      ).join(', ');
      parts.push(`SET ${setClauses}`);
    }
    if (node['_where']) {
      parts.push(`WHERE ${node['_where'].accept(this)}`);
    }
    if (node['_returning'].length > 0) {
      parts.push(`RETURNING ${node['_returning'].map(r => r.accept(this)).join(', ')}`);
    }
    return parts.join(' ');
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
    const parts: string[] = [];
    const unique = node.isUnique ? 'UNIQUE ' : '';
    const ifNotExists = node.hasIfNotExists ? ' IF NOT EXISTS' : '';

    parts.push(`CREATE ${unique}INDEX${ifNotExists} ${quoteIdentifier(node.indexName)}`);
    parts.push(`ON ${quoteIdentifier(node.tableName)} (${node.columns.map(quoteIdentifier).join(', ')})`);

    if (node.whereExpression) {
      parts.push(`WHERE ${node.whereExpression.accept(this)}`);
    }

    return parts.join(' ');
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
    const parts: string[] = [];
    const ifNotExists = node.hasIfNotExists ? ' IF NOT EXISTS' : '';
    parts.push(`CREATE TABLE${ifNotExists} ${quoteIdentifier(node.tableName)} (`);

    const definitions: string[] = [];

    // Column definitions
    for (const col of node.columns) {
      definitions.push(this.renderColumnDefinition(col));
    }

    // Table constraints
    for (const constraint of node.tableConstraints) {
      definitions.push(this.renderTableConstraint(constraint));
    }

    parts.push(definitions.join(', '));
    parts.push(')');

    // Table options
    const options: string[] = [];
    if (node.hasWithoutRowid) {
      options.push('WITHOUT ROWID');
    }
    if (node.isStrict) {
      options.push('STRICT');
    }
    if (options.length > 0) {
      parts.push(' ' + options.join(', '));
    }

    return parts.join('');
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
      parts.push(`WITH ${node['_with'].map(w => w.accept(this)).join(', ')}`);
    }
    parts.push(`SELECT${node.isDistinct() ? ' DISTINCT' : ''}`);
    if (node['_columns'].length > 0) {
      parts.push(node['_columns'].map(c => this.columnLikeAcceptor.accept(this, c)).join(', '));
    } else {
      parts.push('*');
    }
    if (node['_fromsAndJoins'].length > 0) {
      let fromsAndJoinsText = '';
      for (const fromOrJoin of node['_fromsAndJoins']) {
        if (fromOrJoin instanceof Join) {
          fromsAndJoinsText += ` ${fromOrJoin.accept(this)}`;
        } else if (
          fromOrJoin instanceof Alias ||
          fromOrJoin instanceof From ||
          fromOrJoin instanceof TableFrom ||
          fromOrJoin instanceof SubqueryFrom ||
          fromOrJoin instanceof JsonEachFrom
        ) {
          if (fromsAndJoinsText) {
            fromsAndJoinsText += `, ${fromOrJoin.accept(this)}`;
          } else {
            fromsAndJoinsText += `FROM ${fromOrJoin.accept(this)}`;
          }
        }
      }
      parts.push(fromsAndJoinsText);
    }
    if (node['_where']) {
      parts.push(`WHERE ${node['_where'].accept(this)}`);
    }
    if (node['_groupBy'].length > 0) {
      parts.push(`GROUP BY ${node['_groupBy'].map(c => c.accept(this)).join(', ')}`);
    }
    if (node['_having']) {
      parts.push(`HAVING ${node['_having'].accept(this)}`);
    }
    if (node['_union'].length > 0) {
      parts.push(node['_union'].map(u => `UNION ${u.accept(this)}`).join(' '));
    }
    if (node['_intersect'].length > 0) {
      parts.push(node['_intersect'].map(i => `INTERSECT ${i.accept(this)}`).join(' '));
    }
    if (node['_except'].length > 0) {
      parts.push(node['_except'].map(e => `EXCEPT ${e.accept(this)}`).join(' '));
    }
    if (node['_orderBy'].length > 0) {
      parts.push(`ORDER BY ${node['_orderBy'].map(o => o.accept(this)).join(', ')}`);
    }
    if (node['_limit'] !== null && node['_limit'] !== undefined) {
      parts.push(`LIMIT ${node['_limit']}`);
      if (node['_offset'] !== null && node['_offset'] !== undefined) {
        parts.push(`OFFSET ${node['_offset']}`);
      }
    }
    return parts.filter(p => p).join(' ');
  }

  visitTableFrom(node: TableFrom): string {
    return `${quoteIdentifier(node.tableName)}`;
  }

  visitSubqueryFrom(node: SubqueryFrom): string {
    return `(${node.subquery.accept(this)})`;
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
    const isSubquery = node.referent instanceof SubqueryFrom || node.referent instanceof SelectQuery;
    const renderedReferent = node.referent.accept(this);
    const renderedAliasName = quoteIdentifier(node.alias as string);
    if (node.referent instanceof From) {
      return `${renderedReferent} ${renderedAliasName}`;
    } else if (isSubquery) {
      return `(${renderedReferent}) AS ${renderedAliasName}`;
    } else {
      return `${renderedReferent} AS ${renderedAliasName}`;
    }
  }

  visitJoinClause(node: Join): string {
    return `${node.type} JOIN ${quoteIdentifier(node.tableName)} ${quoteIdentifier(node.alias)} ON ${node.on.accept(this)}`;
  }

  visitOrderBy(node: OrderBy): string {
    return `${node.column.accept(this)} ${node.direction}`;
  }

  visitWithClause(node: With): string {
    return `${quoteIdentifier(node.name)} AS (${node.query.accept(this)})`;
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
      right = `(${node.values.accept(this)})`;
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
    const parts: string[] = ['CASE'];
    for (const c of node.cases) {
      parts.push(`WHEN ${c.when.accept(this)} THEN ${c.then.accept(this)}`);
    }
    if (node.else) {
      parts.push(`ELSE ${node.else.accept(this)}`);
    }
    parts.push('END');
    return parts.join(' ');
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
    return `EXISTS (${node.subquery.accept(this)})`;
  }
}
