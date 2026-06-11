import type { Adapter, FillResult } from './types';
import type { Task } from '../tasks';
import { renderSegments } from '../markdown';
import { waitFor, pasteHtml, pasteFiles, setNativeValue, dataUrlToFile, sleep } from './fill-utils';

// —— 选择器常量:平台改版只改这里(2026-06 实测核对) ——
const SELECTORS = {
  title: 'textarea[placeholder*="标题"]',
  // 实测:写作页唯一 contenteditable 即 Draft.js 编辑器(.public-DraftEditor-content)
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

    let editor: HTMLElement;
    try {
      editor = await waitFor(() => document.querySelector<HTMLElement>(SELECTORS.editor));
    } catch {
      return { ok: false, failedStep: '定位编辑器', reason: '选择器失效,平台可能改版' };
    }

    // 分段粘贴:文本段粘 HTML;本地图片粘"文件"(实测知乎对 data: URL 图片会报
    // "图片导入失败",而文件粘贴走知乎客户端上传,且分段粘贴保持顺序)
    const segments = renderSegments(task.markdown, task.images.map((i) => i.filename));
    for (const seg of segments) {
      if (seg.kind === 'html') {
        pasteHtml(editor, seg.html);
        await sleep(500); // 等 Draft.js 消化本段
      } else {
        const img = task.images.find((i) => i.filename === seg.filename);
        if (!img) continue;
        const before = editor.querySelectorAll('img').length;
        pasteFiles(editor, [dataUrlToFile(img.dataUrl, img.filename)]);
        try {
          // 图片上传耗时不可控,放宽 30s;以编辑器内 img 数增加为完成信号
          await waitFor(() => (editor.querySelectorAll('img').length > before ? editor : null), 30_000);
        } catch {
          return { ok: false, failedStep: '上传图片', reason: `图片 ${img.filename} 粘贴后 30 秒未出现在编辑器中` };
        }
      }
    }

    try {
      await waitFor(() => ((editor.textContent ?? '').trim().length > 0 ? editor : null));
    } catch {
      return { ok: false, failedStep: '填正文', reason: '编辑器未接受粘贴内容' };
    }
    return { ok: true, note: '图片已走知乎上传通道,请检查图文顺序后发布' };
  },
};
