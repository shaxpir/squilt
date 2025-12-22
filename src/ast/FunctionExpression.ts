import { SqlTreeNodeVisitor } from "../visitor/SqlTreeNodeVisitor";
import { AliasableExpression, Expression } from "./Abstractions";
import { FunctionName } from "./FunctionName";

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
}
