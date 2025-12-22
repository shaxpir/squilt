import { IndentedQueryRenderer } from "../renderer/IndentedQueryRenderer";
import { QueryRenderer } from "../renderer/QueryRenderer";
import { SqlTreeNodeVisitor } from "../visitor/SqlTreeNodeVisitor";
import { Expression, SqlTreeNode } from "./Abstractions";

// Represents an INSERT OR REPLACE statement with a table, columns, and values
export class InsertQuery implements SqlTreeNode {

  private _tableName: string;
  private _columns: string[] = [];
  private _values: Expression[] = [];
  private _orReplace: boolean = false;

  constructor(tableName: string) {
    this._tableName = tableName;
  }

  public static create(tableName: string): InsertQuery {
    return new InsertQuery(tableName);
  }

  public orReplace(): InsertQuery {
    this._orReplace = true;
    return this;
  }

  public columns(...columns: string[]): InsertQuery {
    this._columns = columns;
    return this;
  }

  public values(...values: Expression[]): InsertQuery {
    this._values = values;
    return this;
  }

  public isOrReplace(): boolean {
    return this._orReplace;
  }

  public toSQL(renderer?: QueryRenderer): string {
    if (!renderer) {
      renderer = new IndentedQueryRenderer(2);
    }
    return this.accept(renderer);
  }

  public accept<T>(visitor: SqlTreeNodeVisitor<T>): T {
    return visitor.visitInsertQuery(this);
  }
}
