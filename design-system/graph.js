/* ==========================================================================
   学习站设计系统 · 知识关系图
   --------------------------------------------------------------------------
   Obsidian 风格的力导向关系图：节点 = 章节/概念，连线 = 前置、依赖、对偶。
   支持拖动、悬停高亮、点击跳转；颜色取自设计令牌，深浅色模式自动跟随。

   用法：
     <div class="graph-wrap"><canvas id="graphCanvas"></canvas></div>
     <script>
       window.SITE_MAP = {
         nodes: [{ id:'laws', label:'KCL/KVL', group:'laws', href:'#laws' }, ...],
         edges: [['intro','quantities'], ...],
         groups: { base:'#2563eb', laws:'#b45309' }
       };
     </script>
     <script src="../design-system/graph.js" defer></script>
   ========================================================================== */
(function () {
  'use strict';

  var GROUP_FALLBACK = ['#0e766e', '#b45309', '#6b3fa0', '#2563eb', '#b3241c', '#1d6b4f', '#a63d2f'];

  function css(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  function Graph(canvas, conf) {
    var self = this;
    this.canvas = canvas;
    this.wrap = canvas.parentElement;
    this.conf = conf;

    var groups = conf.groups || {};
    var keys = Object.keys(groups);
    Object.keys(conf.groups || {}).forEach(function () {});
    if (!keys.length) {
      var used = {};
      (conf.nodes || []).forEach(function (n) { if (n.group) used[n.group] = 1; });
      keys = Object.keys(used);
      keys.forEach(function (k, i) { groups[k] = GROUP_FALLBACK[i % GROUP_FALLBACK.length]; });
    }
    var colorMap = {};
    keys.forEach(function (k) { colorMap[k] = groups[k]; });

    this.nodes = (conf.nodes || []).map(function (n) {
      return {
        id: n.id,
        label: n.label || n.id,
        short: n.short || n.label || n.id,
        href: n.href || ('#' + n.id),
        group: n.group || keys[0],
        x: 0, y: 0, vx: 0, vy: 0, r: 16, degree: 0
      };
    });
    this.byId = {};
    this.nodes.forEach(function (n) { self.byId[n.id] = n; });
    this.edges = (conf.edges || []).filter(function (e) {
      return self.byId[e[0]] && self.byId[e[1]];
    });
    this.edges.forEach(function (e) {
      self.byId[e[0]].degree++;
      self.byId[e[1]].degree++;
    });

    var maxDeg = 1;
    this.nodes.forEach(function (n) { if (n.degree > maxDeg) maxDeg = n.degree; });
    this.maxDeg = maxDeg;
    this.colorMap = colorMap;

    this.W = 0; this.H = 0;
    this.narrow = false;
    this.hover = null;
    this.drag = null;
    this.moved = 0;
    this.frozen = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.text = css('--ink', '#15171c');
    this.line = css('--line', '#e2dac8');
    this.paper = css('--card', '#fffdf8');

    this.init();
    this.bind();
  }

  Graph.prototype.retheme = function () {
    this.text = css('--ink', '#15171c');
    this.line = css('--line', '#e2dac8');
    this.paper = css('--card', '#fffdf8');
    this.draw();
  };

  Graph.prototype.fit = function () {
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var w = this.canvas.clientWidth || this.wrap.clientWidth || 640;
    var h = this.canvas.clientHeight || 460;
    if (!w || !h) return null;
    if (this.canvas.width !== Math.round(w * dpr) || this.canvas.height !== Math.round(h * dpr)) {
      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(h * dpr);
    }
    var ctx = this.canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: w, h: h };
  };

  Graph.prototype.init = function () {
    var f = this.fit();
    if (!f) return;
    this.W = f.w;
    this.H = f.h;
    this.narrow = f.w < 620;

    var self = this;
    this.nodes.forEach(function (n) {
      n.r = (self.narrow ? 11 : 16) + Math.min(self.narrow ? 7 : 13, n.degree * (self.narrow ? 1.2 : 1.7));
    });

    var cx = this.W / 2, cy = this.H / 2;
    var rad = Math.min(this.W, this.H) * 0.42;
    this.nodes.forEach(function (n, i) {
      var a = (i / self.nodes.length) * Math.PI * 2 - Math.PI / 2;
      var wob = 0.74 + 0.26 * ((i * 37) % 10) / 10;
      n.x = cx + Math.cos(a) * rad * wob;
      n.y = cy + Math.sin(a) * rad * wob;
      n.vx = 0; n.vy = 0;
    });
    for (var k = 0; k < 380; k++) this.step(true);
  };

  Graph.prototype.step = function (initial) {
    var W = this.W, H = this.H, narrow = this.narrow;
    var cx = W / 2, cy = H / 2;
    var nodes = this.nodes, i, j;

    for (i = 0; i < nodes.length; i++) {
      var a = nodes[i];
      for (j = i + 1; j < nodes.length; j++) {
        var b = nodes[j];
        var dx = a.x - b.x, dy = a.y - b.y;
        var d2 = dx * dx + dy * dy;
        if (d2 < 1) d2 = 1;
        var d = Math.sqrt(d2);
        var fx = (dx / d) * Math.min(1000, (narrow ? 2600 : 5400) / d2);
        var fy = (dy / d) * Math.min(1000, (narrow ? 2600 : 5400) / d2);
        a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
      }
    }

    var target = narrow ? 88 : 178;
    for (i = 0; i < this.edges.length; i++) {
      var e = this.edges[i];
      var p = this.byId[e[0]], q = this.byId[e[1]];
      var ex = q.x - p.x, ey = q.y - p.y;
      var ed = Math.sqrt(ex * ex + ey * ey) || 1;
      var ef = (ed - target) * 0.013;
      var efx = (ex / ed) * ef, efy = (ey / ed) * ef;
      p.vx += efx; p.vy += efy; q.vx -= efx; q.vy -= efy;
    }

    for (i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      n.vx += (cx - n.x) * 0.0017;
      n.vy += (cy - n.y) * 0.0017;
      n.vx *= 0.86; n.vy *= 0.86;
      n.x += n.vx; n.y += n.vy;
      var mx = n.r + 16, my = n.r + (narrow ? 22 : 40);
      n.x = Math.max(mx, Math.min(W - mx, n.x));
      n.y = Math.max(my, Math.min(H - my - 4, n.y));
    }
    void initial;
  };

  Graph.prototype.draw = function () {
    var f = this.fit();
    if (!f) return;
    var ctx = f.ctx;
    this.W = f.w;
    this.H = f.h;
    var self = this;

    ctx.clearRect(0, 0, this.W, this.H);

    this.edges.forEach(function (e) {
      var a = self.byId[e[0]], b = self.byId[e[1]];
      var on = self.hover && (e[0] === self.hover.id || e[1] === self.hover.id);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = on ? self.colorMap[b.group] : self.line;
      ctx.globalAlpha = on ? 0.75 : 0.5;
      ctx.lineWidth = on ? 1.7 : 1;
      ctx.stroke();
      ctx.globalAlpha = 1;
    });

    this.nodes.forEach(function (n) {
      var col = self.colorMap[n.group] || GROUP_FALLBACK[0];
      var dim = self.hover && self.hover !== n && !self.linked(n);
      ctx.globalAlpha = dim ? 0.42 : 1;

      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = col;
      ctx.globalAlpha = (dim ? 0.42 : 1) * 0.14;
      ctx.fill();
      ctx.globalAlpha = dim ? 0.42 : 1;

      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.strokeStyle = col;
      ctx.lineWidth = self.hover === n ? 2.4 : 1.6;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(n.x, n.y, Math.max(2.4, n.r * 0.2), 0, Math.PI * 2);
      ctx.fillStyle = col;
      ctx.fill();

      ctx.font = (self.narrow ? '10px' : '12px') + ' / 1 -apple-system, "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.fillStyle = self.text;
      ctx.textAlign = 'center';
      if (self.narrow) {
        ctx.textBaseline = 'middle';
        ctx.fillText(n.short, n.x, n.y + 1);
      } else {
        ctx.textBaseline = 'top';
        ctx.fillText(n.label, n.x, n.y + n.r + 6);
      }
      ctx.globalAlpha = 1;
    });

    if (this.hover) {
      var n2 = this.hover;
      ctx.font = '600 11px -apple-system, "Segoe UI", "Microsoft YaHei", sans-serif';
      var label = n2.label + ' →';
      var tw = ctx.measureText(label).width + 18;
      var tx = Math.min(this.W - tw - 8, Math.max(8, n2.x - tw / 2));
      var ty = Math.max(6, n2.y - n2.r - 34);
      ctx.fillStyle = this.paper;
      ctx.strokeStyle = this.colorMap[n2.group] || GROUP_FALLBACK[0];
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(tx, ty, tw, 23, 7);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = this.text;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, tx + 9, ty + 12);
    }
  };

  Graph.prototype.linked = function (n) {
    if (!this.hover) return true;
    var id = this.hover.id;
    for (var i = 0; i < this.edges.length; i++) {
      var e = this.edges[i];
      if (e[0] === id && e[1] === n.id) return true;
      if (e[1] === id && e[0] === n.id) return true;
    }
    return false;
  };

  Graph.prototype.pick = function (x, y) {
    var best = null, bd = 1e9;
    this.nodes.forEach(function (n) {
      var d = Math.hypot(n.x - x, n.y - y);
      if (d < n.r + 9 && d < bd) { bd = d; best = n; }
    });
    return best;
  };

  Graph.prototype.bind = function () {
    var self = this;
    var c = this.canvas;

    function pos(e) {
      var r = c.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    c.addEventListener('pointerdown', function (e) {
      var p = pos(e), n = self.pick(p.x, p.y);
      if (!n) return;
      self.drag = n;
      self.moved = 0;
      c.setPointerCapture(e.pointerId);
      c.style.cursor = 'grabbing';
    });

    c.addEventListener('pointermove', function (e) {
      var p = pos(e);
      if (self.drag) {
        self.moved += Math.abs(e.movementX) + Math.abs(e.movementY);
        self.drag.x = p.x;
        self.drag.y = p.y;
        self.drag.vx = 0;
        self.drag.vy = 0;
        self.draw();
      } else {
        var n = self.pick(p.x, p.y);
        if (n !== self.hover) {
          self.hover = n;
          c.style.cursor = n ? 'pointer' : 'grab';
          self.draw();
        }
      }
    });

    c.addEventListener('pointerup', function () {
      if (self.drag && self.moved < 8) {
        var href = self.drag.href;
        self.drag = null;
        c.style.cursor = self.hover ? 'pointer' : 'grab';
        if (href) window.location.href = href;
        return;
      }
      self.drag = null;
      c.style.cursor = self.hover ? 'pointer' : 'grab';
    });

    c.addEventListener('pointerleave', function () {
      if (!self.drag) { self.hover = null; self.draw(); }
    });

    var rt = null;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { self.init(); self.draw(); }, 120);
    });

    window.addEventListener('ds:theme', function () { self.retheme(); });

    var last = performance.now();
    function loop(now) {
      var dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      void dt;
      var r = c.getBoundingClientRect();
      var visible = r.bottom > -80 && r.top < window.innerHeight + 80;
      if (visible) {
        if (!self.drag && !self.frozen) self.step(false);
        self.draw();
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  };

  function boot() {
    var canvas = document.getElementById('graphCanvas') || document.querySelector('canvas[data-graph]');
    if (!canvas || !window.SITE_MAP) return;
    if (canvas.__dsGraph) return;
    canvas.__dsGraph = new Graph(canvas, window.SITE_MAP);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.DSGraph = Graph;
})();
