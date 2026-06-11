import { browser } from 'wxt/browser';
import { PLATFORMS, type PlatformId } from '../../lib/platforms';
import type { Task, PlatformStatus } from '../../lib/tasks';

function StatusBadge({ status }: { status?: PlatformStatus }) {
  if (!status) return null;
  if (status.state === 'pending')
    return <span>⏳ 等待填充…(若平台要求登录,请登录后进入编辑器,会自动继续)</span>;
  if (status.state === 'filled')
    return <span style={{ color: 'green' }}>✅ 已填充,请人工检查后发布{status.note ? `(${status.note})` : ''}</span>;
  return <span style={{ color: 'red' }}>❌ {status.reason}</span>;
}

export function PlatformBar({ task, onBeforeFill }: { task: Task; onBeforeFill: () => Promise<void> }) {
  const startFill = async (platformId: PlatformId) => {
    await onBeforeFill(); // 先落库,适配器读到的才是最新内容
    await browser.runtime.sendMessage({ kind: 'start-fill', platformId, taskId: task.id });
  };

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <tbody>
        {PLATFORMS.map((p) => (
          <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
            <td style={{ padding: 6, whiteSpace: 'nowrap' }}>{p.name}</td>
            <td>
              {p.supportsFill ? (
                <button type="button" onClick={() => void startFill(p.id)}>
                  {task.platformStatus[p.id]?.state === 'failed' ? '重试填充' : '去发布'}
                </button>
              ) : (
                <button type="button" onClick={() => void browser.tabs.create({ url: p.publishUrl })}>跳转</button>
              )}
            </td>
            <td><StatusBadge status={task.platformStatus[p.id]} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
