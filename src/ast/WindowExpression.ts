import { AliasableExpression } from "./Abstractions";
import { FunctionExpression } from "./FunctionExpression";
import { WindowSpecification } from "./WindowSpecification";
import { SqlTreeNodeVisitor } from "../visitor/SqlTreeNodeVisitor";

/**
 * Represents a window function expression: function OVER (window_spec)
 *
 * Window functions perform calculations across a set of rows related to
 * the current row, defined by the window specification.
 *
 * Currently supports:
 * - PARTITION BY clause: divides rows into groups
 * - ORDER BY clause: determines row ordering within each partition
 *
 * Not yet implemented:
 * - Frame specifications (ROWS/RANGE/GROUPS BETWEEN ... AND ...)
 * - Named windows (WINDOW clause at query level)
 *
 * @example
 * ```typescript
 * // ROW_NUMBER with ORDER BY
 * FN('ROW_NUMBER').over(ORDER_BY('created_at'))
 * // ROW_NUMBER() OVER (ORDER BY created_at)
 *
 * // RANK with PARTITION BY and ORDER BY
 * FN('RANK').over(PARTITION_BY('category'), ORDER_BY('price', DESC))
 * // RANK() OVER (PARTITION BY category ORDER BY price DESC)
 *
 * // Running total with aggregate function
 * SUM(COLUMN('amount')).over(PARTITION_BY('user_id'), ORDER_BY('date'))
 * // SUM(amount) OVER (PARTITION BY user_id ORDER BY date)
 *
 * // Empty OVER clause (window over entire result set)
 * FN('AVG', COLUMN('salary')).over()
 * // AVG(salary) OVER ()
 * ```
 */
export class WindowExpression extends AliasableExpression {
  private _function: FunctionExpression;
  private _windowSpec: WindowSpecification;

  constructor(fn: FunctionExpression, windowSpec: WindowSpecification) {
    super();
    this._function = fn;
    this._windowSpec = windowSpec;
  }

  /**
   * Get the underlying function expression
   */
  public get function(): FunctionExpression {
    return this._function;
  }

  /**
   * Get the window specification (PARTITION BY, ORDER BY)
   */
  public get windowSpec(): WindowSpecification {
    return this._windowSpec;
  }

  public accept<T>(visitor: SqlTreeNodeVisitor<T>): T {
    return visitor.visitWindowExpression(this);
  }
}
