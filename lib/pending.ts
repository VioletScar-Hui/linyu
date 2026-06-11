import { browser } from 'wxt/browser';
import type { PlatformId } from './platforms';

const KEY = 'pendingFills';

type PendingMap = Partial<Record<PlatformId, string>>;

async function read(): Promise<PendingMap> {
  const got = await browser.storage.local.get(KEY);
  return (got[KEY] as PendingMap | undefined) ?? {};
}

export async function setPending(platform: PlatformId, taskId: string): Promise<void> {
  const map = await read();
  map[platform] = taskId;
  await browser.storage.local.set({ [KEY]: map });
}

/** 一次性认领:返回 taskId 并删除登记 */
export async function claimPending(platform: PlatformId): Promise<string | null> {
  const map = await read();
  const taskId = map[platform];
  if (!taskId) return null;
  delete map[platform];
  await browser.storage.local.set({ [KEY]: map });
  return taskId;
}
