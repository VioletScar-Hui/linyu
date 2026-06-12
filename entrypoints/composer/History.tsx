import { useEffect, useState } from 'react';
import { getPlatform, type PlatformId } from '../../lib/platforms';
import { listTasks, type Task } from '../../lib/tasks';
import { T, PLATFORM_COLORS } from '../../lib/ui';

const DOT: Record<'pending' | 'filled' | 'failed', string> = {
  pending: T.warn, filled: T.ok, failed: T.err,
};

function PlatformDots({ task }: { task: Task }) {
  const entries = Object.entries(task.platformStatus) as [PlatformId, { state: keyof typeof DOT }][];
  if (entries.length === 0) return null;
  return (
    <span style={{ display: 'inline-flex', gap: 3, marginLeft: 8 }}>
      {entries.map(([pid, s]) => (
        <span key={pid} title={`${getPlatform(pid)?.name ?? pid}:${s.state}`}
          style={{ width: 7, height: 7, borderRadius: '50%', background: DOT[s.state], border: `1px solid ${PLATFORM_COLORS[pid]}33` }} />
      ))}
    </span>
  );
}

export function History({
  currentId, refreshKey, onLoad,
}: {
  currentId: string;
  refreshKey: number | null;
  onLoad: (t: Task) => void;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [open, setOpen] = useState(false);
  useEffect(() => { void listTasks().then(setTasks); }, [currentId, refreshKey]);

  return (
    <div>
      <button type="button" onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, width: '100%', background: 'transparent',
          border: 'none', cursor: 'pointer', padding: '2px 0', color: T.textSoft, fontSize: 13,
          fontFamily: T.fontSans,
        }}>
        <span style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .15s', fontSize: 11 }}>▶</span>
        历史文章 · 最近 {tasks.length} 篇
      </button>
      {open && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {tasks.length === 0 && <div style={{ fontSize: 12, color: T.textFaint, padding: '4px 0' }}>暂无历史</div>}
          {tasks.map((t) => (
            <button key={t.id} type="button" onClick={() => onLoad(t)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4, textAlign: 'left', width: '100%',
                background: t.id === currentId ? T.goldFaint : 'transparent', border: 'none', cursor: 'pointer',
                borderRadius: T.radiusSm, padding: '7px 10px', fontFamily: T.fontSans,
              }}>
              <span style={{ fontSize: 13, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                {t.title || '(无标题)'}
              </span>
              <PlatformDots task={t} />
              <span style={{ fontSize: 11, color: T.textFaint, flexShrink: 0 }}>{new Date(t.createdAt).toLocaleDateString()}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
