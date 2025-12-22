import { Param } from '../../src/ast/Literals';
import { QueryBuilder } from '../../src/builder/QueryBuilder';
import { INSERT, PARAM } from '../../src/builder/Shorthand';
import { CommonQueryValidator } from '../../src/validate/CommonQueryValidator';
import { SQLiteQueryValidator } from '../../src/validate/SQLiteQueryValidator';

const EXPECTED_ERROR_MESSAGE = "InsertQuery column name 'WHERE' is a reserved SQLite keyword";

describe('Validate INSERT with Reserved Keyword Column', () => {

  test('INSERT with reserved keyword as column name fails', () => {
    const query = QueryBuilder.insertInto('users')
      .columns('WHERE')
      .values(new Param('value'));

    expect(() => query.accept(new CommonQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
    expect(() => query.accept(new SQLiteQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
  });

  test('INSERT with reserved keyword as column name fails using Shorthand API', () => {
    const query = INSERT('users', ['WHERE'], [PARAM('value')]);

    expect(() => query.accept(new CommonQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
    expect(() => query.accept(new SQLiteQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
  });
});