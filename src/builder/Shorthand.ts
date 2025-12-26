import { AliasableExpression, Expression } from "../ast/Abstractions";
import { Alias } from "../ast/Alias";
import { BetweenExpression } from "../ast/BetweenExpression";
import { BinaryExpression } from "../ast/BinaryExpression";
import { CaseExpression, CaseItem } from "../ast/CaseExpression";
import { Column, ColumnLike } from "../ast/Column";
import { Concat } from "../ast/Concat";
import { DeleteQuery } from "../ast/DeleteQuery";
import { UpdateQuery } from "../ast/UpdateQuery";
import { ExistsExpression } from "../ast/ExistsExpression";
import { From, FromLike, JsonEachFrom, SubqueryFrom, TableFrom } from "../ast/From";
import { FunctionExpression } from "../ast/FunctionExpression";
import { FunctionName } from "../ast/FunctionName";
import { InExpression } from "../ast/InExpression";
import { InsertQuery } from "../ast/InsertQuery";
import { Join, JoinType } from "../ast/Join";
import { NullLiteral, NumberLiteral, Param, StringLiteral } from "../ast/Literals";
import { Operator } from "../ast/Operator";
import { OrderBy, OrderByDirection } from "../ast/OrderBy";
import { SelectQuery } from "../ast/SelectQuery";
import { UnaryExpression } from "../ast/UnaryExpression";
import { With } from "../ast/With";
import { QueryBuilder } from "./QueryBuilder";

type PrimitiveValue = string | number | boolean | null;

type LazyExpression = Expression | PrimitiveValue;

type LazyCaseItem = { WHEN?: LazyExpression; THEN?: LazyExpression; ELSE?: LazyExpression };

type LazyFrom = string | From | Alias<From> | SelectQuery;

type LazyColumn = ColumnLike | PrimitiveValue;

export function VAL(val: PrimitiveValue): AliasableExpression {
  return LAZY(val);
}

// --- Operators ---

export function EQ(left: LazyExpression, right: LazyExpression): BinaryExpression {
  return new BinaryExpression(LAZY(left), Operator.EQUALS, LAZY(right));
}

export function NOT_EQ(left: LazyExpression, right: LazyExpression): BinaryExpression {
  return new BinaryExpression(LAZY(left), Operator.NOT_EQUALS, LAZY(right));
}

export function NOT(expr: LazyExpression): UnaryExpression {
  return new UnaryExpression(Operator.NOT, LAZY(expr));
}

export function GT(left: LazyExpression, right: LazyExpression): BinaryExpression {
  return new BinaryExpression(LAZY(left), Operator.GREATER_THAN, LAZY(right));
}

export function LT(left: LazyExpression, right: LazyExpression): BinaryExpression {
  return new BinaryExpression(LAZY(left), Operator.LESS_THAN, LAZY(right));
}

export function GTE(left: LazyExpression, right: LazyExpression): BinaryExpression {
  return new BinaryExpression(LAZY(left), Operator.GREATER_THAN_OR_EQUAL, LAZY(right));
}

export function LTE(left: LazyExpression, right: LazyExpression): BinaryExpression {
  return new BinaryExpression(LAZY(left), Operator.LESS_THAN_OR_EQUAL, LAZY(right));
}

export function LIKE(left: LazyExpression, right: LazyExpression): BinaryExpression {
  return new BinaryExpression(LAZY(left), Operator.LIKE, LAZY(right));
}

export function BETWEEN(operand: LazyExpression, low: LazyExpression, high: LazyExpression): BetweenExpression {
  return new BetweenExpression(LAZY(operand), LAZY(low), LAZY(high), false);
}

export function NOT_BETWEEN(operand: LazyExpression, low: LazyExpression, high: LazyExpression): BetweenExpression {
  return new BetweenExpression(LAZY(operand), LAZY(low), LAZY(high), true);
}

export function IS_NULL(expr: LazyExpression): UnaryExpression {
  return new UnaryExpression(Operator.IS_NULL, LAZY(expr));
}

export function IS_NOT_NULL(expr: LazyExpression): UnaryExpression {
  return new UnaryExpression(Operator.IS_NOT_NULL, LAZY(expr));
}

