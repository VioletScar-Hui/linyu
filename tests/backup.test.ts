import { beforeEach, describe, expect, it } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import { exportBackup, importBackup } from '../lib/backup';
import { saveTask, getTask, listTaskMetas, newTask } from '../lib/tasks';
import { saveSettings, getSettings } from '../lib/settings';

beforeEach(() => fakeBrowser.reset());

describe('backup 导出/导入', () => {
  it('导出含全部任务与设置', async () => {
    await saveTask(newTask({ title: 'A', markdown: '正文A' }));
    await saveTask(newTask({ title: 'B', markdown: '正文B' }));
    await saveSettings({ mpAccounts: [], snippets: [{ id: 's', name: '签', content: 'x' }], enabledPlatforms: ['zhihu'] });

    const backup = await exportBackup();
    expect(backup.version).toBe(1);
    expect(backup.tasks).toHaveLength(2);
    expect(backup.settings.snippets[0].name).toBe('签');
    expect(backup.settings.enabledPlatforms).toEqual(['zhihu']);
  });

  it('往返:导出后清空再导入,任务与设置完整恢复', async () => {
    const t = { ...newTask({ title: '原文', markdown: '正文' }), images: [{ filename: 'a.png', dataUrl: 'data:x', size: 9 }] };
    await saveTask(t);
    await saveSettings({ mpAccounts: [{ id: '1', name: '号', token: 'tk' }], snippets: [], enabledPlatforms: ['x'] });

    const backup = await exportBackup();
    fakeBrowser.reset();
    expect(await listTaskMetas()).toHaveLength(0);

    const { tasks } = await importBackup(backup);
    expect(tasks).toBe(1);
    expect((await getTask(t.id))?.images[0].filename).toBe('a.png');
    expect((await getSettings()).mpAccounts[0].token).toBe('tk');
    expect((await listTaskMetas())).toHaveLength(1);
  });

  it('格式不符抛错', async () => {
    await expect(importBackup({ version: 99 })).rejects.toThrow('格式不正确');
    await expect(importBackup(null)).rejects.toThrow();
  });
});
