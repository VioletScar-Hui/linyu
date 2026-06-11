import { describe, expect, it } from 'vitest';
import { waitFor, dataUrlToFile, setNativeValue } from '../lib/adapters/fill-utils';

describe('waitFor', () => {
  it('值出现后 resolve', async () => {
    let v: string | null = null;
    setTimeout(() => (v = 'ok'), 50);
    expect(await waitFor(() => v, 1000, 10)).toBe('ok');
  });
  it('超时 reject', async () => {
    await expect(waitFor(() => null, 100, 10)).rejects.toThrow('超时');
  });
  it('空字符串等假值但非 null/false 也能 resolve', async () => {
    expect(await waitFor(() => '', 1000, 10)).toBe('');
  });
});

describe('dataUrlToFile', () => {
  it('还原文件名/类型/内容长度', () => {
    // "AAA" 的 base64 是 QUFB
    const f = dataUrlToFile('data:image/png;base64,QUFB', 'a.png');
    expect(f.name).toBe('a.png');
    expect(f.type).toBe('image/png');
    expect(f.size).toBe(3);
  });
});

describe('setNativeValue', () => {
  it('写入值并派发 input 事件(穿透 React 受控组件)', () => {
    const ta = document.createElement('textarea');
    document.body.append(ta);
    let fired = false;
    ta.addEventListener('input', () => (fired = true));
    setNativeValue(ta, '你好');
    expect(ta.value).toBe('你好');
    expect(fired).toBe(true);
  });
});
