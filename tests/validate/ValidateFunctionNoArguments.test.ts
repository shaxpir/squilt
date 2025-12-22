import { Alias } from '../../src/ast/Alias';
import { TableFrom } from '../../src/ast/From';
import { FunctionExpression } from '../../src/ast/FunctionExpression';
import { SelectQuery } from '../../src/ast/SelectQuery';
import { FN, FROM, SELECT } from '../../src/builder/Shorthand';
import { CommonQueryValidator } from '../../src/validate/CommonQueryValidator';
import { SQLiteQueryValidator } from '../../src/validate/SQLiteQueryValidator';

const EXPECTED_ERROR_MESSAGE = 'Function COUNT requires at least one argument';

describe('Validate FunctionExpression with No Arguments', () => {

  test('FunctionExpression with no arguments fails for non-allowed functions', () => {
    const query = SelectQuery.create()
      .from(new TableFrom('users'))
      .column(new Alias(new FunctionExpression('COUNT', []), 'count'));

    expect(() => query.accept(new CommonQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
    expect(() => query.accept(new SQLiteQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
  });

  test('FunctionExpression with no arguments fails for non-allowed functions using Shorthand API', () => {
    const query = SELECT(FROM('users'), FN('COUNT').as('count'));

    expect(() => query.accept(new CommonQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
    expect(() => query.accept(new SQLiteQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
  });
});