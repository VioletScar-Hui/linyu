import { describe, expect, it } from 'vitest';
import { PLATFORMS, getPlatform, type PlatformId } from '../lib/platforms';

describe('platforms', () => {
  it('共 7 个平台,其中 4 个支持自动填充', () => {
    expect(PLATFORMS).toHaveLength(7);
    expect(PLATFORMS.filter((p) => p.supportsFill).map((p) => p.id)).toEqual([
      'weixin', 'zhihu', 'woshipm', 'xiaohongshu',
    ]);
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
