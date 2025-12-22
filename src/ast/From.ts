import { SqlTreeNodeVisitor } from "../visitor/SqlTreeNodeVisitor";
import { Aliasable, Expression } from "./Abstractions";
import { Alias } from "./Alias";
import { SelectQuery } from "./SelectQuery";

export type FromLike = From | { referent: From; alias: string };

export abstract class From implements Aliasable {
  abstract accept<T>(visitor: SqlTreeNodeVisitor<T>): T;
  public as(alias: string): Alias<this> {
    return new Alias<this>(this, alias);
  }
}

// Represents a table in the FROM clause, typically used for simple queries
export class TableFrom extends From {

  private _tableName: string;

  constructor(tableName: string) {
    super();
    this._tableName = tableName;
  }

  public get tableName(): string {
    return this._tableName;
  }

  public accept<T>(visitor: SqlTreeNodeVisitor<T>): T {
    return visitor.visitTableFrom(this);
  }
}

// Represents a subquery in the FROM clause, allowing for complex queries to be used as tables
export class SubqueryFrom extends From {

  private _subquery: SelectQuery;

  constructor(subquery: SelectQuery) {
    super();
    this._subquery = subquery;
  }

  public get subquery(): SelectQuery {
    return this._subquery;
  }

  public accept<T>(visitor: SqlTreeNodeVisitor<T>): T {
    return visitor.visitSubqueryFrom(this);
  }
}


// Represents a `json_each` table-valued function in the FROM clause, iterating over a JSON array or object
export class JsonEachFrom extends From {

  private _jsonExpression: Expression;
  private _jsonPath?: Expression;

  constructor(jsonExpression: Expression, jsonPath?: Expression) {
    super();
    this._jsonExpression = jsonExpression;
    this._jsonPath = jsonPath;
  }

  public as(alias: string): Alias<this> {
    return new Alias<this>(this, alias);
  }

  public get jsonExpression(): Expression {
    return this._jsonExpression;
  }

  public get jsonPath(): Expression | undefined {
    return this._jsonPath;
  }

  public accept<T>(visitor: SqlTreeNodeVisitor<T>): T {
    return visitor.visitJsonEachFrom(this);
  }
}
