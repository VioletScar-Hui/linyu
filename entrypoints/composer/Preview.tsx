import { useMemo } from 'react';
import { renderHtml } from '../../lib/markdown';
import { T } from '../../lib/ui';
import type { Task } from '../../lib/tasks';

export function Preview({ task }: { task: Task }) {
  const html = useMemo(() => {
    const imageMap = Object.fromEntries(task.images.map((i) => [i.filename, i.dataUrl]));
    return renderHtml(task.markdown, imageMap);
  }, [task.markdown, task.images]);

  return (
    <div
      className="lingyu-preview"
      style={{
        padding: '4px 4px', minHeight: 200, color: T.text, fontSize: 15, lineHeight: 1.75,
        wordBreak: 'break-word',
      }}
      dangerouslySetInnerHTML={{ __html: html || '<p style="color:#93a0a6">正文预览将在此显示…</p>' }}
    />
  );
}
