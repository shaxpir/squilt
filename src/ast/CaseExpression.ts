import { SqlTreeNodeVisitor } from "../visitor/SqlTreeNodeVisitor";
import { AliasableExpression, Expression } from "./Abstractions";

export interface CaseItem {
  when: Expression;
  then: Expression;
}

export class CaseExpression extends AliasableExpression {

  private _cases:CaseItem[];
  private _else?: Expression;

  constructor(cases:CaseItem[], elseExpr?: Expression) {
    super();
    this._cases = cases;
    this._else = elseExpr;
  }

  public get cases():CaseItem[] {
    return this._cases;
  }

  public get else(): Expression | undefined {
    return this._else;
  }

  public accept<T>(visitor: SqlTreeNodeVisitor<T>): T {
    return visitor.visitCaseExpression(this);
  }
}
