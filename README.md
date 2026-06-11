# 文章多平台分发助手

Chrome 插件(MV3):Markdown 文章 + 本地配图,半自动填充到微信公众号/知乎/人人都是产品经理/小红书,B站/X/Reddit 快捷跳转。设计文档见 docs/superpowers/specs/。

## 使用

1. `npm install && npm run build`,Chrome → chrome://extensions → 开发者模式 → 加载已解压的扩展程序 → 选 `.output/chrome-mv3`
2. 点插件图标 → "新建分发" → 粘贴 Markdown、拖入配图、选封面、(小红书)生成变体 → 保存
3. 逐平台点"去发布":插件打开编辑器并自动填充,人工检查后点平台的发布按钮
4. 填充失败时用"复制富文本"手动粘贴兜底

## 首次使用前:适配器实测

四个平台适配器的 DOM 选择器基于经验编写,**首次使用前请按
`docs/superpowers/checklists/adapter-acceptance.md` 逐项实测**;选择器不符时,
修改对应适配器 `lib/adapters/<平台>.ts` 顶部的 SELECTORS 常量后重新构建。

## 维护

- 平台改版导致填充失败:改对应适配器 `lib/adapters/<平台>.ts` 顶部的 SELECTORS 常量,重新构建
- 验收清单:docs/superpowers/checklists/adapter-acceptance.md

## 开发

- `npm run dev` 热重载开发;`npx vitest run` 单测
- V2 规划(X/Reddit 摘要短文、B站专栏适配器)见设计文档
