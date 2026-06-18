import type { TaskImage } from './tasks';

const MAX_EDGE = 1920;
const QUALITY = 0.85;
const CANVAS_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

/** 按最大边等比缩放后的目标尺寸(长边不超过 maxEdge);本就更小则不放大。 */
export function targetDimensions(w: number, h: number, maxEdge = MAX_EDGE): { w: number; h: number } {
  const long = Math.max(w, h);
  if (long <= maxEdge) return { w, h };
  const scale = maxEdge / long;
  return { w: Math.round(w * scale), h: Math.round(h * scale) };
}

function dataUrlBytes(dataUrl: string): number {
  return Math.floor((dataUrl.length - dataUrl.indexOf(',') - 1) * 0.75);
}

function readDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('decode failed'));
    img.src = src;
  });
}

/** 大图自动压缩:超过最大边等比缩小,JPEG/WebP 按质量重编码;仅当结果更小才替换。
 *  GIF/SVG 等不经 canvas,原样保留(避免破坏动图/矢量)。失败时回退原图。 */
export async function compressImage(file: File): Promise<TaskImage> {
  const original = await readDataUrl(file);
  const fallback: TaskImage = { filename: file.name, dataUrl: original, size: file.size };
  if (!CANVAS_TYPES.has(file.type)) return fallback;

  let img: HTMLImageElement;
  try { img = await loadImage(original); } catch { return fallback; }

  const { w, h } = targetDimensions(img.naturalWidth, img.naturalHeight);
  const noResize = w === img.naturalWidth && h === img.naturalHeight;
  if (noResize && file.type === 'image/png') return fallback; // 无需缩放的无损 png 直接留

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return fallback;
  ctx.drawImage(img, 0, 0, w, h);

  const outType = file.type === 'image/png' ? 'image/png' : file.type;
  const dataUrl = canvas.toDataURL(outType, QUALITY);
  const size = dataUrlBytes(dataUrl);
  return size < file.size ? { filename: file.name, dataUrl, size } : fallback;
}
