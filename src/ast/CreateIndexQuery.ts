import { IndentedQueryRenderer } from "../renderer/IndentedQueryRenderer";
import { QueryRenderer } from "../renderer/QueryRenderer";
import { SqlTreeNodeVisitor } from "../visitor/SqlTreeNodeVisitor";
import { Expression, SqlTreeNode } from "./Abstractions";

/**
 * Represents an index column, which can be either:
 * - A simple column name (string)
 * - An expression (e.g., FN('json_extract', COLUMN('data'), '$.field'))
 */
export type IndexColumn = string | Expression;

// Represents a CREATE INDEX statement
export class CreateIndexQuery implements SqlTreeNode {

  private _indexName: string;
  private _tableName: string = '';
  private _columns: IndexColumn[] = [];
  private _unique: boolean = false;
  private _ifNotExists: boolean = false;
  private _where: Expression | null = null;

  constructor(indexName: string) {
    this._indexName = indexName;
  }

  public static create(indexName: string): CreateIndexQuery {
    return new CreateIndexQuery(indexName);
  }

  /**
   * Specify the table and columns for the index.
   *
   * Columns can be:
   * - Simple column names: 'column_name' or ['col1', 'col2']
   * - Expressions: FN('json_extract', COLUMN('data'), '$.field')
   * - Mixed: ['col1', FN('LOWER', COLUMN('name'))]
   *
   * @example
   * // Simple column index
   * CREATE_INDEX('idx_users_email').on('users', 'email')
   *
   * @example
   * // Expression index (e.g., for JSON fields)
   * CREATE_INDEX('idx_data_field').on('docs', FN('json_extract', COLUMN('data'), '$.field'))
   *
   * @example
   * // Composite index with expression
   * CREATE_INDEX('idx_name_lower').on('users', [COLUMN('id'), FN('LOWER', COLUMN('name'))])
   */
  public on(tableName: string, columns: IndexColumn | IndexColumn[]): CreateIndexQuery {
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

  public get columns(): IndexColumn[] {
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
