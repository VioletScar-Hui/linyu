import { describe, expect, it } from 'vitest';
import { parseAiJson, aiEnabled, resolveAi, DEFAULT_AI_MODEL } from '../lib/ai';
import type { Settings } from '../lib/settings';

const base: Settings = { mpAccounts: [], snippets: [], enabledPlatforms: [] };

describe('parseAiJson', () => {
  it('解析纯 JSON', () => {
    expect(parseAiJson('{"a":1}')).toEqual({ a: 1 });
  });
  it('剥离 ```json 代码围栏', () => {
    expect(parseAiJson('```json\n{"tags":["x","y"]}\n```')).toEqual({ tags: ['x', 'y'] });
  });
  it('剥离无语言标记的围栏 + 首尾空白', () => {
    expect(parseAiJson('  ```\n{"ok":true}\n```  ')).toEqual({ ok: true });
  });
  it('夹在散文里时截取首尾大括号(兼容非结构化输出的服务商)', () => {
    expect(parseAiJson('好的,结果如下:{"tags":["a","b"]} 完毕')).toEqual({ tags: ['a', 'b'] });
  });
});

describe('aiEnabled', () => {
  it('无 key 时关闭', () => {
    expect(aiEnabled(base)).toBe(false);
    expect(aiEnabled({ ...base, aiApiKey: '   ' })).toBe(false);
  });
  it('有全局 key 时开启', () => {
    expect(aiEnabled({ ...base, aiApiKey: 'sk-ant-xxx' })).toBe(true);
  });
  it('功能有独立 key 即该功能开启,其它功能仍看全局', () => {
    const s = { ...base, aiFeatures: { review: { apiKey: 'sk-review' } } };
    expect(aiEnabled(s, 'review')).toBe(true);
    expect(aiEnabled(s, 'tags')).toBe(false);
  });
});

describe('resolveAi', () => {
  it('无功能覆盖时用全局 provider/key/model;Claude baseURL 为空(走 SDK 默认)', () => {
    const s = { ...base, aiApiKey: 'g', aiModel: 'claude-sonnet-4-6' };
    expect(resolveAi(s)).toEqual({ provider: 'anthropic', baseURL: '', apiKey: 'g', model: 'claude-sonnet-4-6' });
  });
  it('全局切到 DeepSeek 时 baseURL/模型取该家默认', () => {
    expect(resolveAi({ ...base, aiProvider: 'deepseek', aiApiKey: 'dk' }))
      .toEqual({ provider: 'deepseek', baseURL: 'https://api.deepseek.com/v1', apiKey: 'dk', model: 'deepseek-v4-flash' });
  });
  it('全局自填 API 地址(代理)覆盖默认端点', () => {
    expect(resolveAi({ ...base, aiProvider: 'deepseek', aiBaseURL: 'https://proxy.me/v1', aiApiKey: 'dk' }))
      .toEqual({ provider: 'deepseek', baseURL: 'https://proxy.me/v1', apiKey: 'dk', model: 'deepseek-v4-flash' });
  });
  it('自定义服务商用用户填的 API 地址与模型', () => {
    expect(resolveAi({ ...base, aiProvider: 'custom', aiBaseURL: 'https://my.gw/v1', aiApiKey: 'k', aiModel: 'gpt-4o' }))
      .toEqual({ provider: 'custom', baseURL: 'https://my.gw/v1', apiKey: 'k', model: 'gpt-4o' });
  });
  it('功能级独立 服务商+地址+key+model 优先', () => {
    const s = { ...base, aiApiKey: 'g', aiFeatures: { tags: { provider: 'moonshot', apiKey: 'mk', model: 'moonshot-v1-8k' } } };
    expect(resolveAi(s, 'tags')).toEqual({ provider: 'moonshot', baseURL: 'https://api.moonshot.cn/v1', apiKey: 'mk', model: 'moonshot-v1-8k' });
  });
  it('功能只覆盖 model 时 provider/baseURL/key 回退全局', () => {
    const s = { ...base, aiApiKey: 'g', aiFeatures: { tags: { model: 'claude-haiku-4-5' } } };
    expect(resolveAi(s, 'tags')).toEqual({ provider: 'anthropic', baseURL: '', apiKey: 'g', model: 'claude-haiku-4-5' });
  });
  it('功能有 key 但未填模型时取该家默认', () => {
    const s = { ...base, aiFeatures: { review: { provider: 'deepseek', apiKey: 'dk' } } };
    expect(resolveAi(s, 'review')).toEqual({ provider: 'deepseek', baseURL: 'https://api.deepseek.com/v1', apiKey: 'dk', model: 'deepseek-v4-flash' });
  });
  it('全空时取默认 provider 与其默认模型', () => {
    expect(resolveAi(base)).toEqual({ provider: 'anthropic', baseURL: '', apiKey: '', model: DEFAULT_AI_MODEL });
  });
});

describe('默认模型', () => {
  it('是 opus 4.8', () => {
    expect(DEFAULT_AI_MODEL).toBe('claude-opus-4-8');
  });
});
