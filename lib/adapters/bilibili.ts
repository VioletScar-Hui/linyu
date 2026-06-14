import type { Adapter, FillResult } from './types';
import type { Task } from '../tasks';
import { renderSegments } from '../markdown';
import { waitFor, pasteHtml, pasteFiles, dataUrlToFile, sleep } from './fill-utils';

// —— 2026-06 实测:专栏编辑器在同源 iframe(src 含 read-editor)内 ——
const IFRAME_SRC_HINT = 'read-editor';
const SELECTORS = {
  title: 'textarea.title-input__inner',
  editor: '.tiptap.ProseMirror',
};

async function getEditorDoc(): Promise<Document> {
  return waitFor(() => {
    const iframe = [...document.querySelectorAll('iframe')].find(
      (f) => (f.src || '').includes(IFRAME_SRC_HINT),
    ) as HTMLIFrameElement | undefined;
    return iframe?.contentDocument ?? null;
  }, 20_000);
}

/** 跨 iframe 写 textarea 值:必须用该 iframe 的原型 setter */
function setIframeTextarea(win: Window, el: HTMLTextAreaElement, value: string): void {
  const proto = (win as unknown as { HTMLTextAreaElement: typeof HTMLTextAreaElement }).HTMLTextAreaElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

export const bilibiliAdapter: Adapter = {
  platformId: 'bilibili',

  isEditorPage: () =>
    location.host === 'member.bilibili.com' && location.pathname.includes('/upload/text'),

  checkLogin: async () => true,

  probe: () => {
    const iframe = [...document.querySelectorAll('iframe')].find(
      (f) => (f.src || '').includes(IFRAME_SRC_HINT),
    ) as HTMLIFrameElement | undefined;
    const doc = iframe?.contentDocument ?? null;
    return [
      { name: '专栏编辑器 iframe', ok: !!doc },
      { name: '标题框', ok: !!doc?.querySelector(SELECTORS.title) },
      { name: '正文编辑器', ok: !!doc?.querySelector(SELECTORS.editor) },
    ];
  },

  async fill(task: Task): Promise<FillResult> {
    let doc: Document;
    try {
      doc = await getEditorDoc();
    } catch {
      return { ok: false, failedStep: '定位编辑器', reason: '专栏编辑器 iframe 未就绪(选择器或页面改版)' };
    }
    const win = doc.defaultView!;
    try {
      const title = await waitFor(() => doc.querySelector<HTMLTextAreaElement>(SELECTORS.title));
      setIframeTextarea(win, title, task.title);
    } catch {
      return { ok: false, failedStep: '填标题', reason: '找不到标题框' };
    }
    let editor: HTMLElement;
    try {
      editor = await waitFor(() => doc.querySelector<HTMLElement>(SELECTORS.editor));
    } catch {
      return { ok: false, failedStep: '定位正文编辑器', reason: '正文编辑器未找到' };
    }
    const segments = renderSegments(task.markdown, task.images.map((i) => i.filename));
    for (const seg of segments) {
      if (seg.kind === 'html') {
        pasteHtml(editor, seg.html);
        await sleep(500);
      } else {
        const img = task.images.find((i) => i.filename === seg.filename);
        if (!img) continue;
        pasteFiles(editor, [dataUrlToFile(img.dataUrl, img.filename)]);
        await sleep(1500);
      }
    }
    try {
      await waitFor(() => ((editor.textContent ?? '').trim().length > 0 ? editor : null));
    } catch {
      return { ok: false, failedStep: '填正文', reason: '编辑器未接受粘贴内容' };
    }
    return { ok: true, note: 'B站图片可能未转存,请在编辑器内逐张确认/重传后再发布' };
  },
};
