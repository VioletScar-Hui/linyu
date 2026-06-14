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

const KEY = 'tasks';
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

async function readAll(): Promise<Task[]> {
  const got = await browser.storage.local.get(KEY);
  return (got[KEY] as Task[] | undefined) ?? [];
}

async function writeAll(tasks: Task[]): Promise<void> {
  const sorted = [...tasks].sort((a, b) => b.createdAt - a.createdAt).slice(0, MAX_TASKS);
  await browser.storage.local.set({ [KEY]: sorted });
}

export async function saveTask(task: Task): Promise<void> {
  const all = await readAll();
  const idx = all.findIndex((t) => t.id === task.id);
  if (idx >= 0) {
    // 合并存储中的平台状态(存储侧优先):撰写页用旧内存状态保存时,不冲掉后台写入的状态
    all[idx] = {
      ...task,
      platformStatus: { ...task.platformStatus, ...all[idx].platformStatus },
    };
  } else {
    all.push(task);
  }
  await writeAll(all);
}

export async function getTask(id: string): Promise<Task | undefined> {
  return (await readAll()).find((t) => t.id === id);
}

export async function deleteTask(id: string): Promise<void> {
  await writeAll((await readAll()).filter((t) => t.id !== id));
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

export async function listTasks(): Promise<Task[]> {
  return (await readAll()).sort((a, b) => b.createdAt - a.createdAt);
}

export async function updatePlatformStatus(
  id: string,
  platform: PlatformId,
  status: PlatformStatus,
): Promise<void> {
  // 单次读-改-写,不经过 saveTask 的合并(状态更新是权威写入,必须能推进 pending→filled)
  const all = await readAll();
  const task = all.find((t) => t.id === id);
  if (!task) return;
  task.platformStatus[platform] = status;
  await writeAll(all);
}
