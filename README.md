# 灵羽 · AI 辅助多平台分发助手 v3

[中文](README.md) | [English](README.en.md)

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-111827)
![Version](https://img.shields.io/badge/Version-v3-8B5CF6)
![Auto-fill](https://img.shields.io/badge/Auto--fill-7%20platforms-00B96B)
![AI](https://img.shields.io/badge/AI-BYOK%20multi--provider-B45309)
![Stack](https://img.shields.io/badge/WXT%20%2B%20React%20%2B%20TypeScript-111827)
![License](https://img.shields.io/github/license/VioletScar-Hui/linyu)

`linyu` 是一个 Chrome Manifest V3 插件，面向需要把同一篇长文和本地配图分发到多个内容平台的创作者。v3 在 v2 的半自动分发基础上，加入 **BYOK 多服务商 AI 助手**、**飞书式所见即所得编辑器**、图片自动压缩、粘贴图片自动入库、Markdown+图片 zip 导出，以及更稳定的左右两栏撰写台。

灵羽不是全自动发布机器人。它负责辅助撰写、生成平台变体、做发布前检查、打开目标平台编辑器并尽量填充内容；最终发布仍由你在平台页面人工确认。

---

## 图文介绍

### 1. AI 辅助撰写，多平台半自动分发

![灵羽 v3 总览](assets/intro-01-overview.png)

在撰写台中完成长文、配图、平台变体和发布前检查。AI 可以辅助起标题、改写短文案、推荐标签和做语义体检；分发时由插件打开目标编辑器并填充，最后由人工确认发布。

### 2. 所见即所得编辑器 + AI 工作台

![灵羽 v3 AI 撰写工作流](assets/intro-02-human-review.png)

v3 把原 Markdown 文本框升级为 Milkdown Crepe 所见即所得编辑器，底层仍保存 Markdown。右侧常驻图片、变体、预检、平台分发和 AI 操作，写作与发布准备可以在一个界面内完成。

### 3. 本地优先，透明可控

![灵羽 v3 本地安全工作流](assets/intro-03-local-safety.png)

任务、图片、设置和 API Key 存在浏览器本地。AI 只有在你主动点击功能时，才会把当前内容发给你选择的服务商；不保存账号密码，不上传浏览器历史，不调用平台私有发布 API。

---

## v3 重点

### AI 助手

- **BYOK 多服务商**：支持 Claude 官方、Kimi/Moonshot、DeepSeek、智谱 GLM、MiniMax、OpenRouter、AiHubMix，以及自定义 OpenAI 兼容接口。
- **全局配置 + 功能级覆盖**：可设置一个全局服务商、API 地址、Key 和模型；也可为“平台变体、标题、标签、语义体检”单独配置服务商/Key/模型。
- **模型拉取**：设置页可通过服务商接口拉取可用模型，仍保留手动输入模型 id 的入口。
- **四个 AI 功能**：平台短文案变体、AI 起标题/钩子、话题标签推荐、语义发布前体检。
- **本地密钥边界**：Key 存在 `storage.local`；只有用户主动触发 AI 功能时，当前标题/正文才会发送给所选服务商。

### 撰写与图片

- **所见即所得编辑器**：基于 Milkdown Crepe，像写文档一样编辑，底层仍是 Markdown，兼容后续预检、导出和平台适配器。
- **左右两栏撰写台**：主栏用于标题与正文，侧栏常驻图片库、平台变体、发布前体检、分发按钮和设置入口。
- **粘贴图片自动入库**：在编辑器里粘贴或拖入图片，会自动加入图片库并改写为 `filename` 引用，避免把大型 `dataUrl` 塞进正文。
- **图片自动压缩**：超过 1920px 长边的图片会等比缩小；JPEG/WebP 按质量重编码，只有结果更小时才替换；GIF/SVG 原样保留。
- **Markdown zip 导出**：单篇文章可导出为 `article.md + images/` 的 zip 包，适合继续放进 Typora、Obsidian 或归档系统。
- **保存快捷键**：`Ctrl/Cmd + S` 保存当前任务，并拦截浏览器默认“保存网页”对话框。

### 分发与维护

- **7 个自动填充平台**：微信公众号、知乎专栏、小红书、B 站专栏、人人都是产品经理、X、Reddit。
- **7 个快捷跳转平台**：微博头条文章、简书、掘金、CSDN、今日头条、豆瓣、Medium，可在设置里启用或关闭。
- **发布前体检**：按平台检查标题、正文、图片、封面、字数和缺失变体，给出红/黄/绿状态。
- **历史与备份**：任务自动保存，历史列表支持搜索、删除、复制为新任务；设置页支持全量导出/导入。
- **适配器自检**：平台页面改版导致填充失败时，可在当前页面运行自检，定位失效选择器。
- **工程化**：WXT + React + TypeScript，Vitest 单测，ESLint，GitHub Actions 自动运行 lint/test/build。

---

## 适用场景

适合：

- 一篇长文需要同步分发到多个内容平台。
- 你希望 AI 辅助生成平台化标题、短文案、标签或发布风险提示。
- Markdown 正文包含本地图片，希望尽量保持基础排版。
- 发布前仍希望人工检查平台规则、图片、标题和最终效果。

不适合：

- 绕过平台审核或自动点击最终发布按钮。
- 通过平台私有 API 批量发布。
- 让插件托管账号密码、Cookie 或平台登录凭据。
- 不希望文章内容在主动触发 AI 功能时发送给第三方模型服务商。

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
2. 新建分发任务，输入标题，在所见即所得编辑器里撰写正文，也可以导入 `.md`。
3. 拖入本地图片，或直接在编辑器里粘贴/拖入截图，图片会自动入库并尽量压缩。
4. 在设置页配置 AI 服务商与 API Key；需要时为不同 AI 功能单独配置模型。
5. 使用 AI 起标题、生成小红书/X/Reddit 变体、推荐标签或做语义体检。
6. 查看发布前体检，确认没有阻断项。
7. 用 `Ctrl/Cmd + S` 随时保存；草稿也会自动保存。
8. 在平台栏选择目标平台并发起填充。
9. 到平台页面人工检查，最后手动发布。

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

## 数据、权限与隐私

- 任务正文、图片、平台状态、设置和 API Key 存储在浏览器 `storage.local`。
- 任务使用 `task:{id}` + `taskIndex` 拆分存储，历史列表只读取轻量索引，避免每次加载都读入全部图片。
- 最多保留最近 20 个任务，超出后自动清理旧任务。
- 支持导出/导入包含任务和设置的 JSON 备份。
- 支持单篇文章导出为 Markdown zip。
- 不保存账号密码、Cookie 或平台登录凭据。
- 不上传浏览器历史，不提交运行期任务历史。
- AI 功能需要跨域请求模型服务商或自定义网关，因此 manifest 使用 `host_permissions: ["https://*/*"]`；如果只保留固定服务商，可在 `wxt.config.ts` 中收窄为具体域名白名单。
- `.gitignore` 排除了 `node_modules/`、`.wxt/`、`.output/`、`preview/out.js`、`preview/out.css`。

默认 Chrome 用户数据通常位于系统用户目录下，插件运行期本地数据由浏览器管理；仓库中的源码、构建产物和浏览器本地历史是两回事。

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
  entrypoints/composer/     # 撰写台：WYSIWYG、AI、历史、图片、变体、预检、设置
  lib/                      # Markdown、图片、压缩、AI、任务、设置、备份、预检等逻辑
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

### AI 会自动读取或上传我的内容吗？

不会。AI 只有在你点击起标题、生成变体、推荐标签或语义体检时才会调用。调用时会把当前标题/正文发送给你配置的服务商或自定义网关。

### API Key 存在哪里？

AI Key 存在浏览器本地 `storage.local`，不会提交到仓库。不同 AI 功能可以使用不同 Key；功能级 Key 只在该功能触发时使用。

### 自动填充失败怎么办？

先使用“复制富文本”兜底，把内容手动粘贴到平台编辑器。之后在该平台页面打开灵羽 popup，运行当前页面适配器自检，根据结果更新对应适配器的选择器。

### 为什么 README 写 v3，`package.json` 还是 `1.0.0`？

这里的 v3 指当前功能迭代版本和 README 展示版本，不等同于 npm 包发布版本。本项目是个人 Chrome 插件源码仓库，尚未作为公开 npm 包发布。

---

## License

本仓库包含 [`LICENSE`](LICENSE) 文件，具体协议请查看该文件。
