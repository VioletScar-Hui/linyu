import { registerAdapter } from '../lib/adapters/runner';
import { zhihuAdapter } from '../lib/adapters/zhihu';

// 注:content script 仅在文档加载时执行一次。工作流(撰写页→"去发布"→新标签)
// 走全新文档加载,无需监听 SPA 路由变更。
export default defineContentScript({
  matches: ['*://zhuanlan.zhihu.com/*'],
  async main() {
    registerAdapter(zhihuAdapter);
  },
});
