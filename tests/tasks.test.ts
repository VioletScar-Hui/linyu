import { beforeEach, describe, expect, it } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import { saveTask, getTask, listTasks, updatePlatformStatus, newTask, deleteTask, duplicateTask } from '../lib/tasks';

beforeEach(() => fakeBrowser.reset());

describe('deleteTask / duplicateTask', () => {
  it('删除后列表不含该任务', async () => {
    const t = newTask({ title: 'a', markdown: '正文' });
    await saveTask(t);
    await deleteTask(t.id);
    expect(await getTask(t.id)).toBeUndefined();
  });

  it('复制为新任务:新 id、标题加副本、清空状态、深拷贝变体', () => {
    const src = { ...newTask({ title: '原标题', markdown: '正文' }),
      variants: { x: { title: '', body: '推文' } },
      platformStatus: { zhihu: { state: 'filled' as const } } };
    const dup = duplicateTask(src);
    expect(dup.id).not.toBe(src.id);
    expect(dup.title).toBe('原标题 副本');
    expect(dup.platformStatus).toEqual({});
    expect(dup.variants.x?.body).toBe('推文');
    dup.variants.x!.body = '改了';
    expect(src.variants.x?.body).toBe('推文'); // 深拷贝,不互相影响
  });
});

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

  it('getTask 未知 id 返回 undefined', async () => {
    expect(await getTask('nonexistent')).toBeUndefined();
  });

  it('saveTask 不会清掉后台写入的平台状态', async () => {
    const t = newTask({ title: 'a', markdown: '' });
    await saveTask(t);
    await updatePlatformStatus(t.id, 'zhihu', { state: 'pending' });
    await saveTask({ ...t }); // 撰写页用旧内存状态(无 zhihu)再存
    expect((await getTask(t.id))?.platformStatus.zhihu).toEqual({ state: 'pending' });
  });

  it('updatePlatformStatus 可推进状态(pending→filled)', async () => {
    const t = newTask({ title: 'a', markdown: '' });
    await saveTask(t);
    await updatePlatformStatus(t.id, 'zhihu', { state: 'pending' });
    await updatePlatformStatus(t.id, 'zhihu', { state: 'filled' });
    expect((await getTask(t.id))?.platformStatus.zhihu).toEqual({ state: 'filled' });
  });
});
