import { Aliasable, AliasableExpression, Expression, SqlTreeNode } from "../ast/Abstractions";
import { Alias } from "../ast/Alias";
import { AlterTableQuery } from "../ast/AlterTableQuery";
import { BetweenExpression } from "../ast/BetweenExpression";
import { BinaryExpression } from "../ast/BinaryExpression";
import { CaseExpression, CaseItem } from "../ast/CaseExpression";
import { CastExpression } from "../ast/CastExpression";
import { CollateExpression } from "../ast/CollateExpression";
import { Column, ColumnLike } from "../ast/Column";
import { Concat } from "../ast/Concat";
import { CreateIndexQuery } from "../ast/CreateIndexQuery";
import { CreateTableQuery, ColumnDefinition, TableConstraint } from "../ast/CreateTableQuery";
import { CreateViewQuery } from "../ast/CreateViewQuery";
import { DeleteQuery } from "../ast/DeleteQuery";
import { DropIndexQuery } from "../ast/DropIndexQuery";
import { DropTableQuery } from "../ast/DropTableQuery";
import { DropViewQuery } from "../ast/DropViewQuery";
import { ExistsExpression } from "../ast/ExistsExpression";
import { From, FromLike, JsonEachFrom, SubqueryFrom, TableFrom } from "../ast/From";
import { FunctionExpression } from "../ast/FunctionExpression";
import { FunctionName } from "../ast/FunctionName";
import { InExpression } from "../ast/InExpression";
import { InsertQuery, UpsertSetClause } from "../ast/InsertQuery";
import { UpdateQuery, SetClause } from "../ast/UpdateQuery";
import { Join, JoinType } from "../ast/Join";
import { NullLiteral, NumberLiteral, Param, StringLiteral } from "../ast/Literals";
import { Operator } from "../ast/Operator";
import { OrderBy, OrderByDirection } from "../ast/OrderBy";
import { SelectQuery } from "../ast/SelectQuery";
import { UnaryExpression } from "../ast/UnaryExpression";
import { With } from "../ast/With";
import { SqlTreeNodeTransformer } from "./SqlTreeNodeTransformer";

export class QueryIdentityTransformer implements SqlTreeNodeTransformer {
  public transform(node: SqlTreeNode): SqlTreeNode {
    const result = node.accept(this);
    if (Array.isArray(result)) {
      throw new Error('Top-level transformation must return a single SqlTreeNode');
    }
    return result;
  }

  protected expectSingle<T extends SqlTreeNode>(result: SqlTreeNode | SqlTreeNode[], typeName: string): T {
    if (Array.isArray(result)) {
      throw new Error(`Unexpected array in single-node context for ${typeName}`);
    }
    return result as T;
  }

  protected flatList(results: (SqlTreeNode | SqlTreeNode[])[]): SqlTreeNode[] {
    return results.flatMap(r => Array.isArray(r) ? r : [r]);
  }

  protected flatList2D(results: (SqlTreeNode | SqlTreeNode[])[][]): SqlTreeNode[][] {
    return results.map(set => this.flatList(set));
  }

  visitSelectQuery(node: SelectQuery): SqlTreeNode | SqlTreeNode[] {
    const newQuery = new SelectQuery();
    newQuery['_distinct'] = node['_distinct'];
    newQuery['_with'] = this.flatList(node['_with'].map(w => w.accept(this))) as With[];
    newQuery['_fromsAndJoins'] = node['_fromsAndJoins'].map(fj => {
      if (fj && typeof fj === 'object' && 'referent' in fj && 'alias' in fj) {
        return new Alias(this.expectSingle(fj.referent.accept(this), 'referent') as From, fj.alias);
      } else if (fj && typeof fj === 'object' && 'accept' in fj) {
        return this.expectSingle((fj as any).accept(this), 'from/join');
      } else {
        throw new Error('Invalid from/join object');
      }
    }) as (FromLike | Join)[];
    newQuery['_columns'] = node['_columns'].map(c => {
      if (c && typeof c === 'object' && 'referent' in c && 'alias' in c) {
        return new Alias(this.expectSingle(c.referent.accept(this), 'referent') as AliasableExpression, c.alias);
      } else if (c && typeof c === 'object' && 'accept' in c) {
        return this.expectSingle((c as any).accept(this), 'column');
      } else {
        throw new Error('Invalid column object');
      }
    }) as ColumnLike[];
    if (node['_where']) newQuery['_where'] = this.expectSingle(node['_where'].accept(this), 'WHERE') as Expression;
    newQuery['_groupBy'] = this.flatList(node['_groupBy'].map(g => g.accept(this))) as Column[];
    if (node['_having']) newQuery['_having'] = this.expectSingle(node['_having'].accept(this), 'HAVING') as Expression;
    newQuery['_union'] = this.flatList(node['_union'].map(u => u.accept(this))) as SelectQuery[];
    newQuery['_intersect'] = this.flatList(node['_intersect'].map(i => i.accept(this))) as SelectQuery[];
    newQuery['_except'] = this.flatList(node['_except'].map(e => e.accept(this))) as SelectQuery[];
    newQuery['_orderBy'] = this.flatList(node['_orderBy'].map(o => o.accept(this))) as OrderBy[];
    newQuery['_offset'] = node['_offset'];
    newQuery['_limit'] = node['_limit'];
    return newQuery;
  }

