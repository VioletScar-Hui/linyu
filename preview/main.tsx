import './browser-stub';
import { createRoot } from 'react-dom/client';
import { App } from '../entrypoints/composer/App';
import type { Task } from '../lib/tasks';

function demoImage(filename: string, c1: string, c2: string, label: string): { filename: string; dataUrl: string; size: number } {
  const canvas = document.createElement('canvas');
  canvas.width = 400; canvas.height = 300;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, 400, 300);
  g.addColorStop(0, c1); g.addColorStop(1, c2);
  ctx.fillStyle = g; ctx.fillRect(0, 0, 400, 300);
  ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.font = '500 30px system-ui';
  ctx.fillText(label, 28, 160);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
  return { filename, dataUrl, size: Math.floor(dataUrl.length * 0.75) };
}

const markdown = `# 灵羽:写一次,羽传多平台

写完文章打开灵羽,**一处撰写**,自动填充到公众号、知乎、小红书、B站、X 等平台。

## 它能做什么

- 半自动填充标题、正文与配图,你检查后一键发布
- 插件内直接编辑配图:裁剪、旋转、翻转、压缩
- 为小红书 / X / Reddit 生成专属短文案变体

![封面](cover.jpg)

> 内容由你最终确认发布,平台风控风险最低。

更多细节见正文……`;

const demoTask: Task = {
  id: 'preview-demo',
  createdAt: Date.now(),
  title: '灵羽:写一次,羽传多平台',
  markdown,
  images: [
    demoImage('cover.jpg', '#1e3a44', '#c9a86a', '灵羽 · 封面'),
    demoImage('fig-1.jpg', '#2d4a6b', '#3a8a6d', '配图一'),
    demoImage('fig-2.jpg', '#7c5cbf', '#ff2442', '配图二'),
    demoImage('截图 1.png', '#16242c', '#e6a23c', '含空格名'),
  ],
  coverFilename: 'cover.jpg',
  variants: {
    xiaohongshu: { title: '写一次,羽传全平台✨', body: '再也不用一个个平台复制粘贴啦!灵羽帮你自动填充~ #效率工具 #自媒体' },
  },
  platformStatus: {
    weixin: { state: 'filled', note: '封面请手动从正文选择' },
    zhihu: { state: 'filled' },
    xiaohongshu: { state: 'pending' },
    bilibili: { state: 'failed', reason: '图片需在编辑器内确认' },
  },
};

createRoot(document.getElementById('root')!).render(<App initial={demoTask} />);
