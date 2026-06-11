import type { Adapter, FillResult } from './types';
import type { Task } from '../tasks';
import { renderHtml } from '../markdown';
import { waitFor, pasteHtml, setNativeValue } from './fill-utils';

// —— 选择器常量:平台改版只改这里。开发时用 DevTools 在真实页面核对! ——
const SELECTORS = {
  title: 'textarea[placeholder*="标题"]',
  editor: 'div[contenteditable="true"]',
};

export const zhihuAdapter: Adapter = {
  platformId: 'zhihu',

  isEditorPage: () =>
    location.host === 'zhuanlan.zhihu.com' && location.pathname.startsWith('/write'),

  // 未登录访问 /write 会被重定向到 signin(届时 isEditorPage 为 false,任务保持等待)
  checkLogin: async () => true,

  async fill(task: Task): Promise<FillResult> {
    let title: HTMLTextAreaElement;
    try {
      title = await waitFor(() => document.querySelector<HTMLTextAreaElement>(SELECTORS.title));
    } catch {
      return { ok: false, failedStep: '定位标题框', reason: '选择器失效,平台可能改版' };
    }
    setNativeValue(title, task.title);

    try {
      const editor = await waitFor(() => document.querySelector<HTMLElement>(SELECTORS.editor));
      const imageMap = Object.fromEntries(task.images.map((i) => [i.filename, i.dataUrl]));
      pasteHtml(editor, renderHtml(task.markdown, imageMap));
      // 只有编辑器里真的出现内容才算成功(spec:状态真实回报)
      await waitFor(() => (editor.textContent ?? '').trim().length > 0 || null);
    } catch {
      return { ok: false, failedStep: '填正文', reason: '编辑器未接受粘贴内容' };
    }
    return { ok: true, note: '图片由知乎自动转存,请逐张检查后发布' };
  },
};