export function PLUS(left: LazyExpression, right?: LazyExpression): AliasableExpression {
  if (right === undefined) {
    return new UnaryExpression(Operator.PLUS, LAZY(left));
  } else {
    return new BinaryExpression(LAZY(left), Operator.PLUS, LAZY(right));
  }
}

export function MINUS(left: LazyExpression, right?: LazyExpression): AliasableExpression {
  if (right === undefined) {
    return new UnaryExpression(Operator.MINUS, LAZY(left));
  } else {
    return new BinaryExpression(LAZY(left), Operator.MINUS, LAZY(right));
  }
}

export function MULTIPLY(left: LazyExpression, right: LazyExpression): BinaryExpression {
  return new BinaryExpression(LAZY(left), Operator.MULTIPLY, LAZY(right));
}

export function DIVIDE(left: LazyExpression, right: LazyExpression): BinaryExpression {
  return new BinaryExpression(LAZY(left), Operator.DIVIDE, LAZY(right));
}

export function AND(...args: LazyExpression[]): AliasableExpression {
  if (args.length == 1) {
    return LAZY(args[0])
  } if (args.length < 1) {
    throw new Error('AND requires at least one arguments');
  }
  return args.reduce((left, right) => new BinaryExpression(LAZY(left), Operator.AND, LAZY(right))) as AliasableExpression;
}

export function OR(...args: LazyExpression[]): AliasableExpression {
  if (args.length == 1) {
    return LAZY(args[0])
  } else if (args.length < 1) {
    throw new Error('OR requires at least one arguments');
  }
  return args.reduce((left, right) => new BinaryExpression(LAZY(left), Operator.OR, LAZY(right))) as AliasableExpression;
}

// --- EXISTS ---

export function EXISTS(subquery: SelectQuery): ExistsExpression {
  return new ExistsExpression(subquery);
}

// --- Columns ---

export function COLUMN(arg1: string, arg2?: string): Column {
  return new Column(arg1, arg2);
}

// --- Select Queries ---

export function SELECT(...args: (FromLike | Join | LazyColumn)[]): SelectQuery {
  return addClausesToSelect(QueryBuilder.select(), args);
}

export function SELECT_DISTINCT(...args: (FromLike | Join | LazyColumn)[]): SelectQuery {
  return addClausesToSelect(QueryBuilder.select().distinct(), args);
}

function addClausesToSelect(query: SelectQuery, args: (FromLike | Join | LazyColumn)[]): SelectQuery {
  for (let arg of args) {
    if (arg instanceof Join) {
      query.join(arg);
    } else if (arg instanceof From) {
      query.from(arg);
    } else if (arg instanceof Column) {
      query.column(arg);
    } else if (arg instanceof Alias) {
      const referent = arg.referent as any;
      if (referent instanceof From) {
        query.from(arg);
      } else {
        query.column(arg);
      }
    } else if (arg && typeof arg === 'object' && 'referent' in (arg as any) && 'alias' in (arg as any)) {
      // Handle ColumnLike object form
      query.column(new Alias((arg as any).referent, (arg as any).alias));
    } else {
      query.column(LAZY(arg as LazyExpression));
    }
  }
  return query;
}

export function FROM(arg1: LazyFrom, arg2?: string): From|Alias<From> {
  // Two-argument form: FROM(database, table)
  if (typeof arg1 === 'string' && typeof arg2 === 'string') {
    return new TableFrom(`${arg1}.${arg2}`);
  }

  // Single-argument form (existing behavior)
  if (typeof arg1 === 'string') {
    return new TableFrom(arg1);
  } else if (arg1 instanceof Alias) {
    return arg1;
  } else if (arg1 instanceof SelectQuery) {
    return new SubqueryFrom(arg1);
  } else if (
    arg1 instanceof TableFrom ||
    arg1 instanceof SubqueryFrom ||
    arg1 instanceof JsonEachFrom
  ) {
    return arg1;
  } else {
    throw new Error('unexpected argument type for FROM: ' + JSON.stringify(arg1));
  }
}

export function UNION(...queries: SelectQuery[]): SelectQuery {
  const query = QueryBuilder.select();
  queries.forEach(q => query.union(q));
  return query;
}

// --- Joins ---

