import Anthropic from '@anthropic-ai/sdk';
import { AI_PROVIDERS, DEFAULT_PROVIDER, getProvider, type AiProvider } from './ai-providers';
import type { Settings, AiFeatureId } from './settings';

export { AI_PROVIDERS };
export const DEFAULT_AI_MODEL = 'claude-opus-4-8';

/** 设置面板里展示的功能列表(名称) */
export const AI_FEATURES: { id: AiFeatureId; label: string }[] = [
  { id: 'variant', label: '平台变体生成' },
  { id: 'titles', label: 'AI 起标题 / 钩子' },
  { id: 'tags', label: '话题标签推荐' },
  { id: 'review', label: '语义体检' },
];

/** 解析某功能实际使用的服务商/API 地址/Key/模型:功能级有自己的 Key 时用功能配置,否则回退全局。 */
export function resolveAi(settings: Settings, feature?: AiFeatureId): { provider: string; baseURL: string; apiKey: string; model: string } {
  const fc = feature ? settings.aiFeatures?.[feature] : undefined;
  const own = !!fc?.apiKey?.trim(); // 功能填了自己的 Key 才用功能级服务商,避免把全局 Key 发给别家
  const provider = (own ? fc?.provider?.trim() : '') || settings.aiProvider?.trim() || DEFAULT_PROVIDER;
  const apiKey = (own ? fc!.apiKey! : settings.aiApiKey ?? '').trim();
  const p = getProvider(provider);
  const baseURL = fc?.baseURL?.trim() || (own ? '' : settings.aiBaseURL?.trim() || '') || p.baseURL;
  const model = fc?.model?.trim() || (own ? '' : settings.aiModel?.trim() || '') || p.defaultModel;
  return { provider, baseURL, apiKey, model };
}

/** 拉取某服务商可用模型 id(给设置面板下拉用)。OpenAI 兼容走 GET /models,Claude 走 SDK。 */
export async function listModels(provider: string, baseURL: string, apiKey: string): Promise<string[]> {
  if (!apiKey.trim()) throw new AiNotConfigured();
  const p = getProvider(provider);
  if (p.native) {
    const client = new Anthropic({ apiKey, baseURL: baseURL || undefined, dangerouslyAllowBrowser: true });
    const res = await client.models.list();
    return res.data.map((m) => m.id);
  }
  const url = baseURL || p.baseURL;
  if (!url) throw new Error('请先填写 API 地址');
  const resp = await fetch(`${url}/models`, { headers: { authorization: `Bearer ${apiKey}` } });
  if (!resp.ok) throw new Error(`拉取模型失败 ${resp.status}`);
  const data = (await resp.json()) as { data?: { id?: string }[] };
  return (data.data ?? []).map((m) => m.id ?? '').filter(Boolean);
}

/** 该功能是否可用(有功能级 Key 或全局 Key)。不传 feature 则只看全局。 */
export function aiEnabled(settings: Settings, feature?: AiFeatureId): boolean {
  return !!resolveAi(settings, feature).apiKey;
}

export class AiNotConfigured extends Error {
  constructor() {
    super('未配置 AI:请在「设置 → AI 助手」填入 API Key');
    this.name = 'AiNotConfigured';
  }
}

/** 结构化输出文本 → JSON;容错:剥代码围栏,失败时再截取首尾大括号之间的内容(抽出便于单测)。 */
export function parseAiJson<T>(text: string): T {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const s = cleaned.indexOf('{');
    const e = cleaned.lastIndexOf('}');
    if (s >= 0 && e > s) return JSON.parse(cleaned.slice(s, e + 1)) as T;
    throw new SyntaxError('AI 返回的不是有效 JSON');
  }
}

interface AiJsonOpts {
  feature?: AiFeatureId;
  system: string;
  prompt: string;
  /** Anthropic 原生结构化输出用的 JSON schema */
  schema: Record<string, unknown>;
  /** JSON 结构的文字描述,喂给 OpenAI 兼容服务商(它们不收 schema) */
  shape?: string;
  maxTokens?: number;
}

/** 通用结构化调用:按服务商分派。本地优先——仅在用户主动触发时把内容发往所选服务商。 */
export async function aiJson<T>(settings: Settings, opts: AiJsonOpts): Promise<T> {
  const { provider, baseURL, apiKey, model } = resolveAi(settings, opts.feature);
  if (!apiKey) throw new AiNotConfigured();
  const system = opts.shape ? `${opts.system}\n严格只输出 JSON,不要寒暄或代码围栏。结构:${opts.shape}` : opts.system;
  const p = getProvider(provider);
  return p.native
    ? anthropicJson<T>(apiKey, baseURL, model, system, opts)
    : openaiCompatJson<T>(p, baseURL, apiKey, model, system, opts);
}

async function anthropicJson<T>(apiKey: string, baseURL: string, model: string, system: string, opts: AiJsonOpts): Promise<T> {
  const client = new Anthropic({ apiKey, baseURL: baseURL || undefined, dangerouslyAllowBrowser: true });
  const resp = await client.messages.create({
    model,
    max_tokens: opts.maxTokens ?? 4000,
    system,
    messages: [{ role: 'user', content: opts.prompt }],
    output_config: { format: { type: 'json_schema', schema: opts.schema } },
  });
  const text = resp.content.map((b) => (b.type === 'text' ? b.text : '')).join('');
  return parseAiJson<T>(text);
}

async function openaiCompatJson<T>(p: AiProvider, baseURL: string, apiKey: string, model: string, system: string, opts: AiJsonOpts): Promise<T> {
  if (!baseURL) throw new Error(`请在设置里为 ${p.label} 填写 API 地址`);
  if (!model) throw new Error(`请在设置里为 ${p.label} 填写模型 id`);
  const resp = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      max_tokens: opts.maxTokens ?? 4000,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: opts.prompt },
      ],
    }),
  });
  if (!resp.ok) {
    const detail = await resp.text().catch(() => '');
    throw new Error(`${p.label} ${resp.status}:${detail.slice(0, 200)}`);
  }
  const data = (await resp.json()) as { choices?: { message?: { content?: string } }[] };
  return parseAiJson<T>(data.choices?.[0]?.message?.content ?? '');
}
