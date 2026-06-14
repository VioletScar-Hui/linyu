import { describe, expect, it } from 'vitest';
import { preflight, worstLevel } from '../lib/preflight';
import { newTask, type Task } from '../lib/tasks';

function make(over: Partial<Task>): Task {
  return { ...newTask({ title: '标题', markdown: '正文' }), ...over };
}

describe('preflight', () => {
  it('空标题/正文 → 长文平台报 error', () => {
    const r = preflight(make({ title: '', markdown: '' }), []);
    expect(worstLevel(r.zhihu)).toBe('error');
    expect(r.zhihu?.some((i) => i.msg === '标题为空')).toBe(true);
    expect(r.zhihu?.some((i) => i.msg === '正文为空')).toBe(true);
  });

  it('缺图 → warn', () => {
    const r = preflight(make({}), ['a.png']);
    expect(r.zhihu?.some((i) => i.level === 'warn' && i.msg.includes('a.png'))).toBe(true);
  });

  it('公众号未选封面 → warn', () => {
    const r = preflight(make({ coverFilename: undefined }), []);
    expect(r.weixin?.some((i) => i.msg === '未选封面')).toBe(true);
  });

  it('小红书:无图无变体 → 多个 error', () => {
    const r = preflight(make({ images: [] }), []);
    expect(worstLevel(r.xiaohongshu)).toBe('error');
    expect(r.xiaohongshu?.some((i) => i.msg.includes('至少需 1 张图'))).toBe(true);
    expect(r.xiaohongshu?.some((i) => i.msg.includes('标题未填'))).toBe(true);
  });

  it('小红书标题超 20 字 → error', () => {
    const r = preflight(make({
      images: [{ filename: 'a.png', dataUrl: 'x', size: 1 }],
      variants: { xiaohongshu: { title: '一'.repeat(21), body: '正文' } },
    }), []);
    expect(r.xiaohongshu?.some((i) => i.msg.includes('标题超 20 字'))).toBe(true);
  });

  it('X 推文超 280 → error', () => {
    const r = preflight(make({ variants: { x: { title: '', body: 'a'.repeat(281) } } }), []);
    expect(r.x?.some((i) => i.msg.includes('超 280'))).toBe(true);
  });

  it('完整长文(标题+正文+封面,无缺图) → 知乎 ok', () => {
    const r = preflight(make({ coverFilename: 'c.png' }), []);
    expect(worstLevel(r.zhihu)).toBe('ok');
  });

  it('worstLevel:error 优先于 warn', () => {
    expect(worstLevel([{ level: 'warn', msg: '' }, { level: 'error', msg: '' }])).toBe('error');
    expect(worstLevel([])).toBe('ok');
    expect(worstLevel(undefined)).toBe('ok');
  });
});
