import type { Adapter, FillResult } from './types';
import type { Task } from '../tasks';
import { waitFor, setNativeValue } from './fill-utils';

// —— old.reddit.com/submit 经典表单(主站被测试工具拦截,此适配器待用户实测核对) ——
const SELECTORS = {
  title: 'textarea[name="title"], #title',
  body: 'textarea[name="text"]',
};

export const redditAdapter: Adapter = {
  platformId: 'reddit',

  isEditorPage: () => location.host.endsWith('reddit.com') && location.pathname.includes('/submit'),

  checkLogin: async () => true,

  probe: () => [
    { name: '标题框', ok: !!document.querySelector(SELECTORS.title) },
    { name: '正文框', ok: !!document.querySelector(SELECTORS.body) },
  ],

  async fill(task: Task): Promise<FillResult> {
    const v = task.variants.reddit;
    if (!v?.title) return { ok: false, failedStep: '前置检查', reason: '请先在撰写页填写 Reddit 变体' };
    try {
      const title = await waitFor(() => document.querySelector<HTMLTextAreaElement>(SELECTORS.title));
      setNativeValue(title, v.title);
    } catch {
      return { ok: false, failedStep: '填标题', reason: '找不到标题框(请按清单核对 old.reddit 选择器)' };
    }
    const body = document.querySelector<HTMLTextAreaElement>(SELECTORS.body);
    if (body) setNativeValue(body, v.body);
    return { ok: true, note: 'Reddit 正文为 Markdown,请选择 subreddit 后发布' };
  },
};
