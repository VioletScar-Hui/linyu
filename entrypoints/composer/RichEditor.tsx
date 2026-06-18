import { useEffect, useRef } from 'react';
import { Crepe } from '@milkdown/crepe';
import '@milkdown/crepe/theme/common/style.css';
import '@milkdown/crepe/theme/frame.css';
import { toEditorMd, fromEditorMd } from '../../lib/editor-md';
import type { TaskImage } from '../../lib/tasks';

/** 所见即所得 Markdown 编辑器(Milkdown Crepe)。底层仍以存储格式 markdown(filename 引用)对外通信:
 *  进编辑器把 filename 换 dataUrl 显示,出编辑器再换回 filename。 */
export function RichEditor({ value, images, onChange, onReady }: {
  value: string;
  images: TaskImage[];
  onChange: (markdown: string) => void;
  onReady?: (api: { replace: (md: string) => void }) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const crepeRef = useRef<Crepe | null>(null);
  const imagesRef = useRef(images);
  imagesRef.current = images;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  // 编辑器自身最后吐出的存储格式 markdown,用于区分"外部改动"与"自身改动",避免回灌循环
  const lastEmitted = useRef(value);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const crepe = new Crepe({ root, defaultValue: toEditorMd(value, imagesRef.current) });
    crepe.on((l) => {
      l.markdownUpdated((_ctx: unknown, md: string) => {
        const stored = fromEditorMd(md, imagesRef.current);
        lastEmitted.current = stored;
        onChangeRef.current(stored);
      });
    });
    void crepe.create().then(() => {
      crepeRef.current = crepe;
      onReady?.({
        replace: (md: string) => {
          lastEmitted.current = md;
          // Crepe 暴露底层 editor;用 replaceAll 命令整体替换文档
          crepe.editor.action((ctx) => {
            // 动态引入避免顶层依赖耦合
            import('@milkdown/kit/utils').then(({ replaceAll }) => replaceAll(toEditorMd(md, imagesRef.current))(ctx));
          });
        },
      });
    });
    return () => { void crepe.destroy(); crepeRef.current = null; };
    // 仅挂载一次;value 同步由外部经 onReady().replace 驱动
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={rootRef} className="lingyu-rich" />;
}
