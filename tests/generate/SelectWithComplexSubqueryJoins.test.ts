import { Alias } from '../../src/ast/Alias';
import { BinaryExpression } from '../../src/ast/BinaryExpression';
import { Column } from '../../src/ast/Column';
import { SubqueryFrom, TableFrom } from '../../src/ast/From';
import { JoinType } from '../../src/ast/Join';
import { Param, StringLiteral } from '../../src/ast/Literals';
import { Operator } from '../../src/ast/Operator';
import { SelectQuery } from '../../src/ast/SelectQuery';
import { COLUMN, EQ, FROM, GT, JOIN, LEFT_JOIN, PARAM, SELECT } from '../../src/builder/Shorthand';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';
import { ParamCollectingVisitor } from '../../src/visitor/ParamCollector';

const EXPECTED_QUERY_COMPACT ='SELECT user_id AS uid FROM (SELECT user_id FROM orders o WHERE (o.status = \'completed\')) active_orders INNER JOIN users u ON (active_orders.user_id = u.id) LEFT JOIN profiles p ON (u.id = p.user_id) WHERE (p.age > ?)';

const EXPECTED_QUERY_INDENTED = `
SELECT
  user_id AS uid
FROM (
    SELECT
      user_id
    FROM orders o
    WHERE (o.status = 'completed')
  ) active_orders
INNER JOIN users u ON (active_orders.user_id = u.id)
LEFT JOIN profiles p ON (u.id = p.user_id)
WHERE (p.age > ?)
`.trim();

describe('Select Query with Complex Subquery and Joins', () => {

  test('builds and renders complex query with nested subquery and multiple joins', () => {
    const subquery = SelectQuery.create()
      .from(new Alias(new TableFrom('orders'), 'o'))
      .column(new Column('user_id'))
      .where(
        new BinaryExpression(
          new Column('o', 'status'),
          Operator.EQUALS,
          new StringLiteral('completed')
        )
      );

    const query = SelectQuery.create()
      .from(new Alias(new SubqueryFrom(subquery), 'active_orders'))
      .column(new Alias(new Column('user_id'), 'uid'))
      .join(
        JoinType.INNER,
        'users',
        'u',
        new BinaryExpression(
          new Column('active_orders', 'user_id'),
          Operator.EQUALS,
          new Column('u', 'id')
        )
      )
      .join(
        JoinType.LEFT,
        'profiles',
        'p',
        new BinaryExpression(
          new Column('u', 'id'),
          Operator.EQUALS,
          new Column('p', 'user_id')
        )
      )
      .where(
        new BinaryExpression(
          new Column('p', 'age'),
          Operator.GREATER_THAN,
          new Param('minAge')
        )
      );

    const keyValuePairs = {
      minAge: 25,
    };

    const paramCollector = new ParamCollectingVisitor(keyValuePairs);
    const params = query.accept(paramCollector);
    expect(params).toEqual([25]);

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });

  test('builds and renders complex query with nested subquery and multiple joins using Shorthand API', () => {
    const subquery = SELECT(
      FROM('orders').as('o'),
      COLUMN('user_id')
    )
    .where(EQ(COLUMN('o', 'status'), 'completed'));

    const query = SELECT(
      FROM(subquery).as('active_orders'),
      COLUMN('user_id').as('uid')
    )
    .join(JOIN('users', 'u',
      EQ(COLUMN('active_orders', 'user_id'), COLUMN('u', 'id'))
    ))
    .join(LEFT_JOIN('profiles', 'p',
      EQ(COLUMN('u', 'id'), COLUMN('p', 'user_id'))
    ))
    .where(
      GT(COLUMN('p', 'age'), PARAM('minAge'))
    );

    const keyValuePairs = {
      minAge: 25,
    };

    const paramCollector = new ParamCollectingVisitor(keyValuePairs);
    const params = query.accept(paramCollector);
    expect(params).toEqual([25]);

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });
});