import { SqlTreeNode } from "./Abstractions";
import { SelectQuery } from "./SelectQuery";
import { SqlTreeNodeVisitor } from "../visitor/SqlTreeNodeVisitor";

export class CreateViewQuery implements SqlTreeNode {
  private _viewName: string;
  private _columns: string[] = [];
  private _selectQuery: SelectQuery | null = null;
  private _ifNotExists: boolean = false;
  private _isTemporary: boolean = false;

  constructor(viewName: string) {
    this._viewName = viewName;
  }

  public get viewName(): string {
    return this._viewName;
  }

  public get columns(): string[] {
    return this._columns;
  }

  public get selectQuery(): SelectQuery | null {
    return this._selectQuery;
  }

  public get hasIfNotExists(): boolean {
    return this._ifNotExists;
  }

  public get isTemporary(): boolean {
    return this._isTemporary;
  }

  /**
   * Specify column names for the view (optional).
   * If not specified, column names are derived from the SELECT query.
   */
  public withColumns(...columns: string[]): CreateViewQuery {
    this._columns = columns;
    return this;
  }

  /**
   * Define the view's SELECT query.
   */
  public as(query: SelectQuery): CreateViewQuery {
    this._selectQuery = query;
    return this;
  }

  /**
   * Add IF NOT EXISTS modifier.
   */
  public ifNotExists(): CreateViewQuery {
    this._ifNotExists = true;
    return this;
  }

  /**
   * Create a temporary view.
   */
  public temporary(): CreateViewQuery {
    this._isTemporary = true;
    return this;
  }

  public accept<T>(visitor: SqlTreeNodeVisitor<T>): T {
    return visitor.visitCreateViewQuery(this);
  }
}
