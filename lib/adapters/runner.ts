import { browser } from 'wxt/browser';
import type { Adapter } from './types';
import type { ClaimTaskResponse, Msg } from '../messaging';
import type { PlatformStatus } from '../tasks';

/** 通用流程:编辑器页 → 认领任务 → 登录检查 → 填充 → 回报。无任务则静默退出。 */
export async function runAdapter(adapter: Adapter): Promise<void> {
  if (!adapter.isEditorPage()) return;

  const resp = (await browser.runtime.sendMessage({
    kind: 'claim-task',
    platformId: adapter.platformId,
  } satisfies Msg)) as ClaimTaskResponse | undefined;
  const task = resp?.task;
  if (!task) return;

  const report = (status: PlatformStatus) =>
    browser.runtime.sendMessage({
      kind: 'report-fill',
      platformId: adapter.platformId,
      taskId: task.id,
      status,
    } satisfies Msg);

  try {
    if (!(await adapter.checkLogin())) {
      await report({ state: 'failed', reason: '请先登录该平台,再回撰写页点"重试填充"' });
      return;
    }
    const r = await adapter.fill(task);
    if (r.ok) await report({ state: 'filled', note: r.note });
    else await report({ state: 'failed', reason: `${r.failedStep ?? '填充'}失败:${r.reason ?? '未知原因'}` });
  } catch (e) {
    await report({ state: 'failed', reason: e instanceof Error ? e.message : String(e) });
  }
}