  visitInsertQuery(node: InsertQuery): SqlTreeNode | SqlTreeNode[] {
    const newQuery = new InsertQuery(node['_tableName']);
    newQuery['_orReplace'] = node['_orReplace'];
    newQuery['_columns'] = [...node['_columns']]; // Strings, reuse
    if (node['_fromSelect']) {
      newQuery['_fromSelect'] = this.expectSingle(node['_fromSelect'].accept(this), 'fromSelect') as SelectQuery;
    } else {
      newQuery['_values'] = this.flatList(node['_values'].map(v => v.accept(this))) as Expression[];
    }
    // Transform ON CONFLICT clause
    newQuery['_onConflictColumns'] = [...node['_onConflictColumns']];
    newQuery['_doNothing'] = node['_doNothing'];
    newQuery['_doUpdateSets'] = node['_doUpdateSets'].map(s => ({
      column: s.column,
      value: this.expectSingle(s.value.accept(this), 'DO UPDATE value') as Expression
    })) as UpsertSetClause[];
    if (node['_onConflictWhere']) {
      newQuery['_onConflictWhere'] = this.expectSingle(node['_onConflictWhere'].accept(this), 'ON CONFLICT WHERE') as Expression;
    }
    newQuery['_returning'] = this.flatList(node['_returning'].map(r => r.accept(this))) as AliasableExpression[];
    return newQuery;
  }

  visitDeleteQuery(node: DeleteQuery): SqlTreeNode | SqlTreeNode[] {
    const newQuery = new DeleteQuery(node['_tableName']);
    if (node['_where']) {
      newQuery['_where'] = this.expectSingle(node['_where'].accept(this), 'WHERE') as Expression;
    }
    newQuery['_returning'] = this.flatList(node['_returning'].map(r => r.accept(this))) as AliasableExpression[];
    return newQuery;
  }

  visitUpdateQuery(node: UpdateQuery): SqlTreeNode | SqlTreeNode[] {
    const newQuery = new UpdateQuery(node['_tableName']);
    node['_set'].forEach(s => {
      newQuery.set(s.column, this.expectSingle(s.value.accept(this), 'SET value') as Expression);
    });
    if (node['_where']) {
      newQuery['_where'] = this.expectSingle(node['_where'].accept(this), 'WHERE') as Expression;
    }
    newQuery['_returning'] = this.flatList(node['_returning'].map(r => r.accept(this))) as AliasableExpression[];
    return newQuery;
  }

  visitDropTableQuery(node: DropTableQuery): SqlTreeNode | SqlTreeNode[] {
    const newQuery = new DropTableQuery(node.tableName);
    if (node.hasIfExists) {
      newQuery.ifExists();
    }
    return newQuery;
  }

  visitDropIndexQuery(node: DropIndexQuery): SqlTreeNode | SqlTreeNode[] {
    const newQuery = new DropIndexQuery(node.indexName);
    if (node.hasIfExists) {
      newQuery.ifExists();
    }
    return newQuery;
  }

  visitDropViewQuery(node: DropViewQuery): SqlTreeNode | SqlTreeNode[] {
    const newQuery = new DropViewQuery(node.viewName);
    if (node.hasIfExists) {
      newQuery.ifExists();
    }
    return newQuery;
  }

  visitCreateViewQuery(node: CreateViewQuery): SqlTreeNode | SqlTreeNode[] {
    const newQuery = new CreateViewQuery(node.viewName);

    if (node.columns.length > 0) {
      newQuery.withColumns(...node.columns);
    }
    if (node.isTemporary) {
      newQuery.temporary();
    }
    if (node.hasIfNotExists) {
      newQuery.ifNotExists();
    }
    if (node.selectQuery) {
      newQuery.as(this.expectSingle(node.selectQuery.accept(this), 'SELECT') as SelectQuery);
    }

    return newQuery;
  }

