import { Alias } from '../../src/ast/Alias';
import { BinaryExpression } from '../../src/ast/BinaryExpression';
import { Column } from '../../src/ast/Column';
import { TableFrom } from '../../src/ast/From';
import { Join, JoinType } from '../../src/ast/Join';
import { Param } from '../../src/ast/Literals';
import { Operator } from '../../src/ast/Operator';
import { SelectQuery } from '../../src/ast/SelectQuery';
import { COLUMN, EQ, FROM, GT, JOIN, PARAM, SELECT } from '../../src/builder/Shorthand';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';
import { CommonQueryValidator } from '../../src/validate/CommonQueryValidator';
import { SQLiteQueryValidator } from '../../src/validate/SQLiteQueryValidator';

const EXPECTED_QUERY_COMPACT = "SELECT id FROM orders o INNER JOIN users u ON (o.user_id = u.id) WHERE (o.amount > ?)";

const EXPECTED_QUERY_INDENTED = `
SELECT
  id
FROM orders o
INNER JOIN users u ON (o.user_id = u.id)
WHERE (o.amount > ?)
`.trim();

describe('Validate Select Query with JOIN and WHERE', () => {

  test('valid query with JOIN and WHERE passes both validators', () => {
    const query = SelectQuery.create()
      .from(new Alias(new TableFrom('orders'), 'o'))
      .column(new Column('id'))
      .join(
        new Join(
          JoinType.INNER,
          'users',
          'u',
          new BinaryExpression(
            new Column('o', 'user_id'),
            Operator.EQUALS,
            new Column('u', 'id')
          )
        )
      )
      .where(
        new BinaryExpression(
          new Column('o', 'amount'),
          Operator.GREATER_THAN,
          new Param()
        )
      );
      
    expect(() => query.accept(new CommonQueryValidator())).not.toThrow();
    expect(() => query.accept(new SQLiteQueryValidator())).not.toThrow();

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });

  test('valid query with JOIN and WHERE passes both validators using Shorthand API', () => {
    const query = SELECT(
      FROM('orders').as('o'),
      COLUMN('id'))
      .join(JOIN('users', 'u', EQ(COLUMN('o', 'user_id'), COLUMN('u', 'id'))))
      .where(
        GT(COLUMN('o', 'amount'), PARAM())
      );
      
    expect(() => query.accept(new CommonQueryValidator())).not.toThrow();
    expect(() => query.accept(new SQLiteQueryValidator())).not.toThrow();

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });
});