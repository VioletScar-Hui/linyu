import { useEffect, useMemo, useRef, useState } from 'react';
import { renderHtml } from '../../lib/markdown';
import { T } from '../../lib/ui';
import type { Task } from '../../lib/tasks';

/** 实时预览。传入 onMoveImage/onEditImage 后,点击预览内的本地图片会浮出
 *  "上移/下移/编辑"工具条,直接在预览侧调整图片位置或打开图片编辑器。 */
export function Preview({ task, onMoveImage, onEditImage }: {
  task: Task;
  onMoveImage?: (filename: string, dir: 'up' | 'down') => void;
  onEditImage?: (filename: string) => void;
}) {
  const html = useMemo(() => {
    const imageMap = Object.fromEntries(task.images.map((i) => [i.filename, i.dataUrl]));
    return renderHtml(task.markdown, imageMap);
  }, [task.markdown, task.images]);

  const boxRef = useRef<HTMLDivElement>(null);
  const [sel, setSel] = useState<{ filename: string; top: number } | null>(null);
  const interactive = !!(onMoveImage || onEditImage);

  // markdown 变化(如移动后)重新定位工具条并高亮选中图
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    box.querySelectorAll<HTMLImageElement>('img[data-ly-img]').forEach((im) => {
      im.style.outline = 'none';
      im.style.maxWidth = '100%';
      if (interactive) im.style.cursor = 'pointer';
    });
    if (!sel) return;
    const img = box.querySelector<HTMLImageElement>(`img[data-ly-img="${CSS.escape(sel.filename)}"]`);
    if (!img) { setSel(null); return; }
    img.style.outline = `2px solid ${T.gold}`;
    img.style.outlineOffset = '2px';
    const raf = requestAnimationFrame(() => {
      const top = img.getBoundingClientRect().top - box.getBoundingClientRect().top;
      setSel((s) => (s && Math.abs(s.top - top) > 1 ? { ...s, top } : s));
    });
    return () => cancelAnimationFrame(raf);
  }, [html, sel, interactive]);

  const onClick = (e: React.MouseEvent) => {
    if (!interactive) return;
    const el = e.target as HTMLElement;
    const filename = el.tagName === 'IMG' ? el.getAttribute('data-ly-img') : null;
    if (filename && boxRef.current) {
      const top = el.getBoundingClientRect().top - boxRef.current.getBoundingClientRect().top;
      setSel({ filename, top });
    } else {
      setSel(null);
    }
  };

  const toolBtn: React.CSSProperties = {
    background: T.ink, color: '#fff', border: 'none', borderRadius: 7, padding: '5px 11px',
    fontSize: 12, cursor: 'pointer', fontFamily: T.fontSans,
  };

  return (
    <div ref={boxRef} onClick={onClick} style={{ position: 'relative' }}>
      <div
        className="lingyu-preview"
        style={{
          padding: '4px 4px', minHeight: 200, color: T.text, fontSize: 15, lineHeight: 1.75,
          wordBreak: 'break-word',
        }}
        dangerouslySetInnerHTML={{ __html: html || '<p style="color:#93a0a6">正文预览将在此显示…</p>' }}
      />
      {sel && (
        <div style={{
          position: 'absolute', top: Math.max(4, sel.top - 4), right: 8, zIndex: 5,
          display: 'flex', gap: 6, background: 'rgba(22,36,44,.92)', padding: 6,
          borderRadius: 10, boxShadow: T.shadowHover, alignItems: 'center',
        }}>
          <span style={{ color: T.gold, fontSize: 11, padding: '0 4px', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {sel.filename}
          </span>
          {onMoveImage && (
            <>
              <button type="button" style={toolBtn} title="上移一块"
                onClick={(e) => { e.stopPropagation(); onMoveImage(sel.filename, 'up'); }}>↑ 上移</button>
              <button type="button" style={toolBtn} title="下移一块"
                onClick={(e) => { e.stopPropagation(); onMoveImage(sel.filename, 'down'); }}>↓ 下移</button>
            </>
          )}
          {onEditImage && (
            <button type="button" style={{ ...toolBtn, background: T.gold, color: T.ink }}
              onClick={(e) => { e.stopPropagation(); onEditImage(sel.filename); }}>编辑</button>
          )}
          <button type="button" style={{ ...toolBtn, background: 'transparent', color: 'rgba(255,255,255,.6)', padding: '5px 7px' }}
            aria-label="关闭" onClick={(e) => { e.stopPropagation(); setSel(null); }}>×</button>
        </div>
      )}
    </div>
  );
}
