# 灵羽 · 多平台分发

一处撰写,羽传多平台。Chrome 插件(MV3):Markdown 文章 + 本地配图,半自动填充到
微信公众号 / 知乎 / 人人都是产品经理 / 小红书 / B站专栏 / X / Reddit。内容由你最终确认发布,
不调用平台私有接口,风控风险最低。设计文档见 `docs/superpowers/specs/`。

## 功能

- **七平台半自动填充**:打开各平台编辑器,自动填好标题、正文与配图,你检查后一键发布;支持勾选多个平台**一键批量发起**
- **草稿自动保存**:停止编辑 1.5 秒自动落库,意外关闭不丢工作
- **剪贴板贴图**:截图后在正文里 Ctrl+V 直接入库并插到光标处
- **插件内图片编辑**:缩略图悬停即可裁剪 / 旋转 / 翻转 / 调质量压缩,改完同名替换,正文引用不受影响
- **平台文案变体**:为小红书 / X / Reddit 生成专属短文案(字数上限校验),长文平台直接用正文
- **公众号自动跳转**:点"去发布·公众号"后,后台首页自动跳进新建图文编辑器再填充
- **预览即编辑**:右侧预览点击图片可上移/下移调整位置或打开图片编辑器;图库与全屏底部图片条均可"插入正文"(插到光标处,自动成独立段落);支持全屏分屏编辑(左 Markdown 右预览,Esc 退出)
- **历史与兜底**:保留最近 20 篇分发任务(含各平台状态);任何失败都可用"复制富文本"手动粘贴

## 使用

1. `npm install && npm run build`,Chrome → chrome://extensions → 开发者模式 → 加载已解压的扩展程序 → 选 `.output/chrome-mv3`
2. 点插件图标 → "新建分发" → 粘贴 Markdown、拖入配图(可点缩略图编辑)、选封面、按需生成平台变体 → 保存
3. 逐平台点"去发布":插件打开编辑器并自动填充,人工检查后点平台自身的发布按钮
4. 填充失败时用"复制富文本"手动粘贴兜底

## 首次使用前:适配器实测

适配器 DOM 选择器随平台改版会失效。公众号 / 知乎 / 小红书 / 人人都是产品经理 / B站 / X 已实测,
**Reddit 待实测**。首次使用请按 `docs/superpowers/checklists/adapter-acceptance.md` 逐项核对;
选择器不符时改对应 `lib/adapters/<平台>.ts` 顶部的 SELECTORS 常量后重新构建。

## 开发

- `npm run dev` 热重载开发;`npx vitest run` 单测;`npm run icons` 重新生成应用图标
- **撰写台可视化预览**(免加载扩展):
  `npx esbuild preview/main.tsx --bundle --outfile=preview/out.js --jsx=automatic --alias:wxt/browser=./preview/browser-stub.ts`
  → `node preview/server.mjs` → 浏览器开 http://localhost:5199
  (用 stub 的扩展 API + demo 数据渲染真实组件,用于快速校验 UI)

## 设计

灵羽视觉系统集中在 `lib/ui.tsx`:墨青(顶栏)/ 鎏金(点缀)/ 宣纸(基底)配色、羽毛标识、
卡片化分区与状态 pill。平台品牌色见同文件 `PLATFORM_COLORS`。
