import { SqlTreeNodeVisitor } from "../visitor/SqlTreeNodeVisitor";
import { Expression, SqlTreeNode } from "./Abstractions";

export enum JoinType {
  INNER = 'INNER',
  LEFT = 'LEFT',
  CROSS = 'CROSS',
  RIGHT = 'RIGHT',
  FULL = 'FULL',
}

// Represents a JOIN clause with type, table, alias, and ON condition
export class Join implements SqlTreeNode {

  private _type: JoinType;
  private _tableName: string;
  private _alias: string;
  private _on: Expression;

  constructor(type: JoinType, tableName: string, alias: string, on: Expression) {
    this._type = type;
    this._tableName = tableName;
    this._alias = alias;
    this._on = on;
  }

  public get type(): JoinType {
    return this._type;
  }

  public get tableName(): string {
    return this._tableName;
  }

  public get alias(): string {
    return this._alias;
  }

  public get on(): Expression {
    return this._on;
  }

  public accept<T>(visitor: SqlTreeNodeVisitor<T>): T {
    return visitor.visitJoinClause(this);
  }
}
