import { Column } from '../../src/ast/Column';
import { TableFrom } from '../../src/ast/From';
import { SelectQuery } from '../../src/ast/SelectQuery';
import { COLUMN, FROM, SELECT } from '../../src/builder/Shorthand';
import { CommonQueryValidator } from '../../src/validate/CommonQueryValidator';
import { SQLiteQueryValidator } from '../../src/validate/SQLiteQueryValidator';

const EXPECTED_ERROR_MESSAGE = 'OFFSET must be non-negative';

describe('Validate Non-Integer OFFSET', () => {

  test('Non-integer OFFSET fails validation', () => {
    const query = SelectQuery.create()
      .from(new TableFrom('users'))
      .column(new Column('id'))
      .limit(10)
      .offset(-1);

    expect(() => query.accept(new CommonQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
    expect(() => query.accept(new SQLiteQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
  });

  test('Non-integer OFFSET fails validation using Shorthand API', () => {
    const query = SELECT(FROM('users'), COLUMN('id'))
      .limit(10)
      .offset(-1);

    expect(() => query.accept(new CommonQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
    expect(() => query.accept(new SQLiteQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
  });
});