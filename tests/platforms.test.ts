import { describe, expect, it } from 'vitest';
import { PLATFORMS, getPlatform, DEFAULT_ENABLED, type PlatformId } from '../lib/platforms';

describe('platforms', () => {
  it('7 个平台有自动填充适配器,其余仅快捷跳转', () => {
    const fillable = PLATFORMS.filter((p) => p.supportsFill).map((p) => p.id);
    expect(fillable).toEqual(['weixin', 'zhihu', 'woshipm', 'xiaohongshu', 'bilibili', 'x', 'reddit']);
    expect(PLATFORMS.length).toBeGreaterThan(7);
  });

  it('DEFAULT_ENABLED 即可自动填充的 7 个', () => {
    expect(DEFAULT_ENABLED).toHaveLength(7);
    expect(DEFAULT_ENABLED).toContain('weixin');
    expect(DEFAULT_ENABLED).not.toContain('medium');
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
