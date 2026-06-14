import { browser } from 'wxt/browser';
import type { Adapter, FillResult } from './types';
import type { Task } from '../tasks';
import { renderSegments } from '../markdown';
import { stripMarkdown } from '../xhs';
import {
  waitFor, pasteHtml, pasteText, pasteFiles, setNativeValue, setInputFiles, dataUrlToFile, sleep,
} from './fill-utils';
import { buildWeixinEditorUrl } from '../weixin-url';
import type { Msg, PeekTaskResponse } from '../messaging';

// —— 选择器常量(2026-06 按真实编辑页实测) ——
const SELECTORS = {
  // 新版编辑器标题为 #js_title_main 内的 ProseMirror;#title 为遗留字段仅作回退
  titleEditor: '#js_title_main .ProseMirror',
  titleLegacy: '#title',
  digest: '#js_description', // TEXTAREA
  // #ueditor_0 现为 div.mock-iframe(非 iframe),正文是其中的 ProseMirror
  editor: '#ueditor_0 .ProseMirror',
  // 编辑页加载时封面区内无 file input(唯一 file input 属于工具栏插图菜单,勿用!),仅短探测后降级
  coverFileInput: '#js_cover_area input[type="file"]',
};

/** 非编辑器页(如后台首页)且存在待填充任务时,用 URL 里的 token 直跳新建图文编辑器。
 *  每个标签页只尝试一次,避免编辑器打开失败回跳造成循环。 */
export async function maybeRedirectToEditor(): Promise<void> {
  if (sessionStorage.getItem('__mpp_redirected')) return;
  const token = new URLSearchParams(location.search).get('token');
  if (!token) return; // 未登录等场景:登录后的页面跳转会重新触发本脚本
  const resp = (await browser.runtime.sendMessage({
    kind: 'peek-task',
    platformId: 'weixin',
  } satisfies Msg)) as PeekTaskResponse | undefined;
  if (!resp?.hasPending) return;
  sessionStorage.setItem('__mpp_redirected', '1');
  location.assign(buildWeixinEditorUrl(token));
}

export const weixinAdapter: Adapter = {
  platformId: 'weixin',

  // 图文编辑页:mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit_v2…
  isEditorPage: () =>
    location.host === 'mp.weixin.qq.com' && location.pathname.includes('/cgi-bin/appmsg'),

  checkLogin: async () => true, // 进得了图文编辑页即已登录

  probe: () => [
    { name: '标题编辑器', ok: !!document.querySelector(SELECTORS.titleEditor) },
    { name: '摘要框', ok: !!document.querySelector(SELECTORS.digest) },
    { name: '正文编辑器', ok: !!document.querySelector(SELECTORS.editor) },
    { name: '封面上传(常缺,降级正常)', ok: !!document.querySelector(SELECTORS.coverFileInput) },
  ],

  async fill(task: Task): Promise<FillResult> {
    // 1. 标题:优先写可见的 ProseMirror 标题编辑器,回退遗留 #title 字段
    try {
      const titleEditor = await waitFor(() =>
        document.querySelector<HTMLElement>(SELECTORS.titleEditor),
      );
      pasteText(titleEditor, task.title);
    } catch {
      const legacy = document.querySelector<HTMLTextAreaElement>(SELECTORS.titleLegacy);
      if (legacy) setNativeValue(legacy, task.title);
      else return { ok: false, failedStep: '填标题', reason: '找不到标题编辑器(选择器或页面改版)' };
    }

    // 2. 摘要(无独立字段,默认取正文纯文本前 120 字)
    const digest = document.querySelector<HTMLTextAreaElement>(SELECTORS.digest);
    if (digest) setNativeValue(digest, [...stripMarkdown(task.markdown)].slice(0, 120).join(''));

    // 3. 正文:分段粘贴进 ProseMirror —— 文本段粘 HTML,本地图片粘"文件"
    //    (走微信自己的上传通道,与手动粘贴截图同机制;data: URL 不可靠)
    let editor: HTMLElement;
    try {
      editor = await waitFor(() => document.querySelector<HTMLElement>(SELECTORS.editor));
    } catch {
      return { ok: false, failedStep: '定位编辑器', reason: '正文编辑器未找到(选择器或页面改版)' };
    }
    const segments = renderSegments(task.markdown, task.images.map((i) => i.filename));
    for (const seg of segments) {
      if (seg.kind === 'html') {
        pasteHtml(editor, seg.html);
        await sleep(500);
      } else {
        const img = task.images.find((i) => i.filename === seg.filename);
        if (!img) continue;
        const before = editor.querySelectorAll('img').length;
        pasteFiles(editor, [dataUrlToFile(img.dataUrl, img.filename)]);
        try {
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

    // 4. 封面:实测编辑页无封面 file input,短探测后降级为提示手动
    const cover = task.images.find((i) => i.filename === task.coverFilename);
    if (cover) {
      try {
        const input = await waitFor(
          () => document.querySelector<HTMLInputElement>(SELECTORS.coverFileInput),
          3_000,
        );
        setInputFiles(input, [dataUrlToFile(cover.dataUrl, cover.filename)]);
        return { ok: true, note: '请确认封面上传与裁剪结果' };
      } catch {
        return { ok: true, note: '正文已填充;封面请在封面区手动"从正文选择"(图片已在正文中)' };
      }
    }
    return { ok: true };
  },
};
