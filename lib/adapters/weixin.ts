import type { Adapter, FillResult } from './types';
import type { Task } from '../tasks';
import { renderHtml } from '../markdown';
import { stripMarkdown } from '../xhs';
import { waitFor, pasteHtml, setNativeValue, setInputFiles, dataUrlToFile } from './fill-utils';

// —— 选择器常量:平台改版只改这里。开发时用 DevTools 在真实编辑页核对! ——
const SELECTORS = {
  title: '#title',
  digest: '#js_description',
  editorIframe: '#ueditor_0',          // UEditor 同源 iframe
  coverFileInput: '#js_cover_area input[type="file"]',
};

export const weixinAdapter: Adapter = {
  platformId: 'weixin',

  // 图文编辑页:mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit…
  isEditorPage: () =>
    location.host === 'mp.weixin.qq.com' && location.pathname.includes('/cgi-bin/appmsg'),

  checkLogin: async () => true, // 进得了图文编辑页即已登录

  async fill(task: Task): Promise<FillResult> {
    // 1. 标题 + 摘要(摘要无独立字段,默认取正文纯文本前 120 字)
    try {
      const title = await waitFor(() => document.querySelector<HTMLTextAreaElement>(SELECTORS.title));
      setNativeValue(title, task.title);
    } catch {
      return { ok: false, failedStep: '填标题', reason: '找不到标题框(选择器或页面改版)' };
    }
    const digest = document.querySelector<HTMLTextAreaElement>(SELECTORS.digest);
    if (digest) setNativeValue(digest, [...stripMarkdown(task.markdown)].slice(0, 120).join(''));

    // 2. 正文:向 UEditor 同源 iframe 的 body 派发合成粘贴
    let body: HTMLElement;
    try {
      body = await waitFor(() => {
        const iframe = document.querySelector<HTMLIFrameElement>(SELECTORS.editorIframe);
        return iframe?.contentDocument?.body ?? null;
      });
    } catch {
      return { ok: false, failedStep: '填正文', reason: '编辑器 iframe 无法访问(跨域/沙箱或选择器失效)' };
    }
    try {
      const imageMap = Object.fromEntries(task.images.map((i) => [i.filename, i.dataUrl]));
      pasteHtml(body, renderHtml(task.markdown, imageMap));
      await waitFor(() => ((body.textContent ?? '').trim().length > 0 ? body : null));
    } catch {
      return { ok: false, failedStep: '填正文', reason: '编辑器 iframe 未接受粘贴内容' };
    }

    // 3. 封面(V1 风险最高项):尝试封面区文件输入框注入;不可行则降级为提示手动
    const cover = task.images.find((i) => i.filename === task.coverFilename);
    if (cover) {
      try {
        const input = await waitFor(
          () => document.querySelector<HTMLInputElement>(SELECTORS.coverFileInput),
          5_000,
        );
        setInputFiles(input, [dataUrlToFile(cover.dataUrl, cover.filename)]);
        return { ok: true, note: '请确认封面上传与裁剪结果' };
      } catch {
        return { ok: true, note: '正文已填充;封面未能自动设置,请在封面区手动"从正文选择"或上传' };
      }
    }
    return { ok: true };
  },
};
