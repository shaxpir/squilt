import { IndentedQueryRenderer } from "../renderer/IndentedQueryRenderer";
import { QueryRenderer } from "../renderer/QueryRenderer";
import { SqlTreeNodeVisitor } from "../visitor/SqlTreeNodeVisitor";
import { Expression, SqlTreeNode } from "./Abstractions";

// Represents a CREATE INDEX statement
export class CreateIndexQuery implements SqlTreeNode {

  private _indexName: string;
  private _tableName: string = '';
  private _columns: string[] = [];
  private _unique: boolean = false;
  private _ifNotExists: boolean = false;
  private _where: Expression | null = null;

  constructor(indexName: string) {
    this._indexName = indexName;
  }

  public static create(indexName: string): CreateIndexQuery {
    return new CreateIndexQuery(indexName);
  }

  public on(tableName: string, columns: string | string[]): CreateIndexQuery {
    this._tableName = tableName;
    this._columns = Array.isArray(columns) ? columns : [columns];
    return this;
  }

  public unique(): CreateIndexQuery {
    this._unique = true;
    return this;
  }

  public ifNotExists(): CreateIndexQuery {
    this._ifNotExists = true;
    return this;
  }

  public where(expression: Expression): CreateIndexQuery {
    this._where = expression;
    return this;
  }

  public get indexName(): string {
    return this._indexName;
  }

  public get tableName(): string {
    return this._tableName;
  }

  public get columns(): string[] {
    return this._columns;
  }

  public get isUnique(): boolean {
    return this._unique;
  }

  public get hasIfNotExists(): boolean {
    return this._ifNotExists;
  }

  public get whereExpression(): Expression | null {
    return this._where;
  }

  public toSQL(renderer?: QueryRenderer): string {
    if (!renderer) {
      renderer = new IndentedQueryRenderer(2);
    }
    return this.accept(renderer);
  }

  public accept<T>(visitor: SqlTreeNodeVisitor<T>): T {
    return visitor.visitCreateIndexQuery(this);
  }
}
