import { AliasableExpression } from "./Abstractions";
import { SelectQuery } from "./SelectQuery";
import { SqlTreeNodeVisitor } from "../visitor/SqlTreeNodeVisitor";

/**
 * Represents a scalar subquery expression: (SELECT ...)
 *
 * Can be used anywhere an expression is allowed:
 * - In SELECT columns: SELECT id, (SELECT name FROM users WHERE ...) AS user_name
 * - In WHERE clauses: WHERE price > (SELECT AVG(price) FROM products)
 * - In CASE expressions: CASE WHEN (SELECT COUNT(*) FROM ...) > 0 THEN ...
 * - In function arguments: COALESCE((SELECT ...), default_value)
 */
export class SubqueryExpression extends AliasableExpression {
  private _subquery: SelectQuery;

  constructor(subquery: SelectQuery) {
    super();
    this._subquery = subquery;
  }

  public get subquery(): SelectQuery {
    return this._subquery;
  }

  public accept<T>(visitor: SqlTreeNodeVisitor<T>): T {
    return visitor.visitSubqueryExpression(this);
  }
}
