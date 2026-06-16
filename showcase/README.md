# Linyu 灵羽 · Showcase

Linyu（灵羽）Chrome 发布助手的作品展示站，基于 **Astro** 静态站点。
对应你给的 4 张设计稿：作品区入口卡、卡片组件三态、独立详情页首屏、详情页长结构。

## 页面

| 路径 | 内容 | 对应设计稿 |
| --- | --- | --- |
| `/` | 首页作品区 + Featured Linyu 入口卡 + 其它项目卡 | 图 4 |
| `/projects/linyu` | **独立详情页**（Hero / Overview / Problem / Workflow / Key Screens / Local-first / Tech Stack / Links） | 图 1 + 图 2 |
| `/components` | 卡片组件三态 Default / Hover / Mobile | 图 3 |

> 你要从个人网站点进来的落地页是 **`/projects/linyu`**。

## 本地开发

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # 产物输出到 dist/
npm run preview  # 本地预览构建产物
```

## 改文案 / 换素材

- **文案、链接、技术栈**：全部集中在 `src/data/project.ts`，改这里即可，不用动页面结构。
  把 `links.sourceCode` / `liveDemo` / `documentation` / `changelog` 换成你真实地址。
- **作者名 / 导航**：同文件里的 `site`。
- **吉祥物立绘**：把 PNG（透明背景）放到 `public/assets/`，然后给 `<Mascot />` 传 `src`。
  详见 `public/assets/README.md`。未替换前会显示同色系占位 chibi，不影响上线。
- **配色 / 字体**：`src/styles/global.css` 顶部的 CSS 变量。

## 部署

构建产物是纯静态文件（`dist/`），可部署到任意静态托管：

- **Vercel**：导入 `VioletScar-Hui/linyu` 仓库后，**把 Root Directory 设为 `showcase`**
  （因为本站位于扩展仓库的 `showcase/` 子目录），Framework 会自动识别为 Astro，其余零配置。
- **Netlify / Cloudflare Pages**：Base/Root 目录设 `showcase`，Build `npm run build`，Output `dist`。
- **GitHub Pages**：用 `astro` 官方 action，或把 `dist/` 推到 `gh-pages` 分支。
  若部署在子路径（如 `用户名.github.io/linyu`），在 `astro.config.mjs` 里设置
  `site` 和 `base: '/linyu'`，站内链接会自动加前缀。

部署后，在你的个人网站作品卡上把「View Case Study」链接指向这个站的 `/projects/linyu` 即可。

## 技术

Astro 5 · 原生 CSS（设计令牌）· 内联 SVG 图标 · 无运行时框架，纯静态输出。
