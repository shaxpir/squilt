import { Alias } from "./Alias";
import { SqlTreeNodeVisitor } from "../visitor/SqlTreeNodeVisitor";

export interface SqlTreeNode {
  accept<T>(visitor: SqlTreeNodeVisitor<T>): T;
}

export interface Aliasable extends SqlTreeNode {
  as(alias: string): Alias<this>;
}

export interface Expression extends SqlTreeNode {}

export abstract class AliasableExpression implements Aliasable, Expression {
  abstract accept<T>(visitor: SqlTreeNodeVisitor<T>): T;
  public as(alias: string): Alias<this> {
    return new Alias<this>(this, alias);
  }
}
