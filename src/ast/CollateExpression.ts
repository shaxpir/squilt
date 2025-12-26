import { AliasableExpression, Expression } from "./Abstractions";
import { SqlTreeNodeVisitor } from "../visitor/SqlTreeNodeVisitor";

/**
 * Represents a COLLATE expression: expression COLLATE collation_name
 *
 * SQLite built-in collations:
 * - BINARY: Compares using memcmp()
 * - NOCASE: Case-insensitive ASCII comparison
 * - RTRIM: Like BINARY but ignores trailing spaces
 */
export class CollateExpression extends AliasableExpression {
  private _expression: Expression;
  private _collation: string;

  constructor(expression: Expression, collation: string) {
    super();
    this._expression = expression;
    this._collation = collation;
  }

  public get expression(): Expression {
    return this._expression;
  }

  public get collation(): string {
    return this._collation;
  }

  public accept<T>(visitor: SqlTreeNodeVisitor<T>): T {
    return visitor.visitCollateExpression(this);
  }
}
