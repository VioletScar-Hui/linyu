# 适配器手动验收清单

> 每个适配器开发完成后逐项实测打勾。第一步永远是:登录平台,打开编辑器页,
> 用 DevTools 核对适配器 SELECTORS 中每个选择器能命中元素,不符则更新常量后重新构建。

## 知乎(zhuanlan.zhihu.com/write)

- [ ] 选择器核对:SELECTORS.title / SELECTORS.editor 均命中
- [ ] 未登录:点"去发布·知乎"跳到登录页,任务显示"等待填充";登录后进入写作页自动填充
- [ ] 标题:正确写入,无截断
- [ ] 正文:标题层级/加粗/列表/链接格式保留
- [ ] 图片:本地配图出现在正文且被知乎转存(刷新草稿后图片仍在)
- [ ] 分段粘贴:图片位置与原文一致,知乎不再报"图片导入失败"
- [ ] 失败兜底:故意改坏选择器构建,状态显示"失败:…",撰写页"复制富文本"可手动粘贴完成

## 微信公众号(mp.weixin.qq.com 图文编辑页)

- [x] 实测(2026-06):新版编辑器为 #ueditor_0(div.mock-iframe)内 ProseMirror;标题为 #js_title_main 内 ProseMirror;摘要 #js_description 为 TEXTAREA;编辑页无封面 file input
- [ ] 自动跳转:点"去发布·公众号"→后台首页自动跳进新建图文编辑器(无需手动点击)
- [ ] 标题与摘要:正确写入(摘要为正文前 120 字)
- [ ] 正文:分段粘贴,格式保留,本地图片走微信上传通道进素材库(保存草稿刷新后仍在)
- [ ] 封面:状态 note 提示"从正文选择"(正文图已就位);若微信后续提供封面 file input 可升级自动化
- [ ] 失败兜底:复制富文本可手动粘贴到编辑器

## 人人都是产品经理(woshipm.com 创作后台)

- [x] Step 1 实测完成:编辑器为 https://www.woshipm.com/writing (WordPress+TinyMCE),选择器已按实测更新
- [ ] 标题:正确写入
- [ ] 正文:格式保留,图片被平台转存(若平台粘贴时剥离图片,记录现象,图片改走手动)
- [ ] 未登录场景:任务保持"等待填充",登录进入编辑器后自动继续
- [ ] 失败兜底:复制富文本可手动粘贴

## 小红书(creator.xiaohongshu.com/publish)

- [x] 实测:页签切换/图文 input(accept=.jpg)/标题/tiptap 编辑器均已按真实页面核对
- [ ] 选择器核对:fileInput / title / editor 均命中;"上传图文"页签切换正常
- [ ] 前置检查:未填变体或无图时,状态给出明确失败原因
- [ ] 图片:多图全部上传成功,顺序与撰写页一致
- [ ] 标题/正文:变体文案正确写入,20/1000 字限内
- [ ] 失败兜底:复制富文本(纯文本部分)可手动粘贴


## B站专栏(member.bilibili.com/platform/upload/text/edit)

- [x] 实测(2026-06):编辑器在同源 iframe(src 含 read-editor)内;标题 textarea.title-input__inner,正文 .tiptap.ProseMirror,粘贴文本/图片成功、保存草稿成功
- [ ] 标题+正文:格式保留
- [ ] 图片:粘入后显示;发布前在编辑器内逐张确认是否需重传(B站不自动转存粘贴图)

## X(x.com/compose/post)

- [x] 实测(2026-06):compose 为 Draft.js([data-testid=tweetTextarea_0]),图片 input[data-testid=fileInput];文本+图片注入成功
- [ ] 推文变体≤280;配图出现在预览;补链接后发布

## Reddit(old.reddit.com/submit)

- [ ] 待实测:主站被工具拦截,适配器按 old.reddit 经典表单(textarea[name=title]/[name=text])编写,首次使用请 DevTools 核对选择器
- [ ] 标题+Markdown 正文写入;选 subreddit 后发布
