import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: '灵羽 · 多平台分发',
    description: '一处撰写,羽传多平台:Markdown 文章+配图半自动填充到公众号/知乎/小红书/B站/X 等',
    permissions: ['storage', 'unlimitedStorage', 'tabs', 'scripting'],
    icons: { 16: 'icon/16.png', 32: 'icon/32.png', 48: 'icon/48.png', 128: 'icon/128.png' },
  },
});
