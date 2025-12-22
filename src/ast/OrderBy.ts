import { SqlTreeNodeVisitor } from "../visitor/SqlTreeNodeVisitor";
import { Expression, SqlTreeNode } from "./Abstractions";

export enum OrderByDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class OrderBy implements SqlTreeNode {

  private _column: Expression;
  private _direction: OrderByDirection;

  constructor(column: Expression, direction: OrderByDirection) {
    this._column = column;
    this._direction = direction;
  }

  public get column(): Expression {
    return this._column;
  }

  public get direction(): OrderByDirection {
    return this._direction;
  }

  public accept<T>(visitor: SqlTreeNodeVisitor<T>): T {
    return visitor.visitOrderBy(this);
  }
}
