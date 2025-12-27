import { IndentedQueryRenderer } from "../renderer/IndentedQueryRenderer";
import { QueryRenderer } from "../renderer/QueryRenderer";
import { SqlTreeNodeVisitor } from "../visitor/SqlTreeNodeVisitor";
import { SqlTreeNode } from "./Abstractions";

// Supported virtual table modules (extensible for future modules like rtree)
export type VirtualTableModule = 'fts5';

// FTS5-specific options
export interface FTS5Options {
  tokenize?: string;      // e.g., 'porter unicode61'
  content?: string;       // External content table name
  contentRowid?: string;  // Column to use as rowid for external content
  prefix?: string;        // Prefix indexes, e.g., '2 3 4'
}

// Represents a CREATE VIRTUAL TABLE statement
export class CreateVirtualTableQuery implements SqlTreeNode {

  private _tableName: string;
  private _module: VirtualTableModule;
  private _columns: string[] = [];
  private _options: FTS5Options = {};
  private _ifNotExists: boolean = false;

  constructor(tableName: string, module: VirtualTableModule) {
    this._tableName = tableName;
    this._module = module;
  }

  public static create(tableName: string, module: VirtualTableModule): CreateVirtualTableQuery {
    return new CreateVirtualTableQuery(tableName, module);
  }

  // Add a column to the virtual table
  public column(name: string): CreateVirtualTableQuery {
    this._columns.push(name);
    return this;
  }

  // Set the tokenizer for FTS5
  public tokenize(tokenizer: string): CreateVirtualTableQuery {
    this._options.tokenize = tokenizer;
    return this;
  }

  // Set the external content table for FTS5
  public content(tableName: string): CreateVirtualTableQuery {
    this._options.content = tableName;
    return this;
  }

  // Set the content_rowid column for external content FTS5 tables
  public contentRowid(columnName: string): CreateVirtualTableQuery {
    this._options.contentRowid = columnName;
    return this;
  }

  // Set prefix index lengths for FTS5
  public prefix(lengths: string): CreateVirtualTableQuery {
    this._options.prefix = lengths;
    return this;
  }

  // Add IF NOT EXISTS clause
  public ifNotExists(): CreateVirtualTableQuery {
    this._ifNotExists = true;
    return this;
  }

  // Getters
  public get tableName(): string {
    return this._tableName;
  }

  public get module(): VirtualTableModule {
    return this._module;
  }

  public get columns(): string[] {
    return this._columns;
  }

  public get options(): FTS5Options {
    return this._options;
  }

  public get hasIfNotExists(): boolean {
    return this._ifNotExists;
  }

  public toSQL(renderer?: QueryRenderer): string {
    if (!renderer) {
      renderer = new IndentedQueryRenderer(2);
    }
    return this.accept(renderer);
  }

  public accept<T>(visitor: SqlTreeNodeVisitor<T>): T {
    return visitor.visitCreateVirtualTableQuery(this);
  }
}
