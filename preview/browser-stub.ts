// 预览用:stub 扩展 API,让真实 composer 组件在普通页面跑起来
export const browser = {
  storage: {
    local: {
      get: async () => ({}),
      set: async () => {},
    },
    onChanged: { addListener() {}, removeListener() {} },
  },
  runtime: { sendMessage: async () => {}, getURL: (p: string) => p },
  tabs: { create: async () => {} },
};
(globalThis as unknown as { browser: typeof browser }).browser = browser;
