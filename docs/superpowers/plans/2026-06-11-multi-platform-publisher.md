# 多平台文章分发 Chrome 插件 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建 MV3 Chrome 插件：Markdown 文章 + 本地配图导入撰写页后，半自动填充到微信公众号、知乎、人人都是产品经理、小红书的编辑器（B站/X/Reddit 仅快捷跳转），用户人工检查后发布。

**Architecture:** WXT 框架的 MV3 插件。撰写页（React 标签页）保存"分发任务"到 chrome.storage.local；点"去发布"后 background 记录"平台→待填充任务"并打开平台编辑页；各平台 content script 适配器认领任务，用合成 paste/drop 事件把 HTML 与图片注入编辑器，回报状态。转换逻辑全部是纯函数，Vitest 单测；适配器面向真实网站，走手动验收清单。

**Tech Stack:** TypeScript、WXT（+ @wxt-dev/module-react）、React、markdown-it、Vitest + happy-dom

**Spec:** `docs/superpowers/specs/2026-06-11-multi-platform-publisher-extension-design.md`

---

## 文件结构

```
linyu/
├── package.json / tsconfig.json / wxt.config.ts / vitest.config.ts / .gitignore
├── entrypoints/
│   ├── background.ts            # 调度:待填充登记、开平台页、状态转发
│   ├── popup/                   # 快捷跳转 + 新建分发
│   │   ├── index.html
│   │   └── main.tsx
│   ├── composer/                # 撰写页(核心工作台)
│   │   ├── index.html
│   │   ├── main.tsx
│   │   └── App.tsx
│   ├── zhihu.content.ts         # 薄壳:挂载知乎适配器
│   ├── weixin.content.ts
│   ├── woshipm.content.ts
│   └── xiaohongshu.content.ts
├── lib/
│   ├── platforms.ts             # 平台清单(7个)
│   ├── images.ts                # 图片引用解析/文件名匹配
│   ├── markdown.ts              # md→HTML(本地图替换为 dataUrl)、deriveTitle
│   ├── xhs.ts                   # 小红书变体生成(截断)
│   ├── tasks.ts                 # Task 模型 + storage CRUD(最多20篇)
│   ├── pending.ts               # "平台→待填充任务"登记/认领
│   ├── messaging.ts             # 消息类型
│   └── adapters/
│       ├── types.ts             # Adapter 接口
│       ├── fill-utils.ts        # waitFor/合成粘贴/input注入/dataUrl→File
│       ├── runner.ts            # 适配器通用执行流程(认领→登录→填→回报)
│       ├── zhihu.ts / weixin.ts / woshipm.ts / xiaohongshu.ts
├── tests/                       # *.test.ts(纯函数 + storage)
└── docs/superpowers/checklists/adapter-acceptance.md  # 手动验收清单
```

设计约束（来自 spec）：
- 适配器内所有 DOM 选择器集中在文件顶部 `SELECTORS` 常量区。
- 状态只在确认编辑器内容真实存在后才报 `filled`。
- 任何失败路径都有"复制富文本"手动兜底（撰写页提供）。
- 单步等待超时 10 秒（例外：小红书图片上传步骤 30 秒，Task 16 有说明）。

对 spec 的两处实现细化（理由见对应任务）：
1. "tabId→任务映射" 改为**按平台一次性登记/认领**（Task 7）——公众号从首页新建图文会换标签页,tabId 不可靠。
2. "检测到登录页回报请先登录" 改为**任务保持等待、登录进入编辑器后自动续填**——适配器只在编辑器页认领任务,未登录被重定向时不消耗登记;状态文案向用户说明（Task 11/12）。`checkLogin` 接口保留,供实测发现"未登录也能进编辑器"的平台补真实检测。

---

### Task 1: 项目脚手架（WXT + React + Vitest）

**Files:**
- Create: `package.json`、`wxt.config.ts`、`tsconfig.json`、`vitest.config.ts`、`.gitignore`、`entrypoints/popup/index.html`、`entrypoints/popup/main.tsx`、`tests/smoke.test.ts`

- [ ] **Step 1: 初始化 npm 并安装依赖**

```powershell
npm init -y
npm pkg set type=module private=true name=linyu-publisher
npm i wxt @wxt-dev/module-react react react-dom markdown-it
npm i -D typescript @types/react @types/react-dom @types/markdown-it vitest happy-dom
npm pkg set scripts.dev=wxt scripts.build="wxt build" scripts.test="vitest run" scripts.postinstall="wxt prepare"
```

- [ ] **Step 2: 写配置文件**

`wxt.config.ts`:
```ts
import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: '文章多平台分发助手',
    description: 'Markdown 文章+配图半自动填充到公众号/知乎/人人都是产品经理/小红书',
    permissions: ['storage', 'unlimitedStorage', 'tabs', 'scripting'],
  },
});
```

`tsconfig.json`:
```json
{ "extends": "./.wxt/tsconfig.json" }
```

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing';

export default defineConfig({
  plugins: [WxtVitest()],
  test: { environment: 'happy-dom' },
});
```

`.gitignore`:
```
node_modules/
.wxt/
.output/
```

- [ ] **Step 3: 最小 popup 入口（Task 8 会替换内容；WXT 构建至少需要一个入口）**

`entrypoints/popup/index.html`:
```html
<!doctype html>
<html>
  <head><meta charset="utf-8" /><title>分发助手</title></head>
  <body><div id="root"></div><script type="module" src="./main.tsx"></script></body>
</html>
```

`entrypoints/popup/main.tsx`:
```tsx
import { createRoot } from 'react-dom/client';

createRoot(document.getElementById('root')!).render(<h1>分发助手</h1>);
```

- [ ] **Step 4: 冒烟测试**

`tests/smoke.test.ts`:
```ts
import { describe, expect, it } from 'vitest';

