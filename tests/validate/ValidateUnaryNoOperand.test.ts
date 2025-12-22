import { TableFrom } from '../../src/ast/From';
import { Operator } from '../../src/ast/Operator';
import { SelectQuery } from '../../src/ast/SelectQuery';
import { UnaryExpression } from '../../src/ast/UnaryExpression';
import { CommonQueryValidator } from '../../src/validate/CommonQueryValidator';
import { SQLiteQueryValidator } from '../../src/validate/SQLiteQueryValidator';

const EXPECTED_ERROR_MESSAGE = 'UnaryExpression must have a valid operand';

describe('Validate UnaryExpression with No Operand', () => {

  test('UnaryExpression with no operand fails', () => {
    const query = SelectQuery.create()
      .from(new TableFrom('users'))
      .where(
        new UnaryExpression(Operator.NOT, null as any)
      );

    expect(() => query.accept(new CommonQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
    expect(() => query.accept(new SQLiteQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
  });

  // Note: Shorthand API does not allow null operands for unary expressions, as it enforces valid inputs.
  // Adding a Shorthand test with an invalid operand would require modifying Shorthand.ts to allow such cases,
  // which is not practical. Skipping to maintain API consistency.
});