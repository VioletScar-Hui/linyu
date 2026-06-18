import { describe, expect, it } from 'vitest';
import { targetDimensions } from '../lib/compress';

describe('targetDimensions', () => {
  it('小于最大边时不放大', () => {
    expect(targetDimensions(1000, 800, 1920)).toEqual({ w: 1000, h: 800 });
    expect(targetDimensions(1920, 1080, 1920)).toEqual({ w: 1920, h: 1080 });
  });
  it('横图超限按长边等比缩小', () => {
    expect(targetDimensions(4000, 3000, 1920)).toEqual({ w: 1920, h: 1440 });
  });
  it('竖图超限按长边等比缩小', () => {
    expect(targetDimensions(3000, 4000, 1920)).toEqual({ w: 1440, h: 1920 });
  });
  it('正方形超限缩到最大边', () => {
    expect(targetDimensions(3000, 3000, 1920)).toEqual({ w: 1920, h: 1920 });
  });
});
