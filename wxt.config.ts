import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: '文章多平台分发助手',
    description: 'Markdown 文章+配图半自动填充到公众号/知乎/人人都是产品经理/小红书',
    permissions: ['storage', 'unlimitedStorage', 'tabs', 'scripting'],
  },
});
