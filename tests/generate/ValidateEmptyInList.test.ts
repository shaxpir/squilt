import { COLUMN, FROM, IN, SELECT } from '../../src/builder/Shorthand';
import { CommonQueryValidator } from '../../src/validate/CommonQueryValidator';
import { SQLiteQueryValidator } from '../../src/validate/SQLiteQueryValidator';

describe('Validate Empty IN List', () => {
  test('IN with empty list fails validation', () => {
    const query = SELECT(FROM("users")).where(IN(COLUMN("id")));

    expect(() => query.accept(new CommonQueryValidator())).toThrow('IN expression must have at least one value');
    expect(() => query.accept(new SQLiteQueryValidator())).toThrow('IN expression must have at least one value');
  });
});