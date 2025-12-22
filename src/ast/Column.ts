import { SqlTreeNodeVisitor } from "../visitor/SqlTreeNodeVisitor";
import { AliasableExpression, Expression } from "./Abstractions";
import { Alias } from "./Alias";

export type ColumnLike = Column | AliasableExpression | { referent: Expression; alias: string };

// Represents a named column (e.g., 'id'), with optional alias.
export class Column extends AliasableExpression {

  private _tableName: string | undefined;
  private _columnName: string;

  constructor(arg1: string, arg2?: string) {
    super();
    // If arg2 is provided, then we should interpret arg1 as a table name and arg2 as a column name.
    // If arg2 is not provided, then we should interpret arg1 as a column name.
    if (arg2) {
      this._tableName = arg1;
      this._columnName = arg2;
    } else {
      this._tableName = undefined;
      this._columnName = arg1;
    }
  }

  public as(alias: string): Alias<this> {
    return new Alias<this>(this, alias);
  }

  public hasTableName(): boolean {
    return this._tableName !== undefined;
  }

  public get tableName(): string | undefined {
    return this._tableName;
  }

  public get columnName(): string {
    return this._columnName;
  }

  public accept<T>(visitor: SqlTreeNodeVisitor<T>): T {
    return visitor.visitColumn(this);
  }
}
