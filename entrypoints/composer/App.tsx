import { useState } from 'react';
import { type Task } from '../../lib/tasks';
import { T, btn, BrandHeader, Card, SectionTitle } from '../../lib/ui';
import { RichEditor } from './RichEditor';
import { VariantTabs } from './VariantTabs';
import { PlatformBar } from './PlatformBar';
import { History } from './History';
import { ImageGallery } from './ImageGallery';
import { SettingsPanel } from './SettingsPanel';
import { Preflight } from './Preflight';
import { useComposer } from './useComposer';

const field: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', border: `1px solid ${T.border}`, borderRadius: T.radiusSm,
  padding: '11px 14px', fontSize: 14, fontFamily: T.fontSans, color: T.text, background: T.card,
};

export function App({ initial }: { initial?: Task } = {}) {
  const [showSettings, setShowSettings] = useState(false);
  const {
    task, setTask, settings, ready, savedAt, autoSaved, toast,
    enabledSet, match, matchedSet, richApiRef,
    onEditorChange, applyMarkdown, newArticle, loadById,
    addImages, updateImage, removeImage, insertImage, insertSnippet,
    save, copyFallback, exportMarkdown, applySettings,
  } = useComposer(initial);

  return (
    <div style={{ minHeight: '100vh', background: T.paper, fontFamily: T.fontSans }}>
      <header style={{
        background: T.ink, padding: '16px 28px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <BrandHeader subtitle="一处撰写 · 羽传多平台" />
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" onClick={() => setShowSettings(true)} aria-label="设置"
            style={{
              background: 'transparent', color: 'rgba(255,255,255,.75)', border: '1px solid rgba(255,255,255,.25)',
              borderRadius: T.radiusBtn, padding: '9px 14px', fontSize: 13, cursor: 'pointer', fontFamily: T.fontSans,
            }}>⚙ 设置</button>
          <button type="button" onClick={newArticle} style={{ ...btn.gold(), padding: '9px 18px' }}>＋ 新文章</button>
        </div>
      </header>

      <div style={{
        display: 'flex', flexDirection: 'column', gap: 20,
        padding: 24, maxWidth: 920, margin: '0 auto',
      }}>
        <Card style={{ padding: '14px 18px' }}>
          {ready && <History currentId={task.id} refreshKey={savedAt} onLoadId={(id) => void loadById(id)} />}
        </Card>

        <Card>
          <SectionTitle n="1" title="文章" extra={
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, color: T.textFaint }}>{[...task.markdown].length} 字</span>
              <label style={{ ...btn.ghost(), display: 'inline-block', fontSize: 12, padding: '5px 12px' }}>
                导入 .md
                <input type="file" accept=".md,text/markdown" style={{ display: 'none' }}
                  onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void f.text().then((txt) => applyMarkdown(txt, { deriveTitle: true })).catch(console.error); }} />
              </label>
            </div>
          } />
          <input style={{ ...field, fontSize: 17, fontWeight: 500, marginBottom: 12 }}
            placeholder="标题(自动取自第一个 # 标题,可改)"
            value={task.title} onChange={(e) => setTask((t) => ({ ...t, title: e.target.value }))} />
          <div style={{ border: `1px solid ${T.border}`, borderRadius: T.radiusSm, minHeight: 360, overflow: 'hidden', background: T.card }}>
            <RichEditor value={task.markdown} images={task.images} onChange={onEditorChange}
              onReady={(api) => { richApiRef.current = api; }} />
          </div>
          {settings.snippets.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 10 }}>
              <span style={{ fontSize: 12, color: T.textFaint }}>插入片段:</span>
              {settings.snippets.map((s) => (
                <button key={s.id} type="button" onClick={() => insertSnippet(s.content)}
                  style={{ ...btn.ghost(), padding: '4px 12px', fontSize: 12 }}>{s.name || '(未命名)'}</button>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <SectionTitle n="2" title="配图与封面" extra={
            <span style={{ fontSize: 12, color: T.textFaint }}>悬停缩略图可编辑 / 设封面 / 插入正文 / 删除</span>
          } />
          <ImageGallery
            task={task} matchedSet={matchedSet} missing={match.missing}
            onAddImages={(fs) => void addImages(fs)} onUpdateImage={updateImage}
            onRemoveImage={removeImage} onSetCover={(f) => setTask((t) => ({ ...t, coverFilename: f }))}
            onInsertImage={insertImage} />
        </Card>

        <Card>
          <SectionTitle n="3" title="平台文案变体" extra={
            <span style={{ fontSize: 12, color: T.textFaint }}>长文平台用正文,这里写短文案</span>
          } />
          <VariantTabs task={task} onChange={(key, v) => setTask((t) => ({ ...t, variants: { ...t.variants, [key]: v } }))} />
        </Card>

        <Card>
          <SectionTitle n="4" title="分发到平台" />
          <div style={{ marginBottom: 14, paddingBottom: 14, borderBottom: `1px solid ${T.borderSoft}` }}>
            <Preflight task={task} missing={match.missing} enabled={enabledSet} />
          </div>
          <PlatformBar task={task} mpAccounts={settings.mpAccounts} enabled={enabledSet} onBeforeFill={save} />
          <div style={{ display: 'flex', gap: 10, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.borderSoft}` }}>
            <button type="button" style={btn.gold()} onClick={() => void save()}>保存任务</button>
            <button type="button" style={btn.ghost()} onClick={() => void exportMarkdown()}>导出 Markdown</button>
            <button type="button" style={btn.ghost()} onClick={() => void copyFallback()}>复制富文本(兜底)</button>
            {savedAt && (
              <span style={{ marginLeft: 'auto', alignSelf: 'center', fontSize: 12, color: T.textFaint }}>
                {autoSaved ? '已自动保存' : '已保存'} {new Date(savedAt).toLocaleTimeString()}
              </span>
            )}
          </div>
        </Card>
      </div>

      {showSettings && (
        <SettingsPanel settings={settings}
          onSaved={(s) => { applySettings(s); }}
          onClose={() => setShowSettings(false)} />
      )}

      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 2000,
          background: T.ink, color: '#fff', padding: '11px 22px', borderRadius: 24, fontSize: 13,
          boxShadow: T.shadowModal,
        }}>{toast}</div>
      )}
    </div>
  );
}
