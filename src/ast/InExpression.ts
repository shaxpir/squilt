import { SqlTreeNodeVisitor } from "../visitor/SqlTreeNodeVisitor";
import { AliasableExpression, Expression } from "./Abstractions";
import { SelectQuery } from "./SelectQuery";

export class InExpression extends AliasableExpression {
  private _left: Expression[];
  private _values: Expression[][] | SelectQuery;
  private _not: boolean = false;

  constructor(
    left: Expression | Expression[],
    values: Expression[] | Expression[][] | SelectQuery,
    not: boolean = false
  ) {
    super();
    this._left = Array.isArray(left) ? left : [left];
    if (values instanceof SelectQuery) {
      this._values = values;
    } else {
      // Type assertion needed for strict mode
      const valuesArray = values as Expression[] | Expression[][];
      this._values = Array.isArray(valuesArray[0]) ? valuesArray as Expression[][] : (valuesArray as Expression[]).map(v => [v]);
    }
    this._not = not;
  }

  public get left(): Expression[] {
    return this._left;
  }

  public get values(): Expression[][] | SelectQuery {
    return this._values;
  }

  public get not(): boolean {
    return this._not;
  }

  public accept<T>(visitor: SqlTreeNodeVisitor<T>): T {
    return visitor.visitInExpression(this);
  }
}
