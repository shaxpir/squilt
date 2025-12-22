import { Alias } from '../../src/ast/Alias';
import { Column } from '../../src/ast/Column';
import { ExistsExpression } from '../../src/ast/ExistsExpression';
import { TableFrom } from '../../src/ast/From';
import { NumberLiteral } from '../../src/ast/Literals';
import { SelectQuery } from '../../src/ast/SelectQuery';
import { COLUMN, EXISTS, FROM, SELECT, VAL } from '../../src/builder/Shorthand';
import { CommonQueryValidator } from '../../src/validate/CommonQueryValidator';
import { SQLiteQueryValidator } from '../../src/validate/SQLiteQueryValidator';

const EXPECTED_ERROR_MESSAGE = 'ExistsExpression must have a valid subquery';

describe('Validate Select Query with EXISTS', () => {
  let commonValidator: CommonQueryValidator;
  let sqliteValidator: SQLiteQueryValidator;

  beforeEach(() => {
    commonValidator = new CommonQueryValidator();
    sqliteValidator = new SQLiteQueryValidator();
  });

  test('valid query with EXISTS passes both validators', () => {
    const subquery = SelectQuery.create()
      .from(new TableFrom('inventory'))
      .column(new NumberLiteral(1));

    const query = SelectQuery.create()
      .from(new Alias(new TableFrom('products'), 'p'))
      .column(new Column('name'))
      .where(new ExistsExpression(subquery));

    expect(() => query.accept(commonValidator)).not.toThrow();
    expect(() => query.accept(sqliteValidator)).not.toThrow();
  });

  test('valid query with EXISTS passes both validators using Shorthand API', () => {
    const subquery = SELECT(FROM('inventory'), VAL(1));

    const query = SELECT(
      FROM('products').as('p'),
      COLUMN('name')
    ).where(EXISTS(subquery));

    expect(() => query.accept(commonValidator)).not.toThrow();
    expect(() => query.accept(sqliteValidator)).not.toThrow();
  });

  test('EXISTS with null subquery fails validation', () => {
    const query = SelectQuery.create()
      .from(new Alias(new TableFrom('products'), 'p'))
      .column(new Column('name'))
      .where(new ExistsExpression(null as any));

    expect(() => query.accept(commonValidator)).toThrow(EXPECTED_ERROR_MESSAGE);
    expect(() => query.accept(sqliteValidator)).toThrow(EXPECTED_ERROR_MESSAGE);
  });
});