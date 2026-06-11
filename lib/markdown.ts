import MarkdownIt from 'markdown-it';
import { basename } from './images';

const md = new MarkdownIt({ html: false, linkify: true });

// 自定义图片渲染:本地引用按文件名查 env.imageMap 换成 dataUrl
const defaultImage = md.renderer.rules.image!;
md.renderer.rules.image = (tokens, idx, opts, env, self) => {
  const token = tokens[idx];
  const src = token.attrGet('src') ?? '';
  if (!/^(https?:|data:)/i.test(src)) {
    const map = (env?.imageMap as Record<string, string> | undefined) ?? {};
    const mapped = map[basename(src)];
    if (mapped) token.attrSet('src', mapped);
  }
  return defaultImage(tokens, idx, opts, env, self);
};

/** Markdown → HTML;imageMap: 文件名 → dataUrl。无共享可变状态,可安全并发调用。 */
export function renderHtml(markdown: string, imageMap: Record<string, string>): string {
  return md.render(markdown, { imageMap });
}

/** 从 Markdown 提取标题(第一个 #/## 行),用于撰写页标题初值 */
export function deriveTitle(markdown: string): string {
  const m = markdown.match(/^#{1,2}\s+(.+)$/m);
  return m ? m[1].trim() : '';
}
