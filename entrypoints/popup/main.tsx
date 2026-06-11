import { createRoot } from 'react-dom/client';
import { PLATFORMS } from '../../lib/platforms';

function Popup() {
  const open = (url: string) => browser.tabs.create({ url });
  return (
    <div style={{ width: 260, padding: 12, fontFamily: 'system-ui' }}>
      <button
        style={{ width: '100%', padding: 8, marginBottom: 10, fontWeight: 600 }}
        onClick={() => open(browser.runtime.getURL('/composer.html'))}
      >
        ✍️ 新建分发
      </button>
      {PLATFORMS.map((p) => (
        <button
          key={p.id}
          style={{ display: 'block', width: '100%', padding: 6, marginBottom: 4, textAlign: 'left' }}
          onClick={() => open(p.publishUrl)}
        >
          {p.name}{p.supportsFill ? ' · 支持自动填充' : ''}
        </button>
      ))}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<Popup />);
