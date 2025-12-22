import { Alias } from '../../src/ast/Alias';
import { Column } from '../../src/ast/Column';
import { JsonEachFrom } from '../../src/ast/From';
import { SelectQuery } from '../../src/ast/SelectQuery';
import { COLUMN } from '../../src/builder/Shorthand';
import { CommonQueryValidator } from '../../src/validate/CommonQueryValidator';
import { SQLiteQueryValidator } from '../../src/validate/SQLiteQueryValidator';

const EXPECTED_ERROR_MESSAGE = "Alias 'SELECT' in JsonEachFrom is a reserved SQLite keyword";

describe('Validate json_each with Reserved Keyword Alias', () => {

  test('json_each with reserved keyword alias fails', () => {
    const query = SelectQuery.create()
      .from(new Alias(new JsonEachFrom(new Column('data')), 'SELECT'))
      .column(new Column('value'));

    expect(() => query.accept(new CommonQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
    expect(() => query.accept(new SQLiteQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
  });

  test('json_each with reserved keyword alias fails using Shorthand API', () => {
    const query = SelectQuery.create()
      .from(new Alias(new JsonEachFrom(COLUMN('data')), 'SELECT'))
      .column(COLUMN('value'));

    expect(() => query.accept(new CommonQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
    expect(() => query.accept(new SQLiteQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
  });
});