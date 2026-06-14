import { browser } from 'wxt/browser';

/** 公众号账号:备注名 + 会话级 token(登录后台后从地址栏 token= 复制) */
export interface MpAccount {
  id: string;
  name: string;
  token: string;
}

/** 常用片段:开头/结尾/关注引导等,一键插入正文光标处 */
export interface Snippet {
  id: string;
  name: string;
  content: string;
}

export interface Settings {
  mpAccounts: MpAccount[];
  snippets: Snippet[];
}

const KEY = 'settings';

export async function getSettings(): Promise<Settings> {
  const got = await browser.storage.local.get(KEY);
  const s = got[KEY] as Partial<Settings> | undefined;
  return { mpAccounts: s?.mpAccounts ?? [], snippets: s?.snippets ?? [] };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await browser.storage.local.set({ [KEY]: settings });
}

export function newMpAccount(name = ''): MpAccount {
  return { id: crypto.randomUUID(), name, token: '' };
}

export function newSnippet(name = ''): Snippet {
  return { id: crypto.randomUUID(), name, content: '' };
}
