import { useEffect, useState } from 'react';
import { listTasks, type Task } from '../../lib/tasks';

export function History({ currentId, onLoad }: { currentId: string; onLoad: (t: Task) => void }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  useEffect(() => {
    void listTasks().then(setTasks);
  }, [currentId]);

  return (
    <details>
      <summary><strong>历史文章</strong>(最近 {tasks.length} 篇)</summary>
      <ul>
        {tasks.map((t) => (
          <li key={t.id}>
            <a href="#" onClick={(e) => { e.preventDefault(); onLoad(t); }}>
              {t.title || '(无标题)'}
            </a>
            <small> · {new Date(t.createdAt).toLocaleDateString()}</small>
            {t.id === currentId && <small> · 当前</small>}
          </li>
        ))}
      </ul>
    </details>
  );
}
