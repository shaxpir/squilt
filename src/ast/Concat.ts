import { SqlTreeNodeVisitor } from "../visitor/SqlTreeNodeVisitor";
import { AliasableExpression, Expression } from "./Abstractions";

// Concatenates multiple expressions using SQLite's || operator
export class Concat extends AliasableExpression {

  private _expressions: Expression[];

  constructor(...expressions: Expression[]) {
    super();
    this._expressions = expressions;
  }

  public get expressions(): Expression[] {
    return this._expressions;
  }

  public accept<T>(visitor: SqlTreeNodeVisitor<T>): T {
    return visitor.visitConcat(this);
  }
}
