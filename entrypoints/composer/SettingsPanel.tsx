import { useState } from 'react';
import { PLATFORMS, type PlatformId } from '../../lib/platforms';
import { T, btn, PLATFORM_COLORS } from '../../lib/ui';
import {
  newMpAccount, newSnippet, saveSettings,
  type MpAccount, type Snippet, type Settings,
} from '../../lib/settings';

const field: React.CSSProperties = {
  border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: '8px 11px',
  fontSize: 13, fontFamily: T.fontSans, color: T.text, background: T.card, boxSizing: 'border-box',
};

/** 设置面板:公众号多账号 + 常用片段管理 */
export function SettingsPanel({ settings, onSaved, onClose }: {
  settings: Settings;
  onSaved: (settings: Settings) => void;
  onClose: () => void;
}) {
  const [accounts, setAccounts] = useState<MpAccount[]>(settings.mpAccounts);
  const [snippets, setSnippets] = useState<Snippet[]>(settings.snippets);
  const [enabled, setEnabled] = useState<Set<PlatformId>>(new Set(settings.enabledPlatforms));

  const upAcc = (id: string, patch: Partial<MpAccount>) =>
    setAccounts((l) => l.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  const upSnip = (id: string, patch: Partial<Snippet>) =>
    setSnippets((l) => l.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const togglePlatform = (id: PlatformId) =>
    setEnabled((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const save = async () => {
    const next: Settings = {
      mpAccounts: accounts.filter((a) => a.name.trim() || a.token.trim()),
      snippets: snippets.filter((s) => s.name.trim() || s.content.trim()),
      enabledPlatforms: PLATFORMS.filter((p) => enabled.has(p.id)).map((p) => p.id),
    };
    await saveSettings(next);
    onSaved(next);
    onClose();
  };

  const sectionH: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: T.text, margin: '4px 0 10px' };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(10,18,22,.55)', zIndex: 1100,
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.fontSans,
    }} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: T.paper, borderRadius: T.radiusCard, boxShadow: T.shadowModal, width: 580, maxWidth: '94vw', maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ background: T.ink, color: '#fff', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>设置</span>
          <button type="button" aria-label="关闭" onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,.7)', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: 20 }}>
          <div style={sectionH}>显示哪些平台</div>
          <div style={{ fontSize: 12, color: T.textSoft, marginBottom: 12 }}>
            勾选你常用的平台,popup 与分发区只显示它们。标「填充」的有自动填充适配器,其余仅快捷跳转。
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8, marginBottom: 8 }}>
            {PLATFORMS.map((p) => (
              <label key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', cursor: 'pointer',
                border: `1px solid ${enabled.has(p.id) ? T.gold : T.border}`, borderRadius: T.radiusSm,
                background: enabled.has(p.id) ? T.goldFaint + '66' : T.card, fontSize: 13,
              }}>
                <input type="checkbox" checked={enabled.has(p.id)} onChange={() => togglePlatform(p.id)} />
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: PLATFORM_COLORS[p.id], flexShrink: 0 }} />
                <span style={{ color: T.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                <span style={{ fontSize: 10, color: p.supportsFill ? T.ok : T.textFaint, flexShrink: 0 }}>
                  {p.supportsFill ? '填充' : '跳转'}
                </span>
              </label>
            ))}
          </div>

          <div style={{ ...sectionH, marginTop: 24, paddingTop: 18, borderTop: `1px solid ${T.border}` }}>公众号账号</div>
          <div style={{ fontSize: 12, color: T.textSoft, lineHeight: 1.7, background: T.goldFaint + '88', border: `1px solid ${T.gold}55`, borderRadius: T.radiusSm, padding: '10px 12px', marginBottom: 12 }}>
            登录公众号后台后,复制地址栏 <code style={{ background: '#fff', padding: '1px 5px', borderRadius: 4 }}>token=</code> 后的数字填入。
            <strong style={{ color: T.err }}> 注意</strong>:实际发到哪个号取决于<strong>浏览器当前登录的号</strong>;token 会话级,过期需重填。
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {accounts.map((a) => (
              <div key={a.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input style={{ ...field, width: 130, flexShrink: 0 }} placeholder="账号备注名"
                  value={a.name} onChange={(e) => upAcc(a.id, { name: e.target.value })} />
                <input style={{ ...field, flex: 1, minWidth: 0 }} placeholder="token(地址栏 token= 后的数字)"
                  value={a.token} onChange={(e) => upAcc(a.id, { token: e.target.value })} />
                <button type="button" onClick={() => setAccounts((l) => l.filter((x) => x.id !== a.id))}
                  style={{ ...btn.ghost(), padding: '7px 12px', color: T.err, borderColor: `${T.err}55` }}>删除</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setAccounts((l) => [...l, newMpAccount()])}
            style={{ ...btn.ghost(), marginTop: 10 }}>＋ 添加账号</button>

          <div style={{ ...sectionH, marginTop: 24, paddingTop: 18, borderTop: `1px solid ${T.border}` }}>常用片段</div>
          <div style={{ fontSize: 12, color: T.textSoft, marginBottom: 12 }}>
            保存开头语、结尾签名、关注引导等;撰写时在正文下方"插入片段"一键插到光标处。
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {snippets.map((s) => (
              <div key={s.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <input style={{ ...field, width: 130, flexShrink: 0 }} placeholder="片段名"
                  value={s.name} onChange={(e) => upSnip(s.id, { name: e.target.value })} />
                <textarea style={{ ...field, flex: 1, minWidth: 0, height: 56, resize: 'vertical' }} placeholder="片段内容(支持 Markdown)"
                  value={s.content} onChange={(e) => upSnip(s.id, { content: e.target.value })} />
                <button type="button" onClick={() => setSnippets((l) => l.filter((x) => x.id !== s.id))}
                  style={{ ...btn.ghost(), padding: '7px 12px', color: T.err, borderColor: `${T.err}55` }}>删除</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setSnippets((l) => [...l, newSnippet()])}
            style={{ ...btn.ghost(), marginTop: 10 }}>＋ 添加片段</button>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
            <button type="button" style={btn.ghost()} onClick={onClose}>取消</button>
            <button type="button" style={btn.gold()} onClick={() => void save()}>保存</button>
          </div>
        </div>
      </div>
    </div>
  );
}
