/* ==========================================================================
   学习站设计系统 · 数学渲染
   --------------------------------------------------------------------------
   一个模块，五个站点共用。规则来自 render-all-math skill：

     1. data-tex 显式 TeX 优先；
     2. .eq 公式块其次；
     3. <sub>/<sup> 与前面的变量合并；
     4. 正文按中文切分，非中文片段尝试 KaTeX；
     5. 失败保留原文，不显示红色报错。

   KaTeX 用 output:'mathml'，因此不需要 katex.css，也不需要字体文件。
   公式颜色继承正文，不加底色、不加 padding。
   ========================================================================== */
(function (global) {
  'use strict';

  var CJK = /[\u4e00-\u9fff]/;

  /* 不进入渲染的容器：已经渲染过的、代码、控件、导航 */
  var BLOCK = [
    '.katex', 'math', '.tex-inline', '.eq.tex', '.eq-fallback',
    'pre', 'code', 'kbd', 'samp', 'script', 'style', 'textarea',
    '.no-math', '.tex-cell', '.chapter-num', '.formula-card',
    '.widget', '.demo', '.ds-topbar', '.ds-search', '.sidebar',
    '.pager', '.foot-nav', '.quiz', '.tab'
  ].join(',');

  var SUB = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9', '₊': '+', '₋': '-' };
  var SUP = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁺': '+', '⁻': '-', 'ⁿ': 'n' };

  var VAR = '[A-Za-z0-9_^{}.\\u0370-\\u03ff\\u2080-\\u209f]';

  /* 已知单位：只有「数字 + 空格 + 单位」或「数字 + 已知单位」才当公式 */
  var UNITS = ['V','kV','mV','μV','uV','A','mA','μA','uA','nA','Ω','kΩ','MΩ','mΩ','W','kW','mW','μW',
    'Hz','kHz','MHz','GHz','F','mF','μF','uF','nF','pF','H','mH','μH','uH','nH','s','ms','μs','us',
    'ns','ps','dB','dBm','rad','deg','J','kJ','N','Pa','kPa','MPa','K','°C','mol','m','cm','mm','km',
    'g','kg','mol/L','V/A','A/V','V/s','s/V','%','°','H/m','F/m','S'];

  var OPERATORS = /[=≈≠≡≤≥<>±∓∫∬∮√|∑∏∂∇→←↔×÷^_]/;
  var GREEK = /[\u0370-\u03ff\u2200-\u22ff]/;
  var KNOWN_WORD = /^(https?|www|html|css|json|svg|png|jpe?g|pdf|KaTeX|MathJax|SPICE|KCL|KVL|MIT|MOSFET|BJT|FET|MOS|CMOS|SVD|LU|QR|FFT|PCA|ReLU|Adam|RMS|CMRR|GBW|OpAmp|dB|dBm)$/;

  /* 这个片段值得送进 KaTeX 吗？——只认数学语境，不把散文当公式 */
  function isMathy(s) {
    if (!s) return false;
    var t = s.replace(/\s+/g, ' ').trim();
    if (!t || t.length > 120) return false;
    if (KNOWN_WORD.test(t)) return false;
    if (/^[A-Za-z][A-Za-z0-9]*(?:-[A-Za-z0-9]+)+$/.test(t)) return false;   // data-tex、e-mail

    if (OPERATORS.test(t)) return true;
    if (GREEK.test(t)) return true;
    if (/^[A-Za-z]$/.test(t)) return true;                                  // R、L、C、i、v
    if (new RegExp('^[A-Za-z][A-Za-z0-9]*(?:[_^]\\{?[A-Za-z0-9]+\\}?)$').test(t)) return true;

    var m = t.match(/^(\d+(?:\.\d+)?)\s*([A-Za-zΩμ°%][A-Za-z0-9μ°/]*)$/);
    if (m && UNITS.indexOf(m[2]) >= 0) return true;

    return false;
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ---------- 把 HTML 片段转成 TeX ---------- */
  function toTex(source) {
    var s = String(source);

    /* 结构：换行、下标、上标、标签 */
    s = s.replace(/<br\s*\/?>/gi, '\\\\');
    s = s.replace(/<sub>(.*?)<\/sub>/gi, '_{$1}');
    s = s.replace(/<sup>(.*?)<\/sup>/gi, '^{$1}');
    s = s.replace(/<\/?(b|i|em|strong|span|small|u|mark)[^>]*>/gi, '');
    s = s.replace(/<[^>]+>/g, '');
    s = s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
         .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
         .replace(/&times;/g, '×').replace(/&divide;/g, '÷');

    /* 符号 */
    s = s.replace(/[−–—]/g, '-')
         .replace(/×/g, '\\times ')
         .replace(/·/g, '\\cdot ')
         .replace(/≈/g, '\\approx ')
         .replace(/≠/g, '\\neq ')
         .replace(/≤/g, '\\le ')
         .replace(/≥/g, '\\ge ')
         .replace(/⇒/g, '\\Rightarrow ')
         .replace(/→/g, '\\rightarrow ')
         .replace(/∞/g, '\\infty ')
         .replace(/∠/g, '\\angle ')
         .replace(/∫/g, '\\int ')
         .replace(/Σ/g, '\\sum ')
         .replace(/½/g, '\\tfrac{1}{2}')
         .replace(/°/g, '^{\\circ}')
         .replace(/　/g, '\\quad ')
         .replace(/′/g, "'")
         .replace(/‰/g, '\\text{‰}');

    /* 根号：√(a+b) → \sqrt{a+b}；√LC → \sqrt{LC}；√2 → \sqrt{2} */
    s = s.replace(/√\s*\(([^()]*)\)/g, '\\sqrt{$1}');
    s = s.replace(/√\s*\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '\\sqrt{\\frac{$1}{$2}}');
    s = s.replace(/√\s*([A-Za-z0-9]+)/g, '\\sqrt{$1}');
    s = s.replace(/√/g, '\\sqrt{}');

    /* Unicode 上下标 */
    Object.keys(SUB).forEach(function (k) { s = s.split(k).join('_{' + SUB[k] + '}'); });
    Object.keys(SUP).forEach(function (k) { s = s.split(k).join('^{' + SUP[k] + '}'); });

    /* 三角/对数函数名加反斜杠（下标里的 max、min 不处理） */
    ['arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh',
     'sin', 'cos', 'tan', 'log', 'ln', 'exp', 'max', 'min', 'lim', 'det'].forEach(function (fn) {
      s = s.replace(new RegExp('(^|[^\\\\A-Za-z_^{])' + fn + '(?![A-Za-z])', 'g'), '$1\\' + fn + ' ');
    });

    /* |Z|/R → \frac{|Z|}{R} */
    s = s.replace(new RegExp('\\|([^|]{1,15})\\|\\s*/\\s*(' + VAR + '+)', 'g'), '\\frac{|$1|}{$2}');
    s = s.replace(/\\sqrt\{([^{}]*)\}\s*\/\s*\\sqrt\{([^{}]*)\}/g, '\\frac{\\sqrt{$1}}{\\sqrt{$2}}');

    /* 分式：上下堆叠。但 KCL/KVL 这种「全大写缩写相除」保持原样 */
    function stackable(a, b) {
      var aa = a.replace(/[{}\\]/g, ''), bb = b.replace(/[{}\\]/g, '');
      if (/^[A-Z]{2,}$/.test(aa) && /^[A-Z]{2,}$/.test(bb)) return false;
      if (aa.length > 8 || bb.length > 8) return false;
      return true;
    }

    s = s.replace(/\(([^()]*)\)\s*\/\s*\(([^()]*)\)/g, function (m, a, b) {
      return stackable(a, b) ? '\\frac{' + a + '}{' + b + '}' : m;
    });

    var vx = '(' + VAR + '+)';
    s = s.replace(new RegExp(vx + '\\s*/\\s*\\(([^()]*)\\)(\\^\\{?[0-9]+\\}?)?', 'g'),
      function (m, a, b, c) {
        if (!stackable(a, b)) return m;
        return '\\frac{' + a + '}{(' + b + ')' + (c || '') + '}';
      });
    s = s.replace(new RegExp(vx + '\\s*/\\s*\\[([^\\]]*)\\]', 'g'), function (m, a, b) {
      return stackable(a, b) ? '\\frac{' + a + '}{' + b + '}' : m;
    });
    s = s.replace(new RegExp(vx + '\\s*/\\s*\\\\sqrt\\{([^{}]*)\\}', 'g'), function (m, a, b) {
      return stackable(a, b) ? '\\frac{' + a + '}{\\sqrt{' + b + '}}' : m;
    });
    s = s.replace(new RegExp(vx + '\\s*/\\s*(' + VAR + '+)', 'g'), function (m, a, b) {
      return stackable(a, b) ? '\\frac{' + a + '}{' + b + '}' : m;
    });

    s = s.replace(/%/g, '\\%');
    s = s.replace(/&/g, '\\&');
    s = s.replace(/#/g, '\\#');

    /* 多字母全大写标识符 → \mathrm，避免被当成乘积 */
    s = s.replace(/(^|[^\\A-Za-z{])([A-Z]{2,})(?![A-Za-z])/g, '$1\\mathrm{$2}');

    /* 中文留在公式外；若确实在公式里，用 \text 包住 */
    s = s.replace(/[\u4e00-\u9fff]+[，。：、（）“”·]*/g, function (m) { return '\\text{' + m + '}'; });
    s = s.replace(/，/g, ', ').replace(/。/g, '. ');

    return s.replace(/\s+/g, ' ').trim();
  }

  /* ---------- 渲染一个元素 ---------- */
  function renderTex(el, tex, opts) {
    var display = opts.display;
    try {
      global.katex.render(tex, el, {
        output: 'mathml',
        displayMode: !!display,
        throwOnError: true,
        strict: false,
        trust: false
      });
      el.classList.add('tex');
      el.removeAttribute('data-tex-pending');
      return true;
    } catch (e) {
      el.removeAttribute('data-tex-pending');
      return false;
    }
  }

  /* ---------- 1. data-tex 显式公式 ---------- */
  function passExplicit(root) {
    root.querySelectorAll('[data-tex]').forEach(function (el) {
      if (el.classList.contains('tex')) return;
      if (el.closest('.no-math')) return;
      var tex = el.getAttribute('data-tex');
      if (!tex) return;
      var display = el.tagName === 'DIV' || el.tagName === 'FIGURE' ||
                    el.classList.contains('eq') || el.classList.contains('big');
      renderTex(el, tex, { display: display });
    });
  }

  /* ---------- 2. .eq / .formula-card p 自动转换 ---------- */
  function passBlocks(root) {
    root.querySelectorAll('.eq, .formula-card p').forEach(function (el) {
      if (el.classList.contains('tex') || el.hasAttribute('data-tex')) return;
      if (el.closest('.widget, .demo, pre, .no-math')) return;
      var isCard = el.matches('.formula-card p');
      if (isCard && !/[=/∫√]/.test(el.textContent)) return;
      var html = el.innerHTML;
      if (!html.trim()) return;
      var tex = toTex(html);
      if (!tex) return;
      if (!isCard && tex.indexOf('\\\\') >= 0) tex = '\\begin{aligned}' + tex + '\\end{aligned}';
      renderTex(el, tex, { display: !isCard });
    });
  }

  /* ---------- 3. 行内：<sub>/<sup> 与变量合并 ---------- */
  function passScriptPairs(root) {
    root.querySelectorAll('sub, sup').forEach(function (tag) {
      if (tag.closest(BLOCK)) return;
      var prev = tag.previousSibling;
      if (!prev || prev.nodeType !== 3) return;
      var m = prev.nodeValue.match(/([A-Za-z0-9ωΩμτζφλπΔθαβγ]+)$/);
      if (!m) return;
      var start = prev.nodeValue.length - m[1].length;
      var range = document.createRange();
      range.setStart(prev, start);
      range.setEndAfter(tag);
      var holder = document.createElement('div');
      holder.appendChild(range.cloneContents());
      var span = document.createElement('span');
      span.className = 'tex-inline';
      var ok = renderTex(span, toTex(holder.innerHTML), { display: false });
      if (!ok) return;
      range.deleteContents();
      range.insertNode(span);
    });
  }

  /* ---------- 4. 行内：$...$ 与按中文切分 ---------- */
  function makeSpan(tex, cls) {
    var span = document.createElement('span');
    span.className = cls || 'tex-inline';
    if (!renderTex(span, tex, { display: false })) return null;
    return span;
  }

  /* $...$ 里已经是 TeX，直接渲染；失败再退回「按文字猜」 */
  function dollarTex(inner) {
    var t = inner.trim();
    if (!t) return null;
    var probe = makeSpan(t);
    if (probe) return probe;
    return makeSpan(toTex(t));
  }

  function inlineNode(node) {
    if (!node || !node.isConnected) return;
    if (!node.parentElement || node.parentElement.closest(BLOCK)) return;
    var text = node.nodeValue;
    if (!text || text.length > 4000) return;

    var hasDollar = text.indexOf('$') >= 0;
    var segments = hasDollar
      ? text.split(/(\$\$[^$]{1,600}\$\$|\$[^$\n]{1,200}\$)/)
      : [text];

    var frag = document.createDocumentFragment();
    var used = false;

    segments.forEach(function (segment) {
      if (!segment) return;

      /* --- $...$ / $$...$$ --- */
      if (segment.length > 2 && segment.charAt(0) === '$' &&
          segment.charAt(segment.length - 1) === '$') {
        var isDouble = segment.indexOf('$$') === 0;
        var inner = segment.slice(isDouble ? 2 : 1, isDouble ? -2 : -1);
        var node2 = dollarTex(inner);
        if (node2) { frag.appendChild(node2); used = true; return; }
        frag.appendChild(document.createTextNode(segment));
        return;
      }

      /* --- 普通文字：按中文切分 --- */
      var parts = segment.split(/([\u4e00-\u9fff]+)/);
      parts.forEach(function (part) {
        if (!part) return;
        if (/^[\u4e00-\u9fff]+$/.test(part)) {
          frag.appendChild(document.createTextNode(part));
          return;
        }

        var lead = (part.match(/^\s*/) || [''])[0];
        var trail = (part.match(/\s*$/) || [''])[0];
        var core = part.trim();
        if (!core) { frag.appendChild(document.createTextNode(part)); return; }
        if (core.length > 120) { frag.appendChild(document.createTextNode(part)); return; }
        if (/https?:\/\/|www\.|\.(png|svg|jpg|html?|js|css)\b/i.test(core)) {
          frag.appendChild(document.createTextNode(part)); return;
        }
        if (!isMathy(core)) {
          frag.appendChild(document.createTextNode(part)); return;
        }

        var span = makeSpan(toTex(core));
        if (!span) { frag.appendChild(document.createTextNode(part)); return; }

        if (lead) frag.appendChild(document.createTextNode(lead));
        frag.appendChild(span);
        if (trail) frag.appendChild(document.createTextNode(trail));
        used = true;
      });
    });

    if (used) node.parentElement.replaceChild(frag, node);
  }

  function passInline(root) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (n) {
      try { inlineNode(n); } catch (e) { /* 单个节点失败不影响其余节点 */ }
    });
  }

  /* ---------- 入口 ---------- */
  function render(root, options) {
    root = root || document.body;
    if (!global.katex) return;
    var opt = options || {};
    passExplicit(root);
    passBlocks(root);
    if (opt.scripts !== false) passScriptPairs(root);
    if (opt.inline !== false) passInline(root);
  }

  global.RenderAllMath = {
    render: render,
    toTex: toTex,
    isMathy: isMathy,
    renderBlock: function (el) { return renderTex(el, toTex(el.innerHTML), { display: true }); }
  };
})(typeof window !== 'undefined' ? window : globalThis);
