# 灵羽 · 多平台分发助手

[中文](README.md) | [English](README.en.md)

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-111827)
![Platforms](https://img.shields.io/badge/Platforms-7+-00B96B)
![Language](https://img.shields.io/badge/Language-ZH%20%2B%20EN-blue)
![License](https://img.shields.io/github/license/VioletScar-Hui/linyu)
![Status](https://img.shields.io/badge/Status-Active-success)

`linyu` 是一个 Chrome Manifest V3 多平台内容分发插件。它面向需要把同一篇 Markdown 文章和配图分发到微信公众号、知乎、小红书、B 站专栏、人人都是产品经理、X 和 Reddit 的创作者，把“撰写、改写、配图、填充、检查”集中到一个半自动工作流里。

插件不会调用平台私有发布 API，也不会替用户直接点击最终发布按钮。它负责在浏览器端打开对应平台编辑器并填充内容，最终发布动作仍由用户检查后确认。

本仓库是插件**源码**（TypeScript + WXT + React），可由 `npm run build` 构建出可加载的 Chrome 扩展。运行期草稿历史、浏览器本地存储、调试缓存和构建目录（`.output/`、`.wxt/`）不会提交到仓库。

---

## 图文介绍

### 1. 一处撰写，多端分发

![灵羽多平台分发总览](assets/intro-01-overview.png)

在插件弹窗中新建分发任务，粘贴 Markdown 正文并加入本地配图，然后按平台生成对应内容版本。灵羽会把长文、配图和平台入口整理成一条清晰的发布链路。

### 2. 半自动填充，人工确认

![灵羽半自动填充与人工确认](assets/intro-02-human-review.png)

灵羽负责把标题、正文、图片和标签填充到目标平台编辑器中；你仍然保留最终检查和手动发布的控制权，适合需要质量把关的内容工作流。

### 3. 安全本地发布工作流

![灵羽安全本地发布工作流](assets/intro-03-local-safety.png)

插件以本地优先为边界：不保存账号密码，不上传浏览器历史，不调用平台私有发布 API。自动填充失败时，可以使用复制富文本作为兜底方案。

---

## 适用场景

适合使用灵羽的情况：

- 同一篇长文需要同步发布到多个内容平台。
- Markdown 正文中包含本地配图，需要在不同平台保持基本排版。
- 小红书、X、Reddit 等短内容平台需要从长文生成更短的文案变体。
- 发布前仍希望由人最终检查标题、图片、正文和平台规则。

不适合的场景：

- 需要绕过平台审核或自动点击最终发布按钮。
- 需要调用平台私有接口批量发布。
- 需要保存账号密码、Cookie 或平台登录凭据。

---

## 安装

本仓库是源码，需先构建出扩展再加载：

```powershell
git clone https://github.com/VioletScar-Hui/linyu.git
cd linyu
npm install
npm run build
```

构建产物在 `.output/chrome-mv3`。然后在 Chrome 中：

```text
chrome://extensions
```

开启“开发者模式”，选择“加载已解压的扩展程序”，选择 `.output/chrome-mv3` 目录（其中的 `manifest.json` 是插件入口）。

> 改了源码后重新 `npm run build`，并在扩展页点刷新即可生效。

---

## 第一次成功运行

安装完成后：

1. 点击浏览器工具栏中的灵羽图标。
2. “新建分发”，粘贴 Markdown 正文并拖入配图（可点缩略图裁剪/旋转/压缩，或插入到正文）。
3. 按目标平台生成文案变体，或长文平台直接用正文。
4. 看“发布前体检”确认无红黄问题后，点目标平台的“去发布”，插件会打开平台编辑器并填充。
5. 人工检查内容后，在平台页面完成最终发布。

---

## 支持平台

有自动填充适配器的 7 个平台：

| 平台 | 匹配范围 | 当前能力 |
|---|---|---|
| 微信公众号 | `mp.weixin.qq.com` | 标题/摘要/正文含图填充；多账号选号直达；封面自动点“从正文选择” |
| 知乎专栏 | `zhuanlan.zhihu.com` | 文章编辑器填充，图片走知乎上传通道 |
| 小红书创作服务平台 | `creator.xiaohongshu.com` | 切“上传图文”、配图上传、短文案变体填充 |
| B 站创作中心 | `member.bilibili.com` | 专栏标题/正文填充（图片需在编辑器内确认） |
| 人人都是产品经理 | `woshipm.com` | 文章标题/正文填充 |
| X | `x.com` | 推文短文案 + 配图填充 |
| Reddit | `reddit.com` / `old.reddit.com` | 标题 + Markdown 正文填充 |

另含**快捷跳转**（暂无适配器，可在设置中按需启用）：微博头条文章、简书、掘金、CSDN、今日头条、豆瓣、Medium。

平台页面会持续改版。如果某个平台填充失败，先用插件的“复制富文本”兜底；再在该平台编辑器页打开 popup 点“🩺 自检当前页适配器”定位失效的选择器，改对应 `lib/adapters/<平台>.ts` 顶部的 `SELECTORS` 后重新构建。

---

## 核心能力

### 多平台半自动填充

- 根据目标平台打开对应编辑入口，填充标题、正文、图片或短文案。
- 支持勾选多个平台一键批量发起；公众号支持多账号选号直达编辑器。
- 保留平台原生发布确认流程。

### Markdown 与配图工作流

- 以 Markdown 长文作为主输入，本地配图随任务组织、按文件名匹配。
- 插件内图片编辑：裁剪 / 旋转 / 翻转 / 质量压缩，改完同名替换。
- 配图可插入正文任意位置（光标处）；预览中点击图片可上移/下移调位或编辑；支持全屏分屏编辑。
- 截图可直接 Ctrl+V 入库并插到光标处；为小红书 / X / Reddit 生成短文案变体。

### 发布与数据安全

- 发布前体检：七平台字数/格式/缺图/缺变体逐项红黄绿灯。
- 草稿自动保存、历史管理（搜索/删除/复制为新任务）、全量导出/导入备份。
- 不保存账号密码，不提交运行期历史，不上传浏览器本地存储，不调用平台私有发布接口。

---

## 仓库结构

```text
linyu/
  entrypoints/              # WXT 入口:popup / composer 撰写台 / 各平台 content script / background
  lib/                      # 纯逻辑:markdown、images、tasks、platforms、settings、backup、preflight
  lib/adapters/             # 各平台适配器(SELECTORS + 填充/自检逻辑)
  lib/ui.tsx                # 灵羽设计系统(配色/羽毛标识/通用组件)
  tests/                    # Vitest 单测
  preview/                  # 撰写台可视化预览(stub 扩展 API,免加载扩展看 UI)
  scripts/gen-icons.mjs     # 生成应用图标
  docs/superpowers/         # 设计文档 / 实施计划 / 适配器验收清单
  wxt.config.ts             # WXT 配置(manifest、权限、图标)
  eslint.config.js          # ESLint 扁平配置
  .github/workflows/ci.yml  # CI:push/PR 自动 lint + test + build
  public/                   # WXT 静态资源(应用图标)
  showcase/                 # Linyu 案例展示站(独立 Astro 项目)
  assets/                   # README 图文介绍图片
  README.md / README.en.md / LICENSE
```

---

## 开发

```powershell
npm run dev        # 热重载开发
npm test           # Vitest 单测
npm run lint       # ESLint 检查
npm run build      # 构建到 .output/chrome-mv3
npm run preview    # 撰写台可视化预览(http://localhost:5199,免加载扩展)
npm run icons      # 重新生成应用图标
```

提交到 `main` 或任意 PR 会触发 GitHub Actions（`.github/workflows/ci.yml`）自动跑 `lint → test → build`，任一失败即拦住。

`showcase/` 是一个独立的 Astro 案例展示站（与插件源码并存于仓库），有自己的依赖，可单独运行：

```powershell
cd showcase
npm install
npm run dev
```

---

## 常见问题

### 为什么不是自动发布？

不同平台的审核规则、编辑器状态和账号权限都不同。灵羽只做内容填充和辅助跳转，最终发布由用户在平台页面手动确认。

### 会上传我的历史记录吗？

不会。所有任务与设置都存在浏览器本地（`storage.local`），插件不需要也不会提交浏览器历史、账号密码或 Cookie。`.gitignore` 已排除 `.output/`、`.wxt/`、`node_modules/` 等。

### 平台填充失败怎么办？

优先使用插件中的“复制富文本”兜底，把内容手动粘贴到平台编辑器。然后在该平台编辑器页打开 popup 点“🩺 自检当前页适配器”，看哪个选择器失效（✗），改对应 `lib/adapters/<平台>.ts` 顶部的 `SELECTORS` 后 `npm run build` 重新加载。

---

## License

本仓库包含 [`LICENSE`](LICENSE) 文件，具体协议请查看该文件。
