import { INSERT, PARAM, COLUMN, ALIAS, FN } from '../../src/builder/Shorthand';
import { InsertQuery } from '../../src/ast/InsertQuery';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';
import { ParamCollectingVisitor } from '../../src/visitor/ParamCollector';
import { QueryIdentityTransformer } from '../../src/visitor/QueryIdentityTransformer';

describe('InsertWithReturning', () => {
  it('generates INSERT with single RETURNING column', () => {
    const query = INSERT('users', ['name', 'email'], [PARAM('name'), PARAM('email')])
      .returning(COLUMN('id'));
    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe('INSERT INTO users (name, email) VALUES (?, ?) RETURNING id');
  });

  it('generates INSERT with multiple RETURNING columns', () => {
    const query = INSERT('users', ['name', 'email'], [PARAM('name'), PARAM('email')])
      .returning(COLUMN('id'), COLUMN('created_at'), COLUMN('updated_at'));
    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe('INSERT INTO users (name, email) VALUES (?, ?) RETURNING id, created_at, updated_at');
  });

  it('generates INSERT with RETURNING * (all columns)', () => {
    const query = INSERT('users', ['name'], [PARAM('name')])
      .returning(COLUMN('*'));
    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe('INSERT INTO users (name) VALUES (?) RETURNING *');
  });

  it('generates INSERT with RETURNING aliased column', () => {
    const query = INSERT('users', ['name'], [PARAM('name')])
      .returning(ALIAS(COLUMN('id'), 'user_id'));
    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe('INSERT INTO users (name) VALUES (?) RETURNING id AS user_id');
  });

  it('generates INSERT with RETURNING function expression', () => {
    const query = INSERT('users', ['name'], [PARAM('name')])
      .returning(COLUMN('id'), ALIAS(FN('DATETIME', COLUMN('created_at')), 'created'));
    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe('INSERT INTO users (name) VALUES (?) RETURNING id, DATETIME(created_at) AS created');
  });

  it('generates INSERT OR REPLACE with RETURNING', () => {
    const query = INSERT('users', ['id', 'name'], [PARAM('id'), PARAM('name')])
      .orReplace()
      .returning(COLUMN('id'), COLUMN('name'));
    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe('INSERT OR REPLACE INTO users (id, name) VALUES (?, ?) RETURNING id, name');
  });

  it('generates indented INSERT with RETURNING', () => {
    const query = INSERT('users', ['name', 'email'], [PARAM('name'), PARAM('email')])
      .returning(COLUMN('id'), COLUMN('created_at'));
    const renderer = new IndentedQueryRenderer(2);
    const sql = query.toSQL(renderer);
    expect(sql).toBe(`INSERT
INTO users
(name, email)
VALUES
(?, ?)
RETURNING id, created_at`);
  });

  it('collects parameters from INSERT with RETURNING (no params in RETURNING)', () => {
    const query = INSERT('users', ['name', 'email'], [PARAM('name'), PARAM('email')])
      .returning(COLUMN('id'));

    const params = query.accept(new ParamCollectingVisitor({
      name: 'John',
      email: 'john@example.com'
    }));

    expect(params).toEqual(['John', 'john@example.com']);
  });

  it('transforms INSERT with RETURNING through identity transformer', () => {
    const query = INSERT('users', ['name'], [PARAM('name')])
      .returning(COLUMN('id'), COLUMN('created_at'));

    const transformer = new QueryIdentityTransformer();
    const transformed = transformer.transform(query) as InsertQuery;

    const renderer = new CompactQueryRenderer();
    expect(transformed.toSQL(renderer)).toBe(query.toSQL(renderer));
  });

  it('returns empty RETURNING clause getter when not set', () => {
    const query = INSERT('users', ['name'], [PARAM('name')]);
    expect(query.returningClause).toEqual([]);
  });

  it('returns RETURNING clause through getter', () => {
    const query = INSERT('users', ['name'], [PARAM('name')])
      .returning(COLUMN('id'));
    expect(query.returningClause).toHaveLength(1);
  });
});
