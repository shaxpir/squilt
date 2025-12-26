import { INSERT, PARAM, COLUMN, EQ, AND } from '../../src/builder/Shorthand';
import { InsertQuery } from '../../src/ast/InsertQuery';
import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';
import { ParamCollectingVisitor } from '../../src/visitor/ParamCollector';
import { QueryIdentityTransformer } from '../../src/visitor/QueryIdentityTransformer';
import { CommonQueryValidator } from '../../src/validate/CommonQueryValidator';

describe('InsertWithUpsert', () => {
  describe('DO UPDATE', () => {
    it('generates simple ON CONFLICT DO UPDATE', () => {
      const query = INSERT('users', ['id', 'name', 'email'], [PARAM('id'), PARAM('name'), PARAM('email')])
        .onConflict('id')
        .doUpdate({ name: PARAM('name'), email: PARAM('email') });

      const renderer = new CompactQueryRenderer();
      const sql = query.toSQL(renderer);
      expect(sql).toBe('INSERT INTO users (id, name, email) VALUES (?, ?, ?) ON CONFLICT (id) DO UPDATE SET name = ?, email = ?');
    });

    it('generates ON CONFLICT with multiple conflict columns', () => {
      const query = INSERT('user_roles', ['user_id', 'role_id', 'assigned_at'], [PARAM('userId'), PARAM('roleId'), PARAM('now')])
        .onConflict('user_id', 'role_id')
        .doUpdate({ assigned_at: PARAM('now') });

      const renderer = new CompactQueryRenderer();
      const sql = query.toSQL(renderer);
      expect(sql).toBe('INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES (?, ?, ?) ON CONFLICT (user_id, role_id) DO UPDATE SET assigned_at = ?');
    });

    it('generates ON CONFLICT with single column update', () => {
      const query = INSERT('counters', ['counter_key', 'value'], [PARAM('key'), PARAM('value')])
        .onConflict('counter_key')
        .doUpdate({ value: PARAM('newValue') });

      const renderer = new CompactQueryRenderer();
      const sql = query.toSQL(renderer);
      expect(sql).toBe('INSERT INTO counters (counter_key, value) VALUES (?, ?) ON CONFLICT (counter_key) DO UPDATE SET value = ?');
    });

    it('generates ON CONFLICT with WHERE clause', () => {
      const query = INSERT('users', ['id', 'name', 'status'], [PARAM('id'), PARAM('name'), PARAM('status')])
        .onConflict('id')
        .onConflictWhere(EQ(COLUMN('status'), 'active'))
        .doUpdate({ name: PARAM('name') });

      const renderer = new CompactQueryRenderer();
      const sql = query.toSQL(renderer);
      expect(sql).toBe("INSERT INTO users (id, name, status) VALUES (?, ?, ?) ON CONFLICT (id) WHERE (status = 'active') DO UPDATE SET name = ?");
    });

    it('generates ON CONFLICT with complex WHERE clause', () => {
      const query = INSERT('records', ['id', 'data', 'version'], [PARAM('id'), PARAM('data'), PARAM('version')])
        .onConflict('id')
        .onConflictWhere(AND(
          EQ(COLUMN('active'), true),
          EQ(COLUMN('locked'), false)
        ))
        .doUpdate({ data: PARAM('data'), version: PARAM('version') });

      const renderer = new CompactQueryRenderer();
      const sql = query.toSQL(renderer);
      expect(sql).toBe('INSERT INTO records (id, data, version) VALUES (?, ?, ?) ON CONFLICT (id) WHERE ((active = 1) AND (locked = 0)) DO UPDATE SET data = ?, version = ?');
    });
  });

  describe('DO NOTHING', () => {
    it('generates simple ON CONFLICT DO NOTHING', () => {
      const query = INSERT('events', ['id', 'data'], [PARAM('id'), PARAM('data')])
        .onConflict('id')
        .doNothing();

      const renderer = new CompactQueryRenderer();
      const sql = query.toSQL(renderer);
      expect(sql).toBe('INSERT INTO events (id, data) VALUES (?, ?) ON CONFLICT (id) DO NOTHING');
    });

    it('generates ON CONFLICT DO NOTHING with multiple columns', () => {
      const query = INSERT('unique_pairs', ['a', 'b', 'value'], [PARAM('a'), PARAM('b'), PARAM('value')])
        .onConflict('a', 'b')
        .doNothing();

      const renderer = new CompactQueryRenderer();
      const sql = query.toSQL(renderer);
      expect(sql).toBe('INSERT INTO unique_pairs (a, b, value) VALUES (?, ?, ?) ON CONFLICT (a, b) DO NOTHING');
    });
  });

  describe('with RETURNING', () => {
    it('generates ON CONFLICT DO UPDATE with RETURNING', () => {
      const query = INSERT('users', ['id', 'name'], [PARAM('id'), PARAM('name')])
        .onConflict('id')
        .doUpdate({ name: PARAM('name') })
        .returning(COLUMN('id'), COLUMN('name'), COLUMN('updated_at'));

      const renderer = new CompactQueryRenderer();
      const sql = query.toSQL(renderer);
      expect(sql).toBe('INSERT INTO users (id, name) VALUES (?, ?) ON CONFLICT (id) DO UPDATE SET name = ? RETURNING id, name, updated_at');
    });

    it('generates ON CONFLICT DO NOTHING with RETURNING', () => {
      const query = INSERT('logs', ['id', 'message'], [PARAM('id'), PARAM('message')])
        .onConflict('id')
        .doNothing()
        .returning(COLUMN('id'));

      const renderer = new CompactQueryRenderer();
      const sql = query.toSQL(renderer);
      expect(sql).toBe('INSERT INTO logs (id, message) VALUES (?, ?) ON CONFLICT (id) DO NOTHING RETURNING id');
    });
  });

  describe('indented rendering', () => {
    it('renders ON CONFLICT DO UPDATE with proper indentation', () => {
      const query = INSERT('users', ['id', 'name'], [PARAM('id'), PARAM('name')])
        .onConflict('id')
        .doUpdate({ name: PARAM('name') });

      const renderer = new IndentedQueryRenderer(2);
      const sql = query.toSQL(renderer);
      expect(sql).toContain('INSERT');
      expect(sql).toContain('INTO users');
      expect(sql).toContain('ON CONFLICT (id)');
      expect(sql).toContain('DO UPDATE SET');
    });

    it('renders ON CONFLICT DO NOTHING with proper indentation', () => {
      const query = INSERT('events', ['id'], [PARAM('id')])
        .onConflict('id')
        .doNothing();

      const renderer = new IndentedQueryRenderer(2);
      const sql = query.toSQL(renderer);
      expect(sql).toContain('ON CONFLICT (id) DO NOTHING');
    });

    it('renders ON CONFLICT with WHERE clause indented', () => {
      const query = INSERT('users', ['id', 'name'], [PARAM('id'), PARAM('name')])
        .onConflict('id')
        .onConflictWhere(EQ(COLUMN('active'), true))
        .doUpdate({ name: PARAM('name') });

      const renderer = new IndentedQueryRenderer(2);
      const sql = query.toSQL(renderer);
      expect(sql).toContain('ON CONFLICT (id) WHERE');
      expect(sql).toContain('DO UPDATE SET');
    });
  });

  describe('parameter collection', () => {
    it('collects parameters from VALUES and DO UPDATE', () => {
      const query = INSERT('users', ['id', 'name', 'email'], [PARAM('id'), PARAM('name'), PARAM('email')])
        .onConflict('id')
        .doUpdate({ name: PARAM('updateName'), email: PARAM('updateEmail') });

      const params = query.accept(new ParamCollectingVisitor({
        id: 1,
        name: 'John',
        email: 'john@example.com',
        updateName: 'John Updated',
        updateEmail: 'john.updated@example.com'
      }));
      expect(params).toEqual([1, 'John', 'john@example.com', 'John Updated', 'john.updated@example.com']);
    });

    it('collects parameters from ON CONFLICT WHERE clause', () => {
      const query = INSERT('users', ['id', 'name'], [PARAM('id'), PARAM('name')])
        .onConflict('id')
        .onConflictWhere(EQ(COLUMN('version'), PARAM('minVersion')))
        .doUpdate({ name: PARAM('updateName') });

      const params = query.accept(new ParamCollectingVisitor({
        id: 1,
        name: 'Test',
        minVersion: 5,
        updateName: 'Updated'
      }));
      expect(params).toEqual([1, 'Test', 'Updated', 5]);
    });

    it('collects parameters for DO NOTHING (only VALUES params)', () => {
      const query = INSERT('events', ['id', 'data'], [PARAM('id'), PARAM('data')])
        .onConflict('id')
        .doNothing();

      const params = query.accept(new ParamCollectingVisitor({
        id: 42,
        data: 'event data'
      }));
      expect(params).toEqual([42, 'event data']);
    });
  });

  describe('identity transformation', () => {
    it('transforms ON CONFLICT DO UPDATE correctly', () => {
      const query = INSERT('users', ['id', 'name'], [PARAM('id'), PARAM('name')])
        .onConflict('id')
        .doUpdate({ name: PARAM('name') });

      const transformer = new QueryIdentityTransformer();
      const transformed = transformer.transform(query) as InsertQuery;

      const renderer = new CompactQueryRenderer();
      expect(transformed.toSQL(renderer)).toBe(query.toSQL(renderer));
    });

    it('transforms ON CONFLICT DO NOTHING correctly', () => {
      const query = INSERT('events', ['id'], [PARAM('id')])
        .onConflict('id')
        .doNothing();

      const transformer = new QueryIdentityTransformer();
      const transformed = transformer.transform(query) as InsertQuery;

      const renderer = new CompactQueryRenderer();
      expect(transformed.toSQL(renderer)).toBe(query.toSQL(renderer));
    });

    it('transforms ON CONFLICT with WHERE correctly', () => {
      const query = INSERT('users', ['id', 'name'], [PARAM('id'), PARAM('name')])
        .onConflict('id')
        .onConflictWhere(EQ(COLUMN('active'), true))
        .doUpdate({ name: PARAM('name') });

      const transformer = new QueryIdentityTransformer();
      const transformed = transformer.transform(query) as InsertQuery;

      const renderer = new CompactQueryRenderer();
      expect(transformed.toSQL(renderer)).toBe(query.toSQL(renderer));
    });
  });

  describe('validation', () => {
    it('validates ON CONFLICT DO UPDATE successfully', () => {
      const query = INSERT('users', ['id', 'name'], [PARAM('id'), PARAM('name')])
        .onConflict('id')
        .doUpdate({ name: PARAM('name') });

      const validator = new CommonQueryValidator();
      expect(() => validator.validate(query)).not.toThrow();
    });

    it('validates ON CONFLICT DO NOTHING successfully', () => {
      const query = INSERT('events', ['id'], [PARAM('id')])
        .onConflict('id')
        .doNothing();

      const validator = new CommonQueryValidator();
      expect(() => validator.validate(query)).not.toThrow();
    });

    it('rejects ON CONFLICT with both OR REPLACE', () => {
      const query = INSERT('users', ['id', 'name'], [PARAM('id'), PARAM('name')])
        .onConflict('id')
        .doNothing();
      query['_orReplace'] = true;

      const validator = new CommonQueryValidator();
      expect(() => validator.validate(query)).toThrow('InsertQuery cannot use both OR REPLACE and ON CONFLICT');
    });

    it('rejects ON CONFLICT without DO UPDATE or DO NOTHING', () => {
      const query = INSERT('users', ['id', 'name'], [PARAM('id'), PARAM('name')])
        .onConflict('id');
      // Neither doUpdate nor doNothing called

      const validator = new CommonQueryValidator();
      expect(() => validator.validate(query)).toThrow('ON CONFLICT must specify either DO UPDATE or DO NOTHING');
    });

    it('rejects DO UPDATE without ON CONFLICT columns', () => {
      const query = INSERT('users', ['id', 'name'], [PARAM('id'), PARAM('name')])
        .doUpdate({ name: PARAM('name') });

      const validator = new CommonQueryValidator();
      expect(() => validator.validate(query)).toThrow('DO UPDATE or DO NOTHING requires ON CONFLICT columns');
    });

    it('rejects DO NOTHING without ON CONFLICT columns', () => {
      const query = INSERT('events', ['id'], [PARAM('id')])
        .doNothing();

      const validator = new CommonQueryValidator();
      expect(() => validator.validate(query)).toThrow('DO UPDATE or DO NOTHING requires ON CONFLICT columns');
    });

    it('rejects both DO UPDATE and DO NOTHING', () => {
      const query = INSERT('users', ['id', 'name'], [PARAM('id'), PARAM('name')])
        .onConflict('id')
        .doUpdate({ name: PARAM('name') })
        .doNothing();

      const validator = new CommonQueryValidator();
      expect(() => validator.validate(query)).toThrow('ON CONFLICT cannot have both DO UPDATE and DO NOTHING');
    });
  });

  describe('getter methods', () => {
    it('returns conflict columns via getter', () => {
      const query = INSERT('users', ['id', 'name'], [PARAM('id'), PARAM('name')])
        .onConflict('id', 'email');

      expect(query.onConflictColumns).toEqual(['id', 'email']);
    });

    it('returns DO UPDATE clauses via getter', () => {
      const query = INSERT('users', ['id', 'name'], [PARAM('id'), PARAM('name')])
        .onConflict('id')
        .doUpdate({ name: PARAM('name'), status: PARAM('status') });

      expect(query.doUpdateClauses).toHaveLength(2);
      expect(query.doUpdateClauses[0].column).toBe('name');
      expect(query.doUpdateClauses[1].column).toBe('status');
    });

    it('returns isDoNothing flag via getter', () => {
      const query = INSERT('events', ['id'], [PARAM('id')])
        .onConflict('id')
        .doNothing();

      expect(query.isDoNothing).toBe(true);
    });

    it('returns conflictWhere via getter', () => {
      const whereExpr = EQ(COLUMN('active'), true);
      const query = INSERT('users', ['id', 'name'], [PARAM('id'), PARAM('name')])
        .onConflict('id')
        .onConflictWhere(whereExpr)
        .doUpdate({ name: PARAM('name') });

      expect(query.conflictWhere).toBe(whereExpr);
    });
  });
});
