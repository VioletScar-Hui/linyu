import { useEffect, useMemo, useRef, useState } from 'react';
import { deriveTitle, renderHtml, moveImageBlock, insertImageRef } from '../../lib/markdown';
import { extractImageRefs, matchImages } from '../../lib/images';
import { stripMarkdown } from '../../lib/xhs';
import { copyRichText } from '../../lib/clipboard';
import { newTask, saveTask, getTask, type Task, type TaskImage } from '../../lib/tasks';
import { T, btn, BrandHeader, Card, SectionTitle, LingyuMark } from '../../lib/ui';
import { Preview } from './Preview';
import { VariantTabs } from './VariantTabs';
import { PlatformBar } from './PlatformBar';
import { History } from './History';
import { ImageGallery } from './ImageGallery';
import { ImageEditor } from './ImageEditor';

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

const field: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', border: `1px solid ${T.border}`, borderRadius: T.radiusSm,
  padding: '11px 14px', fontSize: 14, fontFamily: T.fontSans, color: T.text, background: T.card,
};

export function App({ initial }: { initial?: Task } = {}) {
  const [task, setTask] = useState<Task>(() => initial ?? newTask({ title: '', markdown: '' }));
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [fullPreview, setFullPreview] = useState(false);
  const [editingImg, setEditingImg] = useState<TaskImage | null>(null);

  // Esc 退出全屏
  useEffect(() => {
    if (!fullPreview) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFullPreview(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullPreview]);

  const latestTask = useRef(task);
  useEffect(() => { latestTask.current = task; }, [task]);

  useEffect(() => {
    const listener = (changes: Record<string, unknown>, area: string) => {
      if (area !== 'local' || !('tasks' in changes)) return;
      void getTask(task.id).then((fresh) => {
        if (fresh) setTask((t) => ({ ...t, platformStatus: fresh.platformStatus }));
      });
    };
    browser.storage.onChanged.addListener(listener);
    return () => browser.storage.onChanged.removeListener(listener);
  }, [task.id]);

  const refs = useMemo(() => extractImageRefs(task.markdown), [task.markdown]);
  const match = useMemo(
    () => matchImages(refs, task.images.map((i) => i.filename)),
    [refs, task.images],
  );
  const matchedSet = useMemo(() => new Set(match.matched), [match]);

  const setMarkdown = (markdown: string) =>
    setTask((t) => ({ ...t, markdown, title: t.title || deriveTitle(markdown) }));

  const addImages = async (files: File[]) => {
    const results = await Promise.allSettled(
      files.filter((f) => f.type.startsWith('image/')).map(async (f): Promise<TaskImage> => ({
        filename: f.name, dataUrl: await readFileAsDataUrl(f), size: f.size,
      })),
    );
    const added = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    if (added.length === 0) return;
    setTask((t) => {
      const kept = t.images.filter((old) => !added.some((n) => n.filename === old.filename));
      const images = [...kept, ...added];
      return { ...t, images, coverFilename: t.coverFilename ?? images[0]?.filename };
    });
  };

  const updateImage = (filename: string, updated: TaskImage) =>
    setTask((t) => ({ ...t, images: t.images.map((i) => (i.filename === filename ? updated : i)) }));

  const removeImage = (filename: string) =>
    setTask((t) => ({
      ...t,
      images: t.images.filter((i) => i.filename !== filename),
      coverFilename: t.coverFilename === filename ? undefined : t.coverFilename,
    }));

  const moveImage = (filename: string, dir: 'up' | 'down') =>
    setTask((t) => ({ ...t, markdown: moveImageBlock(t.markdown, filename, dir) }));

  // 追踪最近一次正文光标位置(普通/全屏两个编辑区共用),插图插到光标处
  const mdCaretRef = useRef<number | null>(null);
  const activeMdRef = useRef<HTMLTextAreaElement | null>(null);
  const trackCaret = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    mdCaretRef.current = e.currentTarget.selectionStart;
    activeMdRef.current = e.currentTarget;
  };

  const insertImage = (filename: string) => {
    const { markdown: md, caret } = insertImageRef(
      latestTask.current.markdown, filename, mdCaretRef.current ?? undefined,
    );
    setTask((t) => ({ ...t, markdown: md }));
    mdCaretRef.current = caret;
    flash(`已插入 ${filename}`);
    requestAnimationFrame(() => {
      const ta = activeMdRef.current;
      if (ta && document.contains(ta)) {
        ta.focus();
        ta.selectionStart = ta.selectionEnd = caret;
      }
    });
  };

  const editImageByName = (filename: string) => {
    const im = latestTask.current.images.find((i) => i.filename === filename);
    if (im) setEditingImg(im);
  };

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2600); };

  const save = async () => { await saveTask(latestTask.current); setSavedAt(Date.now()); flash('已保存'); };

  const copyFallback = async () => {
    const t = latestTask.current;
    const imageMap = Object.fromEntries(t.images.map((i) => [i.filename, i.dataUrl]));
    await copyRichText(renderHtml(t.markdown, imageMap), stripMarkdown(t.markdown));
    flash('富文本已复制,可粘贴到任意编辑器');
  };

  return (
    <div style={{ minHeight: '100vh', background: T.paper, fontFamily: T.fontSans }}>
      <header style={{
        background: T.ink, padding: '16px 28px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <BrandHeader subtitle="一处撰写 · 羽传多平台" />
        <button type="button" onClick={() => { setTask(newTask({ title: '', markdown: '' })); setSavedAt(null); }}
          style={{ ...btn.gold(), padding: '9px 18px' }}>＋ 新文章</button>
      </header>

      <div style={{
        display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 20,
        padding: 24, maxWidth: 1320, margin: '0 auto', alignItems: 'start',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card style={{ padding: '14px 18px' }}>
            <History currentId={task.id} refreshKey={savedAt} onLoad={(t) => { setTask(t); setSavedAt(null); }} />
          </Card>

          <Card>
            <SectionTitle n="1" title="文章" extra={
              <label style={{ ...btn.ghost(), display: 'inline-block', fontSize: 12, padding: '5px 12px' }}>
                导入 .md
                <input type="file" accept=".md,text/markdown" style={{ display: 'none' }}
                  onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void f.text().then(setMarkdown).catch(console.error); }} />
              </label>
            } />
            <input style={{ ...field, fontSize: 17, fontWeight: 500, marginBottom: 12 }}
              placeholder="标题(自动取自第一个 # 标题,可改)"
              value={task.title} onChange={(e) => setTask((t) => ({ ...t, title: e.target.value }))} />
            <textarea style={{ ...field, height: 280, fontFamily: 'ui-monospace, Menlo, Consolas, monospace', fontSize: 13, lineHeight: 1.6, resize: 'vertical' }}
              placeholder="在此粘贴 Markdown 正文…"
              value={task.markdown} onChange={(e) => { setMarkdown(e.target.value); trackCaret(e); }}
              onSelect={trackCaret} onClick={trackCaret} onKeyUp={trackCaret} />
          </Card>

          <Card>
            <SectionTitle n="2" title="配图与封面" extra={
              <span style={{ fontSize: 12, color: T.textFaint }}>悬停缩略图可编辑 / 设封面 / 删除</span>
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
            <PlatformBar task={task} onBeforeFill={save} />
            <div style={{ display: 'flex', gap: 10, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.borderSoft}` }}>
              <button type="button" style={btn.gold()} onClick={() => void save()}>保存任务</button>
              <button type="button" style={btn.ghost()} onClick={() => void copyFallback()}>复制富文本(兜底)</button>
            </div>
          </Card>
        </div>

        <div style={{ position: 'sticky', top: 88 }}>
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{
              padding: '12px 18px', borderBottom: `1px solid ${T.borderSoft}`, display: 'flex',
              alignItems: 'center', gap: 12,
            }}>
              <span style={{ fontSize: 13, color: T.textSoft, letterSpacing: 1, flex: 1 }}>
                实时预览 · 点击图片可调位置/编辑
              </span>
              <span style={{ fontSize: 12, color: T.textFaint }}>{[...task.markdown].length} 字</span>
              <button type="button" onClick={() => setFullPreview(true)}
                style={{ ...btn.ghost(), padding: '4px 12px', fontSize: 12 }}>⤢ 全屏编辑</button>
            </div>
            <div style={{ padding: 20, maxHeight: 'calc(100vh - 180px)', overflow: 'auto' }}>
              <Preview task={task} onMoveImage={moveImage} onEditImage={editImageByName} />
            </div>
          </Card>
        </div>
      </div>

      {fullPreview && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 600, background: T.paper,
          display: 'flex', flexDirection: 'column',
        }}>
          <header style={{
            background: T.ink, padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <LingyuMark size={20} color={T.gold} />
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>全屏编辑</span>
            <span style={{ color: 'rgba(255,255,255,.45)', fontSize: 12 }}>
              左侧改 Markdown,右侧即时预览;点击预览图片可调位置/编辑;Esc 退出
            </span>
            <button type="button" onClick={() => setFullPreview(false)}
              style={{ ...btn.gold(), marginLeft: 'auto', padding: '7px 16px', fontSize: 13 }}>退出全屏</button>
          </header>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 0 }}>
            <div style={{
              display: 'flex', flexDirection: 'column', minHeight: 0,
              borderRight: `1px solid ${T.border}`, background: T.card,
            }}>
              <textarea
                value={task.markdown}
                onChange={(e) => { setMarkdown(e.target.value); trackCaret(e); }}
                onSelect={trackCaret} onClick={trackCaret} onKeyUp={trackCaret}
                placeholder="在此编辑 Markdown 正文…"
                style={{
                  flex: 1, border: 'none', outline: 'none', resize: 'none', background: 'transparent',
                  padding: '24px 28px',
                  fontFamily: 'ui-monospace, Menlo, Consolas, monospace', fontSize: 13.5,
                  lineHeight: 1.7, color: T.text,
                }}
              />
              {task.images.length > 0 && (
                <div style={{
                  borderTop: `1px solid ${T.border}`, background: T.paper, padding: '8px 14px',
                  display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', flexShrink: 0,
                }}>
                  <span style={{ fontSize: 11, color: T.textFaint, flexShrink: 0 }}>点击插入图片 ↦</span>
                  {task.images.map((img) => (
                    <img key={img.filename} src={img.dataUrl} alt={img.filename}
                      title={`插入 ${img.filename} 到光标处`}
                      onClick={() => insertImage(img.filename)}
                      style={{
                        width: 42, height: 42, objectFit: 'cover', borderRadius: 6, cursor: 'pointer',
                        border: `1px solid ${T.border}`, flexShrink: 0,
                      }} />
                  ))}
                </div>
              )}
            </div>
            <div style={{ overflow: 'auto', padding: '24px 32px' }}>
              <Preview task={task} onMoveImage={moveImage} onEditImage={editImageByName} />
            </div>
          </div>
        </div>
      )}

      {editingImg && (
        <ImageEditor image={editingImg} onClose={() => setEditingImg(null)}
          onApply={(updated) => { updateImage(editingImg.filename, updated); setEditingImg(null); flash('图片已更新'); }} />
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
