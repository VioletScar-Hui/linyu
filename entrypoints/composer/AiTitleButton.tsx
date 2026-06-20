import { useState } from 'react';
import { T, btn } from '../../lib/ui';
import { aiGenerateTitles, type AiTitleOption } from '../../lib/ai-features';
import type { Settings } from '../../lib/settings';
import { useAiAction } from './useAiAction';

/** ✨ AI 起标题:生成多角度候选,点一个套用到标题。 */
export function AiTitleButton({ settings, title, markdown, onPick }: {
  settings: Settings;
  title: string;
  markdown: string;
  onPick: (title: string) => void;
}) {
  const [options, setOptions] = useState<AiTitleOption[] | null>(null);
  const { loading, error, run, clearError } = useAiAction();

  const gen = () => void run(
    () => aiGenerateTitles(settings, title, markdown),
    (r) => setOptions(r.options),
  );
  const close = () => { setOptions(null); clearError(); };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button type="button" onClick={gen} disabled={loading}
        style={{ ...btn.ghost(), fontSize: 12, padding: '5px 12px', opacity: loading ? 0.6 : 1 }}>
        {loading ? '起标题中…' : '✨ AI 起标题'}
      </button>
      {(options || error) && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 50, width: 340,
          background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radiusSm,
          boxShadow: T.shadowModal, padding: 10,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: T.textFaint }}>选一个套用(可再改)</span>
            <button type="button" aria-label="关闭" onClick={close}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.textFaint, fontSize: 16, lineHeight: 1 }}>×</button>
          </div>
          {error && <div style={{ fontSize: 12, color: T.err }}>AI 失败:{error}</div>}
          {options?.map((o, i) => (
            <button key={i} type="button" onClick={() => { onPick(o.title); close(); }}
              style={{
                display: 'block', width: '100%', textAlign: 'left', background: 'transparent', cursor: 'pointer',
                border: 'none', borderTop: i > 0 ? `1px solid ${T.borderSoft}` : 'none', padding: '8px 4px', fontFamily: T.fontSans,
              }}>
              <div style={{ fontSize: 10, color: T.gold, marginBottom: 2 }}>{o.angle}</div>
              <div style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>{o.title}</div>
              <div style={{ fontSize: 11, color: T.textSoft, marginTop: 2 }}>{o.hook}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
