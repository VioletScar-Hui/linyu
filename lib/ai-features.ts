import { aiJson } from './ai';
import { stripMarkdown } from './xhs';
import type { Settings } from './settings';

export type VariantPlatform = 'xiaohongshu' | 'x' | 'reddit';

export interface AiVariant { title: string; body: string; tags: string[] }
export interface AiTitleOption { angle: string; title: string; hook: string }
export interface AiFinding { severity: 'high' | 'medium' | 'low'; platform: string; message: string }

// 正文过长时截断喂给模型,省 token(保留足够判断调性/主题的量)
function clip(markdown: string, max = 4000): string {
  const plain = stripMarkdown(markdown);
  return plain.length > max ? plain.slice(0, max) + '…' : plain;
}

const PLATFORM_BRIEF: Record<VariantPlatform, string> = {
  xiaohongshu:
    '小红书:口语化、有情绪和钩子;标题 ≤20 字、可带 emoji;正文 ≤1000 字、分段短、可用 emoji;tags 为话题标签(带 #,如 #效率工具,8 个左右)。',
  x:
    'X(推特):一条推文,纯文本 ≤280 字符,无标题(title 留空字符串);可拆成有节奏的短句;tags 为 hashtag(带 #,3 个左右)。',
  reddit:
    'Reddit:标题 ≤300 字符、客观不标题党;正文用原生 Markdown、信息密度高、先给价值后给观点;tags 为推荐的 subreddit(带 r/,3 个左右)。',
};

/** 平台短文案变体:按平台调性把长文改写成标题+正文+标签。 */
export function aiGenerateVariant(
  settings: Settings, platform: VariantPlatform, articleTitle: string, markdown: string,
): Promise<AiVariant> {
  return aiJson<AiVariant>(settings, {
    feature: 'variant',
    shape: '{"title":string,"body":string,"tags":string[]}',
    system: `你是资深多平台内容运营,擅长把一篇长文改写成各平台原生调性的短文案。只输出 JSON。${PLATFORM_BRIEF[platform]}`,
    prompt: `原文标题:${articleTitle}\n\n原文正文:\n${clip(markdown)}\n\n请为「${platform}」生成一版地道的短文案变体。`,
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        title: { type: 'string' },
        body: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
      },
      required: ['title', 'body', 'tags'],
    },
  });
}

/** 多平台标题/钩子:一篇文生成多个不同角度的候选标题与开头钩子。 */
export function aiGenerateTitles(
  settings: Settings, articleTitle: string, markdown: string,
): Promise<{ options: AiTitleOption[] }> {
  return aiJson<{ options: AiTitleOption[] }>(settings, {
    feature: 'titles',
    shape: '{"options":[{"angle":string,"title":string,"hook":string}]}',
    system:
      '你是擅长起标题的内容编辑。给出 5 个不同角度的候选,角度可包括:直白概括、悬念好奇、数字清单、痛点共鸣、利益承诺。'
      + '每个候选含 angle(角度名)、title(≤30 字)、hook(一句可作开头的钩子)。标题真实不标题党、不浮夸。只输出 JSON。',
    prompt: `当前标题:${articleTitle || '(空)'}\n\n正文:\n${clip(markdown)}\n\n请给出 5 个候选标题与钩子。`,
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        options: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              angle: { type: 'string' },
              title: { type: 'string' },
              hook: { type: 'string' },
            },
            required: ['angle', 'title', 'hook'],
          },
        },
      },
      required: ['options'],
    },
  });
}

/** 标签/话题推荐:按平台给出可直接用的话题词/标签。 */
export function aiRecommendTags(
  settings: Settings, platform: VariantPlatform, articleTitle: string, markdown: string,
): Promise<{ tags: string[] }> {
  return aiJson<{ tags: string[] }>(settings, {
    feature: 'tags',
    shape: '{"tags":string[]}',
    system: `你为内容推荐平台原生的话题标签。${PLATFORM_BRIEF[platform]} 给出 8~12 个,贴合内容、有流量潜力、不堆砌。只输出 JSON。`,
    prompt: `标题:${articleTitle}\n\n正文:\n${clip(markdown, 2500)}\n\n请为「${platform}」推荐话题标签。`,
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: { tags: { type: 'array', items: { type: 'string' } } },
      required: ['tags'],
    },
  });
}

/** 语义版发布前体检:用 AI 查敏感词/平台禁忌/过度营销/标题党/调性不匹配。 */
export function aiSemanticPreflight(
  settings: Settings, articleTitle: string, markdown: string, platforms: string[],
): Promise<{ findings: AiFinding[] }> {
  return aiJson<{ findings: AiFinding[] }>(settings, {
    feature: 'review',
    shape: '{"findings":[{"severity":"high|medium|low","platform":string,"message":string}]}',
    system:
      '你是熟悉中国主流内容平台规则的合规与调性审查助手。检查:违禁/敏感词、平台禁忌(如小红书忌硬广导流、知乎忌口水)、'
      + '过度营销、标题党、夸大承诺、与目标平台调性不匹配之处。每条 finding 含 severity(high/medium/low)、platform(适用平台或"通用")、message(问题+改法,一句话)。'
      + '没有问题就返回空数组。只输出 JSON,不要寒暄。',
    prompt: `目标平台:${platforms.join('、') || '通用'}\n\n标题:${articleTitle}\n\n正文:\n${clip(markdown)}\n\n请逐条列出需要注意的问题。`,
    maxTokens: 2500,
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        findings: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              severity: { type: 'string', enum: ['high', 'medium', 'low'] },
              platform: { type: 'string' },
              message: { type: 'string' },
            },
            required: ['severity', 'platform', 'message'],
          },
        },
      },
      required: ['findings'],
    },
  });
}
