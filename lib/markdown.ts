import MarkdownIt from 'markdown-it';
import { basename } from './images';

const md = new MarkdownIt({ html: false, linkify: true });

/** markdown-it 会对图片 src 做 URL 编码(含空格的文件名 → %20),解码回原文件名再查表 */
function safeDecode(s: string): string {
  try { return decodeURIComponent(s); } catch { return s; }
}

// 自定义图片渲染:本地引用按文件名查 env.imageMap 换成 dataUrl
const defaultImage = md.renderer.rules.image!;
md.renderer.rules.image = (tokens, idx, opts, env, self) => {
  const token = tokens[idx];
  const src = token.attrGet('src') ?? '';
  if (!/^(https?:|data:)/i.test(src)) {
    const name = basename(safeDecode(src));
    const map = (env?.imageMap as Record<string, string> | undefined) ?? {};
    const mapped = map[name];
    if (mapped) {
      token.attrSet('src', mapped);
      token.attrSet('data-ly-img', name); // 供预览面板定位本地图片(移动/编辑)
    }
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

export type ContentSegment =
  | { kind: 'html'; html: string }
  | { kind: 'image'; filename: string };

const LOCAL_IMG_PREFIX = 'local-image://';

/** 渲染为"文本段+本地图片"序列:本地图单独成段(供逐段粘贴,图片走文件粘贴上传),
 *  远程图保留在 HTML 段中。 */
export function renderSegments(markdown: string, localFilenames: string[]): ContentSegment[] {
  const imageMap = Object.fromEntries(localFilenames.map((f) => [f, `${LOCAL_IMG_PREFIX}${f}`]));
  const html = renderHtml(markdown, imageMap);
  const segments: ContentSegment[] = [];
  const re = /<img\b[^>]*src="local-image:\/\/([^"]+)"[^>]*>/g;
  let last = 0;
  for (const m of html.matchAll(re)) {
    const before = html.slice(last, m.index);
    if (hasContent(before)) segments.push({ kind: 'html', html: before });
    segments.push({ kind: 'image', filename: safeDecode(m[1]) }); // src 可能被 URL 编码
    last = (m.index ?? 0) + m[0].length;
  }
  const tail = html.slice(last);
  if (hasContent(tail)) segments.push({ kind: 'html', html: tail });
  return segments;
}

/** 把包含指定本地图片引用的 Markdown 块上移/下移一个块(块以空行分隔)。
 *  找不到引用或已到边界时原样返回。 */
export function moveImageBlock(markdown: string, filename: string, dir: 'up' | 'down'): string {
  const blocks = markdown.split(/\n{2,}/);
  const refRe = /!\[[^\]]*\]\(\s*(?:<([^>]+)>|([^)\s]+))(?:\s+(?:"[^"]*"|'[^']*'|\([^)]*\)))?\s*\)/g;
  const idx = blocks.findIndex((b) =>
    [...b.matchAll(refRe)].some((m) => {
      const ref = m[1] ?? m[2];
      return !/^(https?:|data:)/i.test(ref) && basename(ref) === filename;
    }),
  );
  if (idx < 0) return markdown;
  const to = dir === 'up' ? idx - 1 : idx + 1;
  if (to < 0 || to >= blocks.length) return markdown;
  const next = [...blocks];
  [next[idx], next[to]] = [next[to], next[idx]];
  return next.join('\n\n');
}

/** 在 markdown 的 pos 处插入本地图片引用,自动用空行隔成独立块(便于后续上下移动)。
 *  pos 省略时插到文末。返回新 markdown 与插入后光标位置。 */
export function insertImageRef(
  markdown: string,
  filename: string,
  pos?: number,
): { markdown: string; caret: number } {
  const p = Math.max(0, Math.min(pos ?? markdown.length, markdown.length));
  const before = markdown.slice(0, p);
  const after = markdown.slice(p);
  // 文件名含空格/括号等会破坏 ![](url) 语法,用尖括号包裹(markdown 标准)
  const snippet = /[\s()<>]/.test(filename) ? `![](<${filename}>)` : `![](${filename})`;
  const sepBefore = before === '' ? '' : before.endsWith('\n\n') ? '' : before.endsWith('\n') ? '\n' : '\n\n';
  const sepAfter = after === '' ? '\n' : after.startsWith('\n\n') ? '' : after.startsWith('\n') ? '\n' : '\n\n';
  const head = before + sepBefore + snippet;
  return { markdown: head + sepAfter + after, caret: head.length };
}

/** 剥去所有标签和空白后返回剩余文字;若只剩空白(含纯包裹标签)则返回空串 */
function stripEmptyHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim();
}

/** 片段是否含有实质内容:有非空文本 OR 有自闭合媒体/嵌入标签 */
function hasContent(html: string): boolean {
  if (stripEmptyHtml(html)) return true;
  // 保留含 <img> / <video> / <audio> / <iframe> 等自闭合/媒体标签的片段
  return /<(?:img|video|audio|iframe|source|embed)\b/i.test(html);
}
