import { Alias } from '../../src/ast/Alias';
import { BinaryExpression } from '../../src/ast/BinaryExpression';
import { Column } from '../../src/ast/Column';
import { TableFrom } from '../../src/ast/From';
import { Join, JoinType } from '../../src/ast/Join';
import { Operator } from '../../src/ast/Operator';
import { SelectQuery } from '../../src/ast/SelectQuery';
import { CommonQueryValidator } from '../../src/validate/CommonQueryValidator';
import { SQLiteQueryValidator } from '../../src/validate/SQLiteQueryValidator';

const EXPECTED_ERROR_MESSAGE = 'SQLite does not support RIGHT JOIN';

describe('Validate RIGHT JOIN Failure', () => {

  test('RIGHT JOIN fails SQLite validation', () => {
    const query = SelectQuery.create()
      .from(new Alias(new TableFrom('orders'), 'o'))
      .column(new Column('id'))
      .join(
        new Join(
          JoinType.RIGHT,
          'users',
          'u',
          new BinaryExpression(
            new Column('o', 'user_id'),
            Operator.EQUALS,
            new Column('u', 'id')
          )
        )
      );

    expect(() => query.accept(new CommonQueryValidator())).not.toThrow();
    expect(() => query.accept(new SQLiteQueryValidator())).toThrow(EXPECTED_ERROR_MESSAGE);
  });

  // Note: Shorthand API does not support RIGHT_JOIN, as it’s not supported by SQLite.
  // Adding a Shorthand test would require implementing RIGHT_JOIN in Shorthand.ts,
  // which would still fail SQLite validation. Skipping to maintain API consistency.
});