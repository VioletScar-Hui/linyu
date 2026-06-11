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
