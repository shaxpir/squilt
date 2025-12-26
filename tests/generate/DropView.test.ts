import { CompactQueryRenderer } from "../../src/renderer/CompactQueryRenderer";
import { DROP_VIEW } from "../../src/builder/Shorthand";

describe('DropView', () => {
  const renderer = new CompactQueryRenderer();

  describe('basic DROP VIEW', () => {
    it('should render simple DROP VIEW', () => {
      const query = DROP_VIEW('old_view');

      expect(renderer.render(query)).toBe(
        'DROP VIEW old_view'
      );
    });
  });

  describe('IF EXISTS', () => {
    it('should render DROP VIEW IF EXISTS', () => {
      const query = DROP_VIEW('maybe_exists')
        .ifExists();

      expect(renderer.render(query)).toBe(
        'DROP VIEW IF EXISTS maybe_exists'
      );
    });
  });

  describe('edge cases', () => {
    it('should handle view names with special characters', () => {
      const query = DROP_VIEW('my-view');

      expect(renderer.render(query)).toBe(
        'DROP VIEW "my-view"'
      );
    });

    it('should handle reserved word as view name', () => {
      const query = DROP_VIEW('select');

      expect(renderer.render(query)).toBe(
        'DROP VIEW "select"'
      );
    });

    it('should handle view names with spaces', () => {
      const query = DROP_VIEW('my view');

      expect(renderer.render(query)).toBe(
        'DROP VIEW "my view"'
      );
    });
  });
});
