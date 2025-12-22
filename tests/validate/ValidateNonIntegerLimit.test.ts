import { Column } from '../../src/ast/Column';
import { TableFrom } from '../../src/ast/From';
import { SelectQuery } from '../../src/ast/SelectQuery';
import { COLUMN, FROM, SELECT } from '../../src/builder/Shorthand';
import { CommonQueryValidator } from '../../src/validate/CommonQueryValidator';
import { SQLiteQueryValidator } from '../../src/validate/SQLiteQueryValidator';

const EXPECTED_ERROR_MESSAGE = 'SQLite LIMIT must be an integer';

describe('Validate Non-Integer LIMIT', () => {

  test('Non-integer LIMIT fails SQLite validation', () => {
    const query = SelectQuery.create()
      .from(new TableFrom('users'))
      .column(new Column('id'))
      .limit(1.5);

    expect(() => query.accept(new CommonQueryValidator())).not.toThrow();
    expect(() => query.accept(new SQLiteQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
  });

  test('Non-integer LIMIT fails SQLite validation using Shorthand API', () => {
    const query = SELECT(
      FROM('users'),
      COLUMN('id')
    )
    .limit(1.5);

    expect(() => query.accept(new CommonQueryValidator())).not.toThrow();
    expect(() => query.accept(new SQLiteQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
  });
});