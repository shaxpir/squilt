import { Alias } from '../../src/ast/Alias';
import { BinaryExpression } from '../../src/ast/BinaryExpression';
import { CaseExpression } from '../../src/ast/CaseExpression';
import { Column } from '../../src/ast/Column';
import { Concat } from '../../src/ast/Concat';
import { TableFrom } from '../../src/ast/From';
import { NumberLiteral, StringLiteral } from '../../src/ast/Literals';
import { Operator } from '../../src/ast/Operator';
import { SelectQuery } from '../../src/ast/SelectQuery';
import { CASE, COLUMN, CONCAT, FROM, GT, LTE, SELECT } from '../../src/builder/Shorthand';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';

const EXPECTED_QUERY_COMPACT = `SELECT CASE WHEN (u.age > 18) THEN 'adult' WHEN (u.age <= 18) THEN 'minor' ELSE 'unknown' END AS age_group, ('Mr. ' || u.name) AS greeting FROM users u`;

const EXPECTED_QUERY_INDENTED = `
SELECT
  CASE
    WHEN (u.age > 18) THEN 'adult'
    WHEN (u.age <= 18) THEN 'minor'
    ELSE 'unknown'
  END AS age_group,
  ('Mr. ' || u.name) AS greeting
FROM users u
`.trim();

describe('Select Query with CASE and CONCAT', () => {

  test('builds and renders query with CASE and CONCAT expressions and quoted identifiers', () => {
    const query = SelectQuery.create()
      .from(new Alias(new TableFrom('users'), 'u'))
      .column(
        new Alias(
          new CaseExpression(
            [
              {
                when: new BinaryExpression(
                  new Column('u', 'age'),
                  Operator.GREATER_THAN,
                  new NumberLiteral(18)
                ),
                then: new StringLiteral('adult'),
              },
              {
                when: new BinaryExpression(
                  new Column('u', 'age'),
                  Operator.LESS_THAN_OR_EQUAL,
                  new NumberLiteral(18)
                ),
                then: new StringLiteral('minor'),
              },
            ],
            new StringLiteral('unknown')
          ),
          'age_group'
        )
      )
      .column(
        new Alias(
          new Concat(new StringLiteral('Mr. '), new Column('u', 'name')),
          'greeting'
        )
      );

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });

  test('builds and renders query with CASE and CONCAT expressions and quoted identifiers using Shorthand API', () => {
    const query = SELECT(
      FROM('users').as('u'),
      CASE([
        { WHEN: GT(COLUMN('u', 'age'), 18), THEN: 'adult' },
        { WHEN: LTE(COLUMN('u', 'age'), 18), THEN: 'minor' },
        { ELSE: 'unknown' },
      ]).as('age_group'),
      CONCAT('Mr. ', COLUMN('u', 'name')).as('greeting')
    );

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });
});