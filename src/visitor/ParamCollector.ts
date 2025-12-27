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
import { CreateTableQuery } from "../ast/CreateTableQuery";
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
import { OrderBy } from "../ast/OrderBy";
import { SelectQuery } from "../ast/SelectQuery";
import { UnaryExpression } from "../ast/UnaryExpression";
import { With } from "../ast/With";
import { ColumnLikeVisitorAcceptor, FromLikeAndJoinVisitorAcceptor, SqlTreeNodeVisitor } from "./SqlTreeNodeVisitor";

export class ParamCollectingVisitor implements SqlTreeNodeVisitor<any[]> {

  protected fromLikeAndJoinAcceptor = new FromLikeAndJoinVisitorAcceptor<any[]>();
  protected columnLikeAcceptor = new ColumnLikeVisitorAcceptor<any[]>();

  private readonly keyValuePairs: Record<string, any>;
  private readonly params: any[] = [];

  constructor(keyValuePairs: Record<string, any>) {
    this.keyValuePairs = keyValuePairs;
  }

  visitInsertQuery(node: InsertQuery): any[] {
    if (node['_fromSelect']) {
      node['_fromSelect'].accept(this);
    } else {
      node['_values'].forEach(v => v.accept(this));
    }
    // Collect params from ON CONFLICT clause
    node['_doUpdateSets'].forEach(s => s.value.accept(this));
    if (node['_onConflictWhere']) {
      node['_onConflictWhere'].accept(this);
    }
    node['_returning'].forEach(r => r.accept(this));
    return this.params;
  }

  visitDeleteQuery(node: DeleteQuery): any[] {
    if (node['_where']) {
      node['_where'].accept(this);
    }
    node['_returning'].forEach(r => r.accept(this));
    return this.params;
  }

  visitUpdateQuery(node: UpdateQuery): any[] {
    node['_set'].forEach(s => s.value.accept(this));
    if (node['_where']) {
      node['_where'].accept(this);
    }
    node['_returning'].forEach(r => r.accept(this));
    return this.params;
  }

  visitDropTableQuery(_node: DropTableQuery): any[] {
    // DROP TABLE has no parameters
    return this.params;
  }

  visitDropIndexQuery(_node: DropIndexQuery): any[] {
    // DROP INDEX has no parameters
    return this.params;
  }

  visitDropViewQuery(_node: DropViewQuery): any[] {
    // DROP VIEW has no parameters
    return this.params;
  }

  visitCreateViewQuery(node: CreateViewQuery): any[] {
    // Collect params from the SELECT query
    if (node.selectQuery) {
      node.selectQuery.accept(this);
    }
    return this.params;
  }

  visitCreateIndexQuery(node: CreateIndexQuery): any[] {
    // Collect params from WHERE expression
    if (node.whereExpression) {
      node.whereExpression.accept(this);
    }
    return this.params;
  }

  visitAlterTableQuery(node: AlterTableQuery): any[] {
    // Collect params from ADD COLUMN CHECK constraint
    const op = node.operation;
    if (op && op.type === 'ADD_COLUMN' && op.column.constraints.check) {
      op.column.constraints.check.accept(this);
    }
    return this.params;
  }

  visitCreateTableQuery(node: CreateTableQuery): any[] {
    // Collect params from CHECK constraints
    for (const col of node.columns) {
      if (col.constraints.check) {
        col.constraints.check.accept(this);
      }
    }
    for (const constraint of node.tableConstraints) {
      if (constraint.check) {
        constraint.check.accept(this);
      }
    }
    return this.params;
  }

  visitCreateVirtualTableQuery(_node: CreateVirtualTableQuery): any[] {
    // CREATE VIRTUAL TABLE has no parameters
    return this.params;
  }

