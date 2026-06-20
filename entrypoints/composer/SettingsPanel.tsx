import { useState } from 'react';
import { PLATFORMS, type PlatformId } from '../../lib/platforms';
import { T, btn, PLATFORM_COLORS } from '../../lib/ui';
import {
  newMpAccount, newSnippet, saveSettings,
  type MpAccount, type Snippet, type Settings, type AiFeatureId, type AiFeatureConfig,
} from '../../lib/settings';
import { exportBackup, importBackup } from '../../lib/backup';
import { AI_PROVIDERS, AI_FEATURES, listModels } from '../../lib/ai';
import { DEFAULT_PROVIDER, getProvider } from '../../lib/ai-providers';

const field: React.CSSProperties = {
  border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: '8px 11px',
  fontSize: 13, fontFamily: T.fontSans, color: T.text, background: T.card, boxSizing: 'border-box',
};

/** 模型选择:真 select(总是列出全部候选)+「自定义…」逃生口(给聚合站/自建网关填任意 id)。
 *  外层按 provider 设 key,切服务商时整体重挂、custom 态自动复位。 */
function ModelPicker({ value, options, defaultModel, width = 156, onChange }: {
  value: string; options: string[]; defaultModel: string; width?: number; onChange: (v: string) => void;
}) {
  const inList = options.includes(value);
  const [custom, setCustom] = useState(!!value && !inList);
  const selectVal = custom ? '__custom__' : (inList ? value : '');
  return (
    <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
      <select style={{ ...field, width: custom ? 96 : width, cursor: 'pointer' }} value={selectVal}
        onChange={(e) => {
          const v = e.target.value;
          if (v === '__custom__') { setCustom(true); onChange(''); }
          else { setCustom(false); onChange(v); }
        }}>
        <option value="">默认{defaultModel ? `(${defaultModel})` : '(需选)'}</option>
        {options.map((m) => <option key={m} value={m}>{m}</option>)}
        <option value="__custom__">自定义…</option>
      </select>
      {custom && (
        <input style={{ ...field, width: 130 }} placeholder="模型 id" value={value}
          onChange={(e) => onChange(e.target.value)} />
      )}
    </span>
  );
}

