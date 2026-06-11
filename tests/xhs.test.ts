import { describe, expect, it } from 'vitest';
import { stripMarkdown, makeXhsVariant } from '../lib/xhs';

describe('stripMarkdown', () => {
  it('去掉标题/加粗/链接/图片标记,保留文字', () => {
    const md = '# 标题\n\n**加粗**和[链接](https://a.com)以及![图](a.png)\n\n- 列表项';
    const text = stripMarkdown(md);
    expect(text).not.toMatch(/[#*[\]()!]/);
    expect(text).toContain('加粗');
    expect(text).toContain('链接');
    expect(text).toContain('列表项');
  });
});

describe('makeXhsVariant', () => {
  it('标题截断到 20 字', () => {
    const v = makeXhsVariant('一二三四五六七八九十一二三四五六七八九十超出', '正文');
    expect([...v.title]).toHaveLength(20);
  });
  it('正文为纯文本且不超过 1000 字', () => {
    const v = makeXhsVariant('题', '# 头\n\n' + '字'.repeat(2000));
    expect([...v.body].length).toBeLessThanOrEqual(1000);
    expect(v.body).not.toContain('#');
  });
});