export function JOIN(tableName: string, alias: string, on: LazyExpression): Join {
  return new Join(JoinType.INNER, tableName, alias, LAZY(on));
}

export function LEFT_JOIN(tableName: string, alias: string, on: LazyExpression): Join {
  return new Join(JoinType.LEFT, tableName, alias, LAZY(on));
}

export function CROSS_JOIN(tableName: string, alias: string): Join {
  return new Join(JoinType.CROSS, tableName, alias, new StringLiteral('TRUE'));
}

// --- SQL Functions ---

export function ABS(column:Expression): FunctionExpression {
  return new FunctionExpression('ABS', [ column ]);
}

export function COUNT(column:Column|FunctionExpression|AliasableExpression): FunctionExpression {
  return new FunctionExpression('COUNT', [ column ]);
}

export function SUM(column:Column|FunctionExpression|AliasableExpression): FunctionExpression {
  return new FunctionExpression('SUM', [ column ]);
}

export function FN(name: FunctionName, ...args: LazyExpression[]): FunctionExpression {
  return new FunctionExpression(name, args.map(LAZY));
}

export function FN_DISTINCT(name: FunctionName, ...args: LazyExpression[]): FunctionExpression {
  return new FunctionExpression(name, args.map(LAZY), true);
}

// --- Concatenation ---

export function CONCAT(...args: LazyExpression[]): Concat {
  return new Concat(...args.map(LAZY));
}

// --- Parameters ---

export function PARAM(name?: string): Param {
  return new Param(name);
}

// --- Insert Queries ---

export function INSERT(tableName: string, columns: string[], values: LazyExpression[]): InsertQuery {
  return QueryBuilder.insertInto(tableName)
    .columns(...columns)
    .values(...values.map(LAZY));
}

export function INSERT_INTO(tableName: string): InsertQuery {
  return QueryBuilder.insertInto(tableName);
}

export function INSERT_OR_REPLACE(database: string, table: string, columns: string[], values: LazyExpression[]): InsertQuery;
export function INSERT_OR_REPLACE(tableName: string, columns: string[], values: LazyExpression[]): InsertQuery;
export function INSERT_OR_REPLACE(arg1: string, arg2: string | string[], arg3?: string[] | LazyExpression[], arg4?: LazyExpression[]): InsertQuery {
  // Four-argument form: INSERT_OR_REPLACE(database, table, columns, values)
  if (typeof arg2 === 'string' && Array.isArray(arg3) && Array.isArray(arg4)) {
    const qualifiedTableName = `${arg1}.${arg2}`;
    return QueryBuilder.insertInto(qualifiedTableName)
      .orReplace()
      .columns(...(arg3 as string[]))
      .values(...arg4.map(LAZY));
  }

  // Three-argument form: INSERT_OR_REPLACE(tableName, columns, values)
  if (Array.isArray(arg2) && Array.isArray(arg3)) {
    return QueryBuilder.insertInto(arg1)
      .orReplace()
      .columns(...arg2)
      .values(...(arg3 as LazyExpression[]).map(LAZY));
  }

  throw new Error('Invalid arguments for INSERT_OR_REPLACE');
}

// --- Other Clauses ---

// Overloads for IN
export function IN(left: LazyExpression, ...values: LazyExpression[]): InExpression;
export function IN(left: LazyExpression, values: SelectQuery): InExpression;
export function IN(left: LazyExpression[], values: LazyExpression[][]): InExpression;
export function IN(left: LazyExpression[], values: SelectQuery): InExpression;

// Implementation for IN
export function IN(left: LazyExpression | LazyExpression[], ...args: any[]): InExpression {
  const not = false;
  const resolvedLeft = Array.isArray(left) ? left.map(LAZY) : LAZY(left);
  let resolvedValues: Expression[][] | SelectQuery;
  if (Array.isArray(left)) {
    // Multi-column case
    if (args.length === 1 && args[0] instanceof SelectQuery) {
      resolvedValues = args[0];
    } else {
      const valuesArg = args[0] as LazyExpression[][];
      resolvedValues = valuesArg.map(set => set.map(LAZY));
    }
  } else {
    // Single-column case
    if (args.length === 1 && args[0] instanceof SelectQuery) {
      resolvedValues = args[0];
    } else {
      resolvedValues = args.map(LAZY).map(v => [v]);
    }
  }
  return new InExpression(resolvedLeft, resolvedValues, not);
}

