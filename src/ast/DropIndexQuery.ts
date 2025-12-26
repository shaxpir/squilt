import { IndentedQueryRenderer } from "../renderer/IndentedQueryRenderer";
import { QueryRenderer } from "../renderer/QueryRenderer";
import { SqlTreeNodeVisitor } from "../visitor/SqlTreeNodeVisitor";
import { SqlTreeNode } from "./Abstractions";

// Represents a DROP INDEX statement
export class DropIndexQuery implements SqlTreeNode {

  private _indexName: string;
  private _ifExists: boolean = false;

  constructor(indexName: string) {
    this._indexName = indexName;
  }

  public static create(indexName: string): DropIndexQuery {
    return new DropIndexQuery(indexName);
  }

  public ifExists(): DropIndexQuery {
    this._ifExists = true;
    return this;
  }

  public get indexName(): string {
    return this._indexName;
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
    return visitor.visitDropIndexQuery(this);
  }
}
