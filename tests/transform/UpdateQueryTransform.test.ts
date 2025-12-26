import { UPDATE, EQ, COLUMN, PARAM, AND } from '../../src/builder/Shorthand';
import { QueryIdentityTransformer } from '../../src/visitor/QueryIdentityTransformer';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { StringLiteral, NumberLiteral } from '../../src/ast/Literals';
import { UpdateQuery } from '../../src/ast/UpdateQuery';

describe('UpdateQueryTransform', () => {
  it('transforms a simple UPDATE query', () => {
    const query = UPDATE('users')
      .set('name', new StringLiteral('John'));

    const transformer = new QueryIdentityTransformer();
    const cloned = transformer.transform(query) as UpdateQuery;

    expect(cloned).not.toBe(query);
    expect(cloned).toBeInstanceOf(UpdateQuery);

    const renderer = new CompactQueryRenderer();
    expect(cloned.toSQL(renderer)).toBe(query.toSQL(renderer));
  });

  it('transforms UPDATE with multiple SET clauses', () => {
    const query = UPDATE('users')
      .set('name', new StringLiteral('John'))
      .set('age', new NumberLiteral(30))
      .set('active', new NumberLiteral(1));

    const transformer = new QueryIdentityTransformer();
    const cloned = transformer.transform(query) as UpdateQuery;

    expect(cloned).not.toBe(query);
    const renderer = new CompactQueryRenderer();
    expect(cloned.toSQL(renderer)).toBe(query.toSQL(renderer));
  });

  it('transforms UPDATE with WHERE clause', () => {
    const query = UPDATE('users')
      .set('status', new StringLiteral('active'))
      .where(EQ(COLUMN('id'), PARAM('userId')));

    const transformer = new QueryIdentityTransformer();
    const cloned = transformer.transform(query) as UpdateQuery;

    expect(cloned).not.toBe(query);
    const renderer = new CompactQueryRenderer();
    expect(cloned.toSQL(renderer)).toBe(query.toSQL(renderer));
  });

  it('transforms UPDATE with complex WHERE', () => {
    const query = UPDATE('users')
      .set('verified', new NumberLiteral(1))
      .set('last_check', new StringLiteral('2025-01-01'))
      .where(AND(
        EQ(COLUMN('status'), 'pending'),
        EQ(COLUMN('type'), 'user')
      ));

    const transformer = new QueryIdentityTransformer();
    const cloned = transformer.transform(query) as UpdateQuery;

    expect(cloned).not.toBe(query);
    const renderer = new CompactQueryRenderer();
    expect(cloned.toSQL(renderer)).toBe(query.toSQL(renderer));
  });

  it('creates independent copies of SET expressions', () => {
    const originalValue = new StringLiteral('original');
    const query = UPDATE('users')
      .set('name', originalValue);

    const transformer = new QueryIdentityTransformer();
    const cloned = transformer.transform(query) as UpdateQuery;

    // Modifying original should not affect cloned
    expect(cloned.setClause[0].value).not.toBe(originalValue);
  });
});
