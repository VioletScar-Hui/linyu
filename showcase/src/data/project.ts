// ============================================================
// Linyu 灵羽 — 站点内容数据
// 改文案只动这里，不用碰页面结构。
// ============================================================

export const linyu = {
  name: 'Linyu',
  nameCn: '灵羽',
  tagline: 'Chrome Publishing Assistant',
  taglineLong: 'Chrome Publishing Assistant for multi-platform creators',
  subtitle: 'AI product breakdown → long-form content',
  description:
    'Write once in Markdown, publish everywhere. A local-first assistant that helps creators turn scattered insights into polished, multi-platform long-form content — with fewer steps.',

  // 顶部标签（详情页 Hero）
  tags: ['Chrome Extension', 'React', 'TypeScript', 'Local-first'],
  // 卡片标签（首页入口卡 / 组件卡）
  cardTags: ['AI 工具', '内容创作', 'Chrome 扩展', '效率'],

  // 链接 —— 已接入真实仓库；liveDemo 之后可换成 Chrome 商店地址
  links: {
    liveDemo: 'https://github.com/VioletScar-Hui/linyu/releases',
    sourceCode: 'https://github.com/VioletScar-Hui/linyu',
    documentation: 'https://github.com/VioletScar-Hui/linyu#readme',
    changelog: 'https://github.com/VioletScar-Hui/linyu/releases',
  },

  // Hero 下方的三个小亮点
  highlights: [
    { icon: 'shield', title: 'Local-first', text: 'Your data stays in your browser' },
    { icon: 'layers', title: 'Multi-platform', text: 'One draft, many destinations' },
    { icon: 'clock', title: 'Save time', text: 'Focus on creating, not formatting' },
  ],

  // Overview —— 三句话讲清价值
  overview: [
    {
      icon: 'feather',
      title: 'AI Product Deep Dive',
      text: 'Turn product research into structured long-form drafts automatically.',
    },
    {
      icon: 'layers',
      title: 'Multi-platform Publishing',
      text: 'Adapt one draft to Blog, Docs and News in a single click.',
    },
    {
      icon: 'shield',
      title: 'Local-first by Default',
      text: 'All history and drafts stay on your device. Your data, your control.',
    },
  ],

  // Problem —— 痛点
  problems: [
    { icon: 'notes', text: 'Scattered notes, messy structure' },
    { icon: 'copy', text: 'Copy-paste across platforms' },
    { icon: 'format', text: 'Formatting & publishing are tedious' },
    { icon: 'rules', text: 'Platform rules & limits are unclear' },
  ],

  // Workflow —— 五步
  workflow: [
    { step: 1, title: 'Input', text: 'Provide product basics and materials' },
    { step: 2, title: 'Search', text: 'Crawl official docs, market info, user feedback' },
    { step: 3, title: 'Analyze', text: 'Extract key insights & pain points' },
    { step: 4, title: 'Generate', text: 'Core conclusions + structured chapters' },
    { step: 5, title: 'Export', text: 'Export or update the long-form doc' },
  ],

  // Key Screens —— 四张关键界面
  keyScreens: [
    { n: 1, title: 'Extension Popup', kind: 'popup' },
    { n: 2, title: 'Content Preview', kind: 'preview' },
    { n: 3, title: 'Platform Adapters', kind: 'adapters' },
    { n: 4, title: 'Editor Fill & Confirm', kind: 'editor' },
  ],

  // Tech Stack
  techStack: [
    'TypeScript',
    'React',
    'Vite',
    'Tailwind CSS',
    'Chrome Extension API',
    'Zustand',
    'Marked',
    'html-to-docx',
    'Dexie (IndexedDB)',
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

  // 角色（详情页 Hero 卡）
  role: {
    who: 'Solo Developer',
    what: 'Product Design · Frontend · Extension · Local Storage',
  },
};

// 扩展弹窗里的内容（多处复用）
export const popup = {
  queue: [
    { name: 'AI Product Deep Dive.md', status: 'ready' as const },
    { name: 'Workflow Guide.md', status: 'ready' as const },
    { name: 'Release Notes.md', status: 'draft' as const },
  ],
  imagesCount: 6,
  platforms: [
    { name: 'Blog', status: 'ready' as const },
    { name: 'Docs', status: 'ready' as const },
    { name: 'News', status: 'draft' as const },
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
  role: 'AI Product Manager',
  nav: [
    { label: 'Home', href: '/' },
    { label: 'Projects', href: '/#projects' },
    { label: 'Articles', href: '#' },
    { label: 'About', href: '#' },
  ],
};
