import { SqlTreeNodeVisitor } from "../visitor/SqlTreeNodeVisitor";
import { AliasableExpression } from "./Abstractions";

export abstract class LiteralExpression extends AliasableExpression {
  public abstract get value(): any;
  public abstract accept<T>(visitor: SqlTreeNodeVisitor<T>):T;
}

export class NumberLiteral extends LiteralExpression {
  private _value: number;
  constructor(value: number) {
    super();
    this._value = value;
  }

  public get value(): number {
    return this._value;
  }

  public accept<T>(visitor: SqlTreeNodeVisitor<T>): T {
    return visitor.visitNumberLiteral(this);
  }
}

export class StringLiteral extends LiteralExpression {
  private _value: string;
  constructor(value: string) {
    super();
    this._value = value;
  }

  public get value(): string {
    return this._value;
  }

  public accept<T>(visitor: SqlTreeNodeVisitor<T>): T {
    return visitor.visitStringLiteral(this);
  }
}

export class NullLiteral extends LiteralExpression {

  public static readonly INSTANCE: NullLiteral = new NullLiteral();

  private constructor() {
    super();
  }

  public get value(): null {
    return null;
  }

  public accept<T>(visitor: SqlTreeNodeVisitor<T>): T {
    return visitor.visitNullLiteral(this);
  }
}

// Represents a prepared statement parameter, with optional name for mapping values
// Example: new Param('minPrice') maps to a value in ParamCollectingVisitor
export class Param extends LiteralExpression {

  private _paramName?: string;

  constructor(paramName?: string) {
    super();
    this._paramName = paramName;
  }

  public get value(): any {
    return undefined;
  }

  public get paramName(): string | undefined {
    return this._paramName;
  }

  public accept<T>(visitor: SqlTreeNodeVisitor<T>): T {
    return visitor.visitParamExpression(this);
  }
}
