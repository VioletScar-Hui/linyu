import { beforeEach, describe, expect, it } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import { getSettings, saveSettings, newMpAccount } from '../lib/settings';

beforeEach(() => fakeBrowser.reset());

describe('settings 存储', () => {
  it('默认空账号列表', async () => {
    expect(await getSettings()).toEqual({ mpAccounts: [] });
  });

  it('保存后可取回', async () => {
    const acc = { ...newMpAccount('主号'), token: '123456' };
    await saveSettings({ mpAccounts: [acc] });
    const s = await getSettings();
    expect(s.mpAccounts).toHaveLength(1);
    expect(s.mpAccounts[0]).toMatchObject({ name: '主号', token: '123456' });
  });

  it('newMpAccount 生成唯一 id 且 token 初始为空', () => {
    const a = newMpAccount('a');
    const b = newMpAccount('b');
    expect(a.id).not.toBe(b.id);
    expect(a.token).toBe('');
  });
});