describe('smoke', () => {
  it('vitest 可运行', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: 验证构建与测试**

```powershell
npx wxt prepare
npm run build
npm test
```
预期：`.output/chrome-mv3/manifest.json` 存在且含 4 个 permissions；测试 1 passed。

- [ ] **Step 6: Commit**

```powershell
git add -A; git commit -m "chore: WXT+React+Vitest 脚手架"
```

---

### Task 2: 平台清单 `lib/platforms.ts`

**Files:**
- Create: `lib/platforms.ts`
- Test: `tests/platforms.test.ts`

- [ ] **Step 1: 写失败测试**

`tests/platforms.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { PLATFORMS, getPlatform } from '../lib/platforms';

describe('platforms', () => {
  it('共 7 个平台,其中 4 个支持自动填充', () => {
    expect(PLATFORMS).toHaveLength(7);
    expect(PLATFORMS.filter((p) => p.supportsFill).map((p) => p.id)).toEqual([
      'weixin', 'zhihu', 'woshipm', 'xiaohongshu',
    ]);
  });

  it('publishUrl 均为 https', () => {
    for (const p of PLATFORMS) expect(p.publishUrl).toMatch(/^https:\/\//);
  });

  it('getPlatform 按 id 取平台', () => {
    expect(getPlatform('zhihu')?.name).toBe('知乎');
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npx vitest run tests/platforms.test.ts`
预期：FAIL（模块不存在）。

- [ ] **Step 3: 实现**

`lib/platforms.ts`:
```ts
export type PlatformId =
  | 'weixin' | 'zhihu' | 'woshipm' | 'xiaohongshu'
  | 'bilibili' | 'x' | 'reddit';

export interface Platform {
  id: PlatformId;
  name: string;
  /** 快捷跳转目标(发布页/创作后台) */
  publishUrl: string;
  /** V1 是否有自动填充适配器 */
  supportsFill: boolean;
}

export const PLATFORMS: Platform[] = [
  { id: 'weixin', name: '微信公众号', publishUrl: 'https://mp.weixin.qq.com/', supportsFill: true },
  { id: 'zhihu', name: '知乎', publishUrl: 'https://zhuanlan.zhihu.com/write', supportsFill: true },
  { id: 'woshipm', name: '人人都是产品经理', publishUrl: 'https://www.woshipm.com/', supportsFill: true },
  { id: 'xiaohongshu', name: '小红书', publishUrl: 'https://creator.xiaohongshu.com/publish/publish', supportsFill: true },
  { id: 'bilibili', name: 'B站专栏', publishUrl: 'https://member.bilibili.com/platform/upload/text/edit', supportsFill: false },
  { id: 'x', name: 'X', publishUrl: 'https://x.com/compose/post', supportsFill: false },
  { id: 'reddit', name: 'Reddit', publishUrl: 'https://www.reddit.com/submit', supportsFill: false },
];

export function getPlatform(id: PlatformId): Platform | undefined {
  return PLATFORMS.find((p) => p.id === id);
}
```

- [ ] **Step 4: 测试通过后提交**

Run: `npx vitest run tests/platforms.test.ts` → PASS
```powershell
git add -A; git commit -m "feat: 平台清单"
```

---

### Task 3: 图片引用解析与匹配 `lib/images.ts`

**Files:**
- Create: `lib/images.ts`
- Test: `tests/images.test.ts`

- [ ] **Step 1: 写失败测试**

`tests/images.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { basename, extractImageRefs, matchImages } from '../lib/images';

describe('basename', () => {
  it('取路径最后一段,去掉 query/hash', () => {
    expect(basename('./img/a.png')).toBe('a.png');
    expect(basename('img\\b.jpg')).toBe('b.jpg');
    expect(basename('c.png?x=1#y')).toBe('c.png');
  });
});

describe('extractImageRefs', () => {
  it('提取本地图片引用文件名,忽略网络图与 data URL', () => {
    const md = [
      '![图一](./img/a.png)',
      '![](b.jpg "标题")',
      '![远程](https://cdn.com/c.png)',
      '![内联](data:image/png;base64,xxx)',
    ].join('\n');
    expect(extractImageRefs(md)).toEqual(['a.png', 'b.jpg']);
  });

  it('同名引用去重', () => {
    expect(extractImageRefs('![1](a.png)\n![2](a.png)')).toEqual(['a.png']);
  });
});

describe('matchImages', () => {
  it('按文件名匹配,报告缺失', () => {
    expect(matchImages(['a.png', 'b.jpg'], ['a.png', 'extra.png'])).toEqual({
      matched: ['a.png'],
      missing: ['b.jpg'],
    });
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npx vitest run tests/images.test.ts` → FAIL（模块不存在）。

- [ ] **Step 3: 实现**

`lib/images.ts`:
```ts
export function basename(p: string): string {
  const noQuery = p.split(/[?#]/)[0];
  const parts = noQuery.split(/[/\\]/);
  return parts[parts.length - 1];
}

const IMAGE_REF_RE = /!\[[^\]]*\]\(\s*([^)\s]+)(?:\s+"[^"]*")?\s*\)/g;

/** 提取 Markdown 中的本地图片引用(文件名,去重);忽略 http(s) 与 data: */
export function extractImageRefs(markdown: string): string[] {
  const refs: string[] = [];
  for (const m of markdown.matchAll(IMAGE_REF_RE)) {
    const src = m[1];
    if (/^(https?:|data:)/i.test(src)) continue;
    const name = basename(src);
    if (!refs.includes(name)) refs.push(name);
  }
  return refs;
}

export interface ImageMatch {
  matched: string[];
  missing: string[];
}

/** refs:文章引用的文件名; available:用户已拖入的文件名 */
export function matchImages(refs: string[], available: string[]): ImageMatch {
  const set = new Set(available);
  return {
    matched: refs.filter((r) => set.has(r)),
    missing: refs.filter((r) => !set.has(r)),
  };
}
```

- [ ] **Step 4: 测试通过后提交**

Run: `npx vitest run tests/images.test.ts` → PASS
```powershell
git add -A; git commit -m "feat: 图片引用解析与匹配"
```

---

### Task 4: Markdown 转换 `lib/markdown.ts`

**Files:**
- Create: `lib/markdown.ts`
- Test: `tests/markdown.test.ts`

- [ ] **Step 1: 写失败测试**

`tests/markdown.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { renderHtml, deriveTitle } from '../lib/markdown';

describe('renderHtml', () => {
  it('基本 Markdown 转 HTML', () => {
    const html = renderHtml('# 标题\n\n正文**加粗**', {});
    expect(html).toContain('<h1>标题</h1>');
    expect(html).toContain('<strong>加粗</strong>');
  });

  it('本地图片引用按文件名替换为 dataUrl', () => {
    const html = renderHtml('![图](./img/a.png)', { 'a.png': 'data:image/png;base64,AAA' });
    expect(html).toContain('src="data:image/png;base64,AAA"');
  });

  it('网络图与未匹配图保留原 src', () => {
    const html = renderHtml('![](https://cdn.com/c.png)\n\n![](miss.png)', {});
    expect(html).toContain('src="https://cdn.com/c.png"');
    expect(html).toContain('src="miss.png"');
  });

  it('不放行内嵌 HTML(防注入)', () => {
    expect(renderHtml('<script>alert(1)</script>', {})).not.toContain('<script>');
  });
});

describe('deriveTitle', () => {
  it('取第一个一级/二级标题', () => {
    expect(deriveTitle('前言\n# 我的标题\n正文')).toBe('我的标题');
  });
  it('无标题时返回空串', () => {
    expect(deriveTitle('没有标题的正文')).toBe('');
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npx vitest run tests/markdown.test.ts` → FAIL。

- [ ] **Step 3: 实现**

`lib/markdown.ts`:
```ts
import MarkdownIt from 'markdown-it';
import { basename } from './images';

const md = new MarkdownIt({ html: false, linkify: true });

// 自定义图片渲染:本地引用按文件名查 imageMap 换成 dataUrl
const defaultImage = md.renderer.rules.image!;
let currentImageMap: Record<string, string> = {};
md.renderer.rules.image = (tokens, idx, opts, env, self) => {
  const token = tokens[idx];
  const src = token.attrGet('src') ?? '';
  if (!/^(https?:|data:)/i.test(src)) {
    const mapped = currentImageMap[basename(src)];
    if (mapped) token.attrSet('src', mapped);
  }
  return defaultImage(tokens, idx, opts, env, self);
};

/** Markdown → HTML;imageMap: 文件名 → dataUrl */
export function renderHtml(markdown: string, imageMap: Record<string, string>): string {
  currentImageMap = imageMap;
  try {
    return md.render(markdown);
  } finally {
    currentImageMap = {};
  }
}

/** 从 Markdown 提取标题(第一个 #/## 行),用于撰写页标题初值 */
export function deriveTitle(markdown: string): string {
  const m = markdown.match(/^#{1,2}\s+(.+)$/m);
  return m ? m[1].trim() : '';
}
```

- [ ] **Step 4: 测试通过后提交**

Run: `npx vitest run tests/markdown.test.ts` → PASS
```powershell
git add -A; git commit -m "feat: Markdown 转 HTML 与标题提取"
```

---

### Task 5: 小红书变体生成 `lib/xhs.ts`

**Files:**
- Create: `lib/xhs.ts`
- Test: `tests/xhs.test.ts`

- [ ] **Step 1: 写失败测试**

`tests/xhs.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { stripMarkdown, makeXhsVariant } from '../lib/xhs';

describe('stripMarkdown', () => {
  it('去掉标题/加粗/链接/图片标记,保留文字', () => {
    const md = '# 标题\n\n**加粗**和[链接](https://a.com)以及![图](a.png)\n\n- 列表项';
    const text = stripMarkdown(md);
    expect(text).not.toMatch(/[#*[\]()!]/);
    expect(text).toContain('加粗');
    expect(text).toContain('链接');
    expect(text).toContain('列表项');
  });
});

describe('makeXhsVariant', () => {
  it('标题截断到 20 字', () => {
    const v = makeXhsVariant('一二三四五六七八九十一二三四五六七八九十超出', '正文');
    expect([...v.title]).toHaveLength(20);
  });
  it('正文为纯文本且不超过 1000 字', () => {
    const v = makeXhsVariant('题', '# 头\n\n' + '字'.repeat(2000));
    expect([...v.body].length).toBeLessThanOrEqual(1000);
    expect(v.body).not.toContain('#');
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npx vitest run tests/xhs.test.ts` → FAIL。

- [ ] **Step 3: 实现**

`lib/xhs.ts`:
```ts
/** 粗粒度去 Markdown 标记,产出小红书可用纯文本 */
export function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, '')           // 代码块整体去掉
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')     // 图片
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')  // 链接留文字
    .replace(/^#{1,6}\s+/gm, '')              // 标题标记
    .replace(/^\s*[-*+]\s+/gm, '')            // 列表标记
    .replace(/^\s*>\s?/gm, '')                // 引用标记
    .replace(/(\*\*|__|\*|_|`)/g, '')         // 强调/行内码
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export interface XhsVariant {
  title: string;  // ≤20 字
  body: string;   // ≤1000 字
}

/** 用 Array.from 按 Unicode 码点截断,避免劈开 emoji */
export function makeXhsVariant(title: string, markdown: string): XhsVariant {
  return {
    title: [...title].slice(0, 20).join(''),
    body: [...stripMarkdown(markdown)].slice(0, 1000).join(''),
  };
}
```

- [ ] **Step 4: 测试通过后提交**

Run: `npx vitest run tests/xhs.test.ts` → PASS
```powershell
git add -A; git commit -m "feat: 小红书变体生成"
```

---

### Task 6: 任务模型与存储 `lib/tasks.ts`

**Files:**
- Create: `lib/tasks.ts`
- Test: `tests/tasks.test.ts`

说明：用 `browser.storage.local`（WXT 自动注入 `browser`，测试中由 `WxtVitest` 提供 fake 实现）。所有任务存在单 key `tasks` 下，按 `createdAt` 降序，保存时裁剪到 20 篇。

- [ ] **Step 1: 写失败测试**

`tests/tasks.test.ts`:
```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import { saveTask, getTask, listTasks, updatePlatformStatus, newTask } from '../lib/tasks';

beforeEach(() => fakeBrowser.reset());

describe('tasks 存储', () => {
  it('保存后可按 id 取回', async () => {
    const t = newTask({ title: '标题', markdown: '# 标题' });
    await saveTask(t);
    expect((await getTask(t.id))?.title).toBe('标题');
  });

  it('列表按 createdAt 降序且最多 20 篇', async () => {
    for (let i = 0; i < 25; i++) {
      await saveTask({ ...newTask({ title: `t${i}`, markdown: '' }), createdAt: i });
    }
    const list = await listTasks();
    expect(list).toHaveLength(20);
    expect(list[0].title).toBe('t24'); // 最新在前
  });

  it('saveTask 对同 id 是更新而非追加', async () => {
    const t = newTask({ title: 'a', markdown: '' });
    await saveTask(t);
    await saveTask({ ...t, title: 'b' });
    expect(await listTasks()).toHaveLength(1);
    expect((await getTask(t.id))?.title).toBe('b');
  });

  it('updatePlatformStatus 更新单平台状态', async () => {
    const t = newTask({ title: 'a', markdown: '' });
    await saveTask(t);
    await updatePlatformStatus(t.id, 'zhihu', { state: 'failed', reason: '请先登录' });
    expect((await getTask(t.id))?.platformStatus.zhihu).toEqual({ state: 'failed', reason: '请先登录' });
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npx vitest run tests/tasks.test.ts` → FAIL。

- [ ] **Step 3: 实现**

`lib/tasks.ts`:
```ts
import type { PlatformId } from './platforms';

export type PlatformStatus =
  | { state: 'pending' }                       // 已发起,等待填充
  | { state: 'filled'; note?: string }         // 已填充(note: 如"封面需手动设置")
  | { state: 'failed'; reason: string };

export interface TaskImage {
  filename: string;
  dataUrl: string;
  size: number;
}

export interface Task {
  id: string;
  createdAt: number;
  title: string;
  markdown: string;
  images: TaskImage[];
  coverFilename?: string;
  /** 平台变体;V2 的 x/reddit 复用此结构 */
  variants: { xiaohongshu?: { title: string; body: string } };
  platformStatus: Partial<Record<PlatformId, PlatformStatus>>;
}

const KEY = 'tasks';
const MAX_TASKS = 20;

export function newTask(init: { title: string; markdown: string }): Task {
  return {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    title: init.title,
    markdown: init.markdown,
    images: [],
    variants: {},
    platformStatus: {},
  };
}

async function readAll(): Promise<Task[]> {
  const got = await browser.storage.local.get(KEY);
  return (got[KEY] as Task[] | undefined) ?? [];
}

async function writeAll(tasks: Task[]): Promise<void> {
  const sorted = [...tasks].sort((a, b) => b.createdAt - a.createdAt).slice(0, MAX_TASKS);
  await browser.storage.local.set({ [KEY]: sorted });
}

export async function saveTask(task: Task): Promise<void> {
  const all = await readAll();
  const idx = all.findIndex((t) => t.id === task.id);
  if (idx >= 0) all[idx] = task;
  else all.push(task);
  await writeAll(all);
}

export async function getTask(id: string): Promise<Task | undefined> {
  return (await readAll()).find((t) => t.id === id);
}

export async function listTasks(): Promise<Task[]> {
  return (await readAll()).sort((a, b) => b.createdAt - a.createdAt);
}

export async function updatePlatformStatus(
  id: string,
  platform: PlatformId,
  status: PlatformStatus,
): Promise<void> {
  const task = await getTask(id);
  if (!task) return;
  task.platformStatus[platform] = status;
  await saveTask(task);
}
```

- [ ] **Step 4: 测试通过后提交**

Run: `npx vitest run tests/tasks.test.ts` → PASS
```powershell
git add -A; git commit -m "feat: 分发任务模型与存储"
```

---

### Task 7: 待填充登记、消息协议与 Background

**Files:**
- Create: `lib/pending.ts`、`lib/messaging.ts`、`entrypoints/background.ts`
- Test: `tests/pending.test.ts`

设计说明（对 spec 的细化）：spec 提到"tabId→任务映射"，实际采用更稳的**按平台登记**：`pendingFills: { [platformId]: taskId }` 存 storage.local。原因：公众号等平台从首页点"新建图文"会换页/开新标签，tabId 不可靠；按平台一次性认领（claim 即删除）天然支持这种跳转，也能在 service worker 重启后存活。

- [ ] **Step 1: 写失败测试**

`tests/pending.test.ts`:
```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import { setPending, claimPending } from '../lib/pending';

beforeEach(() => fakeBrowser.reset());

describe('pending 登记/认领', () => {
  it('claim 返回登记的 taskId 且一次性(再 claim 为 null)', async () => {
    await setPending('zhihu', 'task-1');
    expect(await claimPending('zhihu')).toBe('task-1');
    expect(await claimPending('zhihu')).toBeNull();
  });

  it('不同平台互不干扰', async () => {
    await setPending('zhihu', 't1');
    await setPending('weixin', 't2');
    expect(await claimPending('weixin')).toBe('t2');
    expect(await claimPending('zhihu')).toBe('t1');
  });

  it('未登记时 claim 为 null', async () => {
    expect(await claimPending('xiaohongshu')).toBeNull();
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npx vitest run tests/pending.test.ts` → FAIL。

- [ ] **Step 3: 实现 pending 与消息类型**

`lib/pending.ts`:
```ts
import type { PlatformId } from './platforms';

const KEY = 'pendingFills';

type PendingMap = Partial<Record<PlatformId, string>>;

async function read(): Promise<PendingMap> {
  const got = await browser.storage.local.get(KEY);
  return (got[KEY] as PendingMap | undefined) ?? {};
}

export async function setPending(platform: PlatformId, taskId: string): Promise<void> {
  const map = await read();
  map[platform] = taskId;
  await browser.storage.local.set({ [KEY]: map });
}

/** 一次性认领:返回 taskId 并删除登记 */
export async function claimPending(platform: PlatformId): Promise<string | null> {
  const map = await read();
  const taskId = map[platform];
  if (!taskId) return null;
  delete map[platform];
  await browser.storage.local.set({ [KEY]: map });
  return taskId;
}
```

`lib/messaging.ts`:
```ts
import type { PlatformId } from './platforms';
import type { Task, PlatformStatus } from './tasks';

/** composer → background:发起填充(登记并打开平台页) */
export interface StartFillMsg {
  kind: 'start-fill';
  platformId: PlatformId;
  taskId: string;
}

/** content script → background:认领本平台待填充任务 */
export interface ClaimTaskMsg {
  kind: 'claim-task';
  platformId: PlatformId;
}
export interface ClaimTaskResponse {
  task: Task | null;
}

/** content script → background:回报填充结果 */
export interface ReportFillMsg {
  kind: 'report-fill';
  platformId: PlatformId;
  taskId: string;
  status: PlatformStatus;
}

export type Msg = StartFillMsg | ClaimTaskMsg | ReportFillMsg;
```

- [ ] **Step 4: 实现 background**

`entrypoints/background.ts`:
```ts
import { getPlatform } from '../lib/platforms';
import { getTask, updatePlatformStatus } from '../lib/tasks';
import { setPending, claimPending } from '../lib/pending';
import type { Msg, ClaimTaskResponse } from '../lib/messaging';

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((msg: Msg, _sender, sendResponse) => {
    (async () => {
      if (msg.kind === 'start-fill') {
        await setPending(msg.platformId, msg.taskId);
        await updatePlatformStatus(msg.taskId, msg.platformId, { state: 'pending' });
        const platform = getPlatform(msg.platformId);
        if (platform) await browser.tabs.create({ url: platform.publishUrl });
        sendResponse({});
      } else if (msg.kind === 'claim-task') {
        const taskId = await claimPending(msg.platformId);
        const task = taskId ? ((await getTask(taskId)) ?? null) : null;
        sendResponse({ task } satisfies ClaimTaskResponse);
      } else if (msg.kind === 'report-fill') {
        await updatePlatformStatus(msg.taskId, msg.platformId, msg.status);
        sendResponse({});
      }
    })();
    return true; // 异步 sendResponse
  });
});
```

- [ ] **Step 5: 验证**

Run: `npx vitest run` → 全部 PASS；`npm run build` → 成功，`.output/chrome-mv3/background.js` 存在。

- [ ] **Step 6: Commit**

```powershell
git add -A; git commit -m "feat: 待填充登记、消息协议与 background 调度"
```

---

### Task 8: Popup（快捷跳转 + 新建分发）

**Files:**
- Modify: `entrypoints/popup/main.tsx`（替换 Task 1 占位）
- Create: `entrypoints/composer/index.html`、`entrypoints/composer/main.tsx`（先放占位，Task 9 实现）

- [ ] **Step 1: 实现 popup**

`entrypoints/popup/main.tsx`:
```tsx
import { createRoot } from 'react-dom/client';
import { PLATFORMS } from '../../lib/platforms';

function Popup() {
  const open = (url: string) => browser.tabs.create({ url });
  return (
    <div style={{ width: 260, padding: 12, fontFamily: 'system-ui' }}>
      <button
        style={{ width: '100%', padding: 8, marginBottom: 10, fontWeight: 600 }}
        onClick={() => open(browser.runtime.getURL('/composer.html'))}
      >
        ✍️ 新建分发
      </button>
      {PLATFORMS.map((p) => (
        <button
          key={p.id}
          style={{ display: 'block', width: '100%', padding: 6, marginBottom: 4, textAlign: 'left' }}
          onClick={() => open(p.publishUrl)}
        >
          {p.name} {p.supportsFill ? '· 支持自动填充' : ''}
        </button>
      ))}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<Popup />);
```

- [ ] **Step 2: composer 占位入口（保证 `composer.html` 可被打开,Task 9 填实）**

`entrypoints/composer/index.html`:
```html
<!doctype html>
<html>
  <head><meta charset="utf-8" /><title>分发撰写台</title></head>
  <body><div id="root"></div><script type="module" src="./main.tsx"></script></body>
</html>
```

`entrypoints/composer/main.tsx`:
```tsx
import { createRoot } from 'react-dom/client';
import { App } from './App';

createRoot(document.getElementById('root')!).render(<App />);
```

`entrypoints/composer/App.tsx`:
```tsx
export function App() {
  return <h1>分发撰写台</h1>;
}
```

- [ ] **Step 3: 手动验证**

```powershell
npm run build
```
Chrome → `chrome://extensions` → 开发者模式 → 加载已解压的扩展程序 → 选 `.output\chrome-mv3`。
验收：点插件图标弹出 popup；7 个平台按钮分别打开对应网址；"新建分发"打开撰写台标签页。

- [ ] **Step 4: Commit**

```powershell
git add -A; git commit -m "feat: popup 快捷跳转与撰写台入口"
```

---

### Task 9: 撰写页 — Markdown 导入与图片匹配

**Files:**
- Modify: `entrypoints/composer/App.tsx`（替换占位）

- [ ] **Step 1: 实现 App（导入、图片匹配、保存）**

`entrypoints/composer/App.tsx`:
```tsx
import { useMemo, useState } from 'react';
import { deriveTitle } from '../../lib/markdown';
import { extractImageRefs, matchImages } from '../../lib/images';
import { newTask, saveTask, type Task, type TaskImage } from '../../lib/tasks';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

export function App() {
  const [task, setTask] = useState<Task>(() => newTask({ title: '', markdown: '' }));
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const refs = useMemo(() => extractImageRefs(task.markdown), [task.markdown]);
  const match = useMemo(
    () => matchImages(refs, task.images.map((i) => i.filename)),
    [refs, task.images],
  );

  const setMarkdown = (markdown: string) =>
    setTask((t) => ({ ...t, markdown, title: t.title || deriveTitle(markdown) }));

  const addImages = async (files: FileList | File[]) => {
    const added: TaskImage[] = [];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith('image/')) continue;
      added.push({ filename: f.name, dataUrl: await readFileAsDataUrl(f), size: f.size });
    }
    setTask((t) => {
      const kept = t.images.filter((old) => !added.some((n) => n.filename === old.filename));
      const images = [...kept, ...added];
      return { ...t, images, coverFilename: t.coverFilename ?? images[0]?.filename };
    });
  };

  const save = async () => {
    await saveTask(task);
    setSavedAt(Date.now());
  };

  return (
    <div style={{ display: 'flex', gap: 16, padding: 16, fontFamily: 'system-ui' }}>
      <section style={{ flex: 1, minWidth: 0 }}>
        <h2>① 文章</h2>
        <input
          style={{ width: '100%', fontSize: 18, padding: 6 }}
          placeholder="标题(自动取自第一个 # 标题,可改)"
          value={task.title}
          onChange={(e) => setTask((t) => ({ ...t, title: e.target.value }))}
        />
        <p>
          <input
            type="file"
            accept=".md,text/markdown"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) setMarkdown(await f.text());
            }}
          />
          或直接粘贴 Markdown：
        </p>
        <textarea
          style={{ width: '100%', height: 360, fontFamily: 'monospace' }}
          value={task.markdown}
          onChange={(e) => setMarkdown(e.target.value)}
        />

        <h2>② 配图</h2>
        <div
          style={{ border: '2px dashed #999', padding: 16, textAlign: 'center' }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void addImages(e.dataTransfer.files);
          }}
        >
          拖入图片,或
          <input type="file" accept="image/*" multiple onChange={(e) => e.target.files && void addImages(e.target.files)} />
        </div>
        <ul>
          {task.images.map((img) => (
            <li key={img.filename}>
              {match.matched.includes(img.filename) ? '✅' : 'ℹ️ 未被正文引用'} {img.filename}
              {img.size > MAX_IMAGE_SIZE && <strong style={{ color: 'orange' }}> ⚠️ 超过 10MB</strong>}
            </li>
          ))}
          {match.missing.map((name) => (
            <li key={name} style={{ color: 'red' }}>❌ 缺图:正文引用了 {name},请拖入</li>
          ))}
        </ul>

        <button style={{ padding: '8px 24px', fontWeight: 600 }} onClick={() => void save()}>
          保存任务
        </button>
        {savedAt && <span> 已保存 {new Date(savedAt).toLocaleTimeString()}</span>}
      </section>
    </div>
  );
}
```

- [ ] **Step 2: 手动验证**

`npm run build` 后在 Chrome 重新加载扩展，打开撰写台：
1. 粘贴含 `# 标题` 和 `![](a.png)` 的 Markdown → 标题自动填入，图片列表出现红色"缺图 a.png"。
2. 拖入名为 `a.png` 的图片 → 变 ✅。
3. 点保存 → 显示已保存时间。

- [ ] **Step 3: Commit**

```powershell
git add -A; git commit -m "feat: 撰写页导入与图片匹配"
```

---

### Task 10: 撰写页 — 预览、封面、小红书变体

**Files:**
- Create: `entrypoints/composer/Preview.tsx`、`entrypoints/composer/XhsEditor.tsx`
- Modify: `entrypoints/composer/App.tsx`

- [ ] **Step 1: 预览组件**

`entrypoints/composer/Preview.tsx`:
```tsx
import { useMemo } from 'react';
import { renderHtml } from '../../lib/markdown';
import type { Task } from '../../lib/tasks';

export function Preview({ task }: { task: Task }) {
  const html = useMemo(() => {
    const imageMap = Object.fromEntries(task.images.map((i) => [i.filename, i.dataUrl]));
    return renderHtml(task.markdown, imageMap);
  }, [task.markdown, task.images]);

  return (
    <div
      style={{ border: '1px solid #ddd', padding: 16, height: 600, overflow: 'auto' }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
```

（注：`renderHtml` 已设 `html: false`，Markdown 内嵌 HTML 不会透传，自家内容自家预览，风险可控。）

- [ ] **Step 2: 小红书变体编辑组件**

`entrypoints/composer/XhsEditor.tsx`:
```tsx
import { makeXhsVariant } from '../../lib/xhs';
import type { Task } from '../../lib/tasks';

export function XhsEditor({ task, onChange }: { task: Task; onChange: (t: Task) => void }) {
  const v = task.variants.xiaohongshu ?? { title: '', body: '' };
  const set = (patch: Partial<typeof v>) =>
    onChange({ ...task, variants: { ...task.variants, xiaohongshu: { ...v, ...patch } } });
  const titleLen = [...v.title].length;
  const bodyLen = [...v.body].length;

  return (
    <details>
      <summary><strong>小红书变体</strong>(标题≤20字,正文≤1000字)</summary>
      <button onClick={() => onChange({ ...task, variants: { ...task.variants, xiaohongshu: makeXhsVariant(task.title, task.markdown) } })}>
        从文章生成初稿
      </button>
      <input
        style={{ width: '100%', marginTop: 8 }}
        placeholder="小红书标题"
        value={v.title}
        onChange={(e) => set({ title: e.target.value })}
      />
      <span style={{ color: titleLen > 20 ? 'red' : '#888' }}>{titleLen}/20</span>
      <textarea
        style={{ width: '100%', height: 160 }}
        placeholder="小红书正文(可带 #话题#)"
        value={v.body}
        onChange={(e) => set({ body: e.target.value })}
      />
      <span style={{ color: bodyLen > 1000 ? 'red' : '#888' }}>{bodyLen}/1000</span>
    </details>
  );
}
```

- [ ] **Step 3: App 集成（完整替换 App.tsx）**

`entrypoints/composer/App.tsx` —— 在 Task 9 版本基础上：右列加 `<Preview>`；配图区下加封面选择与 `<XhsEditor>`。完整文件：
```tsx
import { useMemo, useState } from 'react';
import { deriveTitle } from '../../lib/markdown';
import { extractImageRefs, matchImages } from '../../lib/images';
import { newTask, saveTask, type Task, type TaskImage } from '../../lib/tasks';
import { Preview } from './Preview';
import { XhsEditor } from './XhsEditor';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

export function App() {
  const [task, setTask] = useState<Task>(() => newTask({ title: '', markdown: '' }));
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const refs = useMemo(() => extractImageRefs(task.markdown), [task.markdown]);
  const match = useMemo(
    () => matchImages(refs, task.images.map((i) => i.filename)),
    [refs, task.images],
  );

  const setMarkdown = (markdown: string) =>
    setTask((t) => ({ ...t, markdown, title: t.title || deriveTitle(markdown) }));

  const addImages = async (files: FileList | File[]) => {
    const added: TaskImage[] = [];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith('image/')) continue;
      added.push({ filename: f.name, dataUrl: await readFileAsDataUrl(f), size: f.size });
    }
    setTask((t) => {
      const kept = t.images.filter((old) => !added.some((n) => n.filename === old.filename));
      const images = [...kept, ...added];
      return { ...t, images, coverFilename: t.coverFilename ?? images[0]?.filename };
    });
  };

  const save = async () => {
    await saveTask(task);
    setSavedAt(Date.now());
  };

  return (
    <div style={{ display: 'flex', gap: 16, padding: 16, fontFamily: 'system-ui' }}>
      <section style={{ flex: 1, minWidth: 0 }}>
        <h2>① 文章</h2>
        <input
          style={{ width: '100%', fontSize: 18, padding: 6 }}
          placeholder="标题(自动取自第一个 # 标题,可改)"
          value={task.title}
          onChange={(e) => setTask((t) => ({ ...t, title: e.target.value }))}
        />
        <p>
          <input
            type="file"
            accept=".md,text/markdown"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) setMarkdown(await f.text());
            }}
          />
          或直接粘贴 Markdown：
        </p>
        <textarea
          style={{ width: '100%', height: 300, fontFamily: 'monospace' }}
          value={task.markdown}
          onChange={(e) => setMarkdown(e.target.value)}
        />

        <h2>② 配图与封面</h2>
        <div
          style={{ border: '2px dashed #999', padding: 16, textAlign: 'center' }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void addImages(e.dataTransfer.files);
          }}
        >
          拖入图片,或
          <input type="file" accept="image/*" multiple onChange={(e) => e.target.files && void addImages(e.target.files)} />
        </div>
        <ul>
          {task.images.map((img) => (
            <li key={img.filename}>
              {match.matched.includes(img.filename) ? '✅' : 'ℹ️ 未被正文引用'} {img.filename}
              {img.size > MAX_IMAGE_SIZE && <strong style={{ color: 'orange' }}> ⚠️ 超过 10MB</strong>}
            </li>
          ))}
          {match.missing.map((name) => (
            <li key={name} style={{ color: 'red' }}>❌ 缺图:正文引用了 {name},请拖入</li>
          ))}
        </ul>
        {task.images.length > 0 && (
          <label>
            封面图(公众号用):
            <select
              value={task.coverFilename ?? ''}
              onChange={(e) => setTask((t) => ({ ...t, coverFilename: e.target.value }))}
            >
              {task.images.map((img) => (
                <option key={img.filename} value={img.filename}>{img.filename}</option>
              ))}
            </select>
          </label>
        )}

        <h2>③ 平台变体</h2>
        <XhsEditor task={task} onChange={setTask} />

        <p>
          <button style={{ padding: '8px 24px', fontWeight: 600 }} onClick={() => void save()}>
            保存任务
          </button>
          {savedAt && <span> 已保存 {new Date(savedAt).toLocaleTimeString()}</span>}
        </p>
      </section>

      <section style={{ flex: 1, minWidth: 0 }}>
        <h2>预览</h2>
        <Preview task={task} />
      </section>
    </div>
  );
}
```

- [ ] **Step 4: 手动验证**

重新构建加载：粘贴带本地图引用的 Markdown 并拖入对应图片 → 右侧预览正文与图片正常显示；封面下拉默认第一张；小红书变体"从文章生成初稿"后字数计数正确、超限变红。

- [ ] **Step 5: Commit**

```powershell
git add -A; git commit -m "feat: 撰写页预览/封面/小红书变体"
```

---

### Task 11: 撰写页 — 分发按钮、状态灯、历史、复制富文本兜底

**Files:**
- Create: `lib/clipboard.ts`、`entrypoints/composer/PlatformBar.tsx`、`entrypoints/composer/History.tsx`
- Modify: `entrypoints/composer/App.tsx`

- [ ] **Step 1: 剪贴板兜底工具**

`lib/clipboard.ts`:
```ts
/** 同时写入 text/html 与 text/plain,粘贴到富文本编辑器时保留格式 */
export async function copyRichText(html: string, plain: string): Promise<void> {
  await navigator.clipboard.write([
    new ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
      'text/plain': new Blob([plain], { type: 'text/plain' }),
    }),
  ]);
}
```

- [ ] **Step 2: 平台分发栏**

`entrypoints/composer/PlatformBar.tsx`:
```tsx
import { PLATFORMS, type PlatformId } from '../../lib/platforms';
import type { Task, PlatformStatus } from '../../lib/tasks';

function StatusBadge({ status }: { status?: PlatformStatus }) {
  if (!status) return null;
  if (status.state === 'pending')
    return <span>⏳ 等待填充…(若平台要求登录,请登录后进入编辑器,会自动继续)</span>;
  if (status.state === 'filled')
    return <span style={{ color: 'green' }}>✅ 已填充,请人工检查后发布{status.note ? `(${status.note})` : ''}</span>;
  return <span style={{ color: 'red' }}>❌ {status.reason}</span>;
}

export function PlatformBar({ task, onBeforeFill }: { task: Task; onBeforeFill: () => Promise<void> }) {
  const startFill = async (platformId: PlatformId) => {
    await onBeforeFill(); // 先落库,适配器读到的才是最新内容
    await browser.runtime.sendMessage({ kind: 'start-fill', platformId, taskId: task.id });
  };

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <tbody>
        {PLATFORMS.map((p) => (
          <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
            <td style={{ padding: 6, whiteSpace: 'nowrap' }}>{p.name}</td>
            <td>
              {p.supportsFill ? (
                <button onClick={() => void startFill(p.id)}>
                  {task.platformStatus[p.id]?.state === 'failed' ? '重试填充' : '去发布'}
                </button>
              ) : (
                <button onClick={() => void browser.tabs.create({ url: p.publishUrl })}>跳转</button>
              )}
            </td>
            <td><StatusBadge status={task.platformStatus[p.id]} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 3: 历史列表**

`entrypoints/composer/History.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { listTasks, type Task } from '../../lib/tasks';

export function History({ currentId, onLoad }: { currentId: string; onLoad: (t: Task) => void }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  useEffect(() => {
    void listTasks().then(setTasks);
  }, [currentId]);

  return (
    <details>
      <summary><strong>历史文章</strong>(最近 {tasks.length} 篇)</summary>
      <ul>
        {tasks.map((t) => (
          <li key={t.id}>
            <a href="#" onClick={(e) => { e.preventDefault(); onLoad(t); }}>
              {t.title || '(无标题)'}
            </a>
            <small> · {new Date(t.createdAt).toLocaleDateString()}</small>
            {t.id === currentId && <small> · 当前</small>}
          </li>
        ))}
      </ul>
    </details>
  );
}
```

- [ ] **Step 4: App 集成（完整替换 App.tsx,最终形态）**

在 Task 10 版本上新增：`PlatformBar`、`History`、"复制富文本"按钮、storage 变化时刷新当前任务的平台状态。完整文件：
```tsx
import { useEffect, useMemo, useState } from 'react';
import { deriveTitle, renderHtml } from '../../lib/markdown';
import { extractImageRefs, matchImages } from '../../lib/images';
import { stripMarkdown } from '../../lib/xhs';
import { copyRichText } from '../../lib/clipboard';
import { newTask, saveTask, getTask, type Task, type TaskImage } from '../../lib/tasks';
import { Preview } from './Preview';
import { XhsEditor } from './XhsEditor';
import { PlatformBar } from './PlatformBar';
import { History } from './History';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

export function App() {
  const [task, setTask] = useState<Task>(() => newTask({ title: '', markdown: '' }));
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // 适配器回报状态写入 storage 后,刷新当前任务的 platformStatus(不覆盖未保存的编辑)
  useEffect(() => {
    const listener = (changes: Record<string, unknown>, area: string) => {
      if (area !== 'local' || !('tasks' in changes)) return;
      void getTask(task.id).then((fresh) => {
        if (fresh) setTask((t) => ({ ...t, platformStatus: fresh.platformStatus }));
      });
    };
    browser.storage.onChanged.addListener(listener);
    return () => browser.storage.onChanged.removeListener(listener);
  }, [task.id]);

  const refs = useMemo(() => extractImageRefs(task.markdown), [task.markdown]);
  const match = useMemo(
    () => matchImages(refs, task.images.map((i) => i.filename)),
    [refs, task.images],
  );

  const setMarkdown = (markdown: string) =>
    setTask((t) => ({ ...t, markdown, title: t.title || deriveTitle(markdown) }));

  const addImages = async (files: FileList | File[]) => {
    const added: TaskImage[] = [];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith('image/')) continue;
      added.push({ filename: f.name, dataUrl: await readFileAsDataUrl(f), size: f.size });
    }
    setTask((t) => {
      const kept = t.images.filter((old) => !added.some((n) => n.filename === old.filename));
      const images = [...kept, ...added];
      return { ...t, images, coverFilename: t.coverFilename ?? images[0]?.filename };
    });
  };

  const save = async () => {
    await saveTask(task);
    setSavedAt(Date.now());
  };

  const copyFallback = async () => {
    const imageMap = Object.fromEntries(task.images.map((i) => [i.filename, i.dataUrl]));
    await copyRichText(renderHtml(task.markdown, imageMap), stripMarkdown(task.markdown));
    alert('富文本已复制,可直接粘贴到任意平台编辑器');
  };

  return (
    <div style={{ display: 'flex', gap: 16, padding: 16, fontFamily: 'system-ui' }}>
      <section style={{ flex: 1, minWidth: 0 }}>
        <History currentId={task.id} onLoad={setTask} />
        <button onClick={() => setTask(newTask({ title: '', markdown: '' }))}>＋ 新文章</button>

        <h2>① 文章</h2>
        <input
          style={{ width: '100%', fontSize: 18, padding: 6 }}
          placeholder="标题(自动取自第一个 # 标题,可改)"
          value={task.title}
          onChange={(e) => setTask((t) => ({ ...t, title: e.target.value }))}
        />
        <p>
          <input
            type="file"
            accept=".md,text/markdown"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) setMarkdown(await f.text());
            }}
          />
          或直接粘贴 Markdown：
        </p>
        <textarea
          style={{ width: '100%', height: 300, fontFamily: 'monospace' }}
          value={task.markdown}
          onChange={(e) => setMarkdown(e.target.value)}
        />

        <h2>② 配图与封面</h2>
        <div
          style={{ border: '2px dashed #999', padding: 16, textAlign: 'center' }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void addImages(e.dataTransfer.files);
          }}
        >
          拖入图片,或
          <input type="file" accept="image/*" multiple onChange={(e) => e.target.files && void addImages(e.target.files)} />
        </div>
        <ul>
          {task.images.map((img) => (
            <li key={img.filename}>
              {match.matched.includes(img.filename) ? '✅' : 'ℹ️ 未被正文引用'} {img.filename}
              {img.size > MAX_IMAGE_SIZE && <strong style={{ color: 'orange' }}> ⚠️ 超过 10MB</strong>}
            </li>
          ))}
          {match.missing.map((name) => (
            <li key={name} style={{ color: 'red' }}>❌ 缺图:正文引用了 {name},请拖入</li>
          ))}
        </ul>
        {task.images.length > 0 && (
          <label>
            封面图(公众号用):
            <select
              value={task.coverFilename ?? ''}
              onChange={(e) => setTask((t) => ({ ...t, coverFilename: e.target.value }))}
            >
              {task.images.map((img) => (
                <option key={img.filename} value={img.filename}>{img.filename}</option>
              ))}
            </select>
          </label>
        )}

        <h2>③ 平台变体</h2>
        <XhsEditor task={task} onChange={setTask} />

        <p>
          <button style={{ padding: '8px 24px', fontWeight: 600 }} onClick={() => void save()}>
            保存任务
          </button>
          {savedAt && <span> 已保存 {new Date(savedAt).toLocaleTimeString()}</span>}
          <button style={{ marginLeft: 12 }} onClick={() => void copyFallback()}>
            复制富文本(手动兜底)
          </button>
        </p>

        <h2>④ 分发</h2>
        <PlatformBar task={task} onBeforeFill={save} />
      </section>

      <section style={{ flex: 1, minWidth: 0 }}>
        <h2>预览</h2>
        <Preview task={task} />
      </section>
    </div>
  );
}
```

- [ ] **Step 5: 手动验证**

重新构建加载：
1. "复制富文本" → 粘贴到任意富文本框(如知乎评论框)保留加粗/标题格式。
2. 点"去发布·知乎" → 新标签页打开知乎写作页,撰写页该行显示"⏳ 等待填充…"（适配器还没写,状态停在 pending 属预期）。
3. 保存两篇文章 → 历史列表可见、可切换加载,"＋ 新文章"清空编辑区。
4. `npx vitest run` 全部通过。

- [ ] **Step 6: Commit**

```powershell
git add -A; git commit -m "feat: 撰写页分发栏/状态/历史/剪贴板兜底"
```

---

### Task 12: 适配器接口、填充工具与通用执行器

**Files:**
- Create: `lib/adapters/types.ts`、`lib/adapters/fill-utils.ts`、`lib/adapters/runner.ts`
- Test: `tests/fill-utils.test.ts`

- [ ] **Step 1: 写失败测试（只测 jsdom 可靠的部分;合成粘贴/文件注入在真实站点手动验收）**

`tests/fill-utils.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { waitFor, dataUrlToFile, setNativeValue } from '../lib/adapters/fill-utils';

describe('waitFor', () => {
  it('值出现后 resolve', async () => {
    let v: string | null = null;
    setTimeout(() => (v = 'ok'), 50);
    expect(await waitFor(() => v, 1000, 10)).toBe('ok');
  });
  it('超时 reject', async () => {
    await expect(waitFor(() => null, 100, 10)).rejects.toThrow('超时');
  });
});

describe('dataUrlToFile', () => {
  it('还原文件名/类型/内容长度', () => {
    // "AAA" 的 base64 是 QUFB
    const f = dataUrlToFile('data:image/png;base64,QUFB', 'a.png');
    expect(f.name).toBe('a.png');
    expect(f.type).toBe('image/png');
    expect(f.size).toBe(3);
  });
});

describe('setNativeValue', () => {
  it('写入值并派发 input 事件(穿透 React 受控组件)', () => {
    const ta = document.createElement('textarea');
    document.body.append(ta);
    let fired = false;
    ta.addEventListener('input', () => (fired = true));
    setNativeValue(ta, '你好');
    expect(ta.value).toBe('你好');
    expect(fired).toBe(true);
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npx vitest run tests/fill-utils.test.ts` → FAIL。

- [ ] **Step 3: 实现接口与工具**

`lib/adapters/types.ts`:
```ts
import type { PlatformId } from '../platforms';
import type { Task } from '../tasks';

export interface FillResult {
  ok: boolean;
  /** ok 时的附加提示,如"封面需手动确认" */
  note?: string;
  failedStep?: string;
  reason?: string;
}

export interface Adapter {
  platformId: PlatformId;
  /** 当前页面是否为该平台编辑器页。适配器挂在全域名上,只在编辑器页认领任务 —
   *  未登录被重定向时任务保持"等待填充",用户登录进入编辑器后自动继续。 */
  isEditorPage(): boolean;
  /** 编辑器页层面的登录态检查(多数平台到得了编辑器即已登录,返回 true 即可) */
  checkLogin(): Promise<boolean>;
  fill(task: Task): Promise<FillResult>;
}
```

`lib/adapters/fill-utils.ts`:
```ts
/** 轮询直到 get() 返回非空,默认 10s 超时(spec:单步超时 10 秒) */
export async function waitFor<T>(
  get: () => T | null | undefined | false,
  timeoutMs = 10_000,
  intervalMs = 200,
): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const v = get();
    if (v) return v as T;
    if (Date.now() > deadline) throw new Error('等待页面元素超时');
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

export function dataUrlToFile(dataUrl: string, filename: string): File {
  const [meta, b64] = dataUrl.split(',');
  const mime = /data:([^;]+)/.exec(meta)?.[1] ?? 'application/octet-stream';
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new File([bytes], filename, { type: mime });
}

/** 用原型上的原生 setter 赋值并派发 input/change,绕过 React/Vue 受控组件拦截 */
export function setNativeValue(el: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  const proto = el instanceof HTMLTextAreaElement
    ? HTMLTextAreaElement.prototype
    : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

function dispatchPaste(target: HTMLElement, dt: DataTransfer): void {
  target.focus();
  target.dispatchEvent(
    new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }),
  );
}

/** 向富文本编辑器派发携带 HTML 的合成粘贴事件 */
export function pasteHtml(target: HTMLElement, html: string): void {
  const dt = new DataTransfer();
  dt.setData('text/html', html);
  dt.setData('text/plain', html.replace(/<[^>]+>/g, ''));
  dispatchPaste(target, dt);
}

/** 纯文本粘贴(小红书正文等) */
export function pasteText(target: HTMLElement, text: string): void {
  const dt = new DataTransfer();
  dt.setData('text/plain', text);
  dispatchPaste(target, dt);
}

/** 把文件塞进 <input type=file> 并触发 change,驱动平台自身上传逻辑 */
export function setInputFiles(input: HTMLInputElement, files: File[]): void {
  const dt = new DataTransfer();
  for (const f of files) dt.items.add(f);
  input.files = dt.files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

/** 按可见文本找元素(用于无稳定选择器的按钮/页签) */
export function findByText(selector: string, text: string): HTMLElement | null {
  return (
    Array.from(document.querySelectorAll<HTMLElement>(selector)).find((el) =>
      el.textContent?.includes(text),
    ) ?? null
  );
}
```

`lib/adapters/runner.ts`:
```ts
import type { Adapter } from './types';
import type { ClaimTaskResponse, Msg } from '../messaging';
import type { PlatformStatus } from '../tasks';

/** 通用流程:编辑器页 → 认领任务 → 登录检查 → 填充 → 回报。无任务则静默退出。 */
export async function runAdapter(adapter: Adapter): Promise<void> {
  if (!adapter.isEditorPage()) return;

  const resp = (await browser.runtime.sendMessage({
    kind: 'claim-task',
    platformId: adapter.platformId,
  } satisfies Msg)) as ClaimTaskResponse | undefined;
  const task = resp?.task;
  if (!task) return;

  const report = (status: PlatformStatus) =>
    browser.runtime.sendMessage({
      kind: 'report-fill',
      platformId: adapter.platformId,
      taskId: task.id,
      status,
    } satisfies Msg);

  try {
    if (!(await adapter.checkLogin())) {
      await report({ state: 'failed', reason: '请先登录该平台,再回撰写页点"重试填充"' });
      return;
    }
    const r = await adapter.fill(task);
    if (r.ok) await report({ state: 'filled', note: r.note });
    else await report({ state: 'failed', reason: `${r.failedStep ?? '填充'}失败:${r.reason ?? '未知原因'}` });
  } catch (e) {
    await report({ state: 'failed', reason: e instanceof Error ? e.message : String(e) });
  }
}
```

- [ ] **Step 4: 测试通过后提交**

Run: `npx vitest run tests/fill-utils.test.ts` → PASS；`npm run build` → 成功。
```powershell
git add -A; git commit -m "feat: 适配器接口/填充工具/通用执行器"
```

---

### Task 13: 知乎适配器

**Files:**
- Create: `lib/adapters/zhihu.ts`、`entrypoints/zhihu.content.ts`、`docs/superpowers/checklists/adapter-acceptance.md`

- [ ] **Step 1: 实现适配器**

`lib/adapters/zhihu.ts`:
```ts
import type { Adapter, FillResult } from './types';
import type { Task } from '../tasks';
import { renderHtml } from '../markdown';
import { waitFor, pasteHtml, setNativeValue } from './fill-utils';

// —— 选择器常量:平台改版只改这里。开发时用 DevTools 在真实页面核对! ——
const SELECTORS = {
  title: 'textarea[placeholder*="标题"]',
  editor: 'div[contenteditable="true"]',
};

export const zhihuAdapter: Adapter = {
  platformId: 'zhihu',

  isEditorPage: () =>
    location.host === 'zhuanlan.zhihu.com' && location.pathname.startsWith('/write'),

  // 未登录访问 /write 会被重定向到 signin(届时 isEditorPage 为 false,任务保持等待)
  checkLogin: async () => true,

  async fill(task: Task): Promise<FillResult> {
    let title: HTMLTextAreaElement;
    try {
      title = await waitFor(() => document.querySelector<HTMLTextAreaElement>(SELECTORS.title));
    } catch {
      return { ok: false, failedStep: '定位标题框', reason: '选择器失效,平台可能改版' };
    }
    setNativeValue(title, task.title);

    try {
      const editor = await waitFor(() => document.querySelector<HTMLElement>(SELECTORS.editor));
      const imageMap = Object.fromEntries(task.images.map((i) => [i.filename, i.dataUrl]));
      pasteHtml(editor, renderHtml(task.markdown, imageMap));
      // 只有编辑器里真的出现内容才算成功(spec:状态真实回报)
      await waitFor(() => (editor.textContent ?? '').trim().length > 0 || null);
    } catch {
      return { ok: false, failedStep: '填正文', reason: '编辑器未接受粘贴内容' };
    }
    return { ok: true, note: '图片由知乎自动转存,请逐张检查后发布' };
  },
};
```

`entrypoints/zhihu.content.ts`:
```ts
import { runAdapter } from '../lib/adapters/runner';
import { zhihuAdapter } from '../lib/adapters/zhihu';

export default defineContentScript({
  matches: ['*://zhuanlan.zhihu.com/*'],
  async main() {
    await runAdapter(zhihuAdapter);
  },
});
```

- [ ] **Step 2: 创建手动验收清单（后续适配器任务往此文件追加）**

`docs/superpowers/checklists/adapter-acceptance.md`:
```markdown
# 适配器手动验收清单

> 每个适配器开发完成后逐项实测打勾。第一步永远是:登录平台,打开编辑器页,
> 用 DevTools 核对适配器 SELECTORS 中每个选择器能命中元素,不符则更新常量后重新构建。

## 知乎(zhuanlan.zhihu.com/write)

- [ ] 选择器核对:SELECTORS.title / SELECTORS.editor 均命中
- [ ] 未登录:点"去发布·知乎"跳到登录页,任务显示"等待填充";登录后进入写作页自动填充
- [ ] 标题:正确写入,无截断
- [ ] 正文:标题层级/加粗/列表/链接格式保留
- [ ] 图片:本地配图出现在正文且被知乎转存(刷新草稿后图片仍在)
- [ ] 失败兜底:故意改坏选择器构建,状态显示"失败:…",撰写页"复制富文本"可手动粘贴完成
```

- [ ] **Step 3: 构建并实测**

```powershell
npm run build
```
重新加载扩展 → 撰写页准备一篇带图测试文章 → 点"去发布·知乎" → 按清单逐项验收，必要时修正 `SELECTORS` 后重新构建重测，全部通过后在清单文件中打勾。

- [ ] **Step 4: Commit**

```powershell
git add -A; git commit -m "feat: 知乎适配器(实测通过)"
```

---

### Task 14: 微信公众号适配器（含封面）

**Files:**
- Create: `lib/adapters/weixin.ts`、`entrypoints/weixin.content.ts`
- Modify: `docs/superpowers/checklists/adapter-acceptance.md`（追加公众号一节）

- [ ] **Step 1: 实现适配器**

`lib/adapters/weixin.ts`:
```ts
import type { Adapter, FillResult } from './types';
import type { Task } from '../tasks';
import { renderHtml } from '../markdown';
import { stripMarkdown } from '../xhs';
import { waitFor, pasteHtml, setNativeValue, setInputFiles, dataUrlToFile } from './fill-utils';

// —— 选择器常量:平台改版只改这里。开发时用 DevTools 在真实编辑页核对! ——
const SELECTORS = {
  title: '#title',
  digest: '#js_description',
  editorIframe: '#ueditor_0',          // UEditor 同源 iframe
  coverFileInput: '#js_cover_area input[type="file"]',
};

export const weixinAdapter: Adapter = {
  platformId: 'weixin',

  // 图文编辑页:mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit…
  isEditorPage: () =>
    location.host === 'mp.weixin.qq.com' && location.pathname.includes('/cgi-bin/appmsg'),

  checkLogin: async () => true, // 进得了图文编辑页即已登录

  async fill(task: Task): Promise<FillResult> {
    // 1. 标题 + 摘要(摘要无独立字段,默认取正文纯文本前 120 字)
    try {
      const title = await waitFor(() => document.querySelector<HTMLTextAreaElement>(SELECTORS.title));
      setNativeValue(title, task.title);
    } catch {
      return { ok: false, failedStep: '填标题', reason: '找不到标题框(选择器或页面改版)' };
    }
    const digest = document.querySelector<HTMLTextAreaElement>(SELECTORS.digest);
    if (digest) setNativeValue(digest, [...stripMarkdown(task.markdown)].slice(0, 120).join(''));

    // 2. 正文:向 UEditor 同源 iframe 的 body 派发合成粘贴
    try {
      const body = await waitFor(() => {
        const iframe = document.querySelector<HTMLIFrameElement>(SELECTORS.editorIframe);
        return iframe?.contentDocument?.body ?? null;
      });
      const imageMap = Object.fromEntries(task.images.map((i) => [i.filename, i.dataUrl]));
      pasteHtml(body, renderHtml(task.markdown, imageMap));
      await waitFor(() => (body.textContent ?? '').trim().length > 0 || null);
    } catch {
      return { ok: false, failedStep: '填正文', reason: '编辑器 iframe 未接受粘贴内容' };
    }

    // 3. 封面(V1 风险最高项):尝试封面区文件输入框注入;不可行则降级为提示手动
    const cover = task.images.find((i) => i.filename === task.coverFilename);
    if (cover) {
      try {
        const input = await waitFor(
          () => document.querySelector<HTMLInputElement>(SELECTORS.coverFileInput),
          5_000,
        );
        setInputFiles(input, [dataUrlToFile(cover.dataUrl, cover.filename)]);
        return { ok: true, note: '请确认封面上传与裁剪结果' };
      } catch {
        return { ok: true, note: '正文已填充;封面未能自动设置,请在封面区手动"从正文选择"或上传' };
      }
    }
    return { ok: true };
  },
};
```

`entrypoints/weixin.content.ts`:
```ts
import { runAdapter } from '../lib/adapters/runner';
import { weixinAdapter } from '../lib/adapters/weixin';

export default defineContentScript({
  matches: ['https://mp.weixin.qq.com/*'],
  async main() {
    await runAdapter(weixinAdapter);
  },
});
```

- [ ] **Step 2: 追加验收清单**

在 `docs/superpowers/checklists/adapter-acceptance.md` 末尾追加：
```markdown
## 微信公众号(mp.weixin.qq.com 图文编辑页)

- [ ] 选择器核对:title / digest / editorIframe / coverFileInput 均命中(封面 input 优先实测!)
- [ ] 流程:点"去发布·公众号"开后台首页 → 手动新建图文 → 编辑页打开后自动填充
- [ ] 标题与摘要:正确写入(摘要为正文前 120 字)
- [ ] 正文:格式保留,本地图片被转存进微信素材库(保存草稿刷新后仍在)
- [ ] 封面:撰写页指定的封面自动出现在封面区;若平台阻断,状态 note 提示手动设置
- [ ] 失败兜底:复制富文本可手动粘贴到编辑器
```

- [ ] **Step 3: 构建并实测**

`npm run build` → 重新加载 → 按清单逐项验收。封面 input 选择器是最可能要改的：在封面区右键检查，找真实的 `input[type=file]`（可能藏在弹窗里，触发弹窗后再找），更新 `SELECTORS.coverFileInput` 重测。确认降级路径：把封面选择器故意改错，验证状态显示"封面未能自动设置"且正文仍完好。

- [ ] **Step 4: Commit**

```powershell
git add -A; git commit -m "feat: 公众号适配器含封面(实测通过)"
```

---

### Task 15: 人人都是产品经理适配器

**Files:**
- Create: `lib/adapters/woshipm.ts`、`entrypoints/woshipm.content.ts`
- Modify: `docs/superpowers/checklists/adapter-acceptance.md`（追加一节）

- [ ] **Step 1: 实测编辑器形态（spec 明确:该平台 DOM 开发时实测确定）**

登录 woshipm.com → 从首页"写文章/投稿"进入创作后台 → 记录：
1. 编辑器页完整 URL → 用其稳定片段更新下面代码中的 `EDITOR_PATH_RE`；
2. 编辑器类型（直接 contenteditable / Quill / iframe 型 UEditor、KindEditor）→ DevTools 核对下面 `SELECTORS` 是否命中，不符则更新；
3. 投稿入口若在独立子域，确认在 `*.woshipm.com` 覆盖范围内（已是）。

- [ ] **Step 2: 实现适配器（通用富文本策略:先找直接 contenteditable,再找 iframe 编辑器）**

`lib/adapters/woshipm.ts`:
```ts
import type { Adapter, FillResult } from './types';
import type { Task } from '../tasks';
import { renderHtml } from '../markdown';
import { waitFor, pasteHtml, setNativeValue } from './fill-utils';

// —— 以下常量需按 Step 1 实测结果核对/更新 ——
const EDITOR_PATH_RE = /write|post|tougao|contribute/i;
const SELECTORS = {
  title: 'input[placeholder*="标题"], #title, .post-title input',
  editor: 'div[contenteditable="true"], .ql-editor',
  editorIframe: 'iframe[id^="ueditor"], iframe.ke-edit-iframe',
};

async function findEditor(): Promise<HTMLElement> {
  return waitFor(() => {
    const direct = document.querySelector<HTMLElement>(SELECTORS.editor);
    if (direct) return direct;
    const iframe = document.querySelector<HTMLIFrameElement>(SELECTORS.editorIframe);
    return iframe?.contentDocument?.body ?? null;
  });
}

export const woshipmAdapter: Adapter = {
  platformId: 'woshipm',

  isEditorPage: () =>
    location.hostname.endsWith('woshipm.com') &&
    EDITOR_PATH_RE.test(location.pathname + location.search),

  checkLogin: async () => true, // 进得了创作后台即已登录;若实测发现未登录也可达,在此补真实检测

  async fill(task: Task): Promise<FillResult> {
    try {
      const title = await waitFor(() =>
        document.querySelector<HTMLInputElement>(SELECTORS.title),
      );
      setNativeValue(title, task.title);
    } catch {
      return { ok: false, failedStep: '填标题', reason: '找不到标题框(请核对选择器)' };
    }
    try {
      const editor = await findEditor();
      const imageMap = Object.fromEntries(task.images.map((i) => [i.filename, i.dataUrl]));
      pasteHtml(editor, renderHtml(task.markdown, imageMap));
      await waitFor(() => (editor.textContent ?? '').trim().length > 0 || null);
    } catch {
      return { ok: false, failedStep: '填正文', reason: '编辑器未接受粘贴内容' };
    }
    return { ok: true, note: '投稿有人工审核,请按平台要求补充分类/标签后提交' };
  },
};
```

`entrypoints/woshipm.content.ts`:
```ts
import { runAdapter } from '../lib/adapters/runner';
import { woshipmAdapter } from '../lib/adapters/woshipm';

export default defineContentScript({
  matches: ['*://*.woshipm.com/*'],
  async main() {
    await runAdapter(woshipmAdapter);
  },
});
```

- [ ] **Step 3: 追加验收清单**

在 `docs/superpowers/checklists/adapter-acceptance.md` 末尾追加：
```markdown
## 人人都是产品经理(woshipm.com 创作后台)

- [ ] Step 1 实测完成:EDITOR_PATH_RE 与 SELECTORS 已按真实页面更新
- [ ] 标题:正确写入
- [ ] 正文:格式保留,图片被平台转存(若平台粘贴时剥离图片,记录现象,图片改走手动)
- [ ] 未登录场景:任务保持"等待填充",登录进入编辑器后自动继续
- [ ] 失败兜底:复制富文本可手动粘贴
```

- [ ] **Step 4: 构建实测后提交**

```powershell
npm run build
# 按清单验收后:
git add -A; git commit -m "feat: 人人都是产品经理适配器(实测通过)"
```

---

### Task 16: 小红书适配器

**Files:**
- Create: `lib/adapters/xiaohongshu.ts`、`entrypoints/xiaohongshu.content.ts`
- Modify: `docs/superpowers/checklists/adapter-acceptance.md`（追加一节）

- [ ] **Step 1: 实现适配器**

流程与长文平台不同：先注入图片驱动上传，上传完成后才出现标题/正文区，再填变体文案。图片上传耗时不可控，该步超时放宽到 30 秒（其余仍为 spec 的 10 秒）。

`lib/adapters/xiaohongshu.ts`:
```ts
import type { Adapter, FillResult } from './types';
import type { Task } from '../tasks';
import {
  waitFor, pasteText, setNativeValue, setInputFiles, dataUrlToFile, findByText,
} from './fill-utils';

// —— 选择器常量:开发时在 creator.xiaohongshu.com 实测核对! ——
const SELECTORS = {
  fileInput: 'input[type="file"]',
  title: 'input[placeholder*="标题"]',
  editor: 'div[contenteditable="true"]',
};
const UPLOAD_TAB_TEXT = '上传图文';

export const xiaohongshuAdapter: Adapter = {
  platformId: 'xiaohongshu',

  isEditorPage: () =>
    location.host === 'creator.xiaohongshu.com' && location.pathname.startsWith('/publish'),

  checkLogin: async () => true, // 未登录会被重定向到登录页(isEditorPage 为 false)

  async fill(task: Task): Promise<FillResult> {
    const v = task.variants.xiaohongshu;
    if (!v?.title || !v.body)
      return { ok: false, failedStep: '前置检查', reason: '请先在撰写页填写小红书变体' };
    if (task.images.length === 0)
      return { ok: false, failedStep: '前置检查', reason: '图文笔记至少需要 1 张图,请先添加配图' };

    // 1. 发布页默认可能在"上传视频"页签,切到"上传图文"
    findByText('div, span, button', UPLOAD_TAB_TEXT)?.click();

    // 2. 注入图片,驱动平台上传
    try {
      const input = await waitFor(() => document.querySelector<HTMLInputElement>(SELECTORS.fileInput));
      setInputFiles(input, task.images.map((i) => dataUrlToFile(i.dataUrl, i.filename)));
    } catch {
      return { ok: false, failedStep: '上传图片', reason: '找不到图片上传入口(请核对选择器)' };
    }

    // 3. 上传完成后出现标题/正文区(放宽 30s)
    try {
      const title = await waitFor(
        () => document.querySelector<HTMLInputElement>(SELECTORS.title),
        30_000,
      );
      setNativeValue(title, v.title);
      const editor = await waitFor(() => document.querySelector<HTMLElement>(SELECTORS.editor));
      pasteText(editor, v.body);
      await waitFor(() => (editor.textContent ?? '').trim().length > 0 || null);
    } catch {
      return { ok: false, failedStep: '填标题/正文', reason: '上传后未出现编辑区或粘贴未生效' };
    }
    return { ok: true, note: '请检查图片顺序与 #话题# 后发布' };
  },
};
```

`entrypoints/xiaohongshu.content.ts`:
```ts
import { runAdapter } from '../lib/adapters/runner';
import { xiaohongshuAdapter } from '../lib/adapters/xiaohongshu';

export default defineContentScript({
  matches: ['https://creator.xiaohongshu.com/*'],
  async main() {
    await runAdapter(xiaohongshuAdapter);
  },
});
```

- [ ] **Step 2: 追加验收清单**

在 `docs/superpowers/checklists/adapter-acceptance.md` 末尾追加：
```markdown
## 小红书(creator.xiaohongshu.com/publish)

- [ ] 选择器核对:fileInput / title / editor 均命中;"上传图文"页签切换正常
- [ ] 前置检查:未填变体或无图时,状态给出明确失败原因
- [ ] 图片:多图全部上传成功,顺序与撰写页一致
- [ ] 标题/正文:变体文案正确写入,20/1000 字限内
- [ ] 失败兜底:复制富文本(纯文本部分)可手动粘贴
```

- [ ] **Step 3: 构建实测后提交**

```powershell
npm run build
# 按清单验收后:
git add -A; git commit -m "feat: 小红书适配器(实测通过)"
```

---

### Task 17: 收尾 — 全量验证与 README

**Files:**
- Create: `README.md`

- [ ] **Step 1: 全量回归**

```powershell
npx vitest run
npm run build
```
预期：所有单测通过；构建产物含 background、popup、composer 与 4 个 content script。

- [ ] **Step 2: 端到端走查（真实文章)**

用一篇真实文章（含标题、配图、加粗/列表）完整走一遍：撰写页导入 → 保存 → 四个平台依次"去发布"并人工检查 → B站/X/Reddit 跳转正常 → 历史列表可重新加载这篇文章。`docs/superpowers/checklists/adapter-acceptance.md` 全部打勾。

- [ ] **Step 3: 写 README**

`README.md`:
```markdown
# 文章多平台分发助手

Chrome 插件(MV3):Markdown 文章 + 本地配图,半自动填充到微信公众号/知乎/人人都是产品经理/小红书,B站/X/Reddit 快捷跳转。设计文档见 docs/superpowers/specs/。

## 使用

1. `npm install && npm run build`,Chrome → chrome://extensions → 加载已解压的扩展程序 → 选 `.output/chrome-mv3`
2. 点插件图标 → "新建分发" → 粘贴 Markdown、拖入配图、选封面、(小红书)生成变体 → 保存
3. 逐平台点"去发布":插件打开编辑器并自动填充,人工检查后点平台的发布按钮
4. 填充失败时用"复制富文本"手动粘贴兜底

## 维护

- 平台改版导致填充失败:改对应适配器 `lib/adapters/<平台>.ts` 顶部的 SELECTORS 常量,重新构建
- 验收清单:docs/superpowers/checklists/adapter-acceptance.md

## 开发

- `npm run dev` 热重载开发;`npx vitest run` 单测;V2 规划(X/Reddit 短文、B站专栏)见设计文档
```

- [ ] **Step 4: 最终提交**

```powershell
git add -A; git commit -m "docs: README 与全量验收"
```
