import { useEffect, useState } from 'react';
import { getPlatform, type PlatformId } from '../../lib/platforms';
import { listTaskMetas, getTask, deleteTask, duplicateTask, saveTask, type TaskMeta } from '../../lib/tasks';
import { T, PLATFORM_COLORS } from '../../lib/ui';

const DOT: Record<'pending' | 'filled' | 'failed', string> = {
  pending: T.warn, filled: T.ok, failed: T.err,
};

function PlatformDots({ meta }: { meta: TaskMeta }) {
  const entries = Object.entries(meta.platformStatus) as [PlatformId, { state: keyof typeof DOT }][];
  if (entries.length === 0) return null;
  return (
    <span style={{ display: 'inline-flex', gap: 3, marginLeft: 6 }}>
      {entries.map(([pid, s]) => (
        <span key={pid} title={`${getPlatform(pid)?.name ?? pid}:${s.state}`}
          style={{ width: 7, height: 7, borderRadius: '50%', background: DOT[s.state], border: `1px solid ${PLATFORM_COLORS[pid]}33` }} />
      ))}
    </span>
  );
}

export function History({
  currentId, refreshKey, onLoadId,
}: {
  currentId: string;
  refreshKey: number | null;
  onLoadId: (id: string) => void;
}) {
  const [metas, setMetas] = useState<TaskMeta[]>([]);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [bump, setBump] = useState(0);

  useEffect(() => { void listTaskMetas().then(setMetas); }, [currentId, refreshKey, bump]);

  const filtered = q.trim()
    ? metas.filter((m) => (m.title || '无标题').toLowerCase().includes(q.trim().toLowerCase()))
    : metas;

  const onDelete = async (e: React.MouseEvent, m: TaskMeta) => {
    e.stopPropagation();
    if (window.confirm(`删除「${m.title || '无标题'}」?此操作不可撤销。`)) {
      await deleteTask(m.id);
      setBump((b) => b + 1);
    }
  };

  const onDuplicate = async (e: React.MouseEvent, m: TaskMeta) => {
    e.stopPropagation();
    const full = await getTask(m.id);
    if (!full) return;
    const dup = duplicateTask(full);
    await saveTask(dup);
    setBump((b) => b + 1);
    onLoadId(dup.id);
  };

  const iconBtn: React.CSSProperties = {
    background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 11, padding: '2px 6px',
    color: T.textFaint, borderRadius: 5, flexShrink: 0,
  };

  return (
    <div>
      <button type="button" onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, width: '100%', background: 'transparent',
          border: 'none', cursor: 'pointer', padding: '2px 0', color: T.textSoft, fontSize: 13, fontFamily: T.fontSans,
        }}>
        <span style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .15s', fontSize: 11 }}>▶</span>
        历史文章 · 最近 {metas.length} 篇
      </button>
      {open && (
        <div style={{ marginTop: 8 }}>
          {metas.length > 4 && (
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索标题…"
              style={{
                width: '100%', boxSizing: 'border-box', border: `1px solid ${T.border}`, borderRadius: T.radiusSm,
                padding: '7px 11px', fontSize: 13, marginBottom: 8, fontFamily: T.fontSans, color: T.text,
              }} />
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filtered.length === 0 && <div style={{ fontSize: 12, color: T.textFaint, padding: '4px 0' }}>
              {metas.length === 0 ? '暂无历史' : '无匹配标题'}
            </div>}
            {filtered.map((m) => (
              <div key={m.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  background: m.id === currentId ? T.goldFaint : 'transparent',
                  borderRadius: T.radiusSm, padding: '6px 8px',
                }}>
                <button type="button" onClick={() => onLoadId(m.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, textAlign: 'left', flex: 1, minWidth: 0,
                    background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: T.fontSans, padding: 0 }}>
                  <span style={{ fontSize: 13, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {m.title || '(无标题)'}
                  </span>
                  <PlatformDots meta={m} />
                  <span style={{ fontSize: 11, color: T.textFaint, flexShrink: 0 }}>{new Date(m.createdAt).toLocaleDateString()}</span>
                </button>
                <button type="button" title="复制为新任务" style={iconBtn}
                  onMouseEnter={(e) => (e.currentTarget.style.color = T.goldDeep)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = T.textFaint)}
                  onClick={(e) => void onDuplicate(e, m)}>复制</button>
                <button type="button" title="删除" style={iconBtn}
                  onMouseEnter={(e) => (e.currentTarget.style.color = T.err)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = T.textFaint)}
                  onClick={(e) => void onDelete(e, m)}>删除</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
