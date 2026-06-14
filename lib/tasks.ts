import { browser } from 'wxt/browser';
import type { PlatformId } from './platforms';

export type PlatformStatus =
  | { state: 'pending' }                       // 已发起,等待填充
  | { state: 'filled'; note?: string }         // 已填充(note: 如"封面需手动设置")
  | { state: 'failed'; reason: string };

export interface TaskImage {
  filename: string;
  dataUrl: string;
  size: number;
}

export interface Task {
  id: string;
  createdAt: number;
  title: string;
  markdown: string;
  images: TaskImage[];
  coverFilename?: string;
  /** 平台变体;V2 的 x/reddit 复用此结构 */
  variants: Partial<Record<'xiaohongshu' | 'x' | 'reddit', { title: string; body: string }>>;
  platformStatus: Partial<Record<PlatformId, PlatformStatus>>;
}

/** 历史列表用的轻量元信息(不含图片/正文,避免列表读入全部图片) */
export interface TaskMeta {
  id: string;
  createdAt: number;
  title: string;
  platformStatus: Partial<Record<PlatformId, PlatformStatus>>;
}

// 存储布局:每任务一个 key `task:{id}`(完整),外加一个轻量索引 `taskIndex`(元信息列表)。
// 旧版把所有任务(含 base64 图片)塞进单个 `tasks` 数组,列表/保存都要序列化全部图片;
// 拆分后历史列表只读索引,单任务读写互不牵连。
const INDEX_KEY = 'taskIndex';
const LEGACY_KEY = 'tasks';
const taskKey = (id: string) => `task:${id}`;
const MAX_TASKS = 20;

export function newTask(init: { title: string; markdown: string }): Task {
  return {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    title: init.title,
    markdown: init.markdown,
    images: [],
    variants: {},
    platformStatus: {},
  };
}

/** 基于已有任务复制为新任务:新 id/时间,清空分发状态,标题加"副本"后缀。 */
export function duplicateTask(src: Task): Task {
  return {
    ...newTask({ title: src.title ? `${src.title} 副本` : '', markdown: src.markdown }),
    images: src.images.map((i) => ({ ...i })),
    coverFilename: src.coverFilename,
    variants: structuredClone(src.variants),
  };
}

function toMeta(t: Task): TaskMeta {
  return { id: t.id, createdAt: t.createdAt, title: t.title, platformStatus: t.platformStatus };
}

async function readIndex(): Promise<TaskMeta[]> {
  const got = await browser.storage.local.get(INDEX_KEY);
  const idx = (got[INDEX_KEY] as TaskMeta[] | undefined) ?? [];
  return [...idx].sort((a, b) => b.createdAt - a.createdAt);
}

async function writeIndex(metas: TaskMeta[]): Promise<void> {
  await browser.storage.local.set({ [INDEX_KEY]: metas });
}

/** 旧 `tasks` 单 key 数据迁移到新布局(幂等:迁移后删除旧 key)。撰写台启动时调用一次。 */
export async function migrateIfNeeded(): Promise<void> {
  const got = await browser.storage.local.get(LEGACY_KEY);
  const old = got[LEGACY_KEY] as Task[] | undefined;
  if (!old) return;
  const metas: TaskMeta[] = [];
  for (const t of old) {
    await browser.storage.local.set({ [taskKey(t.id)]: t });
    metas.push(toMeta(t));
  }
  metas.sort((a, b) => b.createdAt - a.createdAt);
  await writeIndex(metas.slice(0, MAX_TASKS));
  await browser.storage.local.remove(LEGACY_KEY);
}

export async function getTask(id: string): Promise<Task | undefined> {
  const got = await browser.storage.local.get(taskKey(id));
  return got[taskKey(id)] as Task | undefined;
}

export async function saveTask(task: Task): Promise<void> {
  // 合并存储中已有的平台状态(存储侧优先):撰写页用旧内存状态保存时,不冲掉后台写入的状态
  const existing = await getTask(task.id);
  const merged: Task = existing
    ? { ...task, platformStatus: { ...task.platformStatus, ...existing.platformStatus } }
    : task;
  await browser.storage.local.set({ [taskKey(task.id)]: merged });

  let index = (await readIndex()).filter((m) => m.id !== task.id);
  index.push(toMeta(merged));
  index.sort((a, b) => b.createdAt - a.createdAt);
  const keep = index.slice(0, MAX_TASKS);
  for (const m of index.slice(MAX_TASKS)) await browser.storage.local.remove(taskKey(m.id));
  await writeIndex(keep);
}

export async function deleteTask(id: string): Promise<void> {
  await browser.storage.local.remove(taskKey(id));
  await writeIndex((await readIndex()).filter((m) => m.id !== id));
}

/** 历史列表:返回轻量元信息(降序),不含图片/正文。 */
export async function listTaskMetas(): Promise<TaskMeta[]> {
  return readIndex();
}

export async function updatePlatformStatus(
  id: string,
  platform: PlatformId,
  status: PlatformStatus,
): Promise<void> {
  // 状态更新是权威直写,必须能推进 pending→filled;同步到任务与索引两处
  const task = await getTask(id);
  if (!task) return;
  task.platformStatus[platform] = status;
  await browser.storage.local.set({ [taskKey(id)]: task });
  const index = await readIndex();
  const m = index.find((x) => x.id === id);
  if (m) { m.platformStatus[platform] = status; await writeIndex(index); }
}
