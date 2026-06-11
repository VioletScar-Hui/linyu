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
  variants: { xiaohongshu?: { title: string; body: string } };
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
  if (idx >= 0) all[idx] = task;
  else all.push(task);
  await writeAll(all);
}

export async function getTask(id: string): Promise<Task | undefined> {
  return (await readAll()).find((t) => t.id === id);
}

export async function listTasks(): Promise<Task[]> {
  return (await readAll()).sort((a, b) => b.createdAt - a.createdAt);
}

export async function updatePlatformStatus(
  id: string,
  platform: PlatformId,
  status: PlatformStatus,
): Promise<void> {
  const task = await getTask(id);
  if (!task) return;
  task.platformStatus[platform] = status;
  await saveTask(task);
}
