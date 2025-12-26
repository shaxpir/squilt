import { SqlTreeNodeVisitor } from "../visitor/SqlTreeNodeVisitor";
import { AliasableExpression, Expression } from "./Abstractions";
import { FunctionName } from "./FunctionName";
import { OrderBy } from "./OrderBy";
import { WindowExpression } from "./WindowExpression";
import { WindowSpecification } from "./WindowSpecification";

// Represents a function call (e.g., COUNT(id)) with SQLite-supported functions
export class FunctionExpression extends AliasableExpression {

  private _name: FunctionName;
  private _args: Expression[];
  private _distinct: boolean;

  constructor(name: FunctionName, args: Expression[], distinct: boolean = false) {
    super();
    this._name = name;
    this._args = args;
    this._distinct = distinct;
  }

  public get name(): FunctionName {
    return this._name;
  }

  public get args(): Expression[] {
    return this._args;
  }

  public get distinct(): boolean {
    return this._distinct;
  }

  public accept<T>(visitor: SqlTreeNodeVisitor<T>): T {
    return visitor.visitFunctionExpression(this);
  }

  /**
   * Create a window function expression with an OVER clause.
   *
   * Accepts PARTITION_BY (Expression[]) and ORDER_BY (OrderBy) arguments
   * in any order. Multiple ORDER_BY clauses are combined.
   *
   * @example
   * ```typescript
   * // With ORDER BY only
   * FN('ROW_NUMBER').over(ORDER_BY('created_at'))
   *
   * // With PARTITION BY and ORDER BY
   * FN('RANK').over(PARTITION_BY('category'), ORDER_BY('price', DESC))
   *
   * // Empty OVER clause (window over entire result set)
   * FN('AVG', COLUMN('salary')).over()
   * ```
   */
  public over(...specs: (Expression[] | OrderBy)[]): WindowExpression {
    const windowSpec = new WindowSpecification();
    const orderByClauses: OrderBy[] = [];

    for (const spec of specs) {
      if (Array.isArray(spec)) {
        // This is PARTITION BY columns (Expression[])
        windowSpec.setPartitionBy(spec);
      } else if (spec instanceof OrderBy) {
        // This is an ORDER BY clause
        orderByClauses.push(spec);
      }
    }

    if (orderByClauses.length > 0) {
      windowSpec.setOrderBy(orderByClauses);
    }

    return new WindowExpression(this, windowSpec);
  }
}
