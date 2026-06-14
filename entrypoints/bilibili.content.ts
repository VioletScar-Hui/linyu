import { registerAdapter } from '../lib/adapters/runner';
import { bilibiliAdapter } from '../lib/adapters/bilibili';

// 注:专栏编辑器在同源 iframe 内,顶层脚本访问 iframe.contentDocument 即可。
export default defineContentScript({
  matches: ['https://member.bilibili.com/*'],
  async main() {
    registerAdapter(bilibiliAdapter);
  },
});
