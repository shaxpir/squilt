import { SqlTreeNode } from "./Abstractions";
import { SqlTreeNodeVisitor } from "../visitor/SqlTreeNodeVisitor";

export class DropViewQuery implements SqlTreeNode {
  private _viewName: string;
  private _ifExists: boolean = false;

  constructor(viewName: string) {
    this._viewName = viewName;
  }

  public get viewName(): string {
    return this._viewName;
  }

  public get hasIfExists(): boolean {
    return this._ifExists;
  }

  public ifExists(): DropViewQuery {
    this._ifExists = true;
    return this;
  }

  public accept<T>(visitor: SqlTreeNodeVisitor<T>): T {
    return visitor.visitDropViewQuery(this);
  }
}