/** 设置面板:公众号多账号 + 常用片段管理 */
export function SettingsPanel({ settings, onSaved, onClose }: {
  settings: Settings;
  onSaved: (settings: Settings) => void;
  onClose: () => void;
}) {
  const [accounts, setAccounts] = useState<MpAccount[]>(settings.mpAccounts);
  const [snippets, setSnippets] = useState<Snippet[]>(settings.snippets);
  const [enabled, setEnabled] = useState<Set<PlatformId>>(new Set(settings.enabledPlatforms));
  const [aiProvider, setAiProvider] = useState(settings.aiProvider || DEFAULT_PROVIDER);
  const [aiBaseURL, setAiBaseURL] = useState(settings.aiBaseURL ?? '');
  const [aiApiKey, setAiApiKey] = useState(settings.aiApiKey ?? '');
  const [aiModel, setAiModel] = useState(settings.aiModel ?? '');
  const [aiFeatures, setAiFeatures] = useState<Partial<Record<AiFeatureId, AiFeatureConfig>>>(settings.aiFeatures ?? {});
  const [fetchedModels, setFetchedModels] = useState<Record<string, string[]>>({});
  const [modelLoading, setModelLoading] = useState(false);
  const [modelErr, setModelErr] = useState<string | null>(null);
  const upFeature = (id: AiFeatureId, patch: Partial<AiFeatureConfig>) =>
    setAiFeatures((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  const modelOptions = (provider: string) =>
    [...new Set([...getProvider(provider).models, ...(fetchedModels[provider] ?? [])])];
  const pullModels = async () => {
    setModelLoading(true);
    setModelErr(null);
    try {
      const ids = await listModels(aiProvider, aiBaseURL || getProvider(aiProvider).baseURL, aiApiKey);
      setFetchedModels((m) => ({ ...m, [aiProvider]: ids }));
    } catch (e) {
      setModelErr(e instanceof Error ? e.message : String(e));
    } finally {
      setModelLoading(false);
    }
  };

  const upAcc = (id: string, patch: Partial<MpAccount>) =>
    setAccounts((l) => l.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  const upSnip = (id: string, patch: Partial<Snippet>) =>
    setSnippets((l) => l.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const togglePlatform = (id: PlatformId) =>
    setEnabled((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const doExport = async () => {
    const data = await exportBackup();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lingyu-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const doImport = (file: File) => {
    const r = new FileReader();
    r.onload = async () => {
      try {
        const { tasks } = await importBackup(JSON.parse(r.result as string));
        alert(`已导入 ${tasks} 篇文章及设置,即将刷新。`);
        location.reload();
      } catch (e) {
        alert('导入失败:' + (e instanceof Error ? e.message : String(e)));
      }
    };
    r.readAsText(file);
  };

  const save = async () => {
    const next: Settings = {
      mpAccounts: accounts.filter((a) => a.name.trim() || a.token.trim()),
      snippets: snippets.filter((s) => s.name.trim() || s.content.trim()),
      enabledPlatforms: PLATFORMS.filter((p) => enabled.has(p.id)).map((p) => p.id),
      aiProvider,
      aiBaseURL: aiBaseURL.trim(),
      aiApiKey: aiApiKey.trim(),
      aiModel: aiModel.trim(),
      aiFeatures: AI_FEATURES.reduce<Partial<Record<AiFeatureId, AiFeatureConfig>>>((acc, f) => {
        const c = aiFeatures[f.id];
        const provider = c?.provider ?? '';
        const baseURL = c?.baseURL?.trim() ?? '';
        const apiKey = c?.apiKey?.trim() ?? '';
        const model = c?.model?.trim() ?? '';
        if (provider || baseURL || apiKey || model) acc[f.id] = { provider, baseURL, apiKey, model };
        return acc;
      }, {}),
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

          <div style={{ ...sectionH, marginTop: 24, paddingTop: 18, borderTop: `1px solid ${T.border}` }}>AI 助手(自带 API Key)</div>
          <div style={{ fontSize: 12, color: T.textSoft, lineHeight: 1.7, background: T.goldFaint + '88', border: `1px solid ${T.gold}55`, borderRadius: T.radiusSm, padding: '10px 12px', marginBottom: 12 }}>
            支持 Claude、Kimi、DeepSeek、GLM、MiniMax 官方,以及 OpenRouter / AiHubMix 聚合。填入对应服务商的 API Key 即可用 AI 生成变体、起标题、推荐话题、做语义体检。
            <strong> Key 仅存本地</strong>,不上传;仅在你<strong>主动点 AI 功能</strong>时把相关正文发往所选服务商。
            可对每个功能单独设置服务商/Key/模型,<strong>留空则用全局默认</strong>。
          </div>

          <div style={{ fontSize: 12, color: T.textFaint, marginBottom: 6 }}>全局默认</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
            <select style={{ ...field, width: 150, flexShrink: 0, cursor: 'pointer' }}
              value={aiProvider} onChange={(e) => {
                const np = e.target.value;
                setAiProvider(np);
                setAiBaseURL(''); // 旧服务商的代理地址不应带到新服务商
                setAiModel(''); // 清空:留旧值会过滤掉新候选,填默认又只剩一个匹配;空值时下拉显示该家全部模型,调用时回退默认
              }}>
              {AI_PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
            <input style={{ ...field, flex: 1, minWidth: 160 }} placeholder={`API 地址,默认 ${getProvider(aiProvider).baseURL || '(官方)'}`}
              value={aiBaseURL} onChange={(e) => setAiBaseURL(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
            <input type="password" style={{ ...field, flex: 1, minWidth: 160 }} placeholder={`API Key(${getProvider(aiProvider).keyHint})`}
              value={aiApiKey} onChange={(e) => setAiApiKey(e.target.value)} autoComplete="off" />
            <ModelPicker key={`gm-${aiProvider}`} value={aiModel} options={modelOptions(aiProvider)}
              defaultModel={getProvider(aiProvider).defaultModel} onChange={setAiModel} />
            <button type="button" onClick={() => void pullModels()} disabled={modelLoading}
              style={{ ...btn.ghost(), padding: '7px 12px', fontSize: 12, opacity: modelLoading ? 0.6 : 1 }}>
              {modelLoading ? '拉取中…' : '拉取模型'}
            </button>
          </div>
          {modelErr && <div style={{ fontSize: 12, color: T.err, marginBottom: 8 }}>拉取失败:{modelErr}</div>}
          <div style={{ height: 10 }} />

          <div style={{ fontSize: 12, color: T.textFaint, marginBottom: 6 }}>分功能覆盖(留空跟随全局)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {AI_FEATURES.map((f) => {
              const fc = aiFeatures[f.id];
              const eff = fc?.provider || aiProvider;
              return (
                <div key={f.id} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ width: 84, flexShrink: 0, fontSize: 12, color: T.textSoft }}>{f.label}</span>
                  <select style={{ ...field, width: 116, flexShrink: 0, cursor: 'pointer' }}
                    value={fc?.provider ?? ''} onChange={(e) => {
                      // 切服务商时清空该功能的地址与模型(空值下拉显示新家全部候选,调用时回退默认)
                      upFeature(f.id, { provider: e.target.value, baseURL: '', model: '' });
                    }}>
                    <option value="">跟随全局</option>
                    {AI_PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </select>
                  <input style={{ ...field, width: 150, flexShrink: 0 }} placeholder="API 地址(默认)"
                    value={fc?.baseURL ?? ''} onChange={(e) => upFeature(f.id, { baseURL: e.target.value })} />
                  <input type="password" style={{ ...field, flex: 1, minWidth: 90 }} placeholder="留空用全局 Key"
                    value={fc?.apiKey ?? ''} onChange={(e) => upFeature(f.id, { apiKey: e.target.value })} autoComplete="off" />
                  <ModelPicker key={`fm-${f.id}-${eff}`} value={fc?.model ?? ''} options={modelOptions(eff)}
                    defaultModel={getProvider(eff).defaultModel} width={130} onChange={(v) => upFeature(f.id, { model: v })} />
                </div>
              );
            })}
          </div>

          <div style={{ ...sectionH, marginTop: 24, paddingTop: 18, borderTop: `1px solid ${T.border}` }}>数据备份</div>
          <div style={{ fontSize: 12, color: T.textSoft, marginBottom: 12 }}>
            导出全部文章(含图片)与设置为一个 JSON 文件,换设备或防清除时导入恢复。
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" style={btn.ghost()} onClick={() => void doExport()}>导出备份</button>
            <label style={{ ...btn.ghost(), display: 'inline-block' }}>
              导入备份
              <input type="file" accept="application/json,.json" style={{ display: 'none' }}
                onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) doImport(f); }} />
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
            <button type="button" style={btn.ghost()} onClick={onClose}>取消</button>
            <button type="button" style={btn.gold()} onClick={() => void save()}>保存</button>
          </div>
        </div>
      </div>
    </div>
  );
}
