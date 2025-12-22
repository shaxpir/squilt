import { Column } from '../../src/ast/Column';
import { TableFrom } from '../../src/ast/From';
import { SelectQuery } from '../../src/ast/SelectQuery';
import { COLUMN, FROM, SELECT } from '../../src/builder/Shorthand';
import { CommonQueryValidator } from '../../src/validate/CommonQueryValidator';
import { SQLiteQueryValidator } from '../../src/validate/SQLiteQueryValidator';

const EXPECTED_ERROR_MESSAGE = 'A query with UNION subqueries must have columns and a FROM clause in the main query';

describe('Validate UNION with Mismatched Columns', () => {

  test('Invalid UNION construction fails validation', () => {
    const query1 = SelectQuery.create().from(new TableFrom('table1')).column(new Column('a'));
    const query2 = SelectQuery.create().from(new TableFrom('table2')).column(new Column('c'));
    const query = SelectQuery.create().union(query1).union(query2);

    expect(() => query.accept(new CommonQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
    expect(() => query.accept(new SQLiteQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
  });

  test('Invalid UNION construction fails validation with Shorthand API', () => {

    const query = SELECT()
      .union(SELECT(FROM('table1'), COLUMN('a')))
      .union(SELECT(FROM('table2'), COLUMN('c')))

    expect(() => query.accept(new CommonQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
    expect(() => query.accept(new SQLiteQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
  });
});