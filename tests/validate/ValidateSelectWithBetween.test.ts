import { SELECT, FROM, COLUMN, BETWEEN, NOT_BETWEEN, PARAM } from '../../src/builder/Shorthand';
import { SQLiteQueryValidator } from '../../src/validate/SQLiteQueryValidator';
import { CommonQueryValidator } from '../../src/validate/CommonQueryValidator';

describe('ValidateSelectWithBetween', () => {
  describe('CommonQueryValidator', () => {
    it('validates SELECT with BETWEEN', () => {
      const query = SELECT(FROM('products'), COLUMN('*'))
        .where(BETWEEN(COLUMN('price'), 10, 100));
      const validator = new CommonQueryValidator();
      expect(() => validator.validate(query)).not.toThrow();
    });

    it('validates SELECT with NOT BETWEEN', () => {
      const query = SELECT(FROM('employees'), COLUMN('*'))
        .where(NOT_BETWEEN(COLUMN('salary'), 50000, 100000));
      const validator = new CommonQueryValidator();
      expect(() => validator.validate(query)).not.toThrow();
    });

    it('validates SELECT with BETWEEN using parameters', () => {
      const query = SELECT(FROM('orders'), COLUMN('*'))
        .where(BETWEEN(COLUMN('total'), PARAM('min'), PARAM('max')));
      const validator = new CommonQueryValidator();
      expect(() => validator.validate(query)).not.toThrow();
    });

    it('validates expressions within BETWEEN bounds', () => {
      const query = SELECT(FROM('data'), COLUMN('*'))
        .where(BETWEEN(COLUMN('value'), COLUMN('min_val'), COLUMN('max_val')));
      const validator = new CommonQueryValidator();
      expect(() => validator.validate(query)).not.toThrow();
    });
  });

  describe('SQLiteQueryValidator', () => {
    it('validates SELECT with BETWEEN', () => {
      const query = SELECT(FROM('products'), COLUMN('*'))
        .where(BETWEEN(COLUMN('price'), 10, 100));
      const validator = new SQLiteQueryValidator();
      expect(() => validator.validate(query)).not.toThrow();
    });

    it('validates SELECT with NOT BETWEEN', () => {
      const query = SELECT(FROM('items'), COLUMN('*'))
        .where(NOT_BETWEEN(COLUMN('quantity'), 0, 10));
      const validator = new SQLiteQueryValidator();
      expect(() => validator.validate(query)).not.toThrow();
    });

    it('validates SELECT with string bounds in BETWEEN', () => {
      const query = SELECT(FROM('events'), COLUMN('*'))
        .where(BETWEEN(COLUMN('date'), '2025-01-01', '2025-12-31'));
      const validator = new SQLiteQueryValidator();
      expect(() => validator.validate(query)).not.toThrow();
    });
  });
});
