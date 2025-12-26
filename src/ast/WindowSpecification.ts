import { Expression } from "./Abstractions";
import { OrderBy } from "./OrderBy";

/**
 * Represents a window specification for window functions.
 *
 * Currently supports:
 * - PARTITION BY clause
 * - ORDER BY clause
 *
 * Not yet implemented:
 * - Frame specifications (ROWS/RANGE/GROUPS BETWEEN ... AND ...)
 * - Named windows (WINDOW clause at query level)
 *
 * @example
 * ```typescript
 * // Used via FunctionExpression.over()
 * FN('ROW_NUMBER').over(ORDER_BY('created_at'))
 * FN('RANK').over(PARTITION_BY('category'), ORDER_BY('price', DESC))
 * SUM(COLUMN('amount')).over(PARTITION_BY('user_id'))
 * ```
 */
export class WindowSpecification {
  private _partitionBy: Expression[] = [];
  private _orderBy: OrderBy[] = [];

  constructor() {}

  /**
   * Set the PARTITION BY columns
   */
  public setPartitionBy(columns: Expression[]): void {
    this._partitionBy = columns;
  }

  /**
   * Add ORDER BY clauses
   */
  public setOrderBy(orderBy: OrderBy[]): void {
    this._orderBy = orderBy;
  }

  /**
   * Get the PARTITION BY columns
   */
  public get partitionByColumns(): Expression[] {
    return this._partitionBy;
  }

  /**
   * Get the ORDER BY clauses
   */
  public get orderByColumns(): OrderBy[] {
    return this._orderBy;
  }

  /**
   * Check if this window specification is empty (no PARTITION BY or ORDER BY)
   */
  public get isEmpty(): boolean {
    return this._partitionBy.length === 0 && this._orderBy.length === 0;
  }
}