  visitSelectQuery(node: SelectQuery): any[] {
    node['_with'].forEach(w => w.accept(this));
    node['_fromsAndJoins'].forEach(item => this.fromLikeAndJoinAcceptor.accept(this, item));
    node['_columns'].forEach(c => this.columnLikeAcceptor.accept(this, c));
    if (node['_where']) {
      node['_where'].accept(this);
    }
    node['_groupBy'].forEach(c => c.accept(this));
    if (node['_having']) {
      node['_having'].accept(this);
    }
    node['_union'].forEach(u => u.accept(this));
    node['_intersect'].forEach(i => i.accept(this));
    node['_except'].forEach(e => e.accept(this));
    node['_orderBy'].forEach(o => o.accept(this));
    return this.params;
  }

  visitTableFrom(_node: TableFrom): any[] {
    return this.params;
  }

  visitSubqueryFrom(node: SubqueryFrom): any[] {
    node.subquery.accept(this);
    return this.params;
  }

  visitJsonEachFrom(node: JsonEachFrom): any[] {
    node.jsonExpression.accept(this);
    if (node.jsonPath) {
      node.jsonPath.accept(this);
    }
    return this.params;
  }

  visitColumn(_node: Column): any[] {
    return this.params;
  }

  visitAlias(node: Alias<From|AliasableExpression>): any[] {
    node.referent.accept(this);
    return this.params;
  }

  visitJoinClause(node: Join): any[] {
    node.on.accept(this);
    return this.params;
  }

  visitOrderBy(node: OrderBy): any[] {
    node.column.accept(this);
    return this.params;
  }

  visitWithClause(node: With): any[] {
    node.query.accept(this);
    return this.params;
  }

  visitBinaryExpression(node: BinaryExpression): any[] {
    node.left.accept(this);
    node.right.accept(this);
    return this.params;
  }

  visitBetweenExpression(node: BetweenExpression): any[] {
    node.operand.accept(this);
    node.low.accept(this);
    node.high.accept(this);
    return this.params;
  }

  visitUnaryExpression(node: UnaryExpression): any[] {
    node.operand.accept(this);
    return this.params;
  }

  visitInExpression(node: InExpression): any[] {
    node.left.forEach(l => l.accept(this));
    if (node.values instanceof SelectQuery) {
      node.values.accept(this);
    } else {
      node.values.forEach(set => set.forEach(v => v.accept(this)));
    }
    return this.params;
  }

  visitConcat(node: Concat): any[] {
    node.expressions.forEach(e => e.accept(this));
    return this.params;
  }

  visitCaseExpression(node: CaseExpression): any[] {
    node.cases.forEach(c => {
      c.when.accept(this);
      c.then.accept(this);
    });
    if (node.else) {
      node.else.accept(this);
    }
    return this.params;
  }

  visitFunctionExpression(node: FunctionExpression): any[] {
    node.args.forEach(a => a.accept(this));
    return this.params;
  }

  visitParamExpression(node: Param): any[] {
    if (node.paramName) {
      if (!this.keyValuePairs || typeof this.keyValuePairs !== 'object' || !(node.paramName in this.keyValuePairs)) {
        throw new Error(`No value provided for parameter: ${node.paramName}`);
      }
      this.params.push(this.keyValuePairs[node.paramName]);
    } else {
      this.params.push(undefined);
    }
    return this.params;
  }

  visitStringLiteral(_node: StringLiteral): any[] {
    return this.params;
  }

  visitNumberLiteral(_node: NumberLiteral): any[] {
    return this.params;
  }

  visitNullLiteral(_node: NullLiteral): any[] {
    return this.params;
  }

  visitExistsExpression(node: ExistsExpression): any[] {
    node.subquery.accept(this);
    return this.params;
  }

  visitCastExpression(node: CastExpression): any[] {
    node.expression.accept(this);
    return this.params;
  }

  visitCollateExpression(node: CollateExpression): any[] {
    node.expression.accept(this);
    return this.params;
  }

  visitSubqueryExpression(node: SubqueryExpression): any[] {
    node.subquery.accept(this);
    return this.params;
  }

  visitWindowExpression(node: WindowExpression): any[] {
    // Collect params from the underlying function
    node.function.accept(this);
    // Collect params from partition by columns
    node.windowSpec.partitionByColumns.forEach(c => c.accept(this));
    // Collect params from order by clauses
    node.windowSpec.orderByColumns.forEach(o => o.accept(this));
    return this.params;
  }
}
