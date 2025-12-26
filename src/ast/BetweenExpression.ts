import { AliasableExpression, Expression } from "./Abstractions";
import { SqlTreeNodeVisitor } from "../visitor/SqlTreeNodeVisitor";

export class BetweenExpression extends AliasableExpression {
  public readonly operand: Expression;
  public readonly low: Expression;
  public readonly high: Expression;
  public readonly not: boolean;

  constructor(operand: Expression, low: Expression, high: Expression, not: boolean = false) {
    super();
    this.operand = operand;
    this.low = low;
    this.high = high;
    this.not = not;
  }

  public accept<T>(visitor: SqlTreeNodeVisitor<T>): T {
    return visitor.visitBetweenExpression(this);
  }
}
