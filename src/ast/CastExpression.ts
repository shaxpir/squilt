import { AliasableExpression, Expression } from "./Abstractions";
import { SqlTreeNodeVisitor } from "../visitor/SqlTreeNodeVisitor";

/**
 * Represents a CAST expression: CAST(expression AS type)
 */
export class CastExpression extends AliasableExpression {
  private _expression: Expression;
  private _targetType: string;

  constructor(expression: Expression, targetType: string) {
    super();
    this._expression = expression;
    this._targetType = targetType;
  }

  public get expression(): Expression {
    return this._expression;
  }

  public get targetType(): string {
    return this._targetType;
  }

  public accept<T>(visitor: SqlTreeNodeVisitor<T>): T {
    return visitor.visitCastExpression(this);
  }
}
