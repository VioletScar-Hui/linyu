import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // 开发工具条会注入一个浮层，关掉更干净（也避免截图工具卡住）
  devToolbar: { enabled: false },
  // 部署时改成你的线上地址，例如 'https://yourname.github.io'
  // site: 'https://yourname.com',
  //
  // 如果部署在子路径下（例如 GitHub Pages 项目站 yourname.github.io/linyu），
  // 取消下面这行注释并改成对应路径，站内链接会自动加前缀。
  // base: '/linyu',
});
