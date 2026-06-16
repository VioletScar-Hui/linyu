// ============================================================
// Linyu 灵羽 — 站点内容数据（已对齐插件真实功能：多平台内容分发）
// 改文案只动这里，不用碰页面结构。
// 依据：仓库 README.md + manifest.json + 构建产物
// ============================================================

export const linyu = {
  name: 'Linyu',
  nameCn: '灵羽',
  tagline: 'Multi-platform Publishing Assistant',
  taglineLong: 'One Markdown draft, semi-auto filled into 7+ content platforms',
  subtitle: 'Write once → semi-auto fill to 公众号 / 知乎 / 小红书 / B站 / X / Reddit',
  description:
    'Linyu (灵羽) is a Chrome Manifest V3 extension for creators who publish the same article everywhere. Write one Markdown draft with local images — Linyu opens each platform’s editor and fills in the title, body and images. You keep the final review and hit publish yourself.',

  // 顶部标签（详情页 Hero）
  tags: ['Chrome Extension', 'Manifest V3', 'Multi-platform', 'Local-first'],
  // 卡片标签（首页入口卡 / 组件卡）
  cardTags: ['多平台分发', '内容创作', 'Chrome 扩展', '效率'],

  // 链接 —— 已接入真实仓库；liveDemo 之后可换成 Chrome 商店地址
  links: {
    liveDemo: 'https://github.com/VioletScar-Hui/linyu/releases',
    sourceCode: 'https://github.com/VioletScar-Hui/linyu',
    documentation: 'https://github.com/VioletScar-Hui/linyu#readme',
    changelog: 'https://github.com/VioletScar-Hui/linyu/releases',
  },

  // Hero 下方的三个小亮点
  highlights: [
    { icon: 'layers', title: 'Multi-platform', text: '7+ targets from one draft' },
    { icon: 'check', title: 'You stay in control', text: 'Fills the editor — you publish' },
    { icon: 'shield', title: 'Local-first', text: 'No passwords, no history upload' },
  ],

  // Overview —— 三句话讲清价值（对应 README 三点图文介绍）
  overview: [
    {
      icon: 'notes',
      title: 'Write Once in Markdown',
      text: 'Compose one Markdown article with local images, then generate per-platform versions.',
    },
    {
      icon: 'layers',
      title: 'Semi-auto Fill, You Confirm',
      text: 'Linyu opens each platform editor and fills title, body and images. You review and publish.',
    },
    {
      icon: 'shield',
      title: 'Safe & Local-first',
      text: 'No account passwords, no history upload, no private publish APIs. Copy-rich-text fallback if a fill fails.',
    },
  ],

  // Problem —— 多平台分发的真实痛点
  problems: [
    { icon: 'copy', text: 'Re-pasting one article into 7 platforms by hand' },
    { icon: 'image', text: 'Images & formatting break in every editor' },
    { icon: 'format', text: 'Short platforms (小红书 / X / Reddit) need shorter copy' },
    { icon: 'shield', text: 'Full auto-publish tools feel risky to trust' },
  ],

  // Workflow —— 五步（对应 README「第一次成功运行」）
  workflow: [
    { step: 1, title: 'Compose', text: 'Paste your Markdown article and add local images' },
    { step: 2, title: 'Adapt', text: 'Generate shorter variants, or keep the long form' },
    { step: 3, title: 'Select', text: 'Pick target platforms and hit “去发布 / Go publish”' },
    { step: 4, title: 'Auto-fill', text: 'Linyu opens each editor and fills title, body, images' },
    { step: 5, title: 'Confirm', text: 'You review, then publish on the platform yourself' },
  ],

  // Key Screens —— 四张关键界面
  keyScreens: [
    { n: 1, title: 'Distribution Popup', kind: 'popup' },
    { n: 2, title: 'Variant Preview', kind: 'preview' },
    { n: 3, title: 'Platform Adapters', kind: 'adapters' },
    { n: 4, title: 'Editor Fill & Confirm', kind: 'editor' },
  ],

  // Tech Stack（依据构建产物：WXT + React 的 MV3 扩展）
  techStack: [
    'Chrome Manifest V3',
    'WXT',
    'React',
    'TypeScript',
    'Vite',
    'Content Scripts',
    'Service Worker',
    'chrome.storage',
    'Markdown',
  ],

  // 详情页左侧目录锚点
  toc: [
    { id: 'overview', label: 'Overview' },
    { id: 'problem', label: 'Problem' },
    { id: 'workflow', label: 'Workflow' },
    { id: 'screens', label: 'Key Screens' },
    { id: 'local-first', label: 'Local-first' },
    { id: 'tech', label: 'Tech Stack' },
    { id: 'links', label: 'Links' },
  ],

  // 角色（备用数据）
  role: {
    who: 'Solo Developer',
    what: 'Extension · Frontend · Multi-platform Automation',
  },
};

// 扩展弹窗里的内容（多处复用）—— 队列=待分发的 Markdown 文章，平台=分发目标
export const popup = {
  queue: [
    { name: '长文初稿.md', status: 'ready' as const },
    { name: '新版本发布.md', status: 'ready' as const },
    { name: '活动公告.md', status: 'draft' as const },
  ],
  imagesCount: 6,
  platforms: [
    { name: '公众号', status: 'ready' as const },
    { name: '知乎', status: 'ready' as const },
    { name: '小红书', status: 'draft' as const },
  ],
};

// 首页作品区里的其它项目卡（占位示例，可替换）
export const otherProjects = [
  {
    name: 'Insight Board',
    text: 'AI-powered analytics dashboard',
    tags: ['Next.js', 'FastAPI', 'Data Viz'],
    accent: 'green',
  },
  {
    name: 'ClipFlow',
    text: 'Smart content clipping and organization',
    tags: ['Electron', 'SQLite', 'Local-First'],
    accent: 'amber',
  },
  {
    name: 'Prompt Kit',
    text: 'Prompt management for creators',
    tags: ['React', 'Node.js', 'LLM'],
    accent: 'purple',
  },
];

// 站点作者信息（首页导航 / 页脚）—— 改成你自己的
export const site = {
  author: 'VioletScar_Hui',
  role: 'Indie Developer',
  nav: [
    { label: 'Home', href: '/' },
    { label: 'Projects', href: '/#projects' },
    { label: 'Articles', href: '#' },
    { label: 'About', href: '#' },
  ],
};
