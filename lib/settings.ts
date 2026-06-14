import { browser } from 'wxt/browser';

/** 公众号账号:备注名 + 会话级 token(登录后台后从地址栏 token= 复制) */
export interface MpAccount {
  id: string;
  name: string;
  token: string;
}

export interface Settings {
  mpAccounts: MpAccount[];
}

const KEY = 'settings';
const EMPTY: Settings = { mpAccounts: [] };

export async function getSettings(): Promise<Settings> {
  const got = await browser.storage.local.get(KEY);
  const s = got[KEY] as Partial<Settings> | undefined;
  return { mpAccounts: s?.mpAccounts ?? [] };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await browser.storage.local.set({ [KEY]: settings });
}

export function newMpAccount(name = ''): MpAccount {
  return { id: crypto.randomUUID(), name, token: '' };
}