  visitCreateIndexQuery(node: CreateIndexQuery): SqlTreeNode | SqlTreeNode[] {
    const newQuery = new CreateIndexQuery(node.indexName);
    newQuery.on(node.tableName, [...node.columns]);

    if (node.isUnique) {
      newQuery.unique();
    }
    if (node.hasIfNotExists) {
      newQuery.ifNotExists();
    }
    if (node.whereExpression) {
      newQuery.where(this.expectSingle(node.whereExpression.accept(this), 'WHERE') as Expression);
    }

    return newQuery;
  }

  visitAlterTableQuery(node: AlterTableQuery): SqlTreeNode | SqlTreeNode[] {
    const newQuery = new AlterTableQuery(node.tableName);
    const op = node.operation;

    if (op) {
      switch (op.type) {
        case 'ADD_COLUMN':
          const newConstraints = { ...op.column.constraints };
          if (op.column.constraints.check) {
            newConstraints.check = this.expectSingle(op.column.constraints.check.accept(this), 'check constraint') as Expression;
          }
          newQuery.addColumn(op.column.name, op.column.type, newConstraints);
          break;
        case 'RENAME_COLUMN':
          newQuery.renameColumn(op.oldName, op.newName);
          break;
        case 'DROP_COLUMN':
          newQuery.dropColumn(op.columnName);
          break;
        case 'RENAME_TABLE':
          newQuery.renameTo(op.newTableName);
          break;
      }
    }

    return newQuery;
  }

  visitCreateTableQuery(node: CreateTableQuery): SqlTreeNode | SqlTreeNode[] {
    const newQuery = new CreateTableQuery(node.tableName);

    // Copy columns with transformed check constraints
    for (const col of node.columns) {
      const newConstraints = { ...col.constraints };
      if (col.constraints.check) {
        newConstraints.check = this.expectSingle(col.constraints.check.accept(this), 'check constraint') as Expression;
      }
      newQuery.column(col.name, col.type, newConstraints);
    }

    // Copy table constraints with transformed check expressions
    for (const constraint of node.tableConstraints) {
      switch (constraint.type) {
        case 'PRIMARY KEY':
          newQuery.primaryKey(...constraint.columns!);
          break;
        case 'UNIQUE':
          newQuery.unique(...constraint.columns!);
          break;
        case 'FOREIGN KEY':
          newQuery.foreignKey(constraint.columns!, constraint.references!);
          break;
        case 'CHECK':
          const checkExpr = this.expectSingle(constraint.check!.accept(this), 'table check constraint') as Expression;
          newQuery.check(checkExpr, constraint.name);
          break;
      }
    }

    if (node.hasIfNotExists) {
      newQuery.ifNotExists();
    }
    if (node.hasWithoutRowid) {
      newQuery.withoutRowid();
    }
    if (node.isStrict) {
      newQuery.strict();
    }

    return newQuery;
  }

  visitTableFrom(node: TableFrom): SqlTreeNode | SqlTreeNode[] {
    return new TableFrom(node.tableName);
  }

  visitSubqueryFrom(node: SubqueryFrom): SqlTreeNode | SqlTreeNode[] {
    return new SubqueryFrom(this.expectSingle(node.subquery.accept(this), 'subquery') as SelectQuery);
  }

  visitJsonEachFrom(node: JsonEachFrom): SqlTreeNode | SqlTreeNode[] {
    const newJsonExpr = this.expectSingle(node.jsonExpression.accept(this), 'jsonExpression') as Expression;
    const newJsonPath = node.jsonPath ? this.expectSingle(node.jsonPath.accept(this), 'jsonPath') as Expression : undefined;
    return new JsonEachFrom(newJsonExpr, newJsonPath);
  }

  visitColumn(node: Column): SqlTreeNode | SqlTreeNode[] {
    return new Column(node.hasTableName() ? node.tableName! : node.columnName, node.hasTableName() ? node.columnName : undefined);
  }

  visitAlias<T extends Aliasable>(node: Alias<T>): SqlTreeNode | SqlTreeNode[] {
    return new Alias(this.expectSingle(node.referent.accept(this), 'referent') as T, node.alias);
  }

  visitJoinClause(node: Join): SqlTreeNode | SqlTreeNode[] {
    return new Join(node.type, node.tableName, node.alias, this.expectSingle(node.on.accept(this), 'on') as Expression);
  }

