import { SqlTreeNodeVisitor } from "../visitor/SqlTreeNodeVisitor";
import { AliasableExpression, Expression } from "./Abstractions";
import { Operator } from "./Operator";

export class BinaryExpression extends AliasableExpression {

  private _left: Expression;
  private _operator: Operator;
  private _right: Expression;

  constructor(left: Expression, operator: Operator, right: Expression) {
    super()
    this._left = left;
    this._operator = operator;
    this._right = right;
  }

  public get left(): Expression {
    return this._left;
  }

  public get operator(): Operator {
    return this._operator;
  }

  public get right(): Expression {
    return this._right;
  }

  public accept<T>(visitor: SqlTreeNodeVisitor<T>): T {
    return visitor.visitBinaryExpression(this);
  }
}
