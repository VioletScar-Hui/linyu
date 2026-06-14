import { useMemo, useState } from 'react';
import { PLATFORMS } from '../../lib/platforms';
import { preflight, worstLevel } from '../../lib/preflight';
import { T, PLATFORM_COLORS } from '../../lib/ui';
import type { Task } from '../../lib/tasks';

/** 发布前体检:只列出有问题的平台(error 红 / warn 黄);全部就绪时一行绿提示 */
export function Preflight({ task, missing }: { task: Task; missing: string[] }) {
  const result = useMemo(() => preflight(task, missing), [task, missing]);
  const [open, setOpen] = useState(true);

  const rows = PLATFORMS.map((p) => ({ p, issues: result[p.id] ?? [], level: worstLevel(result[p.id]) }))
    .filter((r) => r.level !== 'ok');

  const errCount = rows.filter((r) => r.level === 'error').length;
  const warnCount = rows.filter((r) => r.level === 'warn').length;

  if (rows.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: T.ok, padding: '2px 0' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: T.ok }} />
        全部就绪 · 七平台均无明显问题
      </div>
    );
  }

  return (
    <div>
      <button type="button" onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, width: '100%', background: 'transparent',
          border: 'none', cursor: 'pointer', padding: '2px 0', fontFamily: T.fontSans,
        }}>
        <span style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .15s', fontSize: 11, color: T.textSoft }}>▶</span>
        <span style={{ fontSize: 13, color: T.text }}>发布前体检</span>
        {errCount > 0 && <span style={{ fontSize: 12, color: T.err }}>{errCount} 项待修</span>}
        {warnCount > 0 && <span style={{ fontSize: 12, color: T.warn }}>{warnCount} 项提醒</span>}
      </button>
      {open && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {rows.map(({ p, issues, level }) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: PLATFORM_COLORS[p.id], flexShrink: 0, marginTop: 4 }} />
              <span style={{ color: T.text, width: 84, flexShrink: 0 }}>{p.name}</span>
              <span style={{
                flexShrink: 0, marginTop: 1, fontSize: 11, padding: '1px 7px', borderRadius: 20,
                background: level === 'error' ? T.errBg : T.warnBg, color: level === 'error' ? T.err : T.warn,
              }}>{level === 'error' ? '待修' : '提醒'}</span>
              <span style={{ color: T.textSoft, lineHeight: 1.6 }}>
                {issues.map((i, k) => (
                  <span key={k} style={{ color: i.level === 'error' ? T.err : T.textSoft }}>
                    {k > 0 ? ' · ' : ''}{i.msg}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
