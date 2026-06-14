import { beforeEach, describe, expect, it } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import { getSettings, saveSettings, newMpAccount, newSnippet } from '../lib/settings';

beforeEach(() => fakeBrowser.reset());

describe('settings 存储', () => {
  it('默认空账号与空片段列表', async () => {
    expect(await getSettings()).toEqual({ mpAccounts: [], snippets: [] });
  });

  it('保存后可取回账号与片段', async () => {
    const acc = { ...newMpAccount('主号'), token: '123456' };
    await saveSettings({ mpAccounts: [acc], snippets: [{ id: 's1', name: '签名', content: '关注我' }] });
    const s = await getSettings();
    expect(s.mpAccounts[0]).toMatchObject({ name: '主号', token: '123456' });
    expect(s.snippets[0]).toMatchObject({ name: '签名', content: '关注我' });
  });

  it('newMpAccount 生成唯一 id 且 token 初始为空', () => {
    const a = newMpAccount('a');
    const b = newMpAccount('b');
    expect(a.id).not.toBe(b.id);
    expect(a.token).toBe('');
  });

  it('newSnippet 生成唯一 id 且内容初始为空', () => {
    const a = newSnippet('开头');
    expect(a.id).toBeTruthy();
    expect(a.name).toBe('开头');
    expect(a.content).toBe('');
  });
});
