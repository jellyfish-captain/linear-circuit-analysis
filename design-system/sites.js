/* ==========================================================================
   学习站设计系统 · 站点注册表
   --------------------------------------------------------------------------
   chrome.js 用它渲染「站点切换」菜单，也用它算跨站链接。
   新增站点只需要在这里加一条。
   ========================================================================== */
window.DS_SITES = {
  hub: {
    glyph: '◇',
    title: '学习站总览',
    sub: '五座教材可视化站点',
    dir: '',
    desc: '五座站点的一致性说明、关系图与索引'
  },
  micro: {
    glyph: 'μ',
    title: '微电子电路设计',
    sub: 'Jaeger & Blalock · 5e',
    dir: 'mirosoft-site',
    desc: '18 章固态电子学与集成电路 · 720 幅插图 · SPICE 实验室',
    total: 18,
    searchScript: 'mirosoft-site/assets/data/search.js'
  },
  calculus: {
    glyph: '∫',
    title: '微积分知识点图谱',
    sub: 'MIT 18.006 ＋ 公式带背',
    dir: 'Caculus-site',
    desc: '7 个 Block · 49 个单元 · 272 个知识点 · 217 幅配图',
    total: 0,
    ring: true
  },
  linear: {
    glyph: 'A',
    title: '线性代数图解',
    sub: 'Strang · ZoomNotes',
    dir: 'Linear-site',
    desc: '11 个部分 · 60 个小节 · 70 幅 SVG 矢量图',
    total: 11,
    searchScript: 'Linear-site/assets/js/nav-data.js'
  },
  circuit: {
    glyph: '⌁',
    title: '线性电路分析',
    sub: '可视化课堂 · 18 节',
    dir: 'circuit-site',
    desc: '18 个可视化小节 · 19 个可拖动互动 · 39 幅图示',
    total: 18
  },
  textbook: {
    glyph: '✦',
    title: '教材 → 可视化站点',
    sub: 'SKILL.md · 通用方法',
    dir: 'textbook-to-visual-site',
    desc: '把这五座站点的做法固化成一份可复用的方法论文档'
  }
};
