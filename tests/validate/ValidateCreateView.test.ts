import { CommonQueryValidator } from "../../src/validate/CommonQueryValidator";
import { CREATE_VIEW, SELECT, FROM, COLUMN, EQ, VAL } from "../../src/builder/Shorthand";

describe('ValidateCreateView', () => {
  const validator = new CommonQueryValidator();

  describe('basic validation', () => {
    it('should validate a simple CREATE VIEW', () => {
      const query = CREATE_VIEW('my_view')
        .as(SELECT(FROM('users'), COLUMN('*')));

      expect(() => validator.validate(query)).not.toThrow();
    });

    it('should validate CREATE VIEW with IF NOT EXISTS', () => {
      const query = CREATE_VIEW('my_view')
        .ifNotExists()
        .as(SELECT(FROM('users'), COLUMN('*')));

      expect(() => validator.validate(query)).not.toThrow();
    });

    it('should validate CREATE TEMPORARY VIEW', () => {
      const query = CREATE_VIEW('temp_view')
        .temporary()
        .as(SELECT(FROM('data'), COLUMN('*')));

      expect(() => validator.validate(query)).not.toThrow();
    });
  });

  describe('missing SELECT query', () => {
    it('should fail when no SELECT query is provided', () => {
      const query = CREATE_VIEW('my_view');

      expect(() => validator.validate(query)).toThrow('CreateViewQuery must have a SELECT query');
    });
  });

  describe('reserved keyword validation', () => {
    it('should fail with reserved keyword as view name', () => {
      const query = CREATE_VIEW('SELECT')
        .as(SELECT(FROM('data'), COLUMN('*')));

      expect(() => validator.validate(query)).toThrow("'SELECT' is a reserved SQLite keyword");
    });

    it('should fail with reserved keyword as column name', () => {
      const query = CREATE_VIEW('my_view')
        .withColumns('id', 'SELECT')
        .as(SELECT(FROM('data'), COLUMN('a'), COLUMN('b')));

      expect(() => validator.validate(query)).toThrow("'SELECT' is a reserved SQLite keyword");
    });
  });

  describe('complex queries', () => {
    it('should validate CREATE VIEW with WHERE clause', () => {
      const query = CREATE_VIEW('active_users')
        .as(
          SELECT(FROM('users'), COLUMN('*'))
            .where(EQ(COLUMN('active'), VAL(1)))
        );

      expect(() => validator.validate(query)).not.toThrow();
    });

    it('should validate CREATE VIEW with explicit column names', () => {
      const query = CREATE_VIEW('user_names')
        .withColumns('user_id', 'full_name')
        .as(SELECT(FROM('users'), COLUMN('id'), COLUMN('name')));

      expect(() => validator.validate(query)).not.toThrow();
    });
  });
});
