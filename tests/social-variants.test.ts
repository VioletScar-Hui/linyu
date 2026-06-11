import { describe, expect, it } from 'vitest';
import { makeXVariant, makeRedditVariant } from '../lib/social-variants';

describe('makeXVariant', () => {
  it('推文为纯文本,标题在前,总长≤280 码点', () => {
    const v = makeXVariant('一个标题', '# 一个标题\n\n' + '内容'.repeat(300));
    expect([...v.body].length).toBeLessThanOrEqual(280);
    expect(v.body.startsWith('一个标题')).toBe(true);
    expect(v.body).not.toContain('#');
    expect(v.title).toBe(''); // X 无标题字段
  });
  it('短文章原样保留不截断', () => {
    const v = makeXVariant('标题', '正文很短');
    expect(v.body).toContain('标题');
    expect(v.body).toContain('正文很短');
  });
});

describe('makeRedditVariant', () => {
  it('标题截断到 300,正文保留原始 markdown', () => {
    const longTitle = '标'.repeat(400);
    const v = makeRedditVariant(longTitle, '# H\n\n**正文** markdown');
    expect([...v.title].length).toBe(300);
    expect(v.body).toContain('**正文**'); // 保留 markdown
    expect(v.body).toContain('# H');
  });
});
