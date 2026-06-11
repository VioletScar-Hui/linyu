import { useEffect, useState } from 'react';
import { listTasks, type Task } from '../../lib/tasks';

export function History({
  currentId,
  refreshKey,
  onLoad,
}: {
  currentId: string;
  refreshKey: number | null;
  onLoad: (t: Task) => void;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  useEffect(() => {
    void listTasks().then(setTasks);
  }, [currentId, refreshKey]);

  return (
    <details>
      <summary><strong>历史文章</strong>(最近 {tasks.length} 篇)</summary>
      <ul>
        {tasks.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              style={{ background: 'none', border: 'none', color: '#0969da', cursor: 'pointer', padding: 0 }}
              onClick={() => onLoad(t)}
            >
              {t.title || '(无标题)'}
            </button>
            <small> · {new Date(t.createdAt).toLocaleDateString()}</small>
            {t.id === currentId && <small> · 当前</small>}
          </li>
        ))}
      </ul>
    </details>
  );
}
