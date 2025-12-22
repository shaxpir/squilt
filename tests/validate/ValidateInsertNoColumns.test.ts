import { Param } from '../../src/ast/Literals';
import { QueryBuilder } from '../../src/builder/QueryBuilder';
import { INSERT, PARAM } from '../../src/builder/Shorthand';
import { CommonQueryValidator } from '../../src/validate/CommonQueryValidator';
import { SQLiteQueryValidator } from '../../src/validate/SQLiteQueryValidator';

const EXPECTED_ERROR_MESSAGE = 'InsertQuery must specify at least one column';

describe('Validate INSERT with No Columns', () => {

  test('INSERT with no columns fails', () => {
    const query = QueryBuilder.insertInto('users')
      .values(new Param('id'));

    expect(() => query.accept(new CommonQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
    expect(() => query.accept(new SQLiteQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
  });

  test('INSERT with no columns fails using Shorthand API', () => {
    const query = INSERT('users', [], [PARAM('id')]);

    expect(() => query.accept(new CommonQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
    expect(() => query.accept(new SQLiteQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
  });
});