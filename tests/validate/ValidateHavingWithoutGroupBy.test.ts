import { BinaryExpression } from '../../src/ast/BinaryExpression';
import { Column } from '../../src/ast/Column';
import { TableFrom } from '../../src/ast/From';
import { FunctionExpression } from '../../src/ast/FunctionExpression';
import { NumberLiteral } from '../../src/ast/Literals';
import { Operator } from '../../src/ast/Operator';
import { SelectQuery } from '../../src/ast/SelectQuery';
import { COLUMN, FN, FROM, GT, HAVING, SELECT } from '../../src/builder/Shorthand';
import { CommonQueryValidator } from '../../src/validate/CommonQueryValidator';
import { SQLiteQueryValidator } from '../../src/validate/SQLiteQueryValidator';

const EXPECTED_ERROR_MESSAGE = 'HAVING clause requires GROUP BY';

describe('Validate HAVING without GROUP BY', () => {

  test('HAVING without GROUP BY fails', () => {
    const query = SelectQuery.create()
      .from(new TableFrom('orders'))
      .column(new Column('user_id'))
      .having(
        new BinaryExpression(
          new FunctionExpression('COUNT', [new Column('id')]),
          Operator.GREATER_THAN,
          new NumberLiteral(5)
        )
      );

    expect(() => query.accept(new CommonQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
    expect(() => query.accept(new SQLiteQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
  });

  test('HAVING without GROUP BY fails using Shorthand API', () => {
    const query = SELECT(FROM('orders'), COLUMN('user_id'))
      .having(HAVING(GT(FN('COUNT', COLUMN('id')), 5)));

    expect(() => query.accept(new CommonQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
    expect(() => query.accept(new SQLiteQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
  });
});