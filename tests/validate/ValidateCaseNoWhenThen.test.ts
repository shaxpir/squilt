import { Alias } from '../../src/ast/Alias';
import { CaseExpression } from '../../src/ast/CaseExpression';
import { TableFrom } from '../../src/ast/From';
import { SelectQuery } from '../../src/ast/SelectQuery';
import { CASE, FROM, SELECT } from '../../src/builder/Shorthand';
import { CommonQueryValidator } from '../../src/validate/CommonQueryValidator';
import { SQLiteQueryValidator } from '../../src/validate/SQLiteQueryValidator';

const EXPECTED_ERROR_MESSAGE = 'CaseExpression must have at least one WHEN/THEN pair';

const EXPECTED_QUERY_COMPACT = '';

const EXPECTED_QUERY_INDENTED = `
`.trim();

describe('Validate CASE with No WHEN/THEN Pairs', () => {
  let commonValidator: CommonQueryValidator;
  let sqliteValidator: SQLiteQueryValidator;

  beforeEach(() => {
    commonValidator = new CommonQueryValidator();
    sqliteValidator = new SQLiteQueryValidator();
  });

  test('CASE with no WHEN/THEN pairs fails', () => {
    const query = SelectQuery.create()
      .from(new TableFrom('users'))
      .column(new CaseExpression([]).as('invalid_case'));

    expect(() => query.accept(new CommonQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
    expect(() => query.accept(new SQLiteQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
  });

  test('CASE with no WHEN/THEN pairs fails using Shorthand API', () => {
    const query = SELECT(
      FROM('users'),
      CASE([]).as('invalid_case')
    );

    expect(() => query.accept(new CommonQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
    expect(() => query.accept(new SQLiteQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
  });
});