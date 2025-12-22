import { SqlTreeNodeVisitor } from "../visitor/SqlTreeNodeVisitor";
import { Aliasable, Expression } from "./Abstractions";

export class Alias<T extends Aliasable> implements Expression {

  private _referent:T;
  private _alias: string;

  constructor(referent:T, alias: string) {
    this._referent = referent;
    this._alias = alias;
  }

  public as(alias: string): Alias<T> {
    throw new Error("Cannot create an alias of an alias");
  }

  public get referent(): T {
    return this._referent;
  }

  public get alias(): string {
    return this._alias;
  }

  public accept<T>(visitor: SqlTreeNodeVisitor<T>): T {
    return visitor.visitAlias(this);
  }
}
