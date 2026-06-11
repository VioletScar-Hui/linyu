import { createRoot } from 'react-dom/client';
import { PLATFORMS } from '../../lib/platforms';
import { T, PLATFORM_COLORS, BrandHeader } from '../../lib/ui';

function Popup() {
  const open = (url: string) => browser.tabs.create({ url });
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
          {PLATFORMS.map((p) => (
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

        <div style={{ marginTop: 14, fontSize: 11, color: T.textFaint, textAlign: 'center' }}>
          支持自动填充 · 内容由你最终确认发布
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<Popup />);
