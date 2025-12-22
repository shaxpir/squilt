import { Column } from '../../src/ast/Column';
import { TableFrom } from '../../src/ast/From';
import { SelectQuery } from '../../src/ast/SelectQuery';
import { COLUMN, FROM, SELECT } from '../../src/builder/Shorthand';
import { CommonQueryValidator } from '../../src/validate/CommonQueryValidator';
import { SQLiteQueryValidator } from '../../src/validate/SQLiteQueryValidator';

const EXPECTED_ERROR_MESSAGE = 'UNION queries must have the same number of columns';

describe('Validate UNION with Mismatched Columns', () => {

  test('UNION with mismatched column counts fails', () => {
    const query1 = SelectQuery.create()
      .from(new TableFrom('users'))
      .column(new Column('name'))
      .column(new Column('id'));

    const query2 = SelectQuery.create()
      .from(new TableFrom('users'))
      .column(new Column('name'));

    const query = query1.union(query2);

    expect(() => query.accept(new CommonQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
    expect(() => query.accept(new SQLiteQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
  });

  test('UNION with mismatched column counts fails using Shorthand API', () => {
    const query1 = SELECT(FROM('users'), COLUMN('name'), COLUMN('id'));

    const query2 = SELECT(FROM('users'), COLUMN('name'));

    const query = query1.union(query2);

    expect(() => query.accept(new CommonQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
    expect(() => query.accept(new SQLiteQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
  });
});