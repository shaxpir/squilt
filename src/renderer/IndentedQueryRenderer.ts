import { AliasableExpression } from "../ast/Abstractions";
import { Alias } from "../ast/Alias";
import { BinaryExpression } from "../ast/BinaryExpression";
import { CaseExpression } from "../ast/CaseExpression";
import { Column } from "../ast/Column";
import { Concat } from "../ast/Concat";
import { ExistsExpression } from "../ast/ExistsExpression";
import { From, JsonEachFrom, SubqueryFrom, TableFrom } from "../ast/From";
import { FunctionExpression } from "../ast/FunctionExpression";
import { InExpression } from "../ast/InExpression";
import { InsertQuery } from "../ast/InsertQuery";
import { Join } from "../ast/Join";
import { NullLiteral, NumberLiteral, Param, StringLiteral } from "../ast/Literals";
import { Operator } from "../ast/Operator";
import { OrderBy } from "../ast/OrderBy";
import { SelectQuery } from "../ast/SelectQuery";
import { UnaryExpression } from "../ast/UnaryExpression";
import { With } from "../ast/With";
import { ColumnLikeVisitorAcceptor, FromLikeAndJoinVisitorAcceptor, SqlTreeNodeVisitor } from "../visitor/SqlTreeNodeVisitor";
import { QueryRenderer, quoteIdentifier } from "./QueryRenderer";

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

  public render(node: SelectQuery | InsertQuery): string {
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
    parts.push(`${this.getIndent()}VALUES`);
    parts.push(`${this.getIndent()}(${node['_values'].map(v => v.accept(this)).join(', ')})`);
    this.dedent();
    return parts.join('\n');
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
