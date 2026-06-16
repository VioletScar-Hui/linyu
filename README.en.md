# Linyu · Multi-Platform Publishing Assistant

[中文](README.md) | [English](README.en.md)

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-111827)
![Platforms](https://img.shields.io/badge/Platforms-7+-00B96B)
![Language](https://img.shields.io/badge/Language-ZH%20%2B%20EN-blue)
![License](https://img.shields.io/github/license/VioletScar-Hui/linyu)
![Status](https://img.shields.io/badge/Status-Active-success)

`linyu` is a Chrome Manifest V3 extension for creators who publish the same Markdown article and local images across WeChat Official Accounts, Zhihu, Xiaohongshu, Bilibili columns, Woshipm, X, and Reddit. It turns writing, rewriting, image handling, editor filling, and final review into one semi-automated browser workflow.

The extension does not call private publishing APIs and does not click the final publish button for you. It opens the target platform editor, fills the content in the browser, and leaves the final publishing decision to the user.

This repository holds the **source code** (TypeScript + WXT + React); `npm run build` produces a loadable Chrome extension. Runtime draft history, browser local storage, debug caches, and build folders (`.output/`, `.wxt/`) are intentionally excluded.

---

## Visual Introduction

### 1. Write Once, Distribute Across Platforms

![Linyu multi-platform overview](assets/intro-01-overview.png)

Create a distribution task in the popup, paste your Markdown body and add local images, then generate per-platform variants. Linyu organizes the long article, images, and platform entries into one clear publishing path.

### 2. Semi-Automated Filling, Human Confirmation

![Linyu semi-automated filling with human review](assets/intro-02-human-review.png)

Linyu fills the title, body, images, and tags into the target editor; you keep full control over the final review and manual publish — ideal for content workflows that need quality gating.

### 3. Local-First Safe Publishing Workflow

![Linyu local-first safe publishing](assets/intro-03-local-safety.png)

The extension stays local-first: no stored credentials, no uploaded browser history, no private publishing APIs. When auto-filling fails, copy-as-rich-text is the fallback.

---

## Use Cases

A good fit when:

- The same long article needs to go out to multiple content platforms.
- The Markdown body contains local images that should keep basic layout across platforms.
- Short-form platforms (Xiaohongshu, X, Reddit) need shorter variants generated from the long article.
- You still want a human to review title, images, body, and platform rules before publishing.

Not a fit when:

- You want to bypass platform review or auto-click the final publish button.
- You need private bulk-publishing APIs.
- You need to store credentials, cookies, or platform login tokens.

---

## Installation

This repo is source code — build the extension first, then load it:

```powershell
git clone https://github.com/VioletScar-Hui/linyu.git
cd linyu
npm install
npm run build
```

The build output is in `.output/chrome-mv3`. Then in Chrome:

```text
chrome://extensions
```

Enable "Developer mode", choose "Load unpacked", and select the `.output/chrome-mv3` folder (its `manifest.json` is the entry point).

> After editing source, run `npm run build` again and click reload on the extensions page.

---

## First Successful Run

After installing:

1. Click the Linyu icon in the toolbar.
2. "New task", paste the Markdown body and drop in images (crop/rotate/compress via thumbnail, or insert into the body).
3. Generate per-platform variants, or use the long body directly for long-form platforms.
4. Check the "pre-publish inspection" for red/yellow issues, then click "Publish" for a platform — Linyu opens its editor and fills the content.
5. Review manually, then complete the final publish on the platform page.

---

## Supported Platforms

Seven platforms with auto-fill adapters:

| Platform | Match | Capability |
|---|---|---|
| WeChat Official Account | `mp.weixin.qq.com` | Title/summary/body-with-images fill; multi-account direct jump; cover via "select from body" |
| Zhihu Column | `zhuanlan.zhihu.com` | Article editor fill; images go through Zhihu's upload pipeline |
| Xiaohongshu Creator | `creator.xiaohongshu.com` | Switch to image tab, upload images, fill short-form variant |
| Bilibili Creator | `member.bilibili.com` | Column title/body fill (confirm images inside editor) |
| Woshipm | `woshipm.com` | Article title/body fill |
| X | `x.com` | Tweet variant + image fill |
| Reddit | `reddit.com` / `old.reddit.com` | Title + Markdown body fill |

Plus **quick-jump only** (no adapter yet, enable in settings as needed): Weibo article, Jianshu, Juejin, CSDN, Toutiao, Douban, Medium.

Platforms change their pages over time. If filling fails, use "copy rich text" as fallback; then on the platform editor page open the popup and click "🩺 self-check current page" to find the broken selector, and fix the `SELECTORS` at the top of `lib/adapters/<platform>.ts` before rebuilding.

---

## Core Capabilities

### Semi-Automated Multi-Platform Filling

- Opens the right editor per platform and fills title, body, images, or short-form text.
- Select multiple platforms for one-click batch dispatch; WeChat supports multi-account direct jump.
- Keeps the platform's native publish confirmation.

### Markdown and Image Workflow

- Markdown long article as the main input; local images organized per task and matched by filename.
- In-extension image editing: crop / rotate / flip / quality compression, replaced in place.
- Insert images anywhere in the body (at the caret); in the preview, click an image to move it up/down or edit; full-screen split editing supported.
- Paste screenshots directly with Ctrl+V into the body; generate short variants for Xiaohongshu / X / Reddit.

### Publishing and Data Safety

- Pre-publish inspection: per-platform red/yellow/green checks for length, format, missing images, missing variants.
- Auto-save drafts; history management (search/delete/duplicate); full export/import backup.
- No stored credentials, no committed runtime history, no uploaded local storage, no private publishing APIs.

---

## Repository Structure

```text
linyu/
  entrypoints/              # WXT entries: popup / composer / per-platform content scripts / background
  lib/                      # Pure logic: markdown, images, tasks, platforms, settings, backup, preflight
  lib/adapters/             # Per-platform adapters (SELECTORS + fill/self-check logic)
  lib/ui.tsx                # Linyu design system (palette / feather mark / shared components)
  tests/                    # Vitest unit tests
  preview/                  # Composer visual preview (stubs extension APIs; view UI without loading the ext)
  scripts/gen-icons.mjs     # Icon generation
  docs/superpowers/         # Design docs / plans / adapter acceptance checklist
  wxt.config.ts             # WXT config (manifest, permissions, icons)
  eslint.config.js          # ESLint flat config
  .github/workflows/ci.yml  # CI: lint + test + build on push/PR
  public/                   # WXT static assets (app icons)
  showcase/                 # Linyu case-study showcase site (standalone Astro project)
  assets/                   # README visuals
  README.md / README.en.md / LICENSE
```

---

## Development

```powershell
npm run dev        # hot-reload dev
npm test           # Vitest unit tests
npm run lint       # ESLint
npm run build      # build to .output/chrome-mv3
npm run preview    # composer visual preview (http://localhost:5199, no extension load)
npm run icons      # regenerate app icons
```

Pushing to `main` or opening any PR triggers GitHub Actions (`.github/workflows/ci.yml`) to run `lint → test → build`; any failure blocks the change.

`showcase/` is a standalone Astro case-study site (living alongside the extension source) with its own dependencies; run it separately:

```powershell
cd showcase
npm install
npm run dev
```

---

## FAQ

### Why not fully automatic publishing?

Review rules, editor state, and account permissions differ across platforms. Linyu only fills content and assists navigation; the final publish is confirmed by the user on the platform page.

### Does Linyu upload my history?

No. All tasks and settings live in browser local storage (`storage.local`); the extension neither needs nor commits browser history, credentials, or cookies. `.gitignore` excludes `.output/`, `.wxt/`, `node_modules/`, etc.

### What if editor filling fails?

Use the in-extension "copy rich text" fallback to paste manually into the platform editor. Then on the platform editor page open the popup and click "🩺 self-check current page" to see which selector broke (✗), fix the `SELECTORS` at the top of `lib/adapters/<platform>.ts`, and rebuild.

---

## License

This repository includes a [`LICENSE`](LICENSE) file; see it for the exact terms.
