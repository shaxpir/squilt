import { CompactQueryRenderer } from '../../src/renderer/CompactQueryRenderer';
import { GLOB, COLUMN, SELECT, FROM, AND, NOT } from '../../src/builder/Shorthand';

describe('GLOB Operator Generation', () => {
  const compact = new CompactQueryRenderer();

  it('should render a basic GLOB expression', () => {
    const query = SELECT(FROM('files'), COLUMN('name'))
      .where(GLOB(COLUMN('name'), '*.txt'));
    expect(query.accept(compact)).toBe("SELECT name FROM files WHERE (name GLOB '*.txt')");
  });

  it('should render GLOB with wildcard patterns', () => {
    const query = SELECT(FROM('files'), COLUMN('path'))
      .where(GLOB(COLUMN('path'), '/home/*'));
    expect(query.accept(compact)).toBe("SELECT path FROM files WHERE (path GLOB '/home/*')");
  });

  it('should render GLOB with character class', () => {
    const query = SELECT(FROM('data'), COLUMN('code'))
      .where(GLOB(COLUMN('code'), '[A-Z]*'));
    expect(query.accept(compact)).toBe("SELECT code FROM data WHERE (code GLOB '[A-Z]*')");
  });

  it('should render GLOB combined with AND', () => {
    const query = SELECT(FROM('files'), COLUMN('name'))
      .where(AND(
        GLOB(COLUMN('name'), '*.txt'),
        GLOB(COLUMN('path'), '/docs/*')
      ));
    expect(query.accept(compact)).toBe("SELECT name FROM files WHERE ((name GLOB '*.txt') AND (path GLOB '/docs/*'))");
  });

  it('should render NOT GLOB', () => {
    const query = SELECT(FROM('files'), COLUMN('name'))
      .where(NOT(GLOB(COLUMN('name'), '*.tmp')));
    expect(query.accept(compact)).toBe("SELECT name FROM files WHERE (NOT (name GLOB '*.tmp'))");
  });
});
