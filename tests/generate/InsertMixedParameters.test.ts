import { NumberLiteral, Param, StringLiteral } from '../../src/ast/Literals';
import { QueryBuilder } from '../../src/builder/QueryBuilder';
import { INSERT, PARAM } from '../../src/builder/Shorthand';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';
import { ParamCollectingVisitor } from '../../src/visitor/ParamCollector';

const EXPECTED_QUERY_COMPACT = "INSERT INTO users (id, name, active) VALUES (?, 'John Doe', 1)";

const EXPECTED_QUERY_INDENTED = `
INSERT
INTO users
(id, name, active)
VALUES
(?, 'John Doe', 1)
`.trim();

describe('Insert with Mixed Parameters', () => {

  test('builds and renders INSERT with mixed parameters and literals', () => {
    const query = QueryBuilder.insertInto('users')
      .columns('id', 'name', 'active')
      .values(new Param('id'), new StringLiteral('John Doe'), new NumberLiteral(1));

    const keyValuePairs = { id: 42 };
    const paramCollector = new ParamCollectingVisitor(keyValuePairs);
    const params = query.accept(paramCollector);
    expect(params).toEqual([42]);

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });

  test('builds and renders INSERT with mixed parameters and literals using Shorthand API', () => {
    const query = INSERT('users', ['id', 'name', 'active'], [PARAM('id'), 'John Doe', 1]);

    const keyValuePairs = { id: 42 };
    const paramCollector = new ParamCollectingVisitor(keyValuePairs);
    const params = query.accept(paramCollector);
    expect(params).toEqual([42]);

    expect(query.toSQL(new IndentedQueryRenderer(2))).toBe(EXPECTED_QUERY_INDENTED);
    expect(query.toSQL(new CompactQueryRenderer())).toBe(EXPECTED_QUERY_COMPACT);
  });
});