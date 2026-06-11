import type { Adapter, FillResult } from './types';
import type { Task } from '../tasks';
import { waitFor, pasteText, setInputFiles, dataUrlToFile } from './fill-utils';

// —— 2026-06 实测:compose 为 Draft.js;图片 input data-testid=fileInput ——
const SELECTORS = {
  editor: '[data-testid="tweetTextarea_0"]',
  fileInput: 'input[data-testid="fileInput"]',
};

export const xAdapter: Adapter = {
  platformId: 'x',

  isEditorPage: () => location.host === 'x.com' && location.pathname.includes('/compose'),

  checkLogin: async () => true, // 未登录会被导向 /i/flow/login(pathname 不含 compose)

  async fill(task: Task): Promise<FillResult> {
    const v = task.variants.x;
    if (!v?.body) return { ok: false, failedStep: '前置检查', reason: '请先在撰写页填写 X 推文变体' };
    let editor: HTMLElement;
    try {
      editor = await waitFor(() => document.querySelector<HTMLElement>(SELECTORS.editor));
    } catch {
      return { ok: false, failedStep: '定位输入框', reason: '找不到 compose 输入框(选择器或页面改版)' };
    }
    pasteText(editor, v.body);
    try {
      await waitFor(() => ((editor.textContent ?? '').trim().length > 0 ? editor : null));
    } catch {
      return { ok: false, failedStep: '填推文', reason: '输入框未接受文本' };
    }
    // 配图:导流推文配一张(封面优先,否则第一张)
    const cover = task.images.find((i) => i.filename === task.coverFilename) ?? task.images[0];
    if (cover) {
      const input = document.querySelector<HTMLInputElement>(SELECTORS.fileInput);
      if (input) setInputFiles(input, [dataUrlToFile(cover.dataUrl, cover.filename)]);
    }
    return { ok: true, note: '推文与配图已填,可补充文章链接后发布' };
  },
};
