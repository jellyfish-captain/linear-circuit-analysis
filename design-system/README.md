# 学习站设计系统 · design-system

一套 CSS + JS，四座教材站点共用。站点只声明自己的主色与根路径，其余全部从这里继承。

```html
<html lang="zh-CN" data-brand="circuit" data-root="../">
```

- `data-brand`：`micro` / `calculus` / `linear` / `circuit` / `hub`
- `data-root`：从当前页面到**工作区根目录**的相对路径（根目录页 `""`、一层子页 `../`、两层子页 `../../`）

---

## 文件

| 文件 | 作用 | 改它会怎样 |
|---|---|---|
| `tokens.css` | 颜色、字体、字号阶、间距、圆角、阴影、布局宽度、各站点主色、深色模式 | 四站同时变化 |
| `ui.css` | 基础排版、布局、顶栏、内容块（lead/推导/例题/要点/误区/应用）、公式、图、表格、卡片、互动控件、响应式、打印 | 四站同时变化 |
| `theme.js` | 在 CSS 之前同步读取主题，避免深色模式闪白 | 四站同时变化 |
| `sites.js` | 站点注册表：标题、副标题、图标、目录名、搜索索引脚本 | 顶栏与「全部站点」菜单 |
| `chrome.js` | 顶栏、站点切换、搜索面板、主题按钮、目录抽屉、阅读进度、锚点平滑滚动、滚动定位、灯箱、回到顶部、页脚站点导航 | 四站导航行为 |
| `math.js` | KaTeX 统一渲染：`data-tex` → `.eq` → `<sub>/<sup>` → `$...$` → 行内识别 | 四站公式 |
| `graph.js` | Obsidian 风格力导向知识关系图（拖动 / 悬停 / 点击跳转） | 有 `#graphCanvas` 的页面 |

站点自己的类名映射写在各自的 `assets/css/site.css`（适配层），**不要**在适配层里重复定义颜色和字号。

---

## 载入顺序

```html
<head>
  <script src="../design-system/theme.js"></script>   <!-- 必须在 CSS 之前 -->
  <link rel="stylesheet" href="../design-system/tokens.css">
  <link rel="stylesheet" href="../design-system/ui.css">
  <link rel="stylesheet" href="../assets/css/site.css">  <!-- 站点适配层 -->
</head>
<body>
  …
  <script src="…/katex.min.js"></script>
  <script src="../design-system/sites.js"></script>
  <script src="../design-system/chrome.js"></script>
  <script src="../design-system/math.js"></script>
  <script>
    (function () {
      function run() {
        if (window.RenderAllMath && window.katex) {
          window.RenderAllMath.render(document.querySelector('main') || document.body);
        }
      }
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
      else run();
    })();
  </script>
</body>
```

站内自建目录的页面（如线性代数），要**先建目录再挂 chrome**，否则滚动定位扫不到链接。

---

## 主色

只改 `tokens.css` 里对应站点的一组变量：

```css
html[data-brand="micro"]    { --brand: #3b46c9; --brand-ink: #2b34a6; --brand-soft: #e8eafb; --brand-line: #c3c8f2; }
html[data-brand="calculus"] { --brand: #a63d2f; … }
html[data-brand="linear"]   { --brand: #6b3fa0; … }
html[data-brand="circuit"]  { --brand: #0e766e; … }
html[data-brand="hub"]      { --brand: #b45309; … }
```

深色模式另有一组，写在 `html[data-theme="dark"][data-brand="…"]`。

---

## 内容块词汇

| 类名 | 用途 |
|---|---|
| `.lead` | 本节解决什么问题（衬线、左侧主色竖线） |
| `.concepts` | 核心概念清单 |
| `.deriv` > `.step` | 推导，一步一件事，`.deriv-end` 收尾 |
| `.example` > `.ex-head` / `.ex-body` | 完整例题 |
| `.memo` | 一句话记住 |
| `.pitfall` / `.note` | 易错点、边界条件 |
| `.app` | 现实应用 |
| `.keypoints` / `.keybox` | 可直接背的结论 |
| `.chapter-bridge` | 上游 / 本章 / 下游 |
| `.quiz` | 自测 |
| `.fig` / `.figcard` / `.photo` | 图（可点开灯箱） |
| `.eq` / `.eqwrap` | 独立公式（`.eq-label` 放编号） |
| `.widget` / `.controls` / `.readout` | 互动：拖一个量，看结果 |
| `.graph-wrap` | 知识关系图容器 |
| `.ds-pagebar` | 面包屑 |

---

## 公式

**只用 MathML 输出。** `katex.render(..., { output: 'mathml' })` 不需要 `katex.min.css`，也不需要那 60 个字体文件，离线更轻，深色模式自动继承正文颜色。

`math.js` 的判定顺序：

1. `[data-tex]` 显式 TeX，`div/.eq` 走 display；
2. `.eq`、`.formula-card p` 用 `toTex()` 把文字转 TeX（分式上下堆叠、根号覆盖被开方数、Unicode 上下标转 `_{}`/`^{}`）；
3. `<sub>/<sup>` 与前一个变量合并；
4. `$...$` / `$$...$$` 之间的内容当**现成 TeX** 直接渲染，失败才退回猜测；
5. 剩下的正文按中文切分，只有 `isMathy()` 认可的片段才渲染——单字母变量、带单位的数字、含运算符/希腊字母/上下标的片段；英文单词、路径、URL 一律跳过。

失败一律保留原文，不出现红色报错。

---

## 新增一个站点

1. 在 `sites.js` 加一条（图标、标题、目录名、`searchScript`）；
2. 在 `tokens.css` 加一组 `[data-brand="…"]` 主色；
3. 页面按上面的顺序接四个文件，`<html>` 上写 `data-brand` 与 `data-root`；
4. 写一个只做类名映射的 `assets/css/site.css`；
5. 需要关系图就加 `<canvas id="graphCanvas">` 并定义 `window.SITE_MAP = { nodes, edges, groups }`。
