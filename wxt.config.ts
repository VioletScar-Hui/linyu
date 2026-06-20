import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: '灵羽 · 多平台分发',
    description: '一处撰写,羽传多平台:Markdown 文章+配图半自动填充到公众号/知乎/小红书/B站/X 等',
    permissions: ['storage', 'unlimitedStorage', 'tabs', 'scripting'],
    // AI 助手(BYOK)直连各服务商,且允许用户自填任意 API 地址(代理/自建网关),
    // 故需对所有 https 端点放开跨域 fetch 权限。如只用内置 7 家,可收窄为具体域名白名单。
    host_permissions: ['https://*/*'],
    icons: { 16: 'icon/16.png', 32: 'icon/32.png', 48: 'icon/48.png', 128: 'icon/128.png' },
  },
});
