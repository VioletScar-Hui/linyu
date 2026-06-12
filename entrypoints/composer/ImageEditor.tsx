import { useEffect, useRef, useState } from 'react';
import { T, btn, fmtSize } from '../../lib/ui';
import type { TaskImage } from '../../lib/tasks';

interface Crop { x: number; y: number; w: number; h: number } // 归一化 0..1,相对变换后图

function dataUrlBytes(dataUrl: string): number {
  const i = dataUrl.indexOf(',');
  return Math.floor(dataUrl.slice(i + 1).length * 0.75);
}

/** 图片编辑模态:旋转 / 翻转 / 裁剪 / 质量压缩,应用后写回同名 TaskImage(正文引用不受影响) */
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
  const [drag, setDrag] = useState<{ sx: number; sy: number } | null>(null);
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

  function pointer(e: React.MouseEvent) {
    const r = overlayRef.current!.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
      y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
    };
  }
  function onDown(e: React.MouseEvent) {
    const p = pointer(e);
    setDrag({ sx: p.x, sy: p.y });
    setCrop({ x: p.x, y: p.y, w: 0, h: 0 });
  }
  function onMove(e: React.MouseEvent) {
    if (!drag) return;
    const p = pointer(e);
    setCrop({
      x: Math.min(drag.sx, p.x), y: Math.min(drag.sy, p.y),
      w: Math.abs(p.x - drag.sx), h: Math.abs(p.y - drag.sy),
    });
  }
  function onUp() {
    if (drag && crop && (crop.w < 0.02 || crop.h < 0.02)) setCrop(null);
    setDrag(null);
  }

  const toolBtn = (active: boolean): React.CSSProperties => ({
    ...btn.ghost(),
    padding: '7px 12px', display: 'inline-flex', alignItems: 'center', gap: 6,
    borderColor: active ? T.gold : T.border, color: active ? T.goldDeep : T.text,
    background: active ? T.goldFaint : T.card,
  });

  const cropPct = crop
    ? { left: `${crop.x * 100}%`, top: `${crop.y * 100}%`, width: `${crop.w * 100}%`, height: `${crop.h * 100}%` }
    : null;

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
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            <button type="button" style={toolBtn(false)} onClick={() => setRotation((r) => (r + 270) % 360)}>↺ 左转</button>
            <button type="button" style={toolBtn(false)} onClick={() => setRotation((r) => (r + 90) % 360)}>↻ 右转</button>
            <button type="button" style={toolBtn(flipH)} onClick={() => setFlipH((f) => !f)}>⇄ 水平翻转</button>
            <button type="button" style={toolBtn(flipV)} onClick={() => setFlipV((f) => !f)}>⇅ 垂直翻转</button>
            {crop && (
              <button type="button" style={{ ...btn.ghost(), padding: '7px 12px', color: T.err, borderColor: `${T.err}66` }}
                onClick={() => setCrop(null)}>清除裁剪</button>
            )}
          </div>

          <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%', borderRadius: T.radiusSm, overflow: 'hidden', border: `1px solid ${T.border}` }}>
            <canvas ref={canvasRef} style={{ display: 'block', maxWidth: '100%' }} />
            <div
              ref={overlayRef}
              style={{ position: 'absolute', inset: 0, cursor: 'crosshair' }}
              onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
            >
              {cropPct && (
                <>
                  <div style={{ position: 'absolute', inset: 0, boxShadow: `0 0 0 9999px rgba(10,18,22,.45)`, ...cropPct, border: `1.5px solid ${T.gold}` }} />
                </>
              )}
            </div>
          </div>
          <div style={{ fontSize: 12, color: T.textFaint, marginTop: 8 }}>
            {crop ? '已选裁剪区域 · 在图上重新拖拽可调整' : '在图片上拖拽可框选裁剪区域'}
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
