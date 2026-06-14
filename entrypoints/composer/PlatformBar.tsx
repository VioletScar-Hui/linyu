import { useState } from 'react';
import { browser } from 'wxt/browser';
import { PLATFORMS, type PlatformId } from '../../lib/platforms';
import { T, btn, PLATFORM_COLORS, StatusPill } from '../../lib/ui';
import { buildWeixinEditorUrl } from '../../lib/weixin-url';
import type { MpAccount } from '../../lib/settings';
import type { Task, PlatformStatus } from '../../lib/tasks';

function statusView(status?: PlatformStatus) {
  if (!status) return null;
  if (status.state === 'pending')
    return <StatusPill state="pending" text="等待填充…(需登录;编辑器已开请刷新)" />;
  if (status.state === 'filled')
    return <StatusPill state="filled" text={`已填充,请检查后发布${status.note ? `(${status.note})` : ''}`} />;
  return <StatusPill state="failed" text={status.reason} />;
}

export function PlatformBar({ task, mpAccounts, enabled, onBeforeFill }: {
  task: Task;
  mpAccounts: MpAccount[];
  enabled: Set<string>;
  onBeforeFill: () => Promise<void>;
}) {
  const [selected, setSelected] = useState<Set<PlatformId>>(new Set());
  const [pickMp, setPickMp] = useState(false); // 公众号选号行展开

  const rows = PLATFORMS.filter((p) => enabled.has(p.id));
  const fillableIds = rows.filter((p) => p.supportsFill).map((p) => p.id);

  const fill = async (id: PlatformId, openUrl?: string) => {
    await onBeforeFill();
    await browser.runtime.sendMessage({ kind: 'start-fill', platformId: id, taskId: task.id, openUrl });
  };

  const batchFill = async () => {
    await onBeforeFill();
    for (const id of selected) {
      await browser.runtime.sendMessage({ kind: 'start-fill', platformId: id, taskId: task.id });
    }
  };

  // 公众号单点:有账号则展开选号;无账号走默认(自动读首页 token)
  const clickWeixin = () => {
    if (mpAccounts.length > 0) setPickMp((v) => !v);
    else void fill('weixin');
  };

  const pickAccount = (acc: MpAccount) => {
    setPickMp(false);
    if (!acc.token.trim()) { void fill('weixin'); return; } // 没填 token 退回自动
    if (window.confirm(`请确认浏览器当前登录的公众号是「${acc.name || '该账号'}」,否则会发到当前登录的号。\n继续直达编辑器?`)) {
      void fill('weixin', buildWeixinEditorUrl(acc.token.trim()));
    }
  };

  const toggle = (id: PlatformId) =>
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const allSelected = fillableIds.length > 0 && selected.size === fillableIds.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 10 }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.textSoft, cursor: 'pointer' }}>
          <input type="checkbox" checked={allSelected}
            onChange={() => setSelected(allSelected ? new Set() : new Set(fillableIds))} />
          全选可填充
        </label>
        <button type="button" disabled={selected.size === 0} onClick={() => void batchFill()}
          style={{ ...btn.gold(), padding: '6px 16px', fontSize: 13, opacity: selected.size === 0 ? 0.45 : 1, cursor: selected.size === 0 ? 'default' : 'pointer' }}>
          一键填充已选{selected.size > 0 ? ` (${selected.size})` : ''}
        </button>
        {selected.has('weixin') && mpAccounts.length > 0 && (
          <span style={{ fontSize: 11, color: T.textFaint }}>批量含公众号时走当前登录号;精确选号请单独点公众号"去发布"</span>
        )}
      </div>

      {rows.map((p) => {
        const st = task.platformStatus[p.id];
        const isWeixin = p.id === 'weixin';
        return (
          <div key={p.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 4px', borderTop: `1px solid ${T.borderSoft}` }}>
              {p.supportsFill ? (
                <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)}
                  style={{ flexShrink: 0, cursor: 'pointer' }} aria-label={`选择${p.name}`} />
              ) : (
                <span style={{ width: 13, flexShrink: 0 }} />
              )}
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: PLATFORM_COLORS[p.id], flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: T.text, width: 92, flexShrink: 0 }}>{p.name}</span>
              {p.supportsFill ? (
                <button type="button"
                  onClick={() => (isWeixin ? clickWeixin() : void fill(p.id))}
                  style={{ ...btn.ghost(), padding: '6px 14px', flexShrink: 0, ...(st?.state === 'failed' ? { borderColor: `${T.err}66`, color: T.err } : {}) }}>
                  {st?.state === 'failed' ? '重试填充' : isWeixin && mpAccounts.length > 0 ? '去发布 ▾' : '去发布'}
                </button>
              ) : (
                <button type="button"
                  onClick={() => void browser.tabs.create({ url: p.publishUrl })}
                  style={{ ...btn.ghost(), padding: '6px 14px', flexShrink: 0, color: T.textSoft }}>
                  跳转
                </button>
              )}
              <span style={{ marginLeft: 'auto', minWidth: 0 }}>
                {p.supportsFill ? statusView(st) : <span style={{ fontSize: 11, color: T.textFaint }}>仅跳转</span>}
              </span>
            </div>
            {isWeixin && pickMp && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '4px 4px 12px 36px' }}>
                <span style={{ fontSize: 12, color: T.textSoft, alignSelf: 'center' }}>选目标号:</span>
                {mpAccounts.map((a) => (
                  <button key={a.id} type="button" onClick={() => pickAccount(a)}
                    style={{ ...btn.ghost(), padding: '5px 12px', fontSize: 12 }}>
                    {a.name || '(未命名)'}{!a.token.trim() && <span style={{ color: T.warn }}> ·无token</span>}
                  </button>
                ))}
                <button type="button" onClick={() => { setPickMp(false); void fill('weixin'); }}
                  style={{ ...btn.ghost(), padding: '5px 12px', fontSize: 12, color: T.textSoft }}>自动(当前登录号)</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
