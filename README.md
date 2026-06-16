# 灵羽 · 多平台分发助手 v2

[中文](README.md) | [English](README.en.md)

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-111827)
![Version](https://img.shields.io/badge/Version-v2-8B5CF6)
![Platforms](https://img.shields.io/badge/Auto--fill-7%20platforms-00B96B)
![Stack](https://img.shields.io/badge/WXT%20%2B%20React%20%2B%20TypeScript-111827)
![License](https://img.shields.io/github/license/VioletScar-Hui/linyu)

`linyu` 是一个 Chrome Manifest V3 插件，面向需要把同一篇 Markdown 长文和本地配图分发到多个内容平台的创作者。v2 把“撰写、配图、短文案变体、发布前检查、跳转填充、历史管理、备份恢复”整合到一个本地优先的半自动发布工作流里。

灵羽不会调用平台私有发布 API，也不会替你点击最终发布按钮。它负责打开目标平台编辑器并尽量填充标题、正文、图片或短文案，最终发布仍由你在平台页面人工确认。

---

## 图文介绍

### 1. 一处撰写，多端分发

![灵羽多平台分发总览](assets/intro-01-overview.png)

在撰写台中新建任务，粘贴 Markdown 正文、导入本地配图，并为不同平台准备对应版本。长文平台使用完整正文，短内容平台使用自动生成或手动编辑的短文案变体。

### 2. 半自动填充，人工确认

![灵羽半自动填充与人工确认](assets/intro-02-human-review.png)

灵羽把内容送到平台原生编辑器中，保留平台自己的登录、审核、预览和发布流程。适合需要效率，但又不能放弃人工质检的内容分发场景。

### 3. 本地优先，避免上传历史

![灵羽本地安全发布工作流](assets/intro-03-local-safety.png)

任务草稿、图片和设置保存在浏览器本地存储中；仓库不会提交运行期历史、构建产物和调试缓存。自动填充失效时，可以用“复制富文本”作为兜底方案。

---

## v2 重点

- **7 个自动填充平台**：微信公众号、知乎专栏、小红书、B 站专栏、人人都是产品经理、X、Reddit。
- **7 个快捷跳转平台**：微博头条文章、简书、掘金、CSDN、今日头条、豆瓣、Medium，可在设置里按需启用。
- **撰写台升级**：Markdown 编辑、HTML 预览、全屏分屏、常用片段、一键复制富文本。
- **图片工作流**：拖入图片、截图粘贴入库、按光标插图、封面标记、预览中移动图片、裁剪/旋转/翻转/压缩。
- **平台变体**：为小红书、X、Reddit 生成独立标题或正文变体，并允许发布前手动调整。
- **发布前体检**：按平台检查标题、正文、图片、封面、字数和缺失变体，给出红/黄/绿状态。
- **历史与备份**：任务自动保存，历史列表支持搜索、删除、复制为新任务；设置页支持全量导出/导入；单篇文章可导出为 Markdown（含图片 zip 包，可直接拖进 Typora/Obsidian）。
- **维护工具**：平台适配器支持当前页面自检，便于定位页面改版后失效的选择器。
- **工程化**：WXT + React + TypeScript，Vitest 单测，ESLint，GitHub Actions 自动运行 lint/test/build。
- **作品展示站**：`showcase/` 内置独立 Astro 案例站，可放到个人网站或单独部署。

---

## 适用场景

适合：

- 一篇长文需要同步分发到多个内容平台。
- Markdown 正文包含本地图片，希望尽量保持基础排版。
- 小红书、X、Reddit 等平台需要从长文改写出短版本。
- 发布前仍希望人工检查平台规则、图片、标题和最终效果。

不适合：

- 绕过平台审核或自动点击最终发布按钮。
- 通过平台私有 API 批量发布。
- 保存账号密码、Cookie 或平台登录凭据。

---

## 安装

本仓库是插件源码，需要先构建，再在 Chrome 中加载：

```powershell
git clone https://github.com/VioletScar-Hui/linyu.git
cd linyu
npm install
npm run build
```

构建产物位于 `.output/chrome-mv3`。打开 Chrome：

```text
chrome://extensions
```

开启“开发者模式”，点击“加载已解压的扩展程序”，选择 `.output/chrome-mv3` 目录。

改动源码后，重新运行 `npm run build`，并在扩展管理页点击重新加载。

---

## 第一次运行

1. 点击浏览器工具栏中的灵羽图标。
2. 新建分发任务，输入标题，粘贴 Markdown 正文。
3. 拖入本地图片，或在正文编辑区用 `Ctrl+V` 粘贴截图。
4. 需要时把图片插入到正文光标处，或在图片库中设置封面、裁剪、旋转、压缩。
5. 在变体面板生成或编辑小红书、X、Reddit 文案。
6. 查看发布前体检，确认没有阻断项。
7. 在平台栏选择目标平台并发起填充。
8. 到平台页面人工检查，最后手动发布。

---

## 支持平台

### 自动填充

| 平台 | 匹配范围 | 当前能力 |
| --- | --- | --- |
| 微信公众号 | `mp.weixin.qq.com` | 标题、摘要、正文含图填充；多账号跳转；封面从正文选择 |
| 知乎专栏 | `zhuanlan.zhihu.com` | 标题、正文和图片填充 |
| 小红书创作服务平台 | `creator.xiaohongshu.com` | 切换图文入口、上传图片、填写标题和正文变体 |
| B 站专栏 | `member.bilibili.com` | 专栏标题和正文填充，图片需在编辑器内确认 |
| 人人都是产品经理 | `woshipm.com` | 文章标题和正文填充 |
| X | `x.com` | 推文变体和图片填充 |
| Reddit | `reddit.com` / `old.reddit.com` | 标题和 Markdown 正文填充 |

### 快捷跳转

微博头条文章、简书、掘金、CSDN、今日头条、豆瓣、Medium 暂时只提供创作入口跳转。平台可在设置中启用或关闭。

平台页面会变化。如果某个平台填充失败，先使用“复制富文本”手动粘贴；再在平台编辑器页面打开 popup，点击当前页面适配器自检，查看失效选择器，并更新 `lib/adapters/<platform>.ts` 中的 `SELECTORS`。

---

## 数据与隐私

- 任务正文、图片、平台状态和设置存储在浏览器 `storage.local`。
- v2 使用 `task:{id}` + `taskIndex` 的拆分存储，历史列表只读取轻量索引，避免每次加载都读入全部图片。
- 最多保留最近 20 个任务，超出后自动清理旧任务。
- 支持导出/导入包含任务和设置的 JSON 备份。
- 不保存账号密码、Cookie 或平台登录凭据。
- 不上传浏览器历史，不提交运行期任务历史。
- `.gitignore` 排除了 `node_modules/`、`.wxt/`、`.output/`、`preview/out.js`。

默认 Chrome 用户数据通常位于系统用户目录下，插件的运行期本地数据由浏览器管理；仓库中的源码、构建产物和浏览器本地历史是两回事。

---

## 本地开发

```powershell
npm run dev        # WXT 热重载开发
npm test           # Vitest 单元测试
npm run lint       # ESLint 检查
npm run build      # 构建到 .output/chrome-mv3
npm run preview    # 撰写台可视化预览，默认 http://localhost:5199
npm run icons      # 重新生成插件图标
```

CI 位于 `.github/workflows/ci.yml`，在 push 和 pull request 时运行：

```text
npm ci -> npm run lint -> npm test -> npm run build
```

---

## 作品展示站

`showcase/` 是一个独立 Astro 项目，用来把灵羽放到个人网站作品集中展示。它包含：

- 首页作品区入口卡。
- `/projects/linyu` 独立详情页。
- `/components` 项目卡片组件状态页。

本地运行：

```powershell
cd showcase
npm install
npm run dev
```

部署到 Vercel、Netlify 或 Cloudflare Pages 时，把 Root Directory 设置为 `showcase`，构建命令使用 `npm run build`，输出目录为 `dist`。

---

## 仓库结构

```text
linyu/
  entrypoints/              # WXT 入口：popup、composer、content scripts、background
  entrypoints/composer/     # 撰写台：历史、图片、变体、预检、设置、预览
  lib/                      # Markdown、图片、任务、设置、备份、预检等纯逻辑
  lib/adapters/             # 各平台 SELECTORS、填充逻辑和自检逻辑
  preview/                  # 撰写台可视化预览服务
  public/                   # WXT 静态资源和插件图标
  scripts/                  # 图标生成脚本
  showcase/                 # 独立 Astro 作品展示站
  tests/                    # Vitest 单元测试
  assets/                   # README 介绍图
  wxt.config.ts             # WXT 配置和 Manifest 信息
  eslint.config.js          # ESLint flat config
  .github/workflows/ci.yml  # CI
```

---

## FAQ

### 为什么不是全自动发布？

不同平台的登录、审核、编辑器状态和发布确认都不同。灵羽只做内容填充和辅助跳转，最终发布由用户在平台页面手动确认。

### 历史记录会上传到仓库或服务器吗？

不会。任务历史保存在浏览器本地 `storage.local`，仓库只保存源码。构建目录、运行期缓存和本地依赖已通过 `.gitignore` 排除。

### 自动填充失败怎么办？

先使用“复制富文本”兜底，把内容手动粘贴到平台编辑器。之后在该平台页面打开灵羽 popup，运行当前页面适配器自检，根据结果更新对应适配器的选择器。

### 为什么 README 里写 v2，`package.json` 还是 `1.0.0`？

这里的 v2 指当前功能迭代版本和 README 展示版本，不等同于 npm 包发布版本。本项目是私有/个人插件源码仓库，尚未作为公开 npm 包发布。

---

## License

本仓库包含 [`LICENSE`](LICENSE) 文件，具体协议请查看该文件。
