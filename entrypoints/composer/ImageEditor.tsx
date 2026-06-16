import { useEffect, useRef, useState } from 'react';
import { T, btn, fmtSize } from '../../lib/ui';
import type { TaskImage } from '../../lib/tasks';

interface Crop { x: number; y: number; w: number; h: number } // 归一化 0..1,相对变换后图

function dataUrlBytes(dataUrl: string): number {
  const i = dataUrl.indexOf(',');
  return Math.floor(dataUrl.slice(i + 1).length * 0.75);
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

const RATIOS: { label: string; value: number | null }[] = [
  { label: '自由', value: null },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '16:9', value: 16 / 9 },
  { label: '3:4', value: 3 / 4 },
  { label: '9:16', value: 9 / 16 },
];

/** 图片编辑模态:旋转 / 翻转 / 裁剪(比例预设+可拖拽调整) / 质量压缩,应用后写回同名 TaskImage */
export function ImageEditor({ image, onApply, onClose }: {
  image: TaskImage;
  onApply: (updated: TaskImage) => void;
  onClose: () => void;
}) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [rotation, setRotation] = useState(0); // 0/90/180/270
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [quality, setQuality] = useState(0.9);
  const [crop, setCrop] = useState<Crop | null>(null);
  const [aspect, setAspect] = useState<number | null>(null); // 像素宽高比;null=自由
  const [outSize, setOutSize] = useState(image.size);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const im = new Image();
    im.onload = () => setImg(im);
    im.src = image.dataUrl;
  }, [image.dataUrl]);

  const swap = rotation === 90 || rotation === 270;
  const baseW = img ? (swap ? img.height : img.width) : 0;
  const baseH = img ? (swap ? img.width : img.height) : 0;
  // 归一化空间里的目标宽高比(像素比例 ÷ 图片比例)
  const rNorm = aspect && baseW && baseH ? aspect / (baseW / baseH) : null;

  function paint(ctx: CanvasRenderingContext2D, source: HTMLImageElement, w: number, h: number) {
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    const dw = swap ? h : w;
    const dh = swap ? w : h;
    ctx.drawImage(source, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
  }

  // 预览渲染(限宽 460)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !img || baseW === 0) return;
    const maxW = 460;
    const scale = baseW > maxW ? maxW / baseW : 1;
    canvas.width = Math.round(baseW * scale);
    canvas.height = Math.round(baseH * scale);
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    paint(ctx, img, canvas.width, canvas.height);
  }, [img, rotation, flipH, flipV, baseW, baseH]); // eslint-disable-line react-hooks/exhaustive-deps

  function compose(): { dataUrl: string; size: number } {
    const full = document.createElement('canvas');
    full.width = baseW; full.height = baseH;
    paint(full.getContext('2d')!, img!, baseW, baseH);
    let out = full;
    if (crop) {
      const cw = Math.max(1, Math.round(crop.w * baseW));
      const ch = Math.max(1, Math.round(crop.h * baseH));
      const cc = document.createElement('canvas');
      cc.width = cw; cc.height = ch;
      cc.getContext('2d')!.drawImage(
        full, Math.round(crop.x * baseW), Math.round(crop.y * baseH), cw, ch, 0, 0, cw, ch,
      );
      out = cc;
    }
    const dataUrl = out.toDataURL('image/jpeg', quality);
    return { dataUrl, size: dataUrlBytes(dataUrl) };
  }

  // 实时估算输出大小(防抖)
  useEffect(() => {
    if (!img || baseW === 0) return;
    const id = setTimeout(() => setOutSize(compose().size), 220);
    return () => clearTimeout(id);
  }, [img, rotation, flipH, flipV, quality, crop, baseW, baseH]); // eslint-disable-line react-hooks/exhaustive-deps

  // 选择比例:生成一个居中的最大裁剪框(自由比例给 80% 居中框)
  function pickRatio(value: number | null) {
    setAspect(value);
    const rn = value && baseW && baseH ? value / (baseW / baseH) : null;
    let w = 0.8, h = 0.8;
    if (rn) {
      if (rn >= 1) { w = 0.9; h = 0.9 / rn; } else { h = 0.9; w = 0.9 * rn; }
    }
    setCrop({ x: (1 - w) / 2, y: (1 - h) / 2, w, h });
  }

  function pointerFromClient(cx: number, cy: number) {
    const r = overlayRef.current!.getBoundingClientRect();
    return { x: clamp01((cx - r.left) / r.width), y: clamp01((cy - r.top) / r.height) };
  }

  // 拖动裁剪框(移动整体或四角缩放),全程监听 document 避免快速拖出丢失
  function startDrag(mode: 'move' | 'nw' | 'ne' | 'sw' | 'se', e: React.MouseEvent) {
    if (!crop) return;
    e.preventDefault();
    e.stopPropagation();
    const start = crop;
    const p0 = pointerFromClient(e.clientX, e.clientY);
    const onMove = (ev: MouseEvent) => {
      const p = pointerFromClient(ev.clientX, ev.clientY);
      setCrop(applyDrag(mode, start, p.x - p0.x, p.y - p0.y, p, rNorm));
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  const handle = (mode: 'nw' | 'ne' | 'sw' | 'se', pos: React.CSSProperties): React.CSSProperties => ({
    position: 'absolute', width: 12, height: 12, background: '#fff', border: `2px solid ${T.gold}`,
    borderRadius: 2, ...pos,
  });

  const cropStyle: React.CSSProperties | null = crop
    ? { left: `${crop.x * 100}%`, top: `${crop.y * 100}%`, width: `${crop.w * 100}%`, height: `${crop.h * 100}%` }
    : null;

  const toolBtn = (active: boolean): React.CSSProperties => ({
    ...btn.ghost(), padding: '7px 12px', display: 'inline-flex', alignItems: 'center', gap: 6,
    borderColor: active ? T.gold : T.border, color: active ? T.goldDeep : T.text,
    background: active ? T.goldFaint : T.card,
  });

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(10,18,22,.55)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.fontSans,
    }} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: T.paper, borderRadius: T.radiusCard, boxShadow: T.shadowModal,
        width: 560, maxWidth: '94vw', maxHeight: '92vh', overflow: 'auto',
      }}>
        <div style={{
          background: T.ink, color: '#fff', padding: '14px 20px', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>编辑图片 · {image.filename}</span>
          <button type="button" aria-label="关闭" onClick={onClose} style={{
            background: 'transparent', border: 'none', color: 'rgba(255,255,255,.7)', fontSize: 20,
            cursor: 'pointer', lineHeight: 1,
          }}>×</button>
        </div>

        <div style={{ padding: 18 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            <button type="button" style={toolBtn(false)} onClick={() => setRotation((r) => (r + 270) % 360)}>↺ 左转</button>
            <button type="button" style={toolBtn(false)} onClick={() => setRotation((r) => (r + 90) % 360)}>↻ 右转</button>
            <button type="button" style={toolBtn(flipH)} onClick={() => setFlipH((f) => !f)}>⇄ 水平翻转</button>
            <button type="button" style={toolBtn(flipV)} onClick={() => setFlipV((f) => !f)}>⇅ 垂直翻转</button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 12, color: T.textSoft }}>裁剪比例</span>
            {RATIOS.map((r) => (
              <button key={r.label} type="button" style={{ ...toolBtn(crop != null && aspect === r.value), padding: '5px 12px', fontSize: 12 }}
                onClick={() => pickRatio(r.value)}>{r.label}</button>
            ))}
            {crop && (
              <button type="button" style={{ ...btn.ghost(), padding: '5px 12px', fontSize: 12, color: T.err, borderColor: `${T.err}66` }}
                onClick={() => { setCrop(null); setAspect(null); }}>清除裁剪</button>
            )}
          </div>

          <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%', borderRadius: T.radiusSm, overflow: 'hidden', border: `1px solid ${T.border}`, userSelect: 'none' }}>
            <canvas ref={canvasRef} style={{ display: 'block', maxWidth: '100%' }} />
            <div ref={overlayRef} style={{ position: 'absolute', inset: 0 }}>
              {cropStyle && (
                <>
                  <div style={{ position: 'absolute', inset: 0, boxShadow: '0 0 0 9999px rgba(10,18,22,.5)', pointerEvents: 'none', ...cropStyle, border: `1.5px solid ${T.gold}` }} />
                  <div onMouseDown={(e) => startDrag('move', e)}
                    style={{ position: 'absolute', cursor: 'move', ...cropStyle }}>
                    {/* 三分网格线 */}
                    <div style={{ position: 'absolute', left: '33.33%', top: 0, bottom: 0, borderLeft: '1px solid rgba(255,255,255,.4)' }} />
                    <div style={{ position: 'absolute', left: '66.66%', top: 0, bottom: 0, borderLeft: '1px solid rgba(255,255,255,.4)' }} />
                    <div style={{ position: 'absolute', top: '33.33%', left: 0, right: 0, borderTop: '1px solid rgba(255,255,255,.4)' }} />
                    <div style={{ position: 'absolute', top: '66.66%', left: 0, right: 0, borderTop: '1px solid rgba(255,255,255,.4)' }} />
                  </div>
                  <div onMouseDown={(e) => startDrag('nw', e)} style={handle('nw', { left: `${crop!.x * 100}%`, top: `${crop!.y * 100}%`, transform: 'translate(-50%,-50%)', cursor: 'nwse-resize' })} />
                  <div onMouseDown={(e) => startDrag('ne', e)} style={handle('ne', { left: `${(crop!.x + crop!.w) * 100}%`, top: `${crop!.y * 100}%`, transform: 'translate(-50%,-50%)', cursor: 'nesw-resize' })} />
                  <div onMouseDown={(e) => startDrag('sw', e)} style={handle('sw', { left: `${crop!.x * 100}%`, top: `${(crop!.y + crop!.h) * 100}%`, transform: 'translate(-50%,-50%)', cursor: 'nesw-resize' })} />
                  <div onMouseDown={(e) => startDrag('se', e)} style={handle('se', { left: `${(crop!.x + crop!.w) * 100}%`, top: `${(crop!.y + crop!.h) * 100}%`, transform: 'translate(-50%,-50%)', cursor: 'nwse-resize' })} />
                </>
              )}
            </div>
          </div>
          <div style={{ fontSize: 12, color: T.textFaint, marginTop: 8 }}>
            {crop ? '拖动框体移动 · 拖四角缩放 · 选比例锁定宽高比' : '选择上方比例开始裁剪'}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
            <span style={{ fontSize: 13, color: T.textSoft, whiteSpace: 'nowrap' }}>导出质量</span>
            <input type="range" min={0.4} max={1} step={0.05} value={quality}
              onChange={(e) => setQuality(Number(e.target.value))} style={{ flex: 1 }} />
            <span style={{ fontSize: 13, color: T.text, width: 42, textAlign: 'right' }}>{Math.round(quality * 100)}%</span>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18,
            paddingTop: 16, borderTop: `1px solid ${T.border}`,
          }}>
            <span style={{ fontSize: 12, color: T.textSoft }}>
              原 {fmtSize(image.size)} → 约 <strong style={{ color: outSize <= image.size ? T.ok : T.warn }}>{fmtSize(outSize)}</strong>
            </span>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" style={btn.ghost()} onClick={onClose}>取消</button>
              <button type="button" style={btn.gold()} onClick={() => {
                const { dataUrl, size } = compose();
                onApply({ filename: image.filename, dataUrl, size });
              }}>应用</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** 根据拖动模式计算新裁剪框(归一化)。rNorm 非空时四角缩放锁定宽高比。 */
