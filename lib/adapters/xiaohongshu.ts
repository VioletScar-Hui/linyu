import type { Adapter, FillResult } from './types';
import type { Task } from '../tasks';
import {
  waitFor, pasteText, setNativeValue, setInputFiles, dataUrlToFile, findByText,
} from './fill-utils';

// —— 选择器常量(2026-06 实测核对) ——
const SELECTORS = {
  // 实测图文 input 的 accept=".jpg,.jpeg,.png,.webp"(不含 "image" 字样);
  // 绝不能裸匹配 input[type=file] —— 会命中"上传视频"页签的视频框
  fileInput: 'input[type="file"][accept*=".jpg"]',
  title: 'input[placeholder*="标题"]', // 实测 placeholder="填写标题会有更多赞哦"
  editor: 'div[contenteditable="true"]', // 实测为 div.tiptap.ProseMirror
};
const UPLOAD_TAB_TEXT = '上传图文';

export const xiaohongshuAdapter: Adapter = {
  platformId: 'xiaohongshu',

  isEditorPage: () =>
    location.host === 'creator.xiaohongshu.com' && location.pathname.startsWith('/publish'),

  checkLogin: async () => true, // 未登录会被重定向到登录页(isEditorPage 为 false)

  async fill(task: Task): Promise<FillResult> {
    const v = task.variants.xiaohongshu;
    if (!v?.title || !v.body)
      return { ok: false, failedStep: '前置检查', reason: '请先在撰写页填写小红书变体' };
    if (task.images.length === 0)
      return { ok: false, failedStep: '前置检查', reason: '图文笔记至少需要 1 张图,请先添加配图' };

    // 1. 发布页默认在"上传视频"页签,切到"上传图文"(精确文本匹配最深元素,实测有效)
    findByText('div, span, button', UPLOAD_TAB_TEXT)?.click();

    // 2. 等图文 file input 出现后注入图片,驱动平台上传
    try {
      const input = await waitFor(() => document.querySelector<HTMLInputElement>(SELECTORS.fileInput));
      setInputFiles(input, task.images.map((i) => dataUrlToFile(i.dataUrl, i.filename)));
    } catch {
      return { ok: false, failedStep: '上传图片', reason: '未找到图文上传入口(可能停在视频页签或选择器失效)' };
    }

    // 3. 标题/正文区出现后填写(图片上传耗时不可控,标题等待放宽到 30s)
    let title: HTMLInputElement;
    try {
      title = await waitFor(
        () => document.querySelector<HTMLInputElement>(SELECTORS.title),
        30_000,
      );
    } catch {
      return { ok: false, failedStep: '填标题', reason: '上传后 30 秒内未出现标题框(上传失败或选择器失效)' };
    }
    setNativeValue(title, v.title);
    try {
      const editor = await waitFor(() => document.querySelector<HTMLElement>(SELECTORS.editor));
      pasteText(editor, v.body);
      await waitFor(() => ((editor.textContent ?? '').trim().length > 0 ? editor : null));
    } catch {
      return { ok: false, failedStep: '填正文', reason: '编辑区未出现或粘贴未生效' };
    }
    return { ok: true, note: '图片可能仍在上传,请确认全部图片出现且顺序正确后再发布' };
  },
};
