import { runAdapter } from '../lib/adapters/runner';
import { zhihuAdapter } from '../lib/adapters/zhihu';

export default defineContentScript({
  matches: ['*://zhuanlan.zhihu.com/*'],
  async main() {
    await runAdapter(zhihuAdapter);
  },
});
