/** AI 服务商注册表。Claude 走原生 Anthropic SDK(native);其余讲 OpenAI 兼容协议。
 *  baseURL 可在设置里被覆盖(代理/区域域名);"自定义"服务商完全由用户填 baseURL。
 *  各家 baseURL/模型 id 以其最新官方文档为准。 */
export interface AiProvider {
  id: string;
  label: string;
  /** true=用原生 Anthropic SDK;false/缺省=OpenAI 兼容 /chat/completions */
  native?: boolean;
  /** OpenAI 兼容服务商默认接口前缀(不含 /chat/completions);可被设置里的 API 地址覆盖 */
  baseURL: string;
  defaultModel: string;
  /** 模型下拉候选(用户仍可自行输入或在线拉取补充) */
  models: string[];
  /** 模型输入框占位提示 */
  modelHint: string;
  keyHint: string;
}

// 模型 id 变化很快(各家常下线/新增),下列为撰写时核对的当前可调用模型;
// 真正权威的是设置里的「拉取模型」按钮(实时 GET /models),下拉只作便捷候选。
export const AI_PROVIDERS: AiProvider[] = [
  { id: 'anthropic', label: 'Claude(官方)', native: true, baseURL: '',
    defaultModel: 'claude-opus-4-8', keyHint: 'sk-ant-…',
    models: ['claude-opus-4-8', 'claude-opus-4-7', 'claude-sonnet-4-6', 'claude-haiku-4-5', 'claude-fable-5'],
    modelHint: 'claude-opus-4-8 / claude-sonnet-4-6 / claude-haiku-4-5' },
  { id: 'moonshot', label: 'Kimi(Moonshot)', baseURL: 'https://api.moonshot.cn/v1',
    defaultModel: 'kimi-k2.6', keyHint: 'sk-…',
    models: ['kimi-k2.6', 'kimi-k2.5', 'kimi-k2.7-code', 'moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
    modelHint: 'kimi-k2.6 / moonshot-v1-8k' },
  { id: 'deepseek', label: 'DeepSeek', baseURL: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-v4-flash', keyHint: 'sk-…',
    models: ['deepseek-v4-flash', 'deepseek-v4-pro', 'deepseek-chat', 'deepseek-reasoner'],
    modelHint: 'deepseek-v4-flash / deepseek-v4-pro' },
  { id: 'glm', label: '智谱 GLM', baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    defaultModel: 'glm-4.6', keyHint: 'xxx.yyy',
    models: ['glm-5.1', 'glm-4.7', 'glm-4.6', 'glm-4.5-air', 'glm-4.5-flash', 'glm-4-flash-250414'],
    modelHint: 'glm-4.6 / glm-5.1 / glm-4.5-flash' },
  { id: 'minimax', label: 'MiniMax', baseURL: 'https://api.minimaxi.com/v1',
    defaultModel: 'MiniMax-M2.5', keyHint: 'eyJ…',
    models: ['MiniMax-M2.5', 'MiniMax-M2.7', 'MiniMax-M2.1', 'MiniMax-M2', 'MiniMax-M3'],
    modelHint: 'MiniMax-M2.5 / MiniMax-M2' },
  { id: 'openrouter', label: 'OpenRouter(聚合)', baseURL: 'https://openrouter.ai/api/v1',
    defaultModel: '', keyHint: 'sk-or-…',
    models: ['anthropic/claude-opus-4-8', 'deepseek/deepseek-chat', 'openai/gpt-4o', 'moonshotai/kimi-k2.6', 'google/gemini-2.5-pro'],
    modelHint: 'provider/model,如 anthropic/claude-opus-4-8' },
  { id: 'aihubmix', label: 'AiHubMix(聚合)', baseURL: 'https://aihubmix.com/v1',
    defaultModel: '', keyHint: 'sk-…',
    models: ['claude-opus-4-8', 'gpt-4o', 'deepseek-v4-flash', 'gemini-2.5-pro', 'kimi-k2.6'],
    modelHint: 'claude-opus-4-8、gpt-4o 等' },
  { id: 'custom', label: '自定义(OpenAI 兼容)', baseURL: '',
    defaultModel: '', keyHint: 'API Key', models: [],
    modelHint: '填你的网关模型 id' },
];

export const DEFAULT_PROVIDER = 'anthropic';

export function getProvider(id?: string): AiProvider {
  return AI_PROVIDERS.find((p) => p.id === id) ?? AI_PROVIDERS[0];
}
