import { IndentedQueryRenderer } from "../renderer/IndentedQueryRenderer";
import { QueryRenderer } from "../renderer/QueryRenderer";
import { SqlTreeNodeVisitor } from "../visitor/SqlTreeNodeVisitor";
import { Expression, SqlTreeNode } from "./Abstractions";

// Column type for SQLite
export type ColumnType = 'INTEGER' | 'TEXT' | 'REAL' | 'BLOB' | 'NUMERIC';

// Foreign key reference configuration
export interface ForeignKeyReference {
  table: string;
  column: string;
  onDelete?: 'CASCADE' | 'SET NULL' | 'SET DEFAULT' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'SET DEFAULT' | 'RESTRICT' | 'NO ACTION';
}

// Column constraint options
export interface ColumnConstraints {
  primaryKey?: boolean;
  autoIncrement?: boolean;
  notNull?: boolean;
  unique?: boolean;
  default?: string | number | null;
  check?: Expression;
  references?: ForeignKeyReference;
}

// Column definition
export interface ColumnDefinition {
  name: string;
  type: ColumnType;
  constraints: ColumnConstraints;
}

// Table-level constraint for composite keys
export interface TableConstraint {
  type: 'PRIMARY KEY' | 'UNIQUE' | 'FOREIGN KEY' | 'CHECK';
  columns?: string[];
  references?: ForeignKeyReference;
  check?: Expression;
  name?: string;
}

// Represents a CREATE TABLE statement
export class CreateTableQuery implements SqlTreeNode {

  private _tableName: string;
  private _columns: ColumnDefinition[] = [];
  private _tableConstraints: TableConstraint[] = [];
  private _ifNotExists: boolean = false;
  private _withoutRowid: boolean = false;
  private _strict: boolean = false;

  constructor(tableName: string) {
    this._tableName = tableName;
  }

  public static create(tableName: string): CreateTableQuery {
    return new CreateTableQuery(tableName);
  }

  public column(name: string, type: ColumnType, constraints: ColumnConstraints = {}): CreateTableQuery {
    this._columns.push({ name, type, constraints });
    return this;
  }

  public primaryKey(...columns: string[]): CreateTableQuery {
    this._tableConstraints.push({ type: 'PRIMARY KEY', columns });
    return this;
  }

  public unique(...columns: string[]): CreateTableQuery {
    this._tableConstraints.push({ type: 'UNIQUE', columns });
    return this;
  }

  public foreignKey(columns: string[], references: ForeignKeyReference): CreateTableQuery {
    this._tableConstraints.push({ type: 'FOREIGN KEY', columns, references });
    return this;
  }

  public check(expression: Expression, name?: string): CreateTableQuery {
    this._tableConstraints.push({ type: 'CHECK', check: expression, name });
    return this;
  }

  public ifNotExists(): CreateTableQuery {
    this._ifNotExists = true;
    return this;
  }

  public withoutRowid(): CreateTableQuery {
    this._withoutRowid = true;
    return this;
  }

  public strict(): CreateTableQuery {
    this._strict = true;
    return this;
  }

  public get tableName(): string {
    return this._tableName;
  }

  public get columns(): ColumnDefinition[] {
    return this._columns;
  }

  public get tableConstraints(): TableConstraint[] {
    return this._tableConstraints;
  }

  public get hasIfNotExists(): boolean {
    return this._ifNotExists;
  }

  public get hasWithoutRowid(): boolean {
    return this._withoutRowid;
  }

  public get isStrict(): boolean {
    return this._strict;
  }

  public toSQL(renderer?: QueryRenderer): string {
    if (!renderer) {
      renderer = new IndentedQueryRenderer(2);
    }
    return this.accept(renderer);
  }

  public accept<T>(visitor: SqlTreeNodeVisitor<T>): T {
    return visitor.visitCreateTableQuery(this);
  }
}
