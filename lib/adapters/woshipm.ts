import type { Adapter, FillResult } from './types';
import type { Task } from '../tasks';
import { renderHtml } from '../markdown';
import { waitFor, pasteHtml, setNativeValue } from './fill-utils';

// —— 以下常量为通用默认值,须按真实创作后台实测核对/更新(见验收清单 Step 1) ——
const EDITOR_PATH_RE = /write|post|tougao|contribute/i;
const SELECTORS = {
  title: 'input[placeholder*="标题"], #title, .post-title input',
  editor: 'div[contenteditable="true"], .ql-editor',
  editorIframe: 'iframe[id^="ueditor"], iframe.ke-edit-iframe',
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
    location.hostname.endsWith('woshipm.com') &&
    EDITOR_PATH_RE.test(location.pathname + location.search),

  checkLogin: async () => true, // 进得了创作后台即已登录;若实测发现未登录也可达,在此补真实检测

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
    return { ok: true, note: '投稿有人工审核,请按平台要求补充分类/标签后提交' };
  },
};
