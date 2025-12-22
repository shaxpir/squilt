import { Alias } from '../../src/ast/Alias';
import { TableFrom } from '../../src/ast/From';
import { FunctionExpression } from '../../src/ast/FunctionExpression';
import { SelectQuery } from '../../src/ast/SelectQuery';
import { FN, FROM, SELECT } from '../../src/builder/Shorthand';
import { CommonQueryValidator } from '../../src/validate/CommonQueryValidator';
import { SQLiteQueryValidator } from '../../src/validate/SQLiteQueryValidator';

const EXPECTED_ERROR_MESSAGE = 'Function SUBSTR requires at least one argument';

describe('Validate SUBSTR with Invalid Arguments', () => {

  test('SUBSTR with invalid argument count fails validation', () => {
    const query = SelectQuery.create()
      .from(new TableFrom('users'))
      .column(new Alias(new FunctionExpression('SUBSTR', []), 'substring'));

    expect(() => query.accept(new CommonQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
    expect(() => query.accept(new SQLiteQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
  });

  test('SUBSTR with invalid argument count fails validation using Shorthand API', () => {
    const query = SELECT(FROM('users'), FN('SUBSTR').as('substring'));

    expect(() => query.accept(new CommonQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
    expect(() => query.accept(new SQLiteQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
  });
});