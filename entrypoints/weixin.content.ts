import { registerAdapter } from '../lib/adapters/runner';
import { weixinAdapter, maybeRedirectToEditor } from '../lib/adapters/weixin';

// 注:content script 仅在文档加载时执行一次。"去发布"开后台首页 → 本脚本探测到
// 待填充任务后自动跳转新建图文编辑器(新文档加载) → 适配器认领并填充,全程免手动。
export default defineContentScript({
  matches: ['https://mp.weixin.qq.com/*'],
  async main() {
    registerAdapter(weixinAdapter);
    if (!weixinAdapter.isEditorPage()) await maybeRedirectToEditor();
  },
});
