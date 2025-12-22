import { Column } from '../../src/ast/Column';
import { TableFrom } from '../../src/ast/From';
import { SelectQuery } from '../../src/ast/SelectQuery';
import { COLUMN, FROM, SELECT } from '../../src/builder/Shorthand';
import { CommonQueryValidator } from '../../src/validate/CommonQueryValidator';
import { SQLiteQueryValidator } from '../../src/validate/SQLiteQueryValidator';

const EXPECTED_ERROR_MESSAGE = "TableFrom name 'SELECT' is a reserved SQLite keyword";

describe('Validate Reserved Keyword Table', () => {

  test('Reserved keyword as table name fails', () => {
    const query = SelectQuery.create()
      .from(new TableFrom('SELECT'))
      .column(new Column('id'));

    expect(() => query.accept(new CommonQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
    expect(() => query.accept(new SQLiteQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
  });

  test('Reserved keyword as table name fails using Shorthand API', () => {
    const query = SELECT(FROM('SELECT'), COLUMN('id'));

    expect(() => query.accept(new CommonQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
    expect(() => query.accept(new SQLiteQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
  });
});