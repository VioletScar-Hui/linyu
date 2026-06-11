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
