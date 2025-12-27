import { CommonQueryValidator } from '../../src/validate/CommonQueryValidator';
import { SQLiteQueryValidator } from '../../src/validate/SQLiteQueryValidator';
import { CREATE_VIRTUAL_TABLE } from '../../src/builder/Shorthand';

describe('Validate CreateVirtualTable', () => {
  describe('CommonQueryValidator', () => {
    const validator = new CommonQueryValidator();

    it('should validate basic FTS5 table', () => {
      const query = CREATE_VIRTUAL_TABLE('documents_fts', 'fts5')
        .column('title')
        .column('content');

      expect(() => validator.validate(query)).not.toThrow();
    });

    it('should reject table with no columns', () => {
      const query = CREATE_VIRTUAL_TABLE('documents_fts', 'fts5');

      expect(() => validator.validate(query)).toThrow('must have at least one column');
    });

    it('should reject empty column name', () => {
      const query = CREATE_VIRTUAL_TABLE('documents_fts', 'fts5')
        .column('');

      expect(() => validator.validate(query)).toThrow('cannot be empty');
    });

    it('should reject reserved keyword as column name', () => {
      const query = CREATE_VIRTUAL_TABLE('documents_fts', 'fts5')
        .column('SELECT');

      expect(() => validator.validate(query)).toThrow('reserved');
    });

    it('should reject reserved keyword as table name', () => {
      const query = CREATE_VIRTUAL_TABLE('SELECT', 'fts5')
        .column('content');

      expect(() => validator.validate(query)).toThrow('reserved');
    });
  });

  describe('SQLiteQueryValidator', () => {
    const validator = new SQLiteQueryValidator();

    it('should validate basic FTS5 table', () => {
      const query = CREATE_VIRTUAL_TABLE('documents_fts', 'fts5')
        .column('title')
        .column('content');

      expect(() => validator.validate(query)).not.toThrow();
    });

    it('should validate FTS5 table with content option', () => {
      const query = CREATE_VIRTUAL_TABLE('documents_fts', 'fts5')
        .column('title')
        .column('content')
        .content('documents');

      expect(() => validator.validate(query)).not.toThrow();
    });

    it('should validate FTS5 table with content and content_rowid', () => {
      const query = CREATE_VIRTUAL_TABLE('documents_fts', 'fts5')
        .column('title')
        .content('documents')
        .contentRowid('id');

      expect(() => validator.validate(query)).not.toThrow();
    });

    it('should reject content_rowid without content', () => {
      const query = CREATE_VIRTUAL_TABLE('documents_fts', 'fts5')
        .column('title')
        .contentRowid('id');

      expect(() => validator.validate(query)).toThrow('content_rowid requires content');
    });

    it('should validate FTS5 table with all options', () => {
      const query = CREATE_VIRTUAL_TABLE('documents_fts', 'fts5')
        .column('title')
        .column('content')
        .tokenize('porter unicode61')
        .content('documents')
        .contentRowid('id')
        .prefix('2 3')
        .ifNotExists();

      expect(() => validator.validate(query)).not.toThrow();
    });
  });
});
