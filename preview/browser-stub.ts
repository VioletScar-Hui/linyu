// 预览用:stub 扩展 API,让真实 composer 组件在普通页面跑起来
const mkTask = (i: number, title: string, status = {}) => ({
  id: `h${i}`, createdAt: Date.now() - i * 86400000, title, markdown: `# ${title}\n\n正文`,
  images: [], variants: {}, platformStatus: status,
});
const store: Record<string, unknown> = {
  settings: { mpAccounts: [
    { id: '1', name: '主号·科技', token: '111222' },
    { id: '2', name: '小号·随笔', token: '' },
  ] },
  tasks: [
    mkTask(1, 'AI 编程工具横评', { zhihu: { state: 'filled' }, weixin: { state: 'filled' } }),
    mkTask(2, '小红书运营心得', { xiaohongshu: { state: 'pending' } }),
    mkTask(3, '产品经理周报模板', { woshipm: { state: 'failed', reason: 'x' } }),
    mkTask(4, 'B站视频脚本', {}),
    mkTask(5, '深度长文:大模型趋势', { zhihu: { state: 'filled' } }),
  ],
};
export const browser = {
  storage: {
    local: {
      get: async (k: string) => ({ [k]: store[k] }),
      set: async (o: Record<string, unknown>) => { Object.assign(store, o); },
    },
    onChanged: { addListener() {}, removeListener() {} },
  },
  runtime: { sendMessage: async () => {}, getURL: (p: string) => p },
  tabs: { create: async () => {} },
};
(globalThis as unknown as { browser: typeof browser }).browser = browser;
