import { beforeEach, describe, expect, it } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import { saveTask, getTask, listTaskMetas, updatePlatformStatus, newTask, deleteTask, duplicateTask, migrateIfNeeded } from '../lib/tasks';

beforeEach(() => fakeBrowser.reset());

describe('deleteTask / duplicateTask', () => {
  it('删除后任务与索引均不含该任务', async () => {
    const t = newTask({ title: 'a', markdown: '正文' });
    await saveTask(t);
    await deleteTask(t.id);
    expect(await getTask(t.id)).toBeUndefined();
    expect(await listTaskMetas()).toHaveLength(0);
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

  it('索引按 createdAt 降序且最多 20 篇,超额任务被清除', async () => {
    const ids: string[] = [];
    for (let i = 0; i < 25; i++) {
      const t = { ...newTask({ title: `t${i}`, markdown: '' }), createdAt: i };
      ids.push(t.id);
      await saveTask(t);
    }
    const list = await listTaskMetas();
    expect(list).toHaveLength(20);
    expect(list[0].title).toBe('t24'); // 最新在前
    // 最老的 t0 应被清除(任务 key 也删了)
    expect(await getTask(ids[0])).toBeUndefined();
  });

  it('saveTask 对同 id 是更新而非追加', async () => {
    const t = newTask({ title: 'a', markdown: '' });
    await saveTask(t);
    await saveTask({ ...t, title: 'b' });
    expect(await listTaskMetas()).toHaveLength(1);
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

  it('updatePlatformStatus 可推进状态(pending→filled),且同步到索引', async () => {
    const t = newTask({ title: 'a', markdown: '' });
    await saveTask(t);
    await updatePlatformStatus(t.id, 'zhihu', { state: 'pending' });
    await updatePlatformStatus(t.id, 'zhihu', { state: 'filled' });
    expect((await getTask(t.id))?.platformStatus.zhihu).toEqual({ state: 'filled' });
    const meta = (await listTaskMetas()).find((m) => m.id === t.id);
    expect(meta?.platformStatus.zhihu).toEqual({ state: 'filled' });
  });
});

describe('migrateIfNeeded', () => {
  it('旧 tasks 单 key 迁移到新布局并删除旧 key', async () => {
    const a = { ...newTask({ title: 'old-a', markdown: 'A' }), createdAt: 2 };
    const b = { ...newTask({ title: 'old-b', markdown: 'B' }), createdAt: 1 };
    await fakeBrowser.storage.local.set({ tasks: [a, b] });

    await migrateIfNeeded();

    const metas = await listTaskMetas();
    expect(metas.map((m) => m.title)).toEqual(['old-a', 'old-b']); // 降序
    expect((await getTask(a.id))?.markdown).toBe('A');
    expect((await fakeBrowser.storage.local.get('tasks')).tasks).toBeUndefined();
  });

  it('无旧数据时为无操作', async () => {
    await migrateIfNeeded();
    expect(await listTaskMetas()).toEqual([]);
  });
});
