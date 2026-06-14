import { useState } from 'react';
import { T, btn } from '../../lib/ui';
import { newMpAccount, saveSettings, type MpAccount } from '../../lib/settings';

const field: React.CSSProperties = {
  border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: '8px 11px',
  fontSize: 13, fontFamily: T.fontSans, color: T.text, background: T.card, boxSizing: 'border-box',
};

/** 设置面板:公众号多账号管理(备注名 + 会话级 token) */
export function SettingsPanel({ accounts, onSaved, onClose }: {
  accounts: MpAccount[];
  onSaved: (accounts: MpAccount[]) => void;
  onClose: () => void;
}) {
  const [list, setList] = useState<MpAccount[]>(accounts.length ? accounts : []);

  const update = (id: string, patch: Partial<MpAccount>) =>
    setList((l) => l.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  const remove = (id: string) => setList((l) => l.filter((a) => a.id !== id));
  const add = () => setList((l) => [...l, newMpAccount()]);

  const save = async () => {
    const cleaned = list.filter((a) => a.name.trim() || a.token.trim());
    await saveSettings({ mpAccounts: cleaned });
    onSaved(cleaned);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(10,18,22,.55)', zIndex: 1100,
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.fontSans,
    }} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: T.paper, borderRadius: T.radiusCard, boxShadow: T.shadowModal, width: 560, maxWidth: '94vw', maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ background: T.ink, color: '#fff', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>设置 · 公众号账号</span>
          <button type="button" aria-label="关闭" onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,.7)', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: 20 }}>
          <div style={{ fontSize: 12, color: T.textSoft, lineHeight: 1.7, background: T.goldFaint + '88', border: `1px solid ${T.gold}55`, borderRadius: T.radiusSm, padding: '10px 12px', marginBottom: 16 }}>
            登录公众号后台后,复制地址栏 <code style={{ background: '#fff', padding: '1px 5px', borderRadius: 4 }}>token=</code> 后面的数字,填到对应账号。
            <br />
            <strong style={{ color: T.err }}>注意</strong>:实际发到哪个号取决于<strong>浏览器当前登录的号</strong>;token 为会话级,过期后需重新复制。
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {list.length === 0 && (
              <div style={{ fontSize: 13, color: T.textFaint, textAlign: 'center', padding: '16px 0' }}>
                还没有账号。添加后,公众号"去发布"时可选择目标号直达编辑器。
              </div>
            )}
            {list.map((a) => (
              <div key={a.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input style={{ ...field, width: 130, flexShrink: 0 }} placeholder="账号备注名"
                  value={a.name} onChange={(e) => update(a.id, { name: e.target.value })} />
                <input style={{ ...field, flex: 1, minWidth: 0 }} placeholder="token(地址栏 token= 后的数字)"
                  value={a.token} onChange={(e) => update(a.id, { token: e.target.value })} />
                <button type="button" onClick={() => remove(a.id)}
                  style={{ ...btn.ghost(), padding: '7px 12px', color: T.err, borderColor: `${T.err}55` }}>删除</button>
              </div>
            ))}
          </div>

          <button type="button" onClick={add} style={{ ...btn.ghost(), marginTop: 12 }}>＋ 添加账号</button>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
            <button type="button" style={btn.ghost()} onClick={onClose}>取消</button>
            <button type="button" style={btn.gold()} onClick={() => void save()}>保存</button>
          </div>
        </div>
      </div>
    </div>
  );
}