// Overloads for NOT_IN
export function NOT_IN(left: LazyExpression, ...values: LazyExpression[]): InExpression;
export function NOT_IN(left: LazyExpression, values: SelectQuery): InExpression;
export function NOT_IN(left: LazyExpression[], values: LazyExpression[][]): InExpression;
export function NOT_IN(left: LazyExpression[], values: SelectQuery): InExpression;

// Implementation for NOT_IN
export function NOT_IN(left: LazyExpression | LazyExpression[], ...args: any[]): InExpression {
  const not = true;
  const resolvedLeft = Array.isArray(left) ? left.map(LAZY) : LAZY(left);
  let resolvedValues: Expression[][] | SelectQuery;
  if (Array.isArray(left)) {
    // Multi-column case
    if (args.length === 1 && args[0] instanceof SelectQuery) {
      resolvedValues = args[0];
    } else {
      const valuesArg = args[0] as LazyExpression[][];
      resolvedValues = valuesArg.map(set => set.map(LAZY));
    }
  } else {
    // Single-column case
    if (args.length === 1 && args[0] instanceof SelectQuery) {
      resolvedValues = args[0];
    } else {
      resolvedValues = args.map(LAZY).map(v => [v]);
    }
  }
  return new InExpression(resolvedLeft, resolvedValues, not);
}

export function GROUP_BY(...columns: (Column | string)[]): Column[] {
  return columns.map(col => (typeof col === 'string' ? COLUMN(col) : col));
}

export function HAVING(expr: LazyExpression): Expression {
  return LAZY(expr);
}

export function ORDER_BY(column: Column | string, direction: OrderByDirection = OrderByDirection.ASC): OrderBy {
  return new OrderBy(typeof column === 'string' ? COLUMN(column) : column, direction);
}

// --- CASE Expressions ---

export function CASE(lazyCases: LazyCaseItem[]): CaseExpression {
  let elseExpr: Expression | undefined = undefined;
  const caseItems: CaseItem[] = [];
  for (const c of lazyCases) {
    if (c.WHEN !== undefined && c.THEN !== undefined) {
      if (elseExpr) {
        throw new Error('ELSE must be the last clause in a CASE expression');
      }
      caseItems.push({ when: LAZY(c.WHEN), then: LAZY(c.THEN) });
    } else if (c.ELSE !== undefined) {
      if (elseExpr) {
        throw new Error('CASE expression can only have one ELSE clause');
      }
      elseExpr = LAZY(c.ELSE);
    }
  }
  return new CaseExpression(caseItems, elseExpr);
}

// --- Subqueries and WITH Clauses ---

export function WITH(name: string, query: SelectQuery): With {
  return new With(name, query);
}

// --- Delete Queries ---

export function DELETE_FROM(tableName: string): DeleteQuery {
  return QueryBuilder.deleteFrom(tableName);
}

// --- Update Queries ---

export function UPDATE(tableName: string): UpdateQuery {
  return QueryBuilder.update(tableName);
}

// --- Aliases ---

export function ALIAS(referent: AliasableExpression, alias: string): Alias<AliasableExpression>;
export function ALIAS(referent: From, alias: string): Alias<From>;
export function ALIAS(referent: AliasableExpression | From, alias: string): Alias<AliasableExpression> | Alias<From> {
  if (referent instanceof From) {
    return new Alias<From>(referent, alias);
  }
  return new Alias<AliasableExpression>(referent as AliasableExpression, alias);
}

// --- Literal Conversion ---

function LAZY(value: LazyExpression): AliasableExpression {
  if (value === null) {
    return NullLiteral.INSTANCE;
  } else if (typeof value === 'boolean') {
    return new NumberLiteral(value ? 1 : 0);
  } else if (typeof value === 'string') {
    return new StringLiteral(value);
  } else if (typeof value === 'number') {
    return new NumberLiteral(value);
  } else if (value instanceof AliasableExpression) {
    return value;
  } else {
    throw new Error(`Unsupported value type: ${typeof value}`);
  }
}
