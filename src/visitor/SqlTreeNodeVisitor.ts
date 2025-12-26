import { AliasableExpression } from "../ast/Abstractions";
import { Alias } from "../ast/Alias";
import { BinaryExpression } from "../ast/BinaryExpression";
import { CaseExpression } from "../ast/CaseExpression";
import { Column, ColumnLike } from "../ast/Column";
import { Concat } from "../ast/Concat";
import { DeleteQuery } from "../ast/DeleteQuery";
import { ExistsExpression } from "../ast/ExistsExpression";
import { FromLike, JsonEachFrom, SubqueryFrom, TableFrom } from "../ast/From";
import { FunctionExpression } from "../ast/FunctionExpression";
import { InExpression } from "../ast/InExpression";
import { InsertQuery } from "../ast/InsertQuery";
import { Join } from "../ast/Join";
import { LiteralExpression, NullLiteral, NumberLiteral, Param, StringLiteral } from "../ast/Literals";
import { OrderBy } from "../ast/OrderBy";
import { SelectQuery } from "../ast/SelectQuery";
import { UnaryExpression } from "../ast/UnaryExpression";
import { With } from "../ast/With";

export interface SqlTreeNodeVisitor<T> {
  visitSelectQuery(node: SelectQuery): T;
  visitInsertQuery(node: InsertQuery): T;
  visitDeleteQuery(node: DeleteQuery): T;
  visitTableFrom(node: TableFrom): T;
  visitSubqueryFrom(node: SubqueryFrom): T;
  visitJsonEachFrom(node: JsonEachFrom): T;
  visitJoinClause(node: Join): T;
  visitOrderBy(node: OrderBy): T;
  visitWithClause(node: With): T;
  visitColumn(node: Column): T;
  visitAlias(node: Alias<any>): T;
  visitBinaryExpression(node: BinaryExpression): T;
  visitUnaryExpression(node: UnaryExpression): T;
  visitInExpression(node: InExpression): T;
  visitConcat(node: Concat): T;
  visitCaseExpression(node: CaseExpression): T;
  visitFunctionExpression(node: FunctionExpression): T;
  visitParamExpression(node: Param): T;
  visitStringLiteral(node: StringLiteral): T;
  visitNumberLiteral(node: NumberLiteral): T;
  visitNullLiteral(node: NullLiteral): T;
  visitExistsExpression(node: ExistsExpression): T;
}

export class FromLikeAndJoinVisitorAcceptor<T> {
  public accept(visitor: SqlTreeNodeVisitor<T>, f: FromLike|Join): T {
    if (f instanceof Join ||
        f instanceof TableFrom ||
        f instanceof SubqueryFrom ||
        f instanceof JsonEachFrom ||
        f instanceof Alias
    ) {
      return f.accept(visitor);
    } else if (f && typeof f === 'object' && 'referent' in f && 'alias' in f) {
      const alias = new Alias(f.referent, f.alias);
      return alias.accept(visitor);
    } else {
      throw new Error('Invalid FROM clause: ' + JSON.stringify(f));
    }
  }
}

export class ColumnLikeVisitorAcceptor<T> {
  public accept(visitor: SqlTreeNodeVisitor<T>, c: ColumnLike): T {
    if (
      c instanceof Column ||
      c instanceof LiteralExpression ||
      c instanceof AliasableExpression ||
      c instanceof Alias
    ) {
      return c.accept(visitor);
    } else if (c && typeof c === 'object' && 'referent' in c && 'alias' in c) {
      const alias = new Alias((c as any).referent, c.alias);
      return alias.accept(visitor);
    } else {
      throw new Error('Invalid COLUMN clause: ' + JSON.stringify(c));
    }
  }
}
