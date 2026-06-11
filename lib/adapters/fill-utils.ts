/** 轮询直到 get() 返回非空,默认 10s 超时(spec:单步超时 10 秒) */
export async function waitFor<T>(
  get: () => T | null | undefined | false,
  timeoutMs = 10_000,
  intervalMs = 200,
): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const v = get();
    if (v !== null && v !== undefined && v !== false) return v as T;
    if (Date.now() > deadline) throw new Error('等待页面元素超时');
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

export function dataUrlToFile(dataUrl: string, filename: string): File {
  const [meta, b64] = dataUrl.split(',');
  const mime = /data:([^;]+)/.exec(meta)?.[1] ?? 'application/octet-stream';
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new File([bytes], filename, { type: mime });
}

/** 用原型上的原生 setter 赋值并派发 input/change,绕过 React/Vue 受控组件拦截 */
export function setNativeValue(el: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  const proto = el instanceof HTMLTextAreaElement
    ? HTMLTextAreaElement.prototype
    : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

function dispatchPaste(target: HTMLElement, dt: DataTransfer): void {
  target.focus();
  target.dispatchEvent(
    new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }),
  );
}

/** 向富文本编辑器派发携带 HTML 的合成粘贴事件 */
export function pasteHtml(target: HTMLElement, html: string): void {
  const dt = new DataTransfer();
  dt.setData('text/html', html);
  dt.setData('text/plain', html.replace(/<[^>]+>/g, ''));
  dispatchPaste(target, dt);
}

/** 纯文本粘贴(小红书正文等) */
export function pasteText(target: HTMLElement, text: string): void {
  const dt = new DataTransfer();
  dt.setData('text/plain', text);
  dispatchPaste(target, dt);
}

/** 把文件塞进 <input type=file> 并触发 change,驱动平台自身上传逻辑 */
export function setInputFiles(input: HTMLInputElement, files: File[]): void {
  const dt = new DataTransfer();
  for (const f of files) dt.items.add(f);
  input.files = dt.files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

/** 按可见文本找元素(用于无稳定选择器的按钮/页签) */
export function findByText(selector: string, text: string): HTMLElement | null {
  return (
    Array.from(document.querySelectorAll<HTMLElement>(selector)).find((el) =>
      el.textContent?.includes(text),
    ) ?? null
  );
}
