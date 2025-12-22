import { IndentedQueryRenderer } from '../../src/renderer/IndentedQueryRenderer';

describe('IndentedQueryRenderer Validation', () => {
  test('IndentedQueryRenderer validates spacesPerLevel', () => {
    expect(() => new IndentedQueryRenderer(0)).toThrow('spacesPerLevel must be a positive integer');
    expect(() => new IndentedQueryRenderer(-1)).toThrow('spacesPerLevel must be a positive integer');
    expect(() => new IndentedQueryRenderer(1.5)).toThrow('spacesPerLevel must be a positive integer');
    expect(() => new IndentedQueryRenderer(2)).not.toThrow();
  });
});