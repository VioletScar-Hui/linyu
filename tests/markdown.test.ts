import { describe, expect, it } from 'vitest';
import { renderHtml, deriveTitle } from '../lib/markdown';

describe('renderHtml', () => {
  it('基本 Markdown 转 HTML', () => {
    const html = renderHtml('# 标题\n\n正文**加粗**', {});
    expect(html).toContain('<h1>标题</h1>');
    expect(html).toContain('<strong>加粗</strong>');
  });

  it('本地图片引用按文件名替换为 dataUrl', () => {
    const html = renderHtml('![图](./img/a.png)', { 'a.png': 'data:image/png;base64,AAA' });
    expect(html).toContain('src="data:image/png;base64,AAA"');
  });

  it('网络图与未匹配图保留原 src', () => {
    const html = renderHtml('![](https://cdn.com/c.png)\n\n![](miss.png)', {});
    expect(html).toContain('src="https://cdn.com/c.png"');
    expect(html).toContain('src="miss.png"');
  });

  it('不放行内嵌 HTML(防注入)', () => {
    expect(renderHtml('<script>alert(1)</script>', {})).not.toContain('<script>');
  });

  it('多次调用 imageMap 互不串扰', () => {
    const h1 = renderHtml('![](a.png)', { 'a.png': 'data:first' });
    const h2 = renderHtml('![](a.png)', {});
    expect(h1).toContain('data:first');
    expect(h2).toContain('src="a.png"');
  });
});

describe('deriveTitle', () => {
  it('取第一个一级/二级标题', () => {
    expect(deriveTitle('前言\n# 我的标题\n正文')).toBe('我的标题');
  });
  it('无标题时返回空串', () => {
    expect(deriveTitle('没有标题的正文')).toBe('');
  });
  it('二级标题也可作为标题', () => {
    expect(deriveTitle('前言\n## 副标题\n正文')).toBe('副标题');
  });
});
