import { useState } from 'react';
import { T, btn, PLATFORM_COLORS } from '../../lib/ui';
import { makeXhsVariant } from '../../lib/xhs';
import { makeXVariant, makeRedditVariant } from '../../lib/social-variants';
import type { Task } from '../../lib/tasks';

interface Variant { title: string; body: string }
type Key = 'xiaohongshu' | 'x' | 'reddit';

const TABS: { key: Key; label: string; color: string }[] = [
  { key: 'xiaohongshu', label: '小红书', color: PLATFORM_COLORS.xiaohongshu },
  { key: 'x', label: 'X', color: PLATFORM_COLORS.x },
  { key: 'reddit', label: 'Reddit', color: PLATFORM_COLORS.reddit },
];

function Counter({ len, max }: { len: number; max: number }) {
  return <span style={{ fontSize: 12, color: len > max ? T.err : T.textFaint }}>{len}/{max}</span>;
}

const field: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', border: `1px solid ${T.border}`, borderRadius: T.radiusSm,
  padding: '9px 12px', fontSize: 13, fontFamily: T.fontSans, color: T.text, background: T.card,
};

/** 三平台文案变体编辑(小红书 / X / Reddit),各带"从文章生成初稿" */
export function VariantTabs({
  task, onChange,
}: {
  task: Task;
  onChange: (key: Key, v: Variant) => void;
}) {
  const [active, setActive] = useState<Key>('xiaohongshu');
  const v: Variant = task.variants[active] ?? { title: '', body: '' };
  const set = (patch: Partial<Variant>) => onChange(active, { ...v, ...patch });

  const gen = () => {
    if (active === 'xiaohongshu') onChange('xiaohongshu', makeXhsVariant(task.title, task.markdown));
    else if (active === 'x') onChange('x', makeXVariant(task.title, task.markdown));
    else onChange('reddit', makeRedditVariant(task.title, task.markdown));
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {TABS.map((t) => {
          const on = active === t.key;
          const filled = !!(task.variants[t.key]?.title || task.variants[t.key]?.body);
          return (
            <button key={t.key} type="button" onClick={() => setActive(t.key)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 14px', cursor: 'pointer',
                border: `1px solid ${on ? T.gold : T.border}`, borderRadius: 20, fontSize: 13,
                background: on ? T.goldFaint : T.card, color: on ? T.goldDeep : T.textSoft,
                fontFamily: T.fontSans,
              }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: t.color }} />
              {t.label}{filled && <span style={{ color: T.ok, fontSize: 11 }}>·已填</span>}
            </button>
          );
        })}
        <button type="button" onClick={gen} style={{ ...btn.ghost(), marginLeft: 'auto' }}>从文章生成初稿</button>
      </div>

      {active === 'xiaohongshu' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input style={field} placeholder="小红书标题(≤20 字)" value={v.title}
              onChange={(e) => set({ title: e.target.value })} />
            <Counter len={[...v.title].length} max={20} />
          </div>
          <textarea style={{ ...field, height: 150, resize: 'vertical' }} placeholder="小红书正文(可带 #话题#,≤1000 字)"
            value={v.body} onChange={(e) => set({ body: e.target.value })} />
          <div style={{ textAlign: 'right' }}><Counter len={[...v.body].length} max={1000} /></div>
        </div>
      )}

      {active === 'x' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <textarea style={{ ...field, height: 130, resize: 'vertical' }}
            placeholder="X 推文(≤280 字,X 无标题;发布前可补文章链接)"
            value={v.body} onChange={(e) => set({ body: e.target.value })} />
          <div style={{ textAlign: 'right' }}><Counter len={[...v.body].length} max={280} /></div>
        </div>
      )}

      {active === 'reddit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input style={field} placeholder="Reddit 标题(≤300 字)" value={v.title}
              onChange={(e) => set({ title: e.target.value })} />
            <Counter len={[...v.title].length} max={300} />
          </div>
          <textarea style={{ ...field, height: 150, resize: 'vertical' }}
            placeholder="Reddit 正文(原生支持 Markdown)" value={v.body}
            onChange={(e) => set({ body: e.target.value })} />
        </div>
      )}
    </div>
  );
}
