import { CompactQueryRenderer } from "../../src/renderer/CompactQueryRenderer";
import { CREATE_VIEW, SELECT, FROM, COLUMN, EQ, VAL } from "../../src/builder/Shorthand";

describe('CreateView', () => {
  const renderer = new CompactQueryRenderer();

  describe('basic CREATE VIEW', () => {
    it('should render simple CREATE VIEW', () => {
      const query = CREATE_VIEW('active_users')
        .as(
          SELECT(FROM('users'), COLUMN('*'))
            .where(EQ(COLUMN('active'), VAL(1)))
        );

      expect(renderer.render(query)).toBe(
        'CREATE VIEW active_users AS SELECT * FROM users WHERE (active = 1)'
      );
    });

    it('should render CREATE VIEW with specific columns', () => {
      const query = CREATE_VIEW('user_summary')
        .as(
          SELECT(FROM('users'), COLUMN('id'), COLUMN('name'), COLUMN('email'))
        );

      expect(renderer.render(query)).toBe(
        'CREATE VIEW user_summary AS SELECT id, name, email FROM users'
      );
    });
  });

  describe('IF NOT EXISTS', () => {
    it('should render CREATE VIEW IF NOT EXISTS', () => {
      const query = CREATE_VIEW('my_view')
        .ifNotExists()
        .as(
          SELECT(FROM('data'), COLUMN('*'))
        );

      expect(renderer.render(query)).toBe(
        'CREATE VIEW IF NOT EXISTS my_view AS SELECT * FROM data'
      );
    });
  });

  describe('TEMPORARY VIEW', () => {
    it('should render CREATE TEMPORARY VIEW', () => {
      const query = CREATE_VIEW('temp_data')
        .temporary()
        .as(
          SELECT(FROM('source'), COLUMN('*'))
        );

      expect(renderer.render(query)).toBe(
        'CREATE TEMPORARY VIEW temp_data AS SELECT * FROM source'
      );
    });

    it('should render CREATE TEMPORARY VIEW IF NOT EXISTS', () => {
      const query = CREATE_VIEW('temp_data')
        .temporary()
        .ifNotExists()
        .as(
          SELECT(FROM('source'), COLUMN('*'))
        );

      expect(renderer.render(query)).toBe(
        'CREATE TEMPORARY VIEW IF NOT EXISTS temp_data AS SELECT * FROM source'
      );
    });
  });

  describe('column names', () => {
    it('should render CREATE VIEW with explicit column names', () => {
      const query = CREATE_VIEW('user_names')
        .withColumns('user_id', 'full_name')
        .as(
          SELECT(FROM('users'), COLUMN('id'), COLUMN('name'))
        );

      expect(renderer.render(query)).toBe(
        'CREATE VIEW user_names (user_id, full_name) AS SELECT id, name FROM users'
      );
    });

    it('should handle reserved words in column names', () => {
      const query = CREATE_VIEW('my_view')
        .withColumns('select', 'from')
        .as(
          SELECT(FROM('data'), COLUMN('a'), COLUMN('b'))
        );

      expect(renderer.render(query)).toBe(
        'CREATE VIEW my_view ("select", "from") AS SELECT a, b FROM data'
      );
    });
  });

  describe('complex SELECT queries', () => {
    it('should render CREATE VIEW with WHERE clause', () => {
      const query = CREATE_VIEW('high_value_orders')
        .as(
          SELECT(FROM('orders'), COLUMN('id'), COLUMN('total'))
            .where(EQ(COLUMN('status'), VAL('completed')))
        );

      expect(renderer.render(query)).toBe(
        `CREATE VIEW high_value_orders AS SELECT id, total FROM orders WHERE (status = 'completed')`
      );
    });
  });

  describe('edge cases', () => {
    it('should handle view names with special characters', () => {
      const query = CREATE_VIEW('my-view')
        .as(SELECT(FROM('data'), COLUMN('*')));

      expect(renderer.render(query)).toBe(
        'CREATE VIEW "my-view" AS SELECT * FROM data'
      );
    });

    it('should handle reserved word as view name', () => {
      const query = CREATE_VIEW('select')
        .as(SELECT(FROM('data'), COLUMN('*')));

      expect(renderer.render(query)).toBe(
        'CREATE VIEW "select" AS SELECT * FROM data'
      );
    });
  });
});
