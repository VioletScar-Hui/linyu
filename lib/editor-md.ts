import { basename } from './images';
import type { TaskImage } from './tasks';

// 图片引用:![alt](src) / ![alt](<src>) / 带标题。分组 head、src(尖括号或普通)、tail。
const IMG_RE = /(!\[[^\]]*\]\(\s*)(?:<([^>]+)>|([^)\s]+))((?:\s+(?:"[^"]*"|'[^']*'|\([^)]*\)))?\s*\))/g;

/** 存储格式 → 编辑器格式:本地图片引用的 filename 换成 dataUrl(编辑器才能显示图)。 */
export function toEditorMd(markdown: string, images: TaskImage[]): string {
  const byName = new Map(images.map((i) => [i.filename, i.dataUrl]));
  return markdown.replace(IMG_RE, (full, head: string, bracket: string | undefined, plain: string | undefined, tail: string) => {
    const src = bracket ?? plain ?? '';
    if (/^(https?:|data:)/i.test(src)) return full;
    const url = byName.get(basename(src));
    return url ? `${head}${url}${tail}` : full;
  });
}

/** 编辑器格式 → 存储格式:dataUrl 图片换回 filename(匹配图库的);编辑器内新粘贴的 dataUrl 暂保留。 */
export function fromEditorMd(markdown: string, images: TaskImage[]): string {
  const byUrl = new Map(images.map((i) => [i.dataUrl, i.filename]));
  return markdown.replace(IMG_RE, (full, head: string, bracket: string | undefined, plain: string | undefined, tail: string) => {
    const src = bracket ?? plain ?? '';
    if (!/^data:/i.test(src)) return full;
    const name = byUrl.get(src);
    if (!name) return full; // 不在图库的 dataUrl(编辑器内新图),保留
    const wrapped = /[\s()<>]/.test(name) ? `<${name}>` : name;
    return `${cleanAlt(head)}${wrapped}${tail}`;
  });
}

// Crepe 把图片缩放比例(如 1.00)写进 alt 位置,换回存储格式时清掉这种纯数字 alt
function cleanAlt(head: string): string {
  return head.replace(/^(!\[)\s*\d+(?:\.\d+)?\s*(\]\()/, '$1$2');
}

let pasteSeq = 0;

/** 吸收编辑器内新粘贴/拖入的图片(dataUrl 不在图库):生成 filename 入库,并把引用换成 filename。
 *  返回清洗后的 markdown 与新增图片;同一 dataUrl 多次出现只入库一次。 */
export function absorbPastedImages(
  markdown: string,
  images: TaskImage[],
): { markdown: string; added: TaskImage[] } {
  const known = new Set(images.map((i) => i.dataUrl));
  const byData = new Map<string, string>(); // dataUrl -> 本次生成的 filename
  const added: TaskImage[] = [];
  const out = markdown.replace(IMG_RE, (full, head: string, bracket: string | undefined, plain: string | undefined, tail: string) => {
    const src = bracket ?? plain ?? '';
    if (!/^data:image\//i.test(src) || known.has(src)) return full;
    let name = byData.get(src);
    if (!name) {
      const ext = (/^data:image\/([a-z0-9.+-]+)/i.exec(src)?.[1] || 'png')
        .replace('jpeg', 'jpg').replace('svg+xml', 'svg');
      name = `pasted-${Date.now()}-${++pasteSeq}.${ext}`;
      byData.set(src, name);
      added.push({ filename: name, dataUrl: src, size: Math.floor((src.length - src.indexOf(',') - 1) * 0.75) });
    }
    const wrapped = /[\s()<>]/.test(name) ? `<${name}>` : name;
    return `${cleanAlt(head)}${wrapped}${tail}`;
  });
  return { markdown: out, added };
}