  visitOrderBy(node: OrderBy): SqlTreeNode | SqlTreeNode[] {
    return new OrderBy(this.expectSingle(node.column.accept(this), 'column') as Expression, node.direction);
  }

  visitWithClause(node: With): SqlTreeNode | SqlTreeNode[] {
    return new With(node.name, this.expectSingle(node.query.accept(this), 'query') as SelectQuery);
  }

  visitBinaryExpression(node: BinaryExpression): SqlTreeNode | SqlTreeNode[] {
    return new BinaryExpression(
      this.expectSingle(node.left.accept(this), 'left') as Expression,
      node.operator,
      this.expectSingle(node.right.accept(this), 'right') as Expression
    );
  }

  visitBetweenExpression(node: BetweenExpression): SqlTreeNode | SqlTreeNode[] {
    return new BetweenExpression(
      this.expectSingle(node.operand.accept(this), 'operand') as Expression,
      this.expectSingle(node.low.accept(this), 'low') as Expression,
      this.expectSingle(node.high.accept(this), 'high') as Expression,
      node.not
    );
  }

  visitUnaryExpression(node: UnaryExpression): SqlTreeNode | SqlTreeNode[] {
    return new UnaryExpression(node.operator, this.expectSingle(node.operand.accept(this), 'operand') as Expression);
  }

  visitInExpression(node: InExpression): SqlTreeNode | SqlTreeNode[] {
    const newLeft = this.flatList(node.left.map(l => l.accept(this))) as Expression[];
    let newValues: Expression[][] | SelectQuery;
    if (node.values instanceof SelectQuery) {
      newValues = this.expectSingle(node.values.accept(this), 'values subquery') as SelectQuery;
    } else {
      const newSets: Expression[][] = [];
      for (const set of node.values) {
        const transformedSetParts: (Expression | Expression[])[] = set.map(v => v.accept(this));
        if (set.length > 1 && transformedSetParts.some(Array.isArray)) {
          throw new Error('Array replacement not allowed in multi-column tuple position');
        }
        if (set.length === 1 && Array.isArray(transformedSetParts[0])) {
          // Single-column splice: add as separate sets
          transformedSetParts[0].forEach(r => newSets.push([r]));
        } else {
          // Normal or multi-column (no arrays)
          newSets.push(transformedSetParts as Expression[]);
        }
      }
      newValues = newSets;
    }
    return new InExpression(newLeft, newValues, node.not);
  }

  visitConcat(node: Concat): SqlTreeNode | SqlTreeNode[] {
    return new Concat(...(this.flatList(node.expressions.map(e => e.accept(this))) as Expression[]));
  }

  visitCaseExpression(node: CaseExpression): SqlTreeNode | SqlTreeNode[] {
    const newCases: CaseItem[] = node.cases.map(c => ({
      when: this.expectSingle(c.when.accept(this), 'when') as Expression,
      then: this.expectSingle(c.then.accept(this), 'then') as Expression
    }));
    const newElse = node.else ? this.expectSingle(node.else.accept(this), 'else') as Expression : undefined;
    return new CaseExpression(newCases, newElse);
  }

  visitFunctionExpression(node: FunctionExpression): SqlTreeNode | SqlTreeNode[] {
    return new FunctionExpression(node.name as FunctionName, this.flatList(node.args.map(a => a.accept(this))) as Expression[]);
  }

  visitParamExpression(node: Param): SqlTreeNode | SqlTreeNode[] {
    return new Param(node.paramName);
  }

  visitStringLiteral(node: StringLiteral): SqlTreeNode | SqlTreeNode[] {
    return new StringLiteral(node.value);
  }

  visitNumberLiteral(node: NumberLiteral): SqlTreeNode | SqlTreeNode[] {
    return new NumberLiteral(node.value);
  }

  visitNullLiteral(node: NullLiteral): SqlTreeNode | SqlTreeNode[] {
    return NullLiteral.INSTANCE;
  }

  visitExistsExpression(node: ExistsExpression): SqlTreeNode | SqlTreeNode[] {
    return new ExistsExpression(this.expectSingle(node.subquery.accept(this), 'subquery') as SelectQuery);
  }

  visitCastExpression(node: CastExpression): SqlTreeNode | SqlTreeNode[] {
    return new CastExpression(
      this.expectSingle(node.expression.accept(this), 'cast expression') as Expression,
      node.targetType
    );
  }

  visitCollateExpression(node: CollateExpression): SqlTreeNode | SqlTreeNode[] {
    return new CollateExpression(
      this.expectSingle(node.expression.accept(this), 'collate expression') as Expression,
      node.collation
    );
  }
}
