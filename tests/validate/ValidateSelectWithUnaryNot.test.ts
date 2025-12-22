import { Alias } from '../../src/ast/Alias';
import { BinaryExpression } from '../../src/ast/BinaryExpression';
import { Column } from '../../src/ast/Column';
import { TableFrom } from '../../src/ast/From';
import { NumberLiteral } from '../../src/ast/Literals';
import { Operator } from '../../src/ast/Operator';
import { SelectQuery } from '../../src/ast/SelectQuery';
import { UnaryExpression } from '../../src/ast/UnaryExpression';
import { COLUMN, EQ, FROM, NOT, SELECT } from '../../src/builder/Shorthand';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';
import { CommonQueryValidator } from '../../src/validate/CommonQueryValidator';
import { SQLiteQueryValidator } from '../../src/validate/SQLiteQueryValidator';

const EXPECTED_QUERY_COMPACT = "SELECT name FROM users u WHERE (NOT (u.active = 1))";

const EXPECTED_QUERY_INDENTED = `
SELECT
  name
FROM users u
WHERE (NOT (u.active = 1))
`.trim();

describe('Validate Select Query with Unary NOT', () => {

  test('valid query with unary NOT passes both validators', () => {
    const query = SelectQuery.create()
      .from(new Alias(new TableFrom('users'), 'u'))
      .column(new Column('name'))
      .where(
        new UnaryExpression(
          Operator.NOT,
          new BinaryExpression(
            new Column('u', 'active'),
            Operator.EQUALS,
            new NumberLiteral(1)
          )
        )
      );
          
    expect(() => query.accept(new CommonQueryValidator())).not.toThrow();
    expect(() => query.accept(new SQLiteQueryValidator())).not.toThrow();

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });

  test('valid query with unary NOT passes both validators using Shorthand API', () => {
    const query = SELECT(
      FROM('users').as('u'),
      COLUMN('name')
    )
      .where(NOT(EQ(COLUMN('u', 'active'), 1)));
          
    expect(() => query.accept(new CommonQueryValidator())).not.toThrow();
    expect(() => query.accept(new SQLiteQueryValidator())).not.toThrow();

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });
});