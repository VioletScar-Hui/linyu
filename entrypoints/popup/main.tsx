import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { PLATFORMS, getPlatform } from '../../lib/platforms';
import { getSettings } from '../../lib/settings';
import { T, PLATFORM_COLORS, BrandHeader } from '../../lib/ui';
import type { SelfCheckResponse } from '../../lib/messaging';

function Popup() {
  const open = (url: string) => browser.tabs.create({ url });
  const [enabled, setEnabled] = useState<Set<string>>(new Set());
  const [check, setCheck] = useState<SelfCheckResponse | 'none' | 'checking' | null>(null);
  useEffect(() => { void getSettings().then((s) => setEnabled(new Set(s.enabledPlatforms))); }, []);
  const platforms = PLATFORMS.filter((p) => enabled.has(p.id));

  const selfCheck = async () => {
    setCheck('checking');
    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) { setCheck('none'); return; }
      const resp = (await browser.tabs.sendMessage(tab.id, { kind: 'self-check' })) as SelfCheckResponse | undefined;
      setCheck(resp && resp.results ? resp : 'none');
    } catch {
      setCheck('none'); // 当前页无对应 content script
    }
  };

  return (
    <div style={{ width: 340, background: T.paper, fontFamily: T.fontSans, color: T.text }}>
      <div style={{ background: T.ink, padding: '16px 18px' }}>
        <BrandHeader subtitle="一处撰写 · 羽传多平台" />
      </div>

      <div style={{ padding: 16 }}>
        <button
          onClick={() => open(browser.runtime.getURL('/composer.html'))}
          style={{
            width: '100%', padding: '12px 16px', marginBottom: 16, cursor: 'pointer',
            background: T.gold, color: T.ink, fontWeight: 500, fontSize: 15,
            border: 'none', borderRadius: T.radiusBtn, fontFamily: T.fontSans,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = T.goldDeep)}
          onMouseLeave={(e) => (e.currentTarget.style.background = T.gold)}
        >
          <span style={{ fontSize: 16 }}>✍</span> 新建分发
        </button>

        <div style={{ fontSize: 12, color: T.textFaint, letterSpacing: 1, margin: '4px 2px 10px' }}>
          快捷前往平台
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {platforms.map((p) => (
            <button
              key={p.id}
              onClick={() => open(p.publishUrl)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', cursor: 'pointer',
                background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radiusSm,
                fontFamily: T.fontSans, fontSize: 13, color: T.text, textAlign: 'left',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = T.shadowCard; e.currentTarget.style.borderColor = T.gold; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = T.border; }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: PLATFORM_COLORS[p.id], flexShrink: 0 }} />
              {p.name}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
          <button type="button" onClick={() => void selfCheck()}
            style={{
              width: '100%', padding: '8px 12px', cursor: 'pointer', background: T.card,
              border: `1px solid ${T.border}`, borderRadius: T.radiusSm, fontSize: 12, color: T.textSoft,
              fontFamily: T.fontSans,
            }}>
            🩺 自检当前页适配器
          </button>
          {check === 'checking' && <div style={{ fontSize: 11, color: T.textFaint, marginTop: 8, textAlign: 'center' }}>检查中…</div>}
          {check === 'none' && (
            <div style={{ fontSize: 11, color: T.textFaint, marginTop: 8, textAlign: 'center' }}>
              当前页不是受支持的平台编辑器页(请在编辑器页使用)
            </div>
          )}
          {check && typeof check === 'object' && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 12, color: T.text, marginBottom: 6 }}>
                {getPlatform(check.platformId)?.name ?? check.platformId} 选择器:
              </div>
              {check.results.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, padding: '2px 0' }}>
                  <span style={{ color: r.ok ? T.ok : T.err }}>{r.ok ? '✓' : '✗'}</span>
                  <span style={{ color: r.ok ? T.textSoft : T.err }}>{r.name}</span>
                </div>
              ))}
              {check.results.some((r) => !r.ok) && (
                <div style={{ fontSize: 11, color: T.warn, marginTop: 6 }}>
                  有失效项 → 改对应 lib/adapters/ 里的 SELECTORS 后重新构建
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ marginTop: 14, fontSize: 11, color: T.textFaint, textAlign: 'center' }}>
          内容由你最终确认发布
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<Popup />);
