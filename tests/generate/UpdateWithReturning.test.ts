import { UPDATE, EQ, COLUMN, PARAM, ALIAS, FN } from '../../src/builder/Shorthand';
import { StringLiteral, NumberLiteral } from '../../src/ast/Literals';
import { UpdateQuery } from '../../src/ast/UpdateQuery';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';
import { ParamCollectingVisitor } from '../../src/visitor/ParamCollector';
import { QueryIdentityTransformer } from '../../src/visitor/QueryIdentityTransformer';

describe('UpdateWithReturning', () => {
  it('generates UPDATE with single RETURNING column', () => {
    const query = UPDATE('users')
      .set('status', new StringLiteral('active'))
      .where(EQ(COLUMN('id'), PARAM('userId')))
      .returning(COLUMN('id'));
    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe("UPDATE users SET status = 'active' WHERE (id = ?) RETURNING id");
  });

  it('generates UPDATE with multiple RETURNING columns', () => {
    const query = UPDATE('users')
      .set('status', new StringLiteral('active'))
      .where(EQ(COLUMN('id'), PARAM('userId')))
      .returning(COLUMN('id'), COLUMN('status'), COLUMN('updated_at'));
    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe("UPDATE users SET status = 'active' WHERE (id = ?) RETURNING id, status, updated_at");
  });

  it('generates UPDATE with RETURNING * (all columns)', () => {
    const query = UPDATE('users')
      .set('name', PARAM('name'))
      .where(EQ(COLUMN('id'), PARAM('userId')))
      .returning(COLUMN('*'));
    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe('UPDATE users SET name = ? WHERE (id = ?) RETURNING *');
  });

  it('generates UPDATE with RETURNING aliased column', () => {
    const query = UPDATE('users')
      .set('status', new StringLiteral('inactive'))
      .where(EQ(COLUMN('id'), PARAM('userId')))
      .returning(ALIAS(COLUMN('updated_at'), 'modification_time'));
    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe("UPDATE users SET status = 'inactive' WHERE (id = ?) RETURNING updated_at AS modification_time");
  });

  it('generates UPDATE with RETURNING function expression', () => {
    const query = UPDATE('users')
      .set('login_count', new NumberLiteral(1))
      .where(EQ(COLUMN('id'), PARAM('userId')))
      .returning(COLUMN('id'), ALIAS(FN('DATETIME', COLUMN('updated_at')), 'modified'));
    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe('UPDATE users SET login_count = 1 WHERE (id = ?) RETURNING id, DATETIME(updated_at) AS modified');
  });

  it('generates UPDATE without WHERE but with RETURNING', () => {
    const query = UPDATE('settings')
      .set('value', PARAM('value'))
      .returning(COLUMN('name'), COLUMN('value'));
    const renderer = new CompactQueryRenderer();
    const sql = query.toSQL(renderer);
    expect(sql).toBe('UPDATE settings SET value = ? RETURNING name, value');
  });

  it('generates indented UPDATE with RETURNING', () => {
    const query = UPDATE('users')
      .set('status', new StringLiteral('active'))
      .where(EQ(COLUMN('id'), PARAM('userId')))
      .returning(COLUMN('id'), COLUMN('updated_at'));
    const renderer = new IndentedQueryRenderer(2);
    const sql = query.toSQL(renderer);
    expect(sql).toBe(`UPDATE users
SET status = 'active'
WHERE (id = ?)
RETURNING id, updated_at`);
  });

  it('collects parameters from UPDATE with RETURNING', () => {
    const query = UPDATE('users')
      .set('name', PARAM('newName'))
      .where(EQ(COLUMN('id'), PARAM('userId')))
      .returning(COLUMN('id'));

    const params = query.accept(new ParamCollectingVisitor({
      newName: 'Jane',
      userId: 42
    }));

    expect(params).toEqual(['Jane', 42]);
  });

  it('transforms UPDATE with RETURNING through identity transformer', () => {
    const query = UPDATE('users')
      .set('status', new StringLiteral('active'))
      .where(EQ(COLUMN('id'), PARAM('userId')))
      .returning(COLUMN('id'), COLUMN('status'));

    const transformer = new QueryIdentityTransformer();
    const transformed = transformer.transform(query) as UpdateQuery;

    const renderer = new CompactQueryRenderer();
    expect(transformed.toSQL(renderer)).toBe(query.toSQL(renderer));
  });

  it('returns empty RETURNING clause getter when not set', () => {
    const query = UPDATE('users')
      .set('status', new StringLiteral('active'));
    expect(query.returningClause).toEqual([]);
  });

  it('returns RETURNING clause through getter', () => {
    const query = UPDATE('users')
      .set('status', new StringLiteral('active'))
      .returning(COLUMN('id'), COLUMN('status'));
    expect(query.returningClause).toHaveLength(2);
  });
});
