export type PlatformId =
  | 'weixin' | 'zhihu' | 'woshipm' | 'xiaohongshu'
  | 'bilibili' | 'x' | 'reddit'
  // 仅快捷跳转(暂无自动填充适配器)
  | 'weibo' | 'jianshu' | 'juejin' | 'csdn' | 'toutiao' | 'douban' | 'medium';

export interface Platform {
  id: PlatformId;
  name: string;
  /** 快捷跳转目标(发布页/创作后台) */
  publishUrl: string;
  /** 是否有自动填充适配器(false 则仅快捷跳转) */
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
  // —— 以下仅快捷跳转,适配器后续按需实测补齐 ——
  { id: 'weibo', name: '微博头条文章', publishUrl: 'https://card.weibo.com/article/v3/editor', supportsFill: false },
  { id: 'jianshu', name: '简书', publishUrl: 'https://www.jianshu.com/writer', supportsFill: false },
  { id: 'juejin', name: '掘金', publishUrl: 'https://juejin.cn/editor/drafts/new', supportsFill: false },
  { id: 'csdn', name: 'CSDN', publishUrl: 'https://editor.csdn.net/md/', supportsFill: false },
  { id: 'toutiao', name: '今日头条', publishUrl: 'https://mp.toutiao.com/profile_v4/graphic/publish', supportsFill: false },
  { id: 'douban', name: '豆瓣', publishUrl: 'https://www.douban.com/note/create', supportsFill: false },
  { id: 'medium', name: 'Medium', publishUrl: 'https://medium.com/new-story', supportsFill: false },
];

export function getPlatform(id: PlatformId): Platform | undefined {
  return PLATFORMS.find((p) => p.id === id);
}

/** 默认启用的平台(未在设置中自定义时):有自动填充适配器的那批 */
export const DEFAULT_ENABLED: PlatformId[] = PLATFORMS.filter((p) => p.supportsFill).map((p) => p.id);
