import { Param } from '../../src/ast/Literals';
import { QueryBuilder } from '../../src/builder/QueryBuilder';
import { INSERT, PARAM } from '../../src/builder/Shorthand';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';
import { ParamCollectingVisitor } from '../../src/visitor/ParamCollector';

const EXPECTED_QUERY_COMPACT = 'INSERT INTO user_dictionary (id, data) VALUES (?, ?)';

const EXPECTED_QUERY_INDENTED = `
INSERT
INTO user_dictionary
(id, data)
VALUES
(?, ?)
`.trim();

describe('Insert Simple Query', () => {

  test('builds and renders simple INSERT query with named parameters', () => {
    const query = QueryBuilder.insertInto('user_dictionary')
      .columns('id', 'data')
      .values(new Param('id'), new Param('data'));

    const keyValuePairs = { id: 1, data: '{"word": "example"}' };
    const paramCollector = new ParamCollectingVisitor(keyValuePairs);
    const params = query.accept(paramCollector);
    expect(params).toEqual([1, '{"word": "example"}']);

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });

  test('builds and renders simple INSERT query with named parameters using Shorthand API', () => {
    const query = INSERT('user_dictionary', ['id', 'data'], [PARAM('id'), PARAM('data')]);

    const keyValuePairs = { id: 1, data: '{"word": "example"}' };
    const paramCollector = new ParamCollectingVisitor(keyValuePairs);
    const params = query.accept(paramCollector);
    expect(params).toEqual([1, '{"word": "example"}']);

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });
});