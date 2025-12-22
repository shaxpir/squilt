import { Param } from '../../src/ast/Literals';
import { QueryBuilder } from '../../src/builder/QueryBuilder';
import { INSERT, PARAM } from '../../src/builder/Shorthand';
import { CommonQueryValidator } from '../../src/validate/CommonQueryValidator';
import { SQLiteQueryValidator } from '../../src/validate/SQLiteQueryValidator';

const EXPECTED_ERROR_MESSAGE = "InsertQuery name 'SELECT' is a reserved SQLite keyword";

describe('Validate INSERT with Reserved Keyword Table', () => {

  test('INSERT with reserved keyword as table name fails', () => {
    const query = QueryBuilder.insertInto('SELECT')
      .columns('id')
      .values(new Param('id'));

    expect(() => query.accept(new CommonQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
    expect(() => query.accept(new SQLiteQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
  });

  test('INSERT with reserved keyword as table name fails using Shorthand API', () => {
    const query = INSERT('SELECT', ['id'], [PARAM('id')]);

    expect(() => query.accept(new CommonQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
    expect(() => query.accept(new SQLiteQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
  });
});