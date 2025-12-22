import { IndentedQueryRenderer } from "../renderer/IndentedQueryRenderer";
import { QueryRenderer } from "../renderer/QueryRenderer";
import { SqlTreeNodeVisitor } from "../visitor/SqlTreeNodeVisitor";
import { Expression, SqlTreeNode } from "./Abstractions";
import { Alias } from "./Alias";
import { Column, ColumnLike } from "./Column";
import { From, FromLike } from "./From";
import { Join, JoinType } from "./Join";
import { OrderBy, OrderByDirection } from "./OrderBy";
import { With } from "./With";

// Main entry point for building SELECT queries with a fluent API.
export class SelectQuery implements SqlTreeNode {
  private _fromsAndJoins: (FromLike | Join)[] = [];
  private _columns: ColumnLike[] = [];
  private _where: Expression | null = null;
  private _groupBy: Column[] = [];
  private _having: Expression | null = null;
  private _with: With[] = [];
  private _union: SelectQuery[] = [];
  private _orderBy: OrderBy[] = [];
  private _offset?: number | null = null;
  private _limit?: number | null = null;
  private _distinct: boolean = false;

  public static create(): SelectQuery {
    return new SelectQuery();
  }

  public distinct(): SelectQuery {
    this._distinct = true;
    return this;
  }

  public with(clause: With): SelectQuery;
  public with(name: string, query: SelectQuery): SelectQuery;
  public with(nameOrClause: string | With, query?: SelectQuery): SelectQuery {
    if (typeof nameOrClause === 'string' && query) {
      this._with.push(new With(nameOrClause, query));
    } else if (nameOrClause instanceof With) {
      this._with.push(nameOrClause);
    }
    return this;
  }

  public from(fromClause: FromLike): SelectQuery {
    this._fromsAndJoins.push(fromClause);
    return this;
  }

  public column(column: ColumnLike): SelectQuery {
    this._columns.push(column);
    return this;
  }

  public join(join: Join): SelectQuery;
  public join(type: JoinType, tableName: string, alias: string, on: Expression): SelectQuery;
  public join(typeOrJoin: Join | JoinType, tableName?: string, alias?: string, on?: Expression): SelectQuery {
    if (this._fromsAndJoins.length === 0) {
      throw new Error('Cannot add JOIN without a preceding FROM clause');
    }
    const lastClause = this._fromsAndJoins[this._fromsAndJoins.length - 1];
    if (!(lastClause instanceof From || lastClause instanceof Alias || lastClause instanceof Join)) {
      throw new Error('JOIN must follow a FROM, an ALIAS, or another JOIN clause');
    }
    if (!(typeOrJoin instanceof Join)) {
      typeOrJoin = new Join(typeOrJoin, tableName!, alias!, on!);
    }
    this._fromsAndJoins.push(typeOrJoin);
    return this;
  }

  public where(whereClause: Expression): SelectQuery {
    this._where = whereClause;
    return this;
  }

  public groupBy(...columns: (string|Column)[]): SelectQuery {
    this._groupBy = columns.map(col => (typeof col === 'string' ? new Column(col) : col));
    return this;
  }

  public having(havingClause: Expression): SelectQuery {
    this._having = havingClause;
    return this;
  }

  public union(query: SelectQuery): SelectQuery {
    this._union.push(query);
    return this;
  }

  public orderBy(column: string|Expression, direction: OrderByDirection): SelectQuery {
    if (typeof column === 'string') {
      column = new Column(column);
    }
    this._orderBy.push(new OrderBy(column, direction));
    return this;
  }

  public offset(offset: number): SelectQuery {
    this._offset = offset;
    return this;
  }

  public limit(limit: number): SelectQuery {
    this._limit = limit;
    return this;
  }

  public toSQL(renderer?: QueryRenderer): string {
    if (!renderer) {
      renderer = new IndentedQueryRenderer(2);
    }
    return this.accept(renderer);
  }

  public accept<T>(visitor: SqlTreeNodeVisitor<T>): T {
    return visitor.visitSelectQuery(this);
  }

  public isDistinct(): boolean {
    return this._distinct;
  }
}
