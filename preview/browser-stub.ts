// 预览用:stub 扩展 API,让真实 composer 组件在普通页面跑起来
const store: Record<string, unknown> = {
  settings: { mpAccounts: [
    { id: '1', name: '主号·科技', token: '111222' },
    { id: '2', name: '小号·随笔', token: '' },
  ] },
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
