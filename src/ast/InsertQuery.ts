import { IndentedQueryRenderer } from "../renderer/IndentedQueryRenderer";
import { QueryRenderer } from "../renderer/QueryRenderer";
import { SqlTreeNodeVisitor } from "../visitor/SqlTreeNodeVisitor";
import { AliasableExpression, Expression, SqlTreeNode } from "./Abstractions";
import { SelectQuery } from "./SelectQuery";

// Represents an assignment in the DO UPDATE SET clause
export interface UpsertSetClause {
  column: string;
  value: Expression;
}

// Represents an INSERT OR REPLACE statement with a table, columns, and values
export class InsertQuery implements SqlTreeNode {

  private _tableName: string;
  private _columns: string[] = [];
  private _values: Expression[] = [];
  private _fromSelect: SelectQuery | null = null;
  private _orReplace: boolean = false;
  private _returning: AliasableExpression[] = [];
  private _onConflictColumns: string[] = [];
  private _doUpdateSets: UpsertSetClause[] = [];
  private _doNothing: boolean = false;
  private _onConflictWhere: Expression | null = null;

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

  public fromSelect(query: SelectQuery): InsertQuery {
    this._fromSelect = query;
    return this;
  }

  public get selectQuery(): SelectQuery | null {
    return this._fromSelect;
  }

  public returning(...expressions: AliasableExpression[]): InsertQuery {
    this._returning = expressions;
    return this;
  }

  public onConflict(...columns: string[]): InsertQuery {
    this._onConflictColumns = columns;
    return this;
  }

  public doUpdate(sets: Record<string, Expression>): InsertQuery {
    this._doUpdateSets = Object.entries(sets).map(([column, value]) => ({ column, value }));
    return this;
  }

  public doNothing(): InsertQuery {
    this._doNothing = true;
    return this;
  }

  public onConflictWhere(condition: Expression): InsertQuery {
    this._onConflictWhere = condition;
    return this;
  }

  public isOrReplace(): boolean {
    return this._orReplace;
  }

  public get returningClause(): AliasableExpression[] {
    return this._returning;
  }

  public get onConflictColumns(): string[] {
    return this._onConflictColumns;
  }

  public get doUpdateClauses(): UpsertSetClause[] {
    return this._doUpdateSets;
  }

  public get isDoNothing(): boolean {
    return this._doNothing;
  }

  public get conflictWhere(): Expression | null {
    return this._onConflictWhere;
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
