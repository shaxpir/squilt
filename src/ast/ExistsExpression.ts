import { SqlTreeNodeVisitor } from "../visitor/SqlTreeNodeVisitor";
import { AliasableExpression } from "./Abstractions";
import { SelectQuery } from "./SelectQuery";

export class ExistsExpression extends AliasableExpression {
  private _subquery: SelectQuery;

  constructor(subquery: SelectQuery) {
    super();
    this._subquery = subquery;
  }

  public get subquery(): SelectQuery {
    return this._subquery;
  }

  public accept<T>(visitor: SqlTreeNodeVisitor<T>): T {
    return visitor.visitExistsExpression(this);
  }
}
