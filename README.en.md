# Linyu · AI-Assisted Multi-Platform Publishing Assistant v3

[中文](README.md) | [English](README.en.md)

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-111827)
![Version](https://img.shields.io/badge/Version-v3-8B5CF6)
![Auto-fill](https://img.shields.io/badge/Auto--fill-7%20platforms-00B96B)
![AI](https://img.shields.io/badge/AI-BYOK%20multi--provider-B45309)
![Stack](https://img.shields.io/badge/WXT%20%2B%20React%20%2B%20TypeScript-111827)
![License](https://img.shields.io/github/license/VioletScar-Hui/linyu)

`linyu` is a Chrome Manifest V3 extension for creators who publish the same long-form article and local images across multiple content platforms. v3 builds on the v2 semi-automated distribution workflow with a **BYOK multi-provider AI assistant**, a **Feishu/Notion-style WYSIWYG editor**, automatic image compression, pasted-image ingestion, Markdown+image zip export, and a more stable two-column composer.

Linyu is not a fully automatic publishing bot. It assists writing, generates platform variants, runs pre-publish checks, opens target platform editors, and fills content where possible. The final publish action stays with the user on the platform page.

---

## Visual Introduction

### 1. AI-Assisted Writing, Semi-Automated Distribution

![Linyu v3 overview](assets/intro-01-overview.png)

Prepare the long article, images, platform variants, and pre-publish checks in the composer. AI can help generate titles, rewrite short-form variants, recommend tags, and run semantic review; Linyu then opens native editors and fills content for manual confirmation.

### 2. WYSIWYG Editor + AI Workspace

![Linyu v3 AI writing workflow](assets/intro-02-human-review.png)

v3 replaces the Markdown textarea with a Milkdown Crepe WYSIWYG editor while keeping Markdown as the storage layer. The right sidebar keeps images, variants, checks, dispatch actions, and AI tools visible while writing.

### 3. Local-First and Transparent

![Linyu v3 local-first safety workflow](assets/intro-03-local-safety.png)

Tasks, images, settings, and API keys stay in browser local storage. AI requests are sent only when you explicitly run a feature, and only to the provider you configure. Linyu stores no credentials, uploads no browser history, and does not call private publishing APIs.

---

## v3 Highlights

### AI Assistant

- **BYOK multi-provider support**: Claude official, Kimi/Moonshot, DeepSeek, Zhipu GLM, MiniMax, OpenRouter, AiHubMix, and custom OpenAI-compatible endpoints.
- **Global config + feature overrides**: set one default provider, base URL, API key, and model; or override provider/key/model per feature.
- **Model fetching**: the settings panel can fetch model ids from providers while still allowing manual model input.
- **Four AI features**: platform short-form variants, AI title/hooks, topic/tag recommendations, and semantic pre-publish review.
- **Local key boundary**: keys live in `storage.local`; article content is sent only when the user explicitly triggers an AI feature.

### Writing and Images

- **WYSIWYG editor**: powered by Milkdown Crepe. It feels like editing a document while Markdown remains the source format for checks, export, and adapters.
- **Two-column composer**: the main column holds title and body; the sidebar keeps image gallery, variants, preflight, dispatch, and settings close at hand.
- **Pasted-image ingestion**: images pasted or dropped into the editor are added to the gallery and rewritten to `filename` references instead of embedding huge `dataUrl` blobs.
- **Automatic image compression**: images over a 1920px long edge are scaled down; JPEG/WebP are re-encoded by quality and replaced only when smaller; GIF/SVG stay unchanged.
- **Markdown zip export**: export a single article as `article.md + images/`, ready for Typora, Obsidian, or archiving.
- **Save shortcut**: `Ctrl/Cmd + S` saves the current task and intercepts the browser's default "save page" dialog.

### Distribution and Maintenance

- **7 auto-fill platforms**: WeChat Official Account, Zhihu Column, Xiaohongshu, Bilibili Column, Woshipm, X, and Reddit.
- **7 quick-jump platforms**: Weibo article, Jianshu, Juejin, CSDN, Toutiao, Douban, and Medium, configurable in settings.
- **Pre-publish inspection**: platform-level checks for title, body, images, cover, length, and missing variants.
- **History and backup**: auto-save tasks, search/delete/duplicate history, and full JSON export/import.
- **Adapter self-check**: helps locate broken selectors when platforms change their editors.
- **Engineering**: WXT + React + TypeScript, Vitest, ESLint, and GitHub Actions for lint/test/build.

---

## Use Cases

Good fit:

- One long article needs to be published to several content platforms.
- You want AI help for titles, short-form variants, tags, or publishing-risk review.
- The Markdown body contains local images and should keep a basic layout.
- You still want a human to review platform rules, images, title, and final rendering.

Not a fit:

- Bypassing platform review or auto-clicking final publish buttons.
- Bulk publishing through private platform APIs.
- Letting the extension manage credentials, cookies, or platform login tokens.
- Avoiding third-party model calls when you explicitly trigger AI features.

---

## Installation

This repository contains source code. Build the extension first, then load it in Chrome:

```powershell
git clone https://github.com/VioletScar-Hui/linyu.git
cd linyu
npm install
npm run build
```

The build output is `.output/chrome-mv3`. Open Chrome:

```text
chrome://extensions
```

Enable "Developer mode", click "Load unpacked", and select `.output/chrome-mv3`.

After editing source code, run `npm run build` again and reload the extension on the Chrome extensions page.

---

## First Run

1. Click the Linyu icon in the browser toolbar.
2. Create a distribution task, enter a title, and write the body in the WYSIWYG editor; `.md` import is supported.
3. Drag in local images, or paste/drop screenshots into the editor; images are ingested and compressed when useful.
4. Configure an AI provider and API key in settings; optionally set separate models for individual AI features.
5. Use AI titles, Xiaohongshu/X/Reddit variants, tag recommendations, or semantic review.
6. Review the pre-publish inspection panel.
7. Save anytime with `Ctrl/Cmd + S`; drafts also auto-save.
8. Select target platforms and dispatch filling.
9. Review the native platform editor manually, then publish yourself.

---

## Supported Platforms

### Auto-Fill

| Platform | Match | Capability |
| --- | --- | --- |
| WeChat Official Account | `mp.weixin.qq.com` | Title, summary, body-with-images; multi-account jump; cover selected from body |
| Zhihu Column | `zhuanlan.zhihu.com` | Title, body, and image filling |
| Xiaohongshu Creator | `creator.xiaohongshu.com` | Switch to image-post entry, upload images, fill title and body variant |
| Bilibili Column | `member.bilibili.com` | Column title and body filling; images need editor confirmation |
| Woshipm | `woshipm.com` | Article title and body filling |
| X | `x.com` | Tweet variant and image filling |
| Reddit | `reddit.com` / `old.reddit.com` | Title and Markdown body filling |

### Quick Jump

Weibo article, Jianshu, Juejin, CSDN, Toutiao, Douban, and Medium currently provide editor-entry jumps only. They can be enabled or disabled in settings.

Platform pages change over time. If filling fails, use "copy rich text" as a manual fallback. Then open the popup on that platform editor page, run the current-page adapter self-check, and update the `SELECTORS` in `lib/adapters/<platform>.ts`.

---

## Data, Permissions, and Privacy

- Task bodies, images, platform status, settings, and API keys are stored in browser `storage.local`.
- Tasks are stored as `task:{id}` plus a lightweight `taskIndex`, so the history list does not load every image every time.
- The extension keeps up to 20 recent tasks and prunes older ones.
- JSON export/import backs up tasks and settings.
- Single-article Markdown zip export is supported.
- No credentials, cookies, or platform login tokens are stored.
- Browser history is not uploaded, and runtime task history is not committed.
- AI features need cross-origin requests to model providers or custom gateways, so the manifest uses `host_permissions: ["https://*/*"]`; if you only use fixed providers, narrow this in `wxt.config.ts`.
- `.gitignore` excludes `node_modules/`, `.wxt/`, `.output/`, `preview/out.js`, and `preview/out.css`.

Chrome usually stores extension runtime data inside the user's browser profile. Repository source code, build output, and browser-local task history are separate things.

---

## Development

```powershell
npm run dev        # WXT hot-reload development
npm test           # Vitest unit tests
npm run lint       # ESLint
npm run build      # build to .output/chrome-mv3
npm run preview    # composer visual preview, usually http://localhost:5199
npm run icons      # regenerate extension icons
```

CI lives in `.github/workflows/ci.yml` and runs on push and pull request:

```text
npm ci -> npm run lint -> npm test -> npm run build
```

---

## Showcase Site

`showcase/` is a standalone Astro project for presenting Linyu inside a personal portfolio. It includes:

- A homepage project-card entrance.
- `/projects/linyu`, the independent case-study page.
- `/components`, project-card component states.

Run locally:

```powershell
cd showcase
npm install
npm run dev
```

For Vercel, Netlify, or Cloudflare Pages, set the root directory to `showcase`, build command to `npm run build`, and output directory to `dist`.

---

## Repository Structure

```text
linyu/
  entrypoints/              # WXT entries: popup, composer, content scripts, background
  entrypoints/composer/     # Composer UI: WYSIWYG, AI, history, images, variants, preflight, settings
  lib/                      # Markdown, images, compression, AI, tasks, settings, backup, preflight logic
  lib/adapters/             # Platform SELECTORS, filling logic, and self-checks
  preview/                  # Composer visual preview server
  public/                   # WXT static assets and extension icons
  scripts/                  # Icon generation scripts
  showcase/                 # Standalone Astro portfolio case-study site
  tests/                    # Vitest unit tests
  assets/                   # README visuals
  wxt.config.ts             # WXT config and manifest fields
  eslint.config.js          # ESLint flat config
  .github/workflows/ci.yml  # CI
```

---

## FAQ

### Why not fully automatic publishing?

Login state, editor behavior, review rules, and publish confirmation differ by platform. Linyu only fills content and assists navigation; final publish is manually confirmed by the user.

### Does AI automatically read or upload my content?

No. AI runs only when you click title generation, variant generation, tag recommendations, or semantic review. That request sends the current title/body to the provider or custom gateway you configured.

### Where are API keys stored?

AI keys are stored in browser-local `storage.local` and are not committed to the repo. Different AI features can use different keys; a feature-level key is used only when that feature runs.

### What if auto-fill fails?

Use "copy rich text" to paste manually into the platform editor. Then run the adapter self-check on that page and update the corresponding selectors.

### Why does this README say v3 while `package.json` says `1.0.0`?

v3 refers to the current feature/documentation iteration, not an npm package release. This project is a personal Chrome extension source repository rather than a published npm package.

---

## License

This repository includes a [`LICENSE`](LICENSE) file; see it for the exact terms.
