import { IndentedQueryRenderer } from "../renderer/IndentedQueryRenderer";
import { QueryRenderer } from "../renderer/QueryRenderer";
import { SqlTreeNodeVisitor } from "../visitor/SqlTreeNodeVisitor";
import { SqlTreeNode } from "./Abstractions";

// Represents a DROP TABLE statement
export class DropTableQuery implements SqlTreeNode {

  private _tableName: string;
  private _ifExists: boolean = false;

  constructor(tableName: string) {
    this._tableName = tableName;
  }

  public static create(tableName: string): DropTableQuery {
    return new DropTableQuery(tableName);
  }

  public ifExists(): DropTableQuery {
    this._ifExists = true;
    return this;
  }

  public get tableName(): string {
    return this._tableName;
  }

  public get hasIfExists(): boolean {
    return this._ifExists;
  }

  public toSQL(renderer?: QueryRenderer): string {
    if (!renderer) {
      renderer = new IndentedQueryRenderer(2);
    }
    return this.accept(renderer);
  }

  public accept<T>(visitor: SqlTreeNodeVisitor<T>): T {
    return visitor.visitDropTableQuery(this);
  }
}
