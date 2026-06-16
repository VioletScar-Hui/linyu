import { describe, expect, it } from 'vitest';
import { rewriteImagePaths } from '../lib/export-md';

describe('rewriteImagePaths', () => {
  it('裸文件名改写为 images/ 路径', () => {
    expect(rewriteImagePaths('![](a.png)', 'images')).toBe('![](images/a.png)');
  });

  it('相对路径取文件名后改写', () => {
    expect(rewriteImagePaths('![图](./img/a.png)', 'images')).toBe('![图](images/a.png)');
  });

  it('含空格文件名用尖括号包裹', () => {
    expect(rewriteImagePaths('![](<图 1.png>)', 'images')).toBe('![](<images/图 1.png>)');
  });

  it('保留图片标题', () => {
    expect(rewriteImagePaths('![](a.png "标题")', 'images')).toBe('![](images/a.png "标题")');
  });

  it('远程图与 data URL 不改', () => {
    expect(rewriteImagePaths('![](https://cdn.com/c.png)', 'images')).toBe('![](https://cdn.com/c.png)');
    expect(rewriteImagePaths('![](data:image/png;base64,AAA)', 'images')).toBe('![](data:image/png;base64,AAA)');
  });

  it('多张图全部改写,正文文字不动', () => {
    const md = '开头\n\n![](a.png)\n\n中间\n\n![b](b.jpg)\n\n结尾';
    expect(rewriteImagePaths(md, 'images')).toBe('开头\n\n![](images/a.png)\n\n中间\n\n![b](images/b.jpg)\n\n结尾');
  });
});