function applyDrag(
  mode: 'move' | 'nw' | 'ne' | 'sw' | 'se',
  start: Crop, dx: number, dy: number, p: { x: number; y: number }, rNorm: number | null,
): Crop {
  const MIN = 0.05;
  if (mode === 'move') {
    return {
      ...start,
      x: Math.min(Math.max(0, start.x + dx), 1 - start.w),
      y: Math.min(Math.max(0, start.y + dy), 1 - start.h),
    };
  }
  // 缩放:固定对角,被拖角跟随指针
  const right = start.x + start.w;
  const bottom = start.y + start.h;
  let x = start.x, y = start.y;
  let w: number, h: number;
  if (mode === 'se') {
    w = clamp01(p.x) - start.x; h = rNorm ? w / rNorm : clamp01(p.y) - start.y;
  } else if (mode === 'nw') {
    w = right - clamp01(p.x); h = rNorm ? w / rNorm : bottom - clamp01(p.y);
    x = right - w; y = bottom - h;
  } else if (mode === 'ne') {
    w = clamp01(p.x) - start.x; h = rNorm ? w / rNorm : bottom - clamp01(p.y);
    y = bottom - h;
  } else { // sw
    w = right - clamp01(p.x); h = rNorm ? w / rNorm : clamp01(p.y) - start.y;
    x = right - w;
  }
  // 兜底:宽高不小于 MIN,框不出界
  w = Math.max(MIN, w); h = Math.max(MIN, h);
  x = Math.min(Math.max(0, x), 1 - MIN); y = Math.min(Math.max(0, y), 1 - MIN);
  if (x + w > 1) w = 1 - x;
  if (y + h > 1) h = 1 - y;
  return { x, y, w, h };
}
