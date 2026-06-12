import { useState } from 'react';
import { T, btn, fmtSize } from '../../lib/ui';
import type { Task, TaskImage } from '../../lib/tasks';
import { ImageEditor } from './ImageEditor';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

/** 配图画廊:缩略图网格,每张可插入正文/编辑/设封面/删除;缺图与超限提示 */
export function ImageGallery({
  task, matchedSet, missing, onAddImages, onUpdateImage, onRemoveImage, onSetCover, onInsertImage,
}: {
  task: Task;
  matchedSet: Set<string>;
  missing: string[];
  onAddImages: (files: File[]) => void;
  onUpdateImage: (filename: string, updated: TaskImage) => void;
  onRemoveImage: (filename: string) => void;
  onSetCover: (filename: string | undefined) => void;
  onInsertImage?: (filename: string) => void;
}) {
  const [editing, setEditing] = useState<TaskImage | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  return (
    <div>
      <div
        style={{
          border: `1.5px dashed ${T.gold}99`, background: T.goldFaint + '66', borderRadius: T.radiusSm,
          padding: '18px 16px', textAlign: 'center', color: T.textSoft, fontSize: 13,
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); onAddImages(Array.from(e.dataTransfer.files)); }}
      >
        <div style={{ marginBottom: 8 }}>拖拽图片到此处</div>
        <label style={{ ...btn.ghost(), display: 'inline-block' }}>
          选择文件
          <input type="file" accept="image/*" multiple style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files) { const fs = Array.from(e.target.files); e.target.value = ''; onAddImages(fs); }
            }} />
        </label>
      </div>

      {task.images.length > 0 && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(116px, 1fr))', gap: 12, marginTop: 14,
        }}>
          {task.images.map((img) => {
            const isCover = task.coverFilename === img.filename;
            const used = matchedSet.has(img.filename);
            const tooBig = img.size > MAX_IMAGE_SIZE;
            return (
              <div key={img.filename}
                onMouseEnter={() => setHover(img.filename)} onMouseLeave={() => setHover(null)}
                style={{
                  position: 'relative', borderRadius: T.radiusSm, overflow: 'hidden',
                  border: `1px solid ${isCover ? T.gold : T.border}`, background: T.card,
                  boxShadow: isCover ? `0 0 0 2px ${T.gold}55` : 'none',
                }}>
                <div style={{ position: 'relative', aspectRatio: '1 / 1', background: T.paper }}>
                  <img src={img.dataUrl} alt={img.filename}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  {isCover && (
                    <span style={{
                      position: 'absolute', top: 6, left: 6, background: T.gold, color: T.ink,
                      fontSize: 10, fontWeight: 500, padding: '2px 7px', borderRadius: 20,
                    }}>封面</span>
                  )}
                  {hover === img.filename && (
                    <div style={{
                      position: 'absolute', inset: 0, background: 'rgba(10,18,22,.5)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}>
                      {onInsertImage && (
                        <button type="button" onClick={() => onInsertImage(img.filename)}
                          style={{ ...miniBtn, background: 'rgba(201,168,106,.9)', color: '#16242c', border: 'none' }}>
                          插入正文
                        </button>
                      )}
                      <button type="button" onClick={() => setEditing(img)} style={miniBtn}>编辑</button>
                      <button type="button" onClick={() => onSetCover(isCover ? undefined : img.filename)} style={miniBtn}>
                        {isCover ? '取消封面' : '设为封面'}
                      </button>
                      <button type="button" onClick={() => onRemoveImage(img.filename)}
                        style={{ ...miniBtn, color: '#ffd2c8' }}>删除</button>
                    </div>
                  )}
                </div>
                <div style={{ padding: '6px 8px' }}>
                  <div style={{ fontSize: 11, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {img.filename}
                  </div>
                  <div style={{ fontSize: 10, color: tooBig ? T.err : T.textFaint, marginTop: 2 }}>
                    {fmtSize(img.size)}{tooBig ? ' · 超 10MB' : ''}{!used ? ' · 未引用' : ''}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {missing.length > 0 && (
        <div style={{
          marginTop: 12, padding: '10px 12px', background: T.errBg, borderRadius: T.radiusSm,
          fontSize: 12, color: T.err,
        }}>
          缺图:正文引用了 {missing.join('、')},请拖入对应文件
        </div>
      )}

      {editing && (
        <ImageEditor image={editing} onClose={() => setEditing(null)}
          onApply={(updated) => { onUpdateImage(editing.filename, updated); setEditing(null); }} />
      )}
    </div>
  );
}

const miniBtn: React.CSSProperties = {
  background: 'rgba(255,255,255,.16)', color: '#fff', border: '1px solid rgba(255,255,255,.3)',
  borderRadius: 6, padding: '4px 14px', fontSize: 12, cursor: 'pointer', minWidth: 76,
};
