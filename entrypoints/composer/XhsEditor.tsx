import { makeXhsVariant } from '../../lib/xhs';
import type { Task } from '../../lib/tasks';

export function XhsEditor({ task, onChange }: { task: Task; onChange: (t: Task) => void }) {
  const v = task.variants.xiaohongshu ?? { title: '', body: '' };
  const set = (patch: Partial<typeof v>) =>
    onChange({ ...task, variants: { ...task.variants, xiaohongshu: { ...v, ...patch } } });
  const titleLen = [...v.title].length;
  const bodyLen = [...v.body].length;

  return (
    <details>
      <summary><strong>小红书变体</strong>(标题≤20字,正文≤1000字)</summary>
      <button onClick={() => onChange({ ...task, variants: { ...task.variants, xiaohongshu: makeXhsVariant(task.title, task.markdown) } })}>
        从文章生成初稿
      </button>
      <input
        style={{ width: '100%', marginTop: 8 }}
        placeholder="小红书标题"
        value={v.title}
        onChange={(e) => set({ title: e.target.value })}
      />
      <span style={{ color: titleLen > 20 ? 'red' : '#888' }}>{titleLen}/20</span>
      <textarea
        style={{ width: '100%', height: 160 }}
        placeholder="小红书正文(可带 #话题#)"
        value={v.body}
        onChange={(e) => set({ body: e.target.value })}
      />
      <span style={{ color: bodyLen > 1000 ? 'red' : '#888' }}>{bodyLen}/1000</span>
    </details>
  );
}
