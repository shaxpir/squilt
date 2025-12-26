import { IndentedQueryRenderer } from "../renderer/IndentedQueryRenderer";
import { QueryRenderer } from "../renderer/QueryRenderer";
import { SqlTreeNodeVisitor } from "../visitor/SqlTreeNodeVisitor";
import { AliasableExpression, Expression, SqlTreeNode } from "./Abstractions";

// Represents a DELETE statement with a table and optional WHERE clause
export class DeleteQuery implements SqlTreeNode {

  private _tableName: string;
  private _where: Expression | null = null;
  private _returning: AliasableExpression[] = [];

  constructor(tableName: string) {
    this._tableName = tableName;
  }

  public static create(tableName: string): DeleteQuery {
    return new DeleteQuery(tableName);
  }

  public where(condition: Expression): DeleteQuery {
    this._where = condition;
    return this;
  }

  public returning(...expressions: AliasableExpression[]): DeleteQuery {
    this._returning = expressions;
    return this;
  }

  public get tableName(): string {
    return this._tableName;
  }

  public get whereClause(): Expression | null {
    return this._where;
  }

  public get returningClause(): AliasableExpression[] {
    return this._returning;
  }

  public toSQL(renderer?: QueryRenderer): string {
    if (!renderer) {
      renderer = new IndentedQueryRenderer(2);
    }
    return this.accept(renderer);
  }

  public accept<T>(visitor: SqlTreeNodeVisitor<T>): T {
    return visitor.visitDeleteQuery(this);
  }
}
