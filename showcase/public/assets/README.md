# 立绘 / 图片资源放这里

把吉祥物立绘 PNG（建议透明背景）放进这个文件夹，例如：

```
public/assets/linyu-point.png     # 指向旁边（Hero / 卡片用）
public/assets/linyu-think.png     # 思考（Problem 区用）
public/assets/linyu-stand.png     # 站立（Local-first 区用）
```

然后在页面里给 `<Mascot />` 传 `src` 即可替换占位图：

```astro
<Mascot src="/assets/linyu-point.png" size={240} />
```

`public/` 下的文件部署后通过根路径访问（`/assets/xxx.png`）。
未传 `src` 时组件会渲染一个同色系的占位 chibi，不影响先上线。
