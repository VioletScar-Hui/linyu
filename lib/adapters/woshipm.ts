import type { Adapter, FillResult } from './types';
import type { Task } from '../tasks';
import { renderHtml } from '../markdown';
import { waitFor, pasteHtml, setNativeValue } from './fill-utils';

// —— 2026-06 实测:发文章入口 https://www.woshipm.com/writing,WordPress+TinyMCE ——
const EDITOR_PATH_RE = /^\/writing(?:\/|$|[?#])/i;
const SELECTORS = {
  title: '#post_title',
  // 实测页面无顶层 contenteditable,正文在 TinyMCE 同源 iframe 内
  editor: 'div[contenteditable="true"], .ql-editor',
  editorIframe: '#post_content_ifr, iframe[id^="ueditor"], iframe.ke-edit-iframe',
};

/** 先找直接 contenteditable,再找 iframe 型编辑器(UEditor/KindEditor) */
async function findEditor(): Promise<HTMLElement> {
  return waitFor(() => {
    const direct = document.querySelector<HTMLElement>(SELECTORS.editor);
    if (direct) return direct;
    const iframe = document.querySelector<HTMLIFrameElement>(SELECTORS.editorIframe);
    return iframe?.contentDocument?.body ?? null;
  });
}

export const woshipmAdapter: Adapter = {
  platformId: 'woshipm',

  isEditorPage: () =>
    (location.hostname === 'woshipm.com' || location.hostname.endsWith('.woshipm.com')) &&
    EDITOR_PATH_RE.test(location.pathname),

  checkLogin: async () => true, // 进得了创作后台即已登录;若实测发现未登录也可达,在此补真实检测

  probe: () => {
    const direct = document.querySelector(SELECTORS.editor);
    const iframe = document.querySelector<HTMLIFrameElement>(SELECTORS.editorIframe);
    const body = iframe?.contentDocument?.body ?? null;
    return [
      { name: '标题框', ok: !!document.querySelector(SELECTORS.title) },
      { name: '正文编辑器', ok: !!direct || !!body },
    ];
  },

  async fill(task: Task): Promise<FillResult> {
    try {
      const title = await waitFor(() =>
        document.querySelector<HTMLInputElement>(SELECTORS.title),
      );
      setNativeValue(title, task.title);
    } catch {
      return { ok: false, failedStep: '填标题', reason: '找不到标题框(请按清单实测并更新选择器)' };
    }
    try {
      const editor = await findEditor();
      const imageMap = Object.fromEntries(task.images.map((i) => [i.filename, i.dataUrl]));
      pasteHtml(editor, renderHtml(task.markdown, imageMap));
      await waitFor(() => ((editor.textContent ?? '').trim().length > 0 ? editor : null));
    } catch {
      return { ok: false, failedStep: '填正文', reason: '编辑器未接受粘贴内容' };
    }
    return { ok: true, note: '图片由 TinyMCE 转存(保存草稿后请刷新核对),投稿有人工审核' };
  },
};
