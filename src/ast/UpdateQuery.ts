import { IndentedQueryRenderer } from "../renderer/IndentedQueryRenderer";
import { QueryRenderer } from "../renderer/QueryRenderer";
import { SqlTreeNodeVisitor } from "../visitor/SqlTreeNodeVisitor";
import { Expression, SqlTreeNode } from "./Abstractions";

// Represents an assignment in the SET clause of an UPDATE statement
export interface SetClause {
  column: string;
  value: Expression;
}

// Represents an UPDATE statement with a table, SET clause, and optional WHERE clause
export class UpdateQuery implements SqlTreeNode {

  private _tableName: string;
  private _set: SetClause[] = [];
  private _where: Expression | null = null;

  constructor(tableName: string) {
    this._tableName = tableName;
  }

  public static create(tableName: string): UpdateQuery {
    return new UpdateQuery(tableName);
  }

  public set(column: string, value: Expression): UpdateQuery {
    this._set.push({ column, value });
    return this;
  }

  public where(condition: Expression): UpdateQuery {
    this._where = condition;
    return this;
  }

  public get tableName(): string {
    return this._tableName;
  }

  public get setClause(): SetClause[] {
    return this._set;
  }

  public get whereClause(): Expression | null {
    return this._where;
  }

  public toSQL(renderer?: QueryRenderer): string {
    if (!renderer) {
      renderer = new IndentedQueryRenderer(2);
    }
    return this.accept(renderer);
  }

  public accept<T>(visitor: SqlTreeNodeVisitor<T>): T {
    return visitor.visitUpdateQuery(this);
  }
}
