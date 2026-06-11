import { describe, expect, it } from 'vitest';
import { basename, extractImageRefs, matchImages } from '../lib/images';

describe('basename', () => {
  it('取路径最后一段,去掉 query/hash', () => {
    expect(basename('./img/a.png')).toBe('a.png');
    expect(basename('img\\b.jpg')).toBe('b.jpg');
    expect(basename('c.png?x=1#y')).toBe('c.png');
  });
});

describe('extractImageRefs', () => {
  it('提取本地图片引用文件名,忽略网络图与 data URL', () => {
    const md = [
      '![图一](./img/a.png)',
      '![](b.jpg "标题")',
      '![远程](https://cdn.com/c.png)',
      '![内联](data:image/png;base64,xxx)',
    ].join('\n');
    expect(extractImageRefs(md)).toEqual(['a.png', 'b.jpg']);
  });

  it('同名引用去重', () => {
    expect(extractImageRefs('![1](a.png)\n![2](a.png)')).toEqual(['a.png']);
  });

  it('一行多图全部提取', () => {
    expect(extractImageRefs('![a](a.png) ![b](b.png)')).toEqual(['a.png', 'b.png']);
  });

  it('单引号标题也能提取', () => {
    expect(extractImageRefs("![a](a.png 'note')")).toEqual(['a.png']);
  });
});

describe('matchImages', () => {
  it('按文件名匹配,报告缺失', () => {
    expect(matchImages(['a.png', 'b.jpg'], ['a.png', 'extra.png'])).toEqual({
      matched: ['a.png'],
      missing: ['b.jpg'],
    });
  });
});
