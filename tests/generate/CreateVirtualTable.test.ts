import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';
import { CREATE_VIRTUAL_TABLE } from '../../src/builder/Shorthand';
import { CreateVirtualTableQuery } from '../../src/ast/CreateVirtualTableQuery';

describe('CreateVirtualTable', () => {
  const compact = new CompactQueryRenderer();
  const indented = new IndentedQueryRenderer(2);

  describe('Basic FTS5 tables', () => {
    it('should render basic FTS5 table', () => {
      const query = CREATE_VIRTUAL_TABLE('documents_fts', 'fts5')
        .column('title')
        .column('content');

      expect(query.accept(compact)).toBe(
        'CREATE VIRTUAL TABLE documents_fts USING fts5(title, content)'
      );
    });

    it('should render FTS5 table with single column', () => {
      const query = CREATE_VIRTUAL_TABLE('search', 'fts5')
        .column('text');

      expect(query.accept(compact)).toBe(
        'CREATE VIRTUAL TABLE search USING fts5(text)'
      );
    });

    it('should render FTS5 table with many columns', () => {
      const query = CREATE_VIRTUAL_TABLE('articles_fts', 'fts5')
        .column('title')
        .column('author')
        .column('content')
        .column('summary');

      expect(query.accept(compact)).toBe(
        'CREATE VIRTUAL TABLE articles_fts USING fts5(title, author, content, summary)'
      );
    });
  });

  describe('IF NOT EXISTS', () => {
    it('should render with IF NOT EXISTS', () => {
      const query = CREATE_VIRTUAL_TABLE('documents_fts', 'fts5')
        .column('title')
        .column('content')
        .ifNotExists();

      expect(query.accept(compact)).toBe(
        'CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(title, content)'
      );
    });
  });

  describe('FTS5 options', () => {
    it('should render with tokenize option', () => {
      const query = CREATE_VIRTUAL_TABLE('documents_fts', 'fts5')
        .column('title')
        .column('content')
        .tokenize('porter unicode61');

      expect(query.accept(compact)).toBe(
        "CREATE VIRTUAL TABLE documents_fts USING fts5(title, content, tokenize = 'porter unicode61')"
      );
    });

    it('should render with content table (external content)', () => {
      const query = CREATE_VIRTUAL_TABLE('documents_fts', 'fts5')
        .column('title')
        .column('content')
        .content('documents');

      expect(query.accept(compact)).toBe(
        "CREATE VIRTUAL TABLE documents_fts USING fts5(title, content, content = 'documents')"
      );
    });

    it('should render with content and content_rowid', () => {
      const query = CREATE_VIRTUAL_TABLE('documents_fts', 'fts5')
        .column('title')
        .column('content')
        .content('documents')
        .contentRowid('id');

      expect(query.accept(compact)).toBe(
        "CREATE VIRTUAL TABLE documents_fts USING fts5(title, content, content = 'documents', content_rowid = 'id')"
      );
    });

    it('should render with prefix option', () => {
      const query = CREATE_VIRTUAL_TABLE('documents_fts', 'fts5')
        .column('title')
        .column('content')
        .prefix('2 3');

      expect(query.accept(compact)).toBe(
        "CREATE VIRTUAL TABLE documents_fts USING fts5(title, content, prefix = '2 3')"
      );
    });

    it('should render with all options combined', () => {
      const query = CREATE_VIRTUAL_TABLE('documents_fts', 'fts5')
        .column('title')
        .column('content')
        .tokenize('porter')
        .content('documents')
        .contentRowid('rowid')
        .prefix('2 3 4')
        .ifNotExists();

      expect(query.accept(compact)).toBe(
        "CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(title, content, tokenize = 'porter', content = 'documents', content_rowid = 'rowid', prefix = '2 3 4')"
      );
    });
  });

  describe('Indented rendering', () => {
    it('should render with indentation', () => {
      const query = CREATE_VIRTUAL_TABLE('documents_fts', 'fts5')
        .column('title')
        .column('content')
        .tokenize('porter');

      const result = query.accept(indented);
      expect(result).toContain('CREATE VIRTUAL TABLE documents_fts USING fts5(');
      expect(result).toContain('title');
      expect(result).toContain('content');
      expect(result).toContain("tokenize = 'porter'");
    });
  });

  describe('Query node properties', () => {
    it('should expose table name', () => {
      const query = CREATE_VIRTUAL_TABLE('my_fts', 'fts5').column('text');
      expect(query.tableName).toBe('my_fts');
    });

    it('should expose module', () => {
      const query = CREATE_VIRTUAL_TABLE('my_fts', 'fts5').column('text');
      expect(query.module).toBe('fts5');
    });

    it('should expose columns', () => {
      const query = CREATE_VIRTUAL_TABLE('my_fts', 'fts5')
        .column('title')
        .column('content');
      expect(query.columns).toEqual(['title', 'content']);
    });

    it('should expose options', () => {
      const query = CREATE_VIRTUAL_TABLE('my_fts', 'fts5')
        .column('text')
        .tokenize('porter')
        .content('docs')
        .contentRowid('id')
        .prefix('2');

      expect(query.options.tokenize).toBe('porter');
      expect(query.options.content).toBe('docs');
      expect(query.options.contentRowid).toBe('id');
      expect(query.options.prefix).toBe('2');
    });

    it('should expose hasIfNotExists', () => {
      const query1 = CREATE_VIRTUAL_TABLE('my_fts', 'fts5').column('text');
      expect(query1.hasIfNotExists).toBe(false);

      const query2 = CREATE_VIRTUAL_TABLE('my_fts', 'fts5').column('text').ifNotExists();
      expect(query2.hasIfNotExists).toBe(true);
    });
  });

  describe('toSQL convenience method', () => {
    it('should render SQL via toSQL()', () => {
      const query = CREATE_VIRTUAL_TABLE('docs_fts', 'fts5')
        .column('title')
        .column('content');

      const sql = query.toSQL();
      expect(sql).toContain('CREATE VIRTUAL TABLE docs_fts USING fts5');
      expect(sql).toContain('title');
      expect(sql).toContain('content');
    });
  });
});
