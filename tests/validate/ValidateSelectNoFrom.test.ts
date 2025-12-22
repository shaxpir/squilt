import { Column } from '../../src/ast/Column';
import { SelectQuery } from '../../src/ast/SelectQuery';
import { COLUMN } from '../../src/builder/Shorthand';
import { CommonQueryValidator } from '../../src/validate/CommonQueryValidator';
import { SQLiteQueryValidator } from '../../src/validate/SQLiteQueryValidator';

const EXPECTED_ERROR_MESSAGE = 'SELECT query with columns must have at least one FROM clause';


describe('Validate SELECT with No FROM', () => {

  test('SELECT with columns but no FROM fails', () => {
    const query = SelectQuery.create().column(new Column('id'));

    expect(() => query.accept(new CommonQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
    expect(() => query.accept(new SQLiteQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
  });

  test('SELECT with columns but no FROM fails using Shorthand API', () => {
    const query = SelectQuery.create().column(COLUMN('id'));

    expect(() => query.accept(new CommonQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
    expect(() => query.accept(new SQLiteQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
  });
});