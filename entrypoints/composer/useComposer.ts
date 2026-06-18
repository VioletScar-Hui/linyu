import { useEffect, useMemo, useRef, useState } from 'react';
import { deriveTitle, renderHtml, insertImageRef } from '../../lib/markdown';
import { extractImageRefs, matchImages } from '../../lib/images';
import { stripMarkdown } from '../../lib/xhs';
import { copyRichText } from '../../lib/clipboard';
import { buildArticleZip } from '../../lib/export-md';
import { absorbPastedImages } from '../../lib/editor-md';
import { compressImage } from '../../lib/compress';
import { newTask, saveTask, getTask, migrateIfNeeded, type Task, type TaskImage } from '../../lib/tasks';
import { getSettings, type Settings } from '../../lib/settings';

/** 撰写台控制器:任务状态、自动保存、存储同步、图片与正文动作、导出/复制。
 *  把数据与副作用从视图(App)里分离出来,App 只负责布局组装。 */
export function useComposer(initial?: Task) {
  const [task, setTask] = useState<Task>(() => initial ?? newTask({ title: '', markdown: '' }));
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings>({ mpAccounts: [], snippets: [], enabledPlatforms: [] });
  const [ready, setReady] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);

  // 所见即所得编辑器的命令式 API(整体替换内容,用于加载/插入等外部改动回灌)
  const richApiRef = useRef<{ replace: (md: string) => void } | null>(null);

  useEffect(() => {
    void (async () => {
      await migrateIfNeeded();
      setSettings(await getSettings());
      setReady(true);
    })();
  }, []);

  const enabledSet = useMemo(() => new Set(settings.enabledPlatforms), [settings.enabledPlatforms]);

  const latestTask = useRef(task);
  useEffect(() => { latestTask.current = task; }, [task]);

  // 适配器回报状态写入 storage 后,刷新当前任务的 platformStatus
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

  // 草稿自动保存:内容停止变动 1.5s 后落库(空任务不存)
  useEffect(() => {
    const t = latestTask.current;
    if (!t.title && !t.markdown && t.images.length === 0) return;
    const id = setTimeout(() => {
      void saveTask(latestTask.current).then(() => { setSavedAt(Date.now()); setAutoSaved(true); });
    }, 1500);
    return () => clearTimeout(id);
  }, [task.title, task.markdown, task.images, task.variants, task.coverFilename]);

  const refs = useMemo(() => extractImageRefs(task.markdown), [task.markdown]);
  const match = useMemo(() => matchImages(refs, task.images.map((i) => i.filename)), [refs, task.images]);
  const matchedSet = useMemo(() => new Set(match.matched), [match]);

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2600); };

  // 编辑器自身改动:只更新 state,不回灌(避免循环)。
  // 顺带吸收编辑器内新粘贴/拖入的图(dataUrl)→入库并换 filename,避免大 dataUrl 写进正文
  const onEditorChange = (markdown: string) => {
    const { markdown: clean, added } = absorbPastedImages(markdown, latestTask.current.images);
    setTask((t) => ({
      ...t,
      markdown: clean,
      title: t.title || deriveTitle(clean),
      images: added.length ? [...t.images, ...added] : t.images,
      coverFilename: t.coverFilename ?? added[0]?.filename,
    }));
  };

  // 外部改动 markdown:更新 state + 回灌编辑器
  const applyMarkdown = (markdown: string, opts?: { deriveTitle?: boolean }) => {
    setTask((t) => ({ ...t, markdown, title: opts?.deriveTitle ? (t.title || deriveTitle(markdown)) : t.title }));
    richApiRef.current?.replace(markdown);
  };

  const newArticle = () => {
    const t = newTask({ title: '', markdown: '' });
    setTask(t); setSavedAt(null);
    richApiRef.current?.replace('');
  };

  const loadById = async (id: string) => {
    const t = await getTask(id);
    if (t) { setTask(t); setSavedAt(null); richApiRef.current?.replace(t.markdown); }
  };

  const addImages = async (files: File[]) => {
    const results = await Promise.allSettled(
      files.filter((f) => f.type.startsWith('image/')).map((f) => compressImage(f)),
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

  // 插入图片/片段:WYSIWYG 下追加到正文末尾(独立块)并回灌编辑器
  const insertImage = (filename: string) => {
    const { markdown } = insertImageRef(latestTask.current.markdown, filename);
    applyMarkdown(markdown);
    flash(`已在文末插入 ${filename}`);
  };
  const insertSnippet = (content: string) => {
    const md = latestTask.current.markdown;
    applyMarkdown(md ? `${md}\n\n${content}` : content);
  };

  const save = async () => { await saveTask(latestTask.current); setSavedAt(Date.now()); setAutoSaved(false); flash('已保存'); };

  // Ctrl/Cmd+S 保存(拦截浏览器默认的保存网页对话框)。save 仅经 ref/稳定 setter 取值,挂载一次即可
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        void save();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const copyFallback = async () => {
    const t = latestTask.current;
    const imageMap = Object.fromEntries(t.images.map((i) => [i.filename, i.dataUrl]));
    await copyRichText(renderHtml(t.markdown, imageMap), stripMarkdown(t.markdown));
    flash('富文本已复制,可粘贴到任意编辑器');
  };

  const exportMarkdown = async () => {
    const t = latestTask.current;
    const blob = await buildArticleZip(t);
    const name = (t.title || 'article').replace(/[\\/:*?"<>|]/g, '_').slice(0, 80);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.zip`;
    a.click();
    URL.revokeObjectURL(url);
    flash('已导出 Markdown(含图片)压缩包');
  };

  const applySettings = (s: Settings) => { setSettings(s); flash('设置已保存'); };

  return {
    task, setTask, settings, ready, savedAt, autoSaved, toast,
    enabledSet, match, matchedSet, richApiRef,
    onEditorChange, applyMarkdown, newArticle, loadById,
    addImages, updateImage, removeImage, insertImage, insertSnippet,
    save, copyFallback, exportMarkdown, applySettings,
  };
}
