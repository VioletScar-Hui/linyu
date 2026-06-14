/** 用 token 拼出公众号"新建图文"编辑器地址(token 为会话级,登录后台后地址栏可见)。
 *  纯函数,供 content script 跳转与 composer 指定账号直达共用。 */
export function buildWeixinEditorUrl(token: string): string {
  return 'https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit_v2&action=edit&isNew=1' +
    `&type=77&createType=0&token=${encodeURIComponent(token)}&lang=zh_CN&timestamp=${Date.now()}`;
}
