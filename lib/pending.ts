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

/** 只读查询:该平台是否有待填充任务(不消耗登记)。供"非编辑器页自动跳转编辑器"前探测用。 */
export async function peekPending(platform: PlatformId): Promise<string | null> {
  const map = await read();
  return map[platform] ?? null;
}

/** 一次性认领:返回 taskId 并删除登记。
 *  已知限制:storage 读-改-写非原子。background 侧已用单队列串行化自身写入;
 *  残余竞态:(a)同平台两个编辑页同一时刻认领可能都拿到任务;
 *  (b)撰写页 saveTask 与 background 写 tasks 并发时,窄窗口内可能互相覆盖
 *  (平台状态已由 saveTask 的存储侧优先合并保护,正文编辑丢失概率极低)。
 *  单人使用场景 V1 接受。 */
export async function claimPending(platform: PlatformId): Promise<string | null> {
  const map = await read();
  const taskId = map[platform];
  if (!taskId) return null;
  delete map[platform];
  await browser.storage.local.set({ [KEY]: map });
  return taskId;
}
