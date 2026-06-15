export function basename(p: string): string {
  const noQuery = p.split(/[?#]/)[0];
  const parts = noQuery.split(/[/\\]/);
  return parts[parts.length - 1];
}

// 支持普通 ![](a.png) 与尖括号包裹 ![](<图 1.png>)(含空格文件名)
const IMAGE_REF_RE = /!\[[^\]]*\]\(\s*(?:<([^>]+)>|([^)\s]+))(?:\s+(?:"[^"]*"|'[^']*'|\([^)]*\)))?\s*\)/g;

/** 提取 Markdown 中的本地图片引用(文件名,去重);忽略 http(s) 与 data: */
export function extractImageRefs(markdown: string): string[] {
  const refs: string[] = [];
  const seen = new Set<string>();
  for (const m of markdown.matchAll(IMAGE_REF_RE)) {
    const src = m[1] ?? m[2];
    if (/^(https?:|data:)/i.test(src)) continue;
    const name = basename(src);
    if (!seen.has(name)) {
      seen.add(name);
      refs.push(name);
    }
  }
  return refs;
}

export interface ImageMatch {
  matched: string[];
  missing: string[];
}

/** refs:文章引用的文件名; available:用户已拖入的文件名 */
export function matchImages(refs: string[], available: string[]): ImageMatch {
  const set = new Set(available);
  return {
    matched: refs.filter((r) => set.has(r)),
    missing: refs.filter((r) => !set.has(r)),
  };
}
