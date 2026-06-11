import { beforeEach, describe, expect, it } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import { saveTask, getTask, listTasks, updatePlatformStatus, newTask } from '../lib/tasks';

beforeEach(() => fakeBrowser.reset());

describe('tasks 存储', () => {
  it('保存后可按 id 取回', async () => {
    const t = newTask({ title: '标题', markdown: '# 标题' });
    await saveTask(t);
    expect((await getTask(t.id))?.title).toBe('标题');
  });

  it('列表按 createdAt 降序且最多 20 篇', async () => {
    for (let i = 0; i < 25; i++) {
      await saveTask({ ...newTask({ title: `t${i}`, markdown: '' }), createdAt: i });
    }
    const list = await listTasks();
    expect(list).toHaveLength(20);
    expect(list[0].title).toBe('t24'); // 最新在前
  });

  it('saveTask 对同 id 是更新而非追加', async () => {
    const t = newTask({ title: 'a', markdown: '' });
    await saveTask(t);
    await saveTask({ ...t, title: 'b' });
    expect(await listTasks()).toHaveLength(1);
    expect((await getTask(t.id))?.title).toBe('b');
  });

  it('updatePlatformStatus 更新单平台状态', async () => {
    const t = newTask({ title: 'a', markdown: '' });
    await saveTask(t);
    await updatePlatformStatus(t.id, 'zhihu', { state: 'failed', reason: '请先登录' });
    expect((await getTask(t.id))?.platformStatus.zhihu).toEqual({ state: 'failed', reason: '请先登录' });
  });
});
