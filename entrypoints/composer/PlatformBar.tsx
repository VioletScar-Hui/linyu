import { useState } from 'react';
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
  const [selected, setSelected] = useState<Set<PlatformId>>(new Set());

  const fill = async (ids: PlatformId[]) => {
    await onBeforeFill(); // 先落库,适配器读到的才是最新内容
    for (const id of ids) {
      await browser.runtime.sendMessage({ kind: 'start-fill', platformId: id, taskId: task.id });
    }
  };

  const toggle = (id: PlatformId) =>
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const allIds = PLATFORMS.map((p) => p.id);
  const allSelected = selected.size === allIds.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 10 }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.textSoft, cursor: 'pointer' }}>
          <input type="checkbox" checked={allSelected}
            onChange={() => setSelected(allSelected ? new Set() : new Set(allIds))} />
          全选
        </label>
        <button type="button" disabled={selected.size === 0}
          onClick={() => void fill([...selected])}
          style={{
            ...btn.gold(), padding: '6px 16px', fontSize: 13,
            opacity: selected.size === 0 ? 0.45 : 1, cursor: selected.size === 0 ? 'default' : 'pointer',
          }}>
          一键填充已选{selected.size > 0 ? ` (${selected.size})` : ''}
        </button>
      </div>

      {PLATFORMS.map((p, i) => {
        const st = task.platformStatus[p.id];
        return (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '11px 4px',
            borderTop: `1px solid ${T.borderSoft}`,
          }}>
            <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)}
              style={{ flexShrink: 0, cursor: 'pointer' }} aria-label={`选择${p.name}`} />
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: PLATFORM_COLORS[p.id], flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: T.text, width: 92, flexShrink: 0 }}>{p.name}</span>
            <button type="button"
              onClick={() => void fill([p.id])}
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
