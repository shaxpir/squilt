import { SqlTreeNodeVisitor } from "../visitor/SqlTreeNodeVisitor";
import { SqlTreeNode } from "./Abstractions";
import { SelectQuery } from "./SelectQuery";

// Represents a WITH clause (common table expression) with a name and subquery
export class With implements SqlTreeNode {

  private _name: string;
  private _query: SelectQuery;

  constructor(name: string, query: SelectQuery) {
    this._name = name;
    this._query = query;
  }

  public get name(): string {
    return this._name;
  }

  public get query(): SelectQuery {
    return this._query;
  }

  public accept<T>(visitor: SqlTreeNodeVisitor<T>): T {
    return visitor.visitWithClause(this);
  }
}
