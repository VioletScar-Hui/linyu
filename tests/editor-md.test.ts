import { describe, expect, it } from 'vitest';
import { toEditorMd, fromEditorMd, absorbPastedImages } from '../lib/editor-md';
import type { TaskImage } from '../lib/tasks';

const imgs: TaskImage[] = [
  { filename: 'a.png', dataUrl: 'data:image/png;base64,AAA', size: 3 },
  { filename: '图 1.png', dataUrl: 'data:image/jpeg;base64,BBB', size: 3 },
];

describe('toEditorMd', () => {
  it('本地 filename 换成 dataUrl', () => {
    expect(toEditorMd('![](a.png)', imgs)).toBe('![](data:image/png;base64,AAA)');
  });
  it('相对路径取文件名匹配', () => {
    expect(toEditorMd('![图](./img/a.png)', imgs)).toBe('![图](data:image/png;base64,AAA)');
  });
  it('含空格文件名(尖括号)也匹配', () => {
    expect(toEditorMd('![](<图 1.png>)', imgs)).toBe('![](data:image/jpeg;base64,BBB)');
  });
  it('图库里没有的引用保持原样', () => {
    expect(toEditorMd('![](miss.png)', imgs)).toBe('![](miss.png)');
  });
  it('远程图不动', () => {
    expect(toEditorMd('![](https://x.com/c.png)', imgs)).toBe('![](https://x.com/c.png)');
  });
});

describe('fromEditorMd', () => {
  it('dataUrl 换回 filename', () => {
    expect(fromEditorMd('![](data:image/png;base64,AAA)', imgs)).toBe('![](a.png)');
  });
  it('含空格的 filename 换回时加尖括号', () => {
    expect(fromEditorMd('![](data:image/jpeg;base64,BBB)', imgs)).toBe('![](<图 1.png>)');
  });
  it('Crepe 写进 alt 的缩放比例(纯数字)被清掉', () => {
    expect(fromEditorMd('![1.00](data:image/png;base64,AAA)', imgs)).toBe('![](a.png)');
    expect(fromEditorMd('![0.5](data:image/jpeg;base64,BBB)', imgs)).toBe('![](<图 1.png>)');
  });
  it('图库没有的 dataUrl(新粘贴图)保留', () => {
    expect(fromEditorMd('![](data:image/png;base64,ZZZ)', imgs)).toBe('![](data:image/png;base64,ZZZ)');
  });
  it('非 data URL 不动', () => {
    expect(fromEditorMd('![](a.png)', imgs)).toBe('![](a.png)');
  });
});

describe('往返', () => {
  it('filename → 编辑器 → filename 一致', () => {
    const stored = '段落\n\n![](a.png)\n\n![](<图 1.png>)';
    expect(fromEditorMd(toEditorMd(stored, imgs), imgs)).toBe(stored);
  });
});

describe('absorbPastedImages', () => {
  it('新 dataUrl 入库并换成 filename(无 data: 残留)', () => {
    const { markdown, added } = absorbPastedImages('正文\n\n![1.00](data:image/png;base64,NEW)', imgs);
    expect(added).toHaveLength(1);
    expect(added[0].dataUrl).toBe('data:image/png;base64,NEW');
    expect(added[0].filename).toMatch(/^pasted-\d+-\d+\.png$/);
    expect(markdown).toContain(`(${added[0].filename})`);
    expect(markdown).not.toContain('data:');
    expect(markdown).not.toContain('1.00'); // alt 缩放比例被清掉
  });
  it('同一 dataUrl 多处只入库一次', () => {
    const { added, markdown } = absorbPastedImages('![](data:image/jpeg;base64,X)\n\n![](data:image/jpeg;base64,X)', imgs);
    expect(added).toHaveLength(1);
    expect(markdown.match(new RegExp(added[0].filename.replace(/[.]/g, '\\.'), 'g'))).toHaveLength(2);
  });
  it('已在图库的 dataUrl 不重复入库', () => {
    const { added } = absorbPastedImages('![](data:image/png;base64,AAA)', imgs);
    expect(added).toHaveLength(0);
  });
  it('没有新图时原样返回', () => {
    const { markdown, added } = absorbPastedImages('![](a.png)\n\n纯文本', imgs);
    expect(added).toHaveLength(0);
    expect(markdown).toBe('![](a.png)\n\n纯文本');
  });
});
