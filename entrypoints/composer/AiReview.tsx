import { useState } from 'react';
import { T, btn } from '../../lib/ui';
import { PLATFORMS } from '../../lib/platforms';
import { aiSemanticPreflight, type AiFinding } from '../../lib/ai-features';
import type { Settings } from '../../lib/settings';
import type { Task } from '../../lib/tasks';
import { useAiAction } from './useAiAction';

const SEV: Record<AiFinding['severity'], { label: string; color: string; bg: string }> = {
  high: { label: '高', color: T.err, bg: T.errBg },
  medium: { label: '中', color: T.warn, bg: T.warnBg },
  low: { label: '低', color: T.textSoft, bg: T.paper },
};

/** ✨ AI 语义体检:用 AI 查敏感词/平台禁忌/过度营销/标题党/调性,补机械体检看不出的问题。 */
export function AiReview({ settings, task, enabled }: {
  settings: Settings;
  task: Task;
  enabled: Set<string>;
}) {
  const [findings, setFindings] = useState<AiFinding[] | null>(null);
  const { loading, error, run } = useAiAction();

  const go = () => {
    const platforms = PLATFORMS.filter((p) => enabled.has(p.id)).map((p) => p.name);
    void run(
      () => aiSemanticPreflight(settings, task.title, task.markdown, platforms),
      (r) => setFindings(r.findings),
    );
  };

  return (
    <div>
      <button type="button" onClick={go} disabled={loading}
        style={{ ...btn.ghost(), padding: '5px 12px', fontSize: 12, opacity: loading ? 0.6 : 1 }}>
        {loading ? 'AI 体检中…' : '✨ AI 语义体检'}
      </button>
      {error && <div style={{ fontSize: 12, color: T.err, marginTop: 8 }}>AI 失败:{error}</div>}
      {findings && findings.length === 0 && (
        <div style={{ fontSize: 12, color: T.ok, marginTop: 8 }}>AI 未发现明显的合规/调性问题</div>
      )}
      {findings && findings.length > 0 && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {findings.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12 }}>
              <span style={{
                flexShrink: 0, fontSize: 11, padding: '1px 7px', borderRadius: 20,
                background: SEV[f.severity].bg, color: SEV[f.severity].color,
              }}>{SEV[f.severity].label}</span>
              <span style={{ color: T.textFaint, width: 64, flexShrink: 0 }}>{f.platform}</span>
              <span style={{ color: T.textSoft, lineHeight: 1.6 }}>{f.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
