import { describe, expect, it } from 'vitest';
import { PLATFORMS, getPlatform, type PlatformId } from '../lib/platforms';

describe('platforms', () => {
  it('全部 7 个平台均支持自动填充(V2)', () => {
    expect(PLATFORMS).toHaveLength(7);
    expect(PLATFORMS.every((p) => p.supportsFill)).toBe(true);
  });

  it('publishUrl 均为 https', () => {
    for (const p of PLATFORMS) expect(p.publishUrl).toMatch(/^https:\/\//);
  });

  it('getPlatform 按 id 取平台', () => {
    expect(getPlatform('zhihu')?.name).toBe('知乎');
  });

  it('getPlatform 未知 id 返回 undefined', () => {
    expect(getPlatform('unknown' as PlatformId)).toBeUndefined();
  });
});
