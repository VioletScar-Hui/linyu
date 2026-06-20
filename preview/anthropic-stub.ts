// 预览专用:真实 WXT 构建用浏览器版 SDK;预览不发真实 AI 请求,用空壳避免打包 node 内置依赖。
export default class Anthropic {
  constructor(_opts: unknown) { void _opts; }
  messages = {
    create: async () => { throw new Error('预览环境不发真实 AI 请求'); },
  };
}
