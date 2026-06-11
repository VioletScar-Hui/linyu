export type PlatformId =
  | 'weixin' | 'zhihu' | 'woshipm' | 'xiaohongshu'
  | 'bilibili' | 'x' | 'reddit';

export interface Platform {
  id: PlatformId;
  name: string;
  /** 快捷跳转目标(发布页/创作后台) */
  publishUrl: string;
  /** V1 是否有自动填充适配器 */
  supportsFill: boolean;
}

export const PLATFORMS: readonly Platform[] = [
  { id: 'weixin', name: '微信公众号', publishUrl: 'https://mp.weixin.qq.com/', supportsFill: true },
  { id: 'zhihu', name: '知乎', publishUrl: 'https://zhuanlan.zhihu.com/write', supportsFill: true },
  { id: 'woshipm', name: '人人都是产品经理', publishUrl: 'https://www.woshipm.com/writing', supportsFill: true },
  { id: 'xiaohongshu', name: '小红书', publishUrl: 'https://creator.xiaohongshu.com/publish/publish', supportsFill: true },
  { id: 'bilibili', name: 'B站专栏', publishUrl: 'https://member.bilibili.com/platform/upload/text/edit', supportsFill: true },
  { id: 'x', name: 'X', publishUrl: 'https://x.com/compose/post', supportsFill: true },
  { id: 'reddit', name: 'Reddit', publishUrl: 'https://old.reddit.com/submit?selftext=true', supportsFill: true },
];

export function getPlatform(id: PlatformId): Platform | undefined {
  return PLATFORMS.find((p) => p.id === id);
}
