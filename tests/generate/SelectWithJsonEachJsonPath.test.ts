import { Alias } from '../../src/ast/Alias';
import { Column } from '../../src/ast/Column';
import { JsonEachFrom } from '../../src/ast/From';
import { Param, StringLiteral } from '../../src/ast/Literals';
import { SelectQuery } from '../../src/ast/SelectQuery';
import { COLUMN, PARAM } from '../../src/builder/Shorthand';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';
import { ParamCollectingVisitor } from '../../src/visitor/ParamCollector';

const EXPECTED_QUERY_COMPACT = 'SELECT value FROM json_each(?, \'$.items\') items';

const EXPECTED_QUERY_INDENTED = `
SELECT
  value
FROM json_each(?, '$.items') items
`.trim();

describe('Select Query with json_each and JSONPath', () => {

  test('builds and renders query with json_each and JSONPath parameter', () => {
    const query = SelectQuery.create()
      .from(new Alias(
        new JsonEachFrom(new Param('jsonData'), new StringLiteral('$.items')),
        'items'
      ))
      .column(new Column('value'));

    const keyValuePairs = { jsonData: '["apple", "banana"]' };
    const paramCollector = new ParamCollectingVisitor(keyValuePairs);
    const params = query.accept(paramCollector);
    expect(params).toEqual(['["apple", "banana"]']);

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });

  test('builds and renders query with json_each and JSONPath parameter using Shorthand API', () => {
    const query = SelectQuery.create()
      .from(new Alias(
        new JsonEachFrom(PARAM('jsonData'), new StringLiteral('$.items')),
        'items'
      ))
      .column(COLUMN('value'));

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });
});