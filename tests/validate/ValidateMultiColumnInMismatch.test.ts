import { COLUMN, FROM, IN, SELECT } from '../../src/builder/Shorthand';
import { CommonQueryValidator } from '../../src/validate/CommonQueryValidator';
import { SQLiteQueryValidator } from '../../src/validate/SQLiteQueryValidator';

describe('Validate Multi-Column IN Mismatch', () => {
  test('IN with mismatched value set lengths fails validation', () => {
    const query = SELECT(FROM("t")).where(IN([COLUMN("d"), COLUMN("e")], [['val1'], ['val3', 'val4']]));

    expect(() => query.accept(new CommonQueryValidator())).toThrow('Value sets in IN expression must match the number of left expressions');
    expect(() => query.accept(new SQLiteQueryValidator())).toThrow('Value sets in IN expression must match the number of left expressions');
  });

  test('IN with empty left fails validation', () => {
    const query = SELECT(FROM("t")).where(IN([], [['val1', 'val2']]));

    expect(() => query.accept(new CommonQueryValidator())).toThrow('IN expression must have at least one left expression');
    expect(() => query.accept(new SQLiteQueryValidator())).toThrow('IN expression must have at least one left expression');
  });
});