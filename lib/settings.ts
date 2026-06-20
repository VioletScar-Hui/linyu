import { browser } from 'wxt/browser';
import { DEFAULT_ENABLED, type PlatformId } from './platforms';

/** 公众号账号:备注名 + 会话级 token(登录后台后从地址栏 token= 复制) */
export interface MpAccount {
  id: string;
  name: string;
  token: string;
}

/** 常用片段:开头/结尾/关注引导等,一键插入正文光标处 */
export interface Snippet {
  id: string;
  name: string;
  content: string;
}

/** 四个 AI 功能的标识,用于功能级 Key/模型覆盖 */
export type AiFeatureId = 'variant' | 'titles' | 'tags' | 'review';

/** 单个功能的覆盖配置;字段留空则回退全局默认 */
export interface AiFeatureConfig {
  provider?: string;
  baseURL?: string;
  apiKey?: string;
  model?: string;
}

export interface Settings {
  mpAccounts: MpAccount[];
  snippets: Snippet[];
  /** 用户启用显示的平台;未设置时用 DEFAULT_ENABLED(有适配器的 7 个) */
  enabledPlatforms: PlatformId[];
  /** AI 全局默认服务商 id;留空用 anthropic */
  aiProvider?: string;
  /** AI 全局默认 API 地址(baseURL),覆盖所选服务商的默认端点;留空用服务商默认 */
  aiBaseURL?: string;
  /** AI 全局默认 Key(BYOK,仅存本地);各功能未单独设置时用它 */
  aiApiKey?: string;
  /** AI 全局默认模型 id;留空用所选服务商的默认模型 */
  aiModel?: string;
  /** 各 AI 功能的独立 Key/模型覆盖;留空回退全局默认 */
  aiFeatures?: Partial<Record<AiFeatureId, AiFeatureConfig>>;
}

const KEY = 'settings';

export async function getSettings(): Promise<Settings> {
  const got = await browser.storage.local.get(KEY);
  const s = got[KEY] as Partial<Settings> | undefined;
  return {
    mpAccounts: s?.mpAccounts ?? [],
    snippets: s?.snippets ?? [],
    enabledPlatforms: s?.enabledPlatforms ?? DEFAULT_ENABLED,
    aiProvider: s?.aiProvider ?? '',
    aiBaseURL: s?.aiBaseURL ?? '',
    aiApiKey: s?.aiApiKey ?? '',
    aiModel: s?.aiModel ?? '',
    aiFeatures: s?.aiFeatures ?? {},
  };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await browser.storage.local.set({ [KEY]: settings });
}

export function newMpAccount(name = ''): MpAccount {
  return { id: crypto.randomUUID(), name, token: '' };
}

export function newSnippet(name = ''): Snippet {
  return { id: crypto.randomUUID(), name, content: '' };
}
