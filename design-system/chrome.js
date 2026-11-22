/* ==========================================================================
   学习站设计系统 · 站点外壳
   --------------------------------------------------------------------------
   注入并驱动：顶栏、站点切换、搜索、主题、阅读进度、目录抽屉、
   锚点平滑滚动、滚动定位、图片灯箱、回顶部。

   页面只需要在 <html> 上声明：
     data-brand="micro|calculus|linear|circuit|hub"
     data-root="../"            <- 从本页到工作区根目录的相对路径
   ========================================================================== */
(function () {
  'use strict';

  if (window.__DS_CHROME__) return;
  window.__DS_CHROME__ = true;

  var D = document.documentElement;
  var B = document.body;
  var BRAND = D.getAttribute('data-brand') || 'hub';
  var ROOT = D.getAttribute('data-root');
  if (ROOT === null) ROOT = '../';
  var WS_ROOT = ROOT;                        // 工作区根
  var REG = window.DS_SITES || {};
  var SELF = REG[BRAND] || {};
  var SITE_DIR = SELF.dir ? SELF.dir + '/' : '';

  /* 工作区相对路径 */
  function ws(p) { return WS_ROOT + String(p).replace(/^\/+/, ''); }
  /* 本站根目录 */
  function site(p) { return ws(SITE_DIR + String(p || '').replace(/^\/+/, '')); }

  var I18N = {
    menu: '目录',
    sites: '全部站点',
    search: '搜索',
    searchPh: '搜索章节、小节、公式主题…',
    searchEmpty: '没有匹配的结果',
    theme: '切换深浅色',
    progress: '阅读进度',
    top: '回到顶部'
  };

  var SVG = {
    sites: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.6"/><rect x="14" y="3" width="7" height="7" rx="1.6"/><rect x="3" y="14" width="7" height="7" rx="1.6"/><rect x="14" y="14" width="7" height="7" rx="1.6"/></svg>',
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="16.6" y1="16.6" x2="21" y2="21"/></svg>',
    sun: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.6M12 19.4V22M2 12h2.6M19.4 12H22M4.9 4.9l1.9 1.9M17.2 17.2l1.9 1.9M19.1 4.9l-1.9 1.9M6.8 17.2l-1.9 1.9"/></svg>',
    moon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 14.2A8.6 8.6 0 1 1 9.8 3.5a6.9 6.9 0 0 0 10.7 10.7z"/></svg>',
    up: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg>'
  };

  /* ======================================================================
     1. 顶栏
     ====================================================================== */

  function ringSvg() {
    return '<svg viewBox="0 0 36 36" width="20" height="20" aria-hidden="true">' +
      '<circle cx="18" cy="18" r="15" fill="none" stroke="var(--line)" stroke-width="3.2"/>' +
      '<circle id="dsRingFg" cx="18" cy="18" r="15" fill="none" stroke="var(--brand)" stroke-width="3.2" ' +
      'stroke-linecap="round" stroke-dasharray="94.25" stroke-dashoffset="94.25" ' +
      'transform="rotate(-90 18 18)" style="transition:stroke-dashoffset .4s ease"/></svg>';
  }

  function buildTopbar() {
    if (document.querySelector('.ds-topbar')) return;

    var bar = document.createElement('div');
    bar.className = 'ds-topbar';
    bar.setAttribute('role', 'banner');

    var sitesMenu = '';
    Object.keys(REG).forEach(function (k) {
      var s = REG[k];
      sitesMenu += '<a href="' + ws((s.dir ? s.dir + '/' : '') + 'index.html') + '"' +
        (k === BRAND ? ' aria-current="true"' : '') + '>' +
        '<span class="s-glyph">' + (s.glyph || '·') + '</span>' +
        '<span><span class="s-name">' + s.title + '</span>' +
        '<span class="s-desc">' + (s.desc || s.sub || '') + '</span></span></a>';
    });

    bar.innerHTML =
      '<button class="ds-menu" id="dsMenu" type="button" aria-label="' + I18N.menu + '" aria-expanded="false">' +
        '<span></span><span></span><span></span></button>' +
      '<a class="ds-brand" href="' + site('index.html') + '">' +
        '<span class="ds-brand-mark">' + (SELF.glyph || '◇') + '</span>' +
        '<span class="ds-brand-text"><span class="ds-brand-title">' + (SELF.title || document.title) + '</span>' +
        '<span class="ds-brand-sub">' + (SELF.sub || '') + '</span></span></a>' +
      '<div class="ds-tools">' +
        '<div class="ds-sites">' +
          '<button class="ds-btn" id="dsSitesBtn" type="button" aria-haspopup="true" aria-expanded="false">' +
            SVG.sites + '<span class="lbl">' + I18N.sites + '</span></button>' +
          '<div class="ds-sites-menu" id="dsSitesMenu" hidden>' + sitesMenu + '</div>' +
        '</div>' +
        '<button class="ds-btn" id="dsSearchBtn" type="button">' + SVG.search +
          '<span class="lbl">' + I18N.search + '</span><kbd>/</kbd></button>' +
        '<button class="ds-btn ds-iconbtn" id="dsThemeBtn" type="button" title="' + I18N.theme + '" aria-label="' + I18N.theme + '"></button>' +
        (SELF.total || SELF.ring ? '<span class="ds-btn ds-iconbtn" id="dsRing" title="' + I18N.progress + '">' + ringSvg() + '</span>' : '') +
      '</div>';

    B.insertBefore(bar, B.firstChild);
  }

  /* ======================================================================
     2. 主题
     ====================================================================== */

  function initTheme() {
    var btn = document.getElementById('dsThemeBtn');
    if (!btn) return;
    function paint() {
      var dark = D.getAttribute('data-theme') === 'dark';
      btn.innerHTML = dark ? SVG.sun : SVG.moon;
      btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
    }
    btn.addEventListener('click', function () {
      var next = D.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      D.setAttribute('data-theme', next);
      try { localStorage.setItem('ds:theme', next); } catch (e) {}
      paint();
      window.dispatchEvent(new CustomEvent('ds:theme', { detail: next }));
    });
    window.addEventListener('ds:set-theme', function (e) {
      D.setAttribute('data-theme', e.detail);
      paint();
    });
    paint();
  }

  /* ======================================================================
     3. 站点切换菜单
     ====================================================================== */

  function initSitesMenu() {
    var btn = document.getElementById('dsSitesBtn');
    var menu = document.getElementById('dsSitesMenu');
    if (!btn || !menu) return;

    function close() { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); }
    function open() { menu.hidden = false; btn.setAttribute('aria-expanded', 'true'); }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      menu.hidden ? open() : close();
    });
    document.addEventListener('click', function (e) {
      if (!menu.hidden && !menu.contains(e.target)) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  }

  /* ======================================================================
     4. 搜索
     ====================================================================== */

  var INDEX = null;
  var INDEX_LOADING = false;

  function buildDomIndex() {
    var out = [];
    var seen = Object.create(null);

    function push(t, c, u) {
      t = (t || '').replace(/\s+/g, ' ').trim();
      if (!t || t.length > 160 || seen[u + '|' + t]) return;
      seen[u + '|' + t] = 1;
      out.push({ t: t, c: c || '', u: u });
    }

    document.querySelectorAll('.sidebar a[href]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (!href || href === '#' || /^https?:/i.test(href)) return;
      push(a.textContent, '', href);
    });

    document.querySelectorAll('main h2[id], main h3[id], main section[id]').forEach(function (el) {
      var label = el.textContent.replace(/\s+/g, ' ').trim();
      if (label.length > 120) label = label.slice(0, 118) + '…';
      push(label, '', '#' + el.id);
    });

    return out;
  }

  /* 三种索引形状的适配 */
  function normalizeIndex(raw) {
    if (!Array.isArray(raw) || !raw.length) return null;
    var sample = raw[0];

    if (sample && sample.u) return raw.slice();

    /* MCD_SEARCH：{n,t,c,ch,f,a} —— 微电子电路设计 */
    if (sample && sample.f) {
      return raw.map(function (e) {
        return {
          t: (e.n ? e.n + ' ' : '') + (e.t || '') + (e.c ? ' · ' + e.c : ''),
          c: e.ch || '',
          u: ws(SITE_DIR + 'chapters/' + e.f + (e.a ? '#' + e.a : ''))
        };
      });
    }

    /* NAV：{id,zh,en,tag,sections[[id,num,zh,en]]} —— 线性代数 */
    if (sample && sample.sections) {
      var out = [];
      raw.forEach(function (p) {
        out.push({
          t: 'Part ' + p.id + ' ' + (p.zh || ''),
          c: p.en || '',
          u: ws(SITE_DIR + 'parts/part' + p.id + '.html')
        });
        (p.sections || []).forEach(function (s) {
          out.push({
            t: s[1] + ' ' + (s[2] || '') + (s[3] ? ' · ' + s[3] : ''),
            c: 'Part ' + p.id + ' · ' + (p.zh || ''),
            u: ws(SITE_DIR + 'parts/part' + p.id + '.html#' + s[0])
          });
        });
      });
      return out;
    }

    return null;
  }

  function loadIndex(done) {
    if (INDEX) { done(INDEX); return; }

    var direct = normalizeIndex(window.DS_SEARCH);
    if (direct) { INDEX = direct; done(INDEX); return; }

    var script = SELF.searchScript;
    if (script && !INDEX_LOADING) {
      INDEX_LOADING = true;
      var s = document.createElement('script');
      s.src = ws(script);
      s.onload = function () {
        INDEX = normalizeIndex(window.DS_SEARCH) ||
                normalizeIndex(window.MCD_SEARCH) ||
                normalizeIndex(window.NAV) ||
                buildDomIndex();
        INDEX_LOADING = false;
        done(INDEX);
      };
      s.onerror = function () {
        INDEX = buildDomIndex();
        INDEX_LOADING = false;
        done(INDEX);
      };
      document.head.appendChild(s);
      return;
    }

    INDEX = buildDomIndex();
    done(INDEX);
  }

  function initSearch() {
    var btn = document.getElementById('dsSearchBtn');
    if (!btn) return;

    var wrap = document.createElement('div');
    wrap.className = 'ds-search';
    wrap.id = 'dsSearch';
    wrap.innerHTML = '<div class="ds-search-inner" role="dialog" aria-modal="true" aria-label="' + I18N.search + '">' +
      '<input class="ds-search-input" id="dsSearchInput" type="search" placeholder="' + I18N.searchPh + '" ' +
      'autocomplete="off" spellcheck="false" aria-label="' + I18N.search + '">' +
      '<ul class="ds-search-results" id="dsSearchResults"></ul></div>';
    B.appendChild(wrap);

    var input = wrap.querySelector('#dsSearchInput');
    var list = wrap.querySelector('#dsSearchResults');
    var active = -1;

    function close() { wrap.classList.remove('show'); input.value = ''; list.innerHTML = ''; }
    function open() {
      wrap.classList.add('show');
      input.focus();
      loadIndex(function () { run(input.value); });
    }

    function run(q) {
      if (!INDEX) return;
      q = (q || '').trim().toLowerCase();
      list.innerHTML = '';
      active = -1;
      if (!q) return;

      var terms = q.split(/\s+/).filter(Boolean);
      var hits = [];
      for (var i = 0; i < INDEX.length && hits.length < 60; i++) {
        var e = INDEX[i];
        var hay = (e.t + ' ' + (e.c || '')).toLowerCase();
        var ok = true;
        for (var k = 0; k < terms.length; k++) {
          if (hay.indexOf(terms[k]) < 0) { ok = false; break; }
        }
        if (ok) hits.push(e);
      }

      if (!hits.length) {
        list.innerHTML = '<li class="ds-search-empty">' + I18N.searchEmpty + '</li>';
        return;
      }

      hits.forEach(function (e, i) {
        var li = document.createElement('li');
        li.innerHTML = '<a href="' + e.u + '"' + (i === 0 ? ' aria-selected="true"' : '') + '>' +
          (e.c ? '<span class="s-crumb">' + e.c + '</span>' : '') + e.t + '</a>';
        list.appendChild(li);
      });
      active = 0;
    }

    function move(delta) {
      var items = list.querySelectorAll('a');
      if (!items.length) return;
      items[active] && items[active].removeAttribute('aria-selected');
      active = (active + delta + items.length) % items.length;
      items[active].setAttribute('aria-selected', 'true');
      items[active].scrollIntoView({ block: 'nearest' });
    }

    btn.addEventListener('click', open);
    wrap.addEventListener('click', function (e) { if (e.target === wrap) close(); });
    input.addEventListener('input', function () { run(input.value); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      else if (e.key === 'Enter') {
        var sel = list.querySelector('a[aria-selected="true"]') || list.querySelector('a');
        if (sel) { e.preventDefault(); close(); location.href = sel.getAttribute('href'); }
      } else if (e.key === 'Escape') { close(); }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && wrap.classList.contains('show')) { close(); return; }
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      var tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) return;
      e.preventDefault();
      open();
    });
  }

  /* ======================================================================
     5. 目录抽屉
     ====================================================================== */

  function initDrawer() {
    var btn = document.getElementById('dsMenu');
    var side = document.querySelector('.sidebar');
    if (!btn || !side) { if (btn) btn.style.display = 'none'; return; }

    var scrim = document.createElement('div');
    scrim.className = 'ds-scrim';
    B.appendChild(scrim);

    function close() {
      side.classList.remove('open');
      scrim.classList.remove('show');
      btn.setAttribute('aria-expanded', 'false');
    }
    function toggle() {
      var on = side.classList.toggle('open');
      scrim.classList.toggle('show', on);
      btn.setAttribute('aria-expanded', on ? 'true' : 'false');
    }

    btn.addEventListener('click', toggle);
    scrim.addEventListener('click', close);
    side.addEventListener('click', function (e) {
      if (e.target.closest('a') && window.innerWidth <= 1080) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  }

  /* ======================================================================
     6. 滚动进度 + 阅读完成度
     ====================================================================== */

  function initScrollProgress() {
    var bar = document.createElement('div');
    bar.className = 'ds-progress';
    B.appendChild(bar);

    var ticking = false;
    function update() {
      var h = D.scrollHeight - window.innerHeight;
      var p = h > 0 ? (window.scrollY / h) : 0;
      bar.style.width = Math.min(1, Math.max(0, p)) * 100 + '%';
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  function initCompletion() {
    var total = SELF.total;
    if (!total) return;
    var key = 'ds:done:' + BRAND;
    var done;
    try { done = JSON.parse(localStorage.getItem(key) || '[]'); } catch (e) { done = []; }
    if (!Array.isArray(done)) done = [];

    var page = location.pathname.split('/').pop() || 'index.html';
    var fg = document.getElementById('dsRingFg');
    var host = document.getElementById('dsRing');

    function paint() {
      if (!fg) return;
      var pct = Math.min(1, done.length / total);
      fg.setAttribute('stroke-dashoffset', String(94.25 * (1 - pct)));
      if (host) host.title = I18N.progress + ' ' + done.length + ' / ' + total;
    }

    paint();
    window.addEventListener('scroll', function () {
      if (done.indexOf(page) >= 0) return;
      var h = D.scrollHeight - window.innerHeight;
      if (h <= 0) return;
      if (window.scrollY / h > 0.85) {
        done.push(page);
        try { localStorage.setItem(key, JSON.stringify(done)); } catch (e) {}
        paint();
      }
    }, { passive: true });
  }

  /* ======================================================================
     7. 锚点：平滑滚动 + 亮一下
     ====================================================================== */

  function initAnchors() {
    var barH = 64;
    var lastFlash = null;

    function flash(el) {
      if (lastFlash) lastFlash.classList.remove('flash');
      el.classList.add('flash');
      lastFlash = el;
      setTimeout(function () { el.classList.remove('flash'); }, 1100);
    }

    function go(id, updateHash) {
      var el = document.getElementById(id);
      if (!el) return false;
      var rect = el.getBoundingClientRect();
      var top = Math.max(0, rect.top + window.scrollY - barH);
      window.scrollTo({ top: top, behavior: 'smooth' });
      if (updateHash && history.replaceState) {
        try { history.replaceState(null, '', '#' + id); } catch (e) {}
      }
      setActive(id);
      flash(el);
      return true;
    }

    function setActive(id) {
      var links = document.querySelectorAll('.sidebar a[href^="#"]');
      var any = false;
      for (var i = 0; i < links.length; i++) {
        var on = links[i].getAttribute('href') === '#' + id;
        links[i].classList.toggle('active', on);
        if (on) any = true;
      }
      if (!any) {
        for (var j = 0; j < links.length; j++) links[j].classList.remove('active');
      }
    }

    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      if (a.getAttribute('href') === '#') return;
      var id = a.getAttribute('href').slice(1);
      if (!id || !document.getElementById(id)) return;
      e.preventDefault();
      go(id, true);
    });

    if (location.hash.length > 1) {
      var id0 = location.hash.slice(1);
      setTimeout(function () { go(id0, false); }, 120);
    }

    window.addEventListener('hashchange', function () {
      if (location.hash.length > 1) go(location.hash.slice(1), false);
    });

    /* 滚动定位：只看目录里引用到的锚点 */
    var wanted = Object.create(null);
    var targets = [];
    document.querySelectorAll('.sidebar a[href^="#"]').forEach(function (a) {
      var id = a.getAttribute('href').slice(1);
      if (!id || wanted[id]) return;
      var el = document.getElementById(id);
      if (!el) return;
      wanted[id] = 1;
      targets.push(el);
    });
    if (!targets.length) return;

    var current = '';
    var ticking = false;
    function spy() {
      ticking = false;
      var best = '', bestTop = -Infinity;
      for (var i = 0; i < targets.length; i++) {
        var t = targets[i].getBoundingClientRect().top;
        if (t - barH - 30 <= 0 && t > bestTop) { bestTop = t; best = targets[i].id; }
      }
      if (!best) best = targets[0].id;
      if (best !== current) { current = best; setActive(best); }
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(spy); }
    }, { passive: true });
    spy();
  }

  /* ======================================================================
     8. 回到顶部
     ====================================================================== */

  function initTop() {
    var btn = document.createElement('button');
    btn.className = 'ds-totop';
    btn.type = 'button';
    btn.title = I18N.top;
    btn.setAttribute('aria-label', I18N.top);
    btn.innerHTML = SVG.up;
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    B.appendChild(btn);

    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        btn.classList.toggle('show', window.scrollY > 700);
        ticking = false;
      });
    }, { passive: true });
  }

  /* ======================================================================
     9. 入场动画 + 图片灯箱 + 页脚站点导航
     ====================================================================== */

  function initFootNav() {
    var foot = document.querySelector('.foot');
    if (!foot || foot.querySelector('.foot-nav')) return;
    var nav = document.createElement('nav');
    nav.className = 'foot-nav';
    nav.setAttribute('aria-label', I18N.sites);
    Object.keys(REG).forEach(function (k) {
      if (k === BRAND) return;
      var s = REG[k];
      var a = document.createElement('a');
      a.href = ws((s.dir ? s.dir + '/' : '') + 'index.html');
      a.textContent = s.title;
      nav.appendChild(a);
    });
    if (!nav.children.length) return;
    foot.appendChild(nav);
  }

  function initReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (e) { e.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: .04 });
    els.forEach(function (e) { io.observe(e); });
  }

  function initLightbox() {
    var box = null;

    function close() {
      if (!box) return;
      box.remove();
      box = null;
      document.documentElement.style.overflow = '';
    }

    document.addEventListener('click', function (e) {
      var img = e.target.closest && e.target.closest('.fig img, .figcard img, .photo img, .kp-fig img, .figure img');
      if (!img || !img.src) return;
      e.preventDefault();
      box = document.createElement('div');
      box.className = 'lightbox';
      var big = document.createElement('img');
      big.src = img.src;
      big.alt = img.alt || '';
      box.appendChild(big);
      box.addEventListener('click', close);
      document.body.appendChild(box);
      document.documentElement.style.overflow = 'hidden';
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  }

  /* ======================================================================
     10. 对外接口
     ====================================================================== */

  window.DS = {
    root: WS_ROOT,
    brand: BRAND,
    ws: ws,
    site: site,
    /* 单页站点用它更新顶栏进度环 */
    setProgress: function (pct) {
      var fg = document.getElementById('dsRingFg');
      if (!fg) return;
      var p = Math.min(1, Math.max(0, pct));
      fg.setAttribute('stroke-dashoffset', String(94.25 * (1 - p)));
    },
    /* 单页站点用它更新面包屑 */
    setCrumb: function (html) {
      var bar = document.querySelector('.ds-pagebar');
      if (bar) bar.innerHTML = html;
    },
    /* 重新扫描数学公式 */
    typeset: function (root) {
      if (window.RenderAllMath && window.katex) window.RenderAllMath.render(root || document.body);
    },
    refreshSpy: function () {
      INDEX = null;
    }
  };

  /* ======================================================================
     启动
     ====================================================================== */

  function boot() {
    buildTopbar();
    initTheme();
    initSitesMenu();
    initSearch();
    initDrawer();
    initScrollProgress();
    initCompletion();
    initAnchors();
    initTop();
    initReveal();
    initLightbox();
    initFootNav();

    /* 老站点自带的顶栏 / 进度条 / 回顶部，统一撤掉 */
    document.querySelectorAll('header.topbar, .topbar, .progress, #progress, .to-top, .backdrop, .scrim').forEach(function (el) {
      if (el.closest('.ds-topbar')) return;
      if (el.classList.contains('scrim') || el.classList.contains('backdrop')) {
        el.style.display = 'none';
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
