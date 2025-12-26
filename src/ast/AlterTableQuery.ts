import { IndentedQueryRenderer } from "../renderer/IndentedQueryRenderer";
import { QueryRenderer } from "../renderer/QueryRenderer";
import { SqlTreeNodeVisitor } from "../visitor/SqlTreeNodeVisitor";
import { SqlTreeNode } from "./Abstractions";
import { ColumnType, ColumnConstraints, ColumnDefinition } from "./CreateTableQuery";

// Types of ALTER TABLE operations
export type AlterTableOperation =
  | { type: 'ADD_COLUMN'; column: ColumnDefinition }
  | { type: 'RENAME_COLUMN'; oldName: string; newName: string }
  | { type: 'DROP_COLUMN'; columnName: string }
  | { type: 'RENAME_TABLE'; newTableName: string };

// Represents an ALTER TABLE statement
export class AlterTableQuery implements SqlTreeNode {

  private _tableName: string;
  private _operation: AlterTableOperation | null = null;

  constructor(tableName: string) {
    this._tableName = tableName;
  }

  public static create(tableName: string): AlterTableQuery {
    return new AlterTableQuery(tableName);
  }

  public addColumn(name: string, type: ColumnType, constraints: ColumnConstraints = {}): AlterTableQuery {
    this._operation = {
      type: 'ADD_COLUMN',
      column: { name, type, constraints }
    };
    return this;
  }

  public renameColumn(oldName: string, newName: string): AlterTableQuery {
    this._operation = {
      type: 'RENAME_COLUMN',
      oldName,
      newName
    };
    return this;
  }

  public dropColumn(columnName: string): AlterTableQuery {
    this._operation = {
      type: 'DROP_COLUMN',
      columnName
    };
    return this;
  }

  public renameTo(newTableName: string): AlterTableQuery {
    this._operation = {
      type: 'RENAME_TABLE',
      newTableName
    };
    return this;
  }

  public get tableName(): string {
    return this._tableName;
  }

  public get operation(): AlterTableOperation | null {
    return this._operation;
  }

  public toSQL(renderer?: QueryRenderer): string {
    if (!renderer) {
      renderer = new IndentedQueryRenderer(2);
    }
    return this.accept(renderer);
  }

  public accept<T>(visitor: SqlTreeNodeVisitor<T>): T {
    return visitor.visitAlterTableQuery(this);
  }
}
