import { browser } from 'wxt/browser';
import { PLATFORMS, type PlatformId } from '../../lib/platforms';
import { T, btn, PLATFORM_COLORS, StatusPill } from '../../lib/ui';
import type { Task, PlatformStatus } from '../../lib/tasks';

function statusView(status?: PlatformStatus) {
  if (!status) return null;
  if (status.state === 'pending')
    return <StatusPill state="pending" text="等待填充…(需登录;编辑器已开请刷新)" />;
  if (status.state === 'filled')
    return <StatusPill state="filled" text={`已填充,请检查后发布${status.note ? `(${status.note})` : ''}`} />;
  return <StatusPill state="failed" text={status.reason} />;
}

export function PlatformBar({ task, onBeforeFill }: { task: Task; onBeforeFill: () => Promise<void> }) {
  const startFill = async (platformId: PlatformId) => {
    await onBeforeFill();
    await browser.runtime.sendMessage({ kind: 'start-fill', platformId, taskId: task.id });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {PLATFORMS.map((p, i) => {
        const st = task.platformStatus[p.id];
        return (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '11px 4px',
            borderTop: i === 0 ? 'none' : `1px solid ${T.borderSoft}`,
          }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: PLATFORM_COLORS[p.id], flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: T.text, width: 96, flexShrink: 0 }}>{p.name}</span>
            <button type="button"
              onClick={() => void startFill(p.id)}
              style={{
                ...btn.ghost(), padding: '6px 14px', flexShrink: 0,
                ...(st?.state === 'failed' ? { borderColor: `${T.err}66`, color: T.err } : {}),
              }}>
              {st?.state === 'failed' ? '重试填充' : '去发布'}
            </button>
            <span style={{ marginLeft: 'auto', minWidth: 0 }}>{statusView(st)}</span>
          </div>
        );
      })}
    </div>
  );
}
