import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import {
  SELECT, FROM, COLUMN, MATCH, FN, PARAM
} from '../../src/builder/Shorthand';
import { OrderByDirection } from '../../src/ast/OrderBy';

describe('FTS5 MATCH Operator', () => {
  const compact = new CompactQueryRenderer();

  describe('Basic MATCH queries', () => {
    it('should render simple MATCH query', () => {
      const query = SELECT(FROM('documents_fts'), COLUMN('*'))
        .where(MATCH(COLUMN('documents_fts'), 'sqlite database'));

      expect(query.accept(compact)).toBe(
        "SELECT * FROM documents_fts WHERE (documents_fts MATCH 'sqlite database')"
      );
    });

    it('should render MATCH with column reference', () => {
      const query = SELECT(FROM('posts_fts'), COLUMN('title'), COLUMN('content'))
        .where(MATCH(COLUMN('posts_fts'), 'search terms'));

      expect(query.accept(compact)).toBe(
        "SELECT title, content FROM posts_fts WHERE (posts_fts MATCH 'search terms')"
      );
    });

    it('should render MATCH with parameterized query', () => {
      const query = SELECT(FROM('documents_fts'), COLUMN('*'))
        .where(MATCH(COLUMN('documents_fts'), PARAM('searchQuery')));

      expect(query.accept(compact)).toBe(
        'SELECT * FROM documents_fts WHERE (documents_fts MATCH ?)'
      );
    });
  });

  describe('FTS5 functions', () => {
    it('should render bm25 ranking function', () => {
      const query = SELECT(
        FROM('documents_fts'),
        COLUMN('title'),
        FN('bm25', COLUMN('documents_fts')).as('rank')
      )
      .where(MATCH(COLUMN('documents_fts'), 'query'))
      .orderBy(COLUMN('rank'), OrderByDirection.ASC);

      expect(query.accept(compact)).toBe(
        "SELECT title, bm25(documents_fts) AS rank FROM documents_fts WHERE (documents_fts MATCH 'query') ORDER BY rank ASC"
      );
    });

    it('should render highlight function', () => {
      const query = SELECT(
        FROM('documents_fts'),
        FN('highlight', COLUMN('documents_fts'), 0, '<b>', '</b>').as('title')
      )
      .where(MATCH(COLUMN('documents_fts'), 'query'));

      expect(query.accept(compact)).toBe(
        "SELECT highlight(documents_fts, 0, '<b>', '</b>') AS title FROM documents_fts WHERE (documents_fts MATCH 'query')"
      );
    });

    it('should render snippet function', () => {
      const query = SELECT(
        FROM('documents_fts'),
        FN('snippet', COLUMN('documents_fts'), 1, '<b>', '</b>', '...', 20).as('excerpt')
      )
      .where(MATCH(COLUMN('documents_fts'), 'query'));

      expect(query.accept(compact)).toBe(
        "SELECT snippet(documents_fts, 1, '<b>', '</b>', '...', 20) AS excerpt FROM documents_fts WHERE (documents_fts MATCH 'query')"
      );
    });
  });

  describe('Combined FTS5 queries', () => {
    it('should render query with ranking and highlighting', () => {
      const query = SELECT(
        FROM('articles_fts'),
        FN('highlight', COLUMN('articles_fts'), 0, '<mark>', '</mark>').as('title'),
        FN('snippet', COLUMN('articles_fts'), 1, '<mark>', '</mark>', '...', 30).as('excerpt'),
        FN('bm25', COLUMN('articles_fts')).as('relevance')
      )
      .where(MATCH(COLUMN('articles_fts'), PARAM('searchTerm')))
      .orderBy(COLUMN('relevance'), OrderByDirection.ASC);

      const sql = query.accept(compact);
      expect(sql).toContain('highlight(articles_fts, 0,');
      expect(sql).toContain('snippet(articles_fts, 1,');
      expect(sql).toContain('bm25(articles_fts) AS relevance');
      expect(sql).toContain('(articles_fts MATCH ?)');
      expect(sql).toContain('ORDER BY relevance ASC');
    });
  });
});
