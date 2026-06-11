import { useMemo } from 'react';
import { renderHtml } from '../../lib/markdown';
import type { Task } from '../../lib/tasks';

export function Preview({ task }: { task: Task }) {
  const html = useMemo(() => {
    const imageMap = Object.fromEntries(task.images.map((i) => [i.filename, i.dataUrl]));
    return renderHtml(task.markdown, imageMap);
  }, [task.markdown, task.images]);

  return (
    <div
      style={{ border: '1px solid #ddd', padding: 16, height: 600, overflow: 'auto' }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
