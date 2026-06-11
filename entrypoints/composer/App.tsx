import { useEffect, useMemo, useRef, useState } from 'react';
import { deriveTitle, renderHtml } from '../../lib/markdown';
import { extractImageRefs, matchImages } from '../../lib/images';
import { stripMarkdown } from '../../lib/xhs';
import { copyRichText } from '../../lib/clipboard';
import { newTask, saveTask, getTask, type Task, type TaskImage } from '../../lib/tasks';
import { Preview } from './Preview';
import { XhsEditor } from './XhsEditor';
import { PlatformBar } from './PlatformBar';
import { History } from './History';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

export function App() {
  const [task, setTask] = useState<Task>(() => newTask({ title: '', markdown: '' }));
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // 异步操作(保存等)读取最新 task,避免闭包拿到旧状态
  const latestTask = useRef(task);
  useEffect(() => {
    latestTask.current = task;
  }, [task]);

  // 适配器回报状态写入 storage 后,刷新当前任务的 platformStatus(不覆盖未保存的编辑)
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
      files
        .filter((f) => f.type.startsWith('image/'))
        .map(async (f): Promise<TaskImage> => ({
          filename: f.name,
          dataUrl: await readFileAsDataUrl(f),
          size: f.size,
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

  const save = async () => {
    await saveTask(latestTask.current);
    setSavedAt(Date.now());
  };

  const copyFallback = async () => {
    const t = latestTask.current;
    const imageMap = Object.fromEntries(t.images.map((i) => [i.filename, i.dataUrl]));
    await copyRichText(renderHtml(t.markdown, imageMap), stripMarkdown(t.markdown));
    alert('富文本已复制,可直接粘贴到任意平台编辑器');
  };

  return (
    <div style={{ display: 'flex', gap: 16, padding: 16, fontFamily: 'system-ui' }}>
      <section style={{ flex: 1, minWidth: 0 }}>
        <History currentId={task.id} refreshKey={savedAt} onLoad={setTask} />
        <button type="button" onClick={() => setTask(newTask({ title: '', markdown: '' }))}>＋ 新文章</button>

        <h2>① 文章</h2>
        <input
          style={{ width: '100%', fontSize: 18, padding: 6 }}
          placeholder="标题(自动取自第一个 # 标题,可改)"
          value={task.title}
          onChange={(e) => setTask((t) => ({ ...t, title: e.target.value }))}
        />
        <p>
          <input
            type="file"
            accept=".md,text/markdown"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) void f.text().then(setMarkdown).catch(console.error);
            }}
          />
          或直接粘贴 Markdown：
        </p>
        <textarea
          style={{ width: '100%', height: 300, fontFamily: 'monospace' }}
          value={task.markdown}
          onChange={(e) => setMarkdown(e.target.value)}
        />

        <h2>② 配图与封面</h2>
        <div
          style={{ border: '2px dashed #999', padding: 16, textAlign: 'center' }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void addImages(Array.from(e.dataTransfer.files));
          }}
        >
          拖入图片,或
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              if (e.target.files) {
                const files = Array.from(e.target.files);
                e.target.value = '';
                void addImages(files);
              }
            }}
          />
        </div>
        <ul>
          {task.images.map((img) => (
            <li key={img.filename}>
              {matchedSet.has(img.filename) ? '✅' : 'ℹ️ 未被正文引用'} {img.filename}
              {img.size > MAX_IMAGE_SIZE && <strong style={{ color: 'orange' }}> ⚠️ 超过 10MB</strong>}
            </li>
          ))}
          {match.missing.map((name) => (
            <li key={name} style={{ color: 'red' }}>❌ 缺图:正文引用了 {name},请拖入</li>
          ))}
        </ul>
        {task.images.length > 0 && (
          <label>
            封面图(公众号用):
            <select
              value={task.coverFilename ?? ''}
              onChange={(e) => setTask((t) => ({ ...t, coverFilename: e.target.value || undefined }))}
            >
              <option value="">(未选择)</option>
              {task.images.map((img) => (
                <option key={img.filename} value={img.filename}>{img.filename}</option>
              ))}
            </select>
          </label>
        )}

        <h2>③ 平台变体</h2>
        <XhsEditor
          task={task}
          onChangeVariant={(v) => setTask((t) => ({ ...t, variants: { ...t.variants, xiaohongshu: v } }))}
        />

        <p>
          <button type="button" style={{ padding: '8px 24px', fontWeight: 600 }} onClick={() => void save()}>
            保存任务
          </button>
          {savedAt && <span> 已保存 {new Date(savedAt).toLocaleTimeString()}</span>}
          <button type="button" style={{ marginLeft: 12 }} onClick={() => void copyFallback()}>
            复制富文本(手动兜底)
          </button>
        </p>

        <h2>④ 分发</h2>
        <PlatformBar task={task} onBeforeFill={save} />
      </section>

      <section style={{ flex: 1, minWidth: 0 }}>
        <h2>预览</h2>
        <Preview task={task} />
      </section>
    </div>
  );
}
