import JSZip from 'jszip';
import { basename } from './images';
import type { Task } from './tasks';

// 图片引用:![alt](src) / ![alt](<src with space>) / 带标题。分组捕获 head、src、tail 以便改写。
const IMG_RE = /(!\[[^\]]*\]\(\s*)(?:<([^>]+)>|([^)\s]+))((?:\s+(?:"[^"]*"|'[^']*'|\([^)]*\)))?\s*\))/g;

/** 把 markdown 里本地图片引用的路径改写为 `prefix/文件名`(含空格用尖括号);远程图/data URL 保留。 */
export function rewriteImagePaths(markdown: string, prefix: string): string {
  return markdown.replace(IMG_RE, (full, head: string, bracket: string | undefined, plain: string | undefined, tail: string) => {
    const src = bracket ?? plain ?? '';
    if (/^(https?:|data:)/i.test(src)) return full; // 远程/内联不改
    const name = basename(src);
    const path = `${prefix}/${name}`;
    const wrapped = /[\s()<>]/.test(name) ? `<${path}>` : path;
    return `${head}${wrapped}${tail}`;
  });
}

/** 组装文章 zip:article.md(图片引用指向 images/) + images/ 下的全部配图。 */
export async function buildArticleZip(task: Task): Promise<Blob> {
  const zip = new JSZip();
  zip.file('article.md', rewriteImagePaths(task.markdown, 'images'));
  if (task.images.length > 0) {
    const folder = zip.folder('images')!;
    for (const image of task.images) {
      const b64 = image.dataUrl.slice(image.dataUrl.indexOf(',') + 1);
      folder.file(image.filename, b64, { base64: true });
    }
  }
  return zip.generateAsync({ type: 'blob' });
}
