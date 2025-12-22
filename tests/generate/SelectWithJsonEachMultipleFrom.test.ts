import { Alias } from '../../src/ast/Alias';
import { BinaryExpression } from '../../src/ast/BinaryExpression';
import { Column } from '../../src/ast/Column';
import { JsonEachFrom, TableFrom } from '../../src/ast/From';
import { FunctionExpression } from '../../src/ast/FunctionExpression';
import { JoinType } from '../../src/ast/Join';
import { StringLiteral } from '../../src/ast/Literals';
import { Operator } from '../../src/ast/Operator';
import { SelectQuery } from '../../src/ast/SelectQuery';
import { COLUMN, EQ, FN, JOIN } from '../../src/builder/Shorthand';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';

const EXPECTED_QUERY_COMPACT = 'SELECT h.id, h.value FROM hanzi h, json_each(json_extract(h.data, \'$.dictionary\')) dict INNER JOIN hanzi_pinyin hp ON (h.id = hp.hanzi_id)';

const EXPECTED_QUERY_INDENTED = `
SELECT
  h.id,
  h.value
FROM hanzi h,
json_each(json_extract(h.data, '$.dictionary')) dict
INNER JOIN hanzi_pinyin hp ON (h.id = hp.hanzi_id)
`.trim();

describe('Select Query with json_each in Multiple FROM Clauses', () => {

  test('builds and renders query with json_each in multiple FROM clauses', () => {
    const query = SelectQuery.create()
      .column(new Column('h', 'id'))
      .column(new Column('h', 'value'))
      .from(new Alias(new TableFrom('hanzi'), 'h'))
      .from(new Alias(
        new JsonEachFrom(
          new FunctionExpression('json_extract', [
            new Column('h', 'data'),
            new StringLiteral('$.dictionary')
          ]),
        ),
        'dict'
      ))
      .join(
        JoinType.INNER,
        'hanzi_pinyin',
        'hp',
        new BinaryExpression(
          new Column('h', 'id'),
          Operator.EQUALS,
          new Column('hp', 'hanzi_id')
        )
      );

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });

  test('builds and renders query with json_each in multiple FROM clauses using Shorthand API', () => {
    const query = SelectQuery.create()
      .column(COLUMN('h', 'id'))
      .column(COLUMN('h', 'value'))
      .from(new Alias(new TableFrom('hanzi'), 'h'))
      .from(new Alias(
        new JsonEachFrom(
          FN('json_extract', COLUMN('h', 'data'), '$.dictionary')
        ),
        'dict'
      ))
      .join(JOIN('hanzi_pinyin', 'hp', EQ(COLUMN('h', 'id'), COLUMN('hp', 'hanzi_id'))));

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });
});