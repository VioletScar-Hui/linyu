/** 同时写入 text/html 与 text/plain,粘贴到富文本编辑器时保留格式 */
export async function copyRichText(html: string, plain: string): Promise<void> {
  await navigator.clipboard.write([
    new ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
      'text/plain': new Blob([plain], { type: 'text/plain' }),
    }),
  ]);
}
