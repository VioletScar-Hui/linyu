import { listTaskMetas, getTask, saveTask, type Task } from './tasks';
import { getSettings, saveSettings, type Settings } from './settings';

/** 全量备份:所有分发任务(含 base64 图片)+ 设置,自包含可往返导入。 */
export interface BackupData {
  version: 1;
  exportedAt: number;
  tasks: Task[];
  settings: Settings;
}

export async function exportBackup(): Promise<BackupData> {
  const metas = await listTaskMetas();
  const tasks: Task[] = [];
  for (const m of metas) {
    const t = await getTask(m.id);
    if (t) tasks.push(t);
  }
  return { version: 1, exportedAt: Date.now(), tasks, settings: await getSettings() };
}

/** 导入备份:逐个写回任务并恢复设置。返回导入的任务数。格式不符抛错。 */
export async function importBackup(data: unknown): Promise<{ tasks: number }> {
  const d = data as Partial<BackupData> | null;
  if (!d || d.version !== 1 || !Array.isArray(d.tasks)) {
    throw new Error('备份文件格式不正确(需灵羽导出的 JSON)');
  }
  for (const t of d.tasks) await saveTask(t);
  if (d.settings) await saveSettings(d.settings);
  return { tasks: d.tasks.length };
}
