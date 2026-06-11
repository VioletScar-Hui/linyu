/** 粗粒度去 Markdown 标记,产出小红书可用纯文本。
 *  覆盖:ATX 标题(#)、无序列表、引用、围栏代码块(```)、图片、链接、强调、行内码。
 *  不处理:setext 标题、有序列表编号、表格、分隔线、~~~ 围栏 —— 用户会在撰写页人工修订。 */
export function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, '')           // 代码块整体去掉
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')     // 图片
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')  // 链接留文字
    .replace(/^#{1,6}\s+/gm, '')              // 标题标记
    .replace(/^\s*[-*+]\s+/gm, '')            // 列表标记
    .replace(/^\s*>\s?/gm, '')                // 引用标记
    .replace(/`([^`\n]+)`/g, (_m, code: string) =>
      code.replace(/\*/g, '\x01').replace(/_/g, '\x02')) // 行内码:去反引号,*/_ 暂存为哨兵
    .replace(/(\*\*|__|\*|_)/g, '')           // 强调标记
    .replace(/\x01/g, '*').replace(/\x02/g, '_') // 还原行内码中的 */_
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
