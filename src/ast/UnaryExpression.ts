import { SqlTreeNodeVisitor } from "../visitor/SqlTreeNodeVisitor";
import { AliasableExpression, Expression } from "./Abstractions";
import { Operator } from "./Operator";

export class UnaryExpression extends AliasableExpression {

  private _operator: Operator;
  private _operand: Expression;

  constructor(operator: Operator, operand: Expression) {
    super();
    this._operator = operator;
    this._operand = operand;
  }

  public get operator(): Operator {
    return this._operator;
  }

  public get operand(): Expression {
    return this._operand;
  }

  public accept<T>(visitor: SqlTreeNodeVisitor<T>): T {
    return visitor.visitUnaryExpression(this);
  }
}
