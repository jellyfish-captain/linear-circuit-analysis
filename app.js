(function () {
  'use strict';
  if (location.search.indexOf("shot") >= 0) document.documentElement.classList.add("shot");

  const TEAL = '#0e766e';
  const TEAL_DARK = '#0b5d57';
  const AMBER = '#b45309';
  const INK = '#15171c';
  const MUTED = '#8a8f9c';
  const PURPLE = '#7c3aed';
  const BLUE = '#2563eb';
  const GRID = '#e9e2d3';
  const SOFT = '#d8f1ec';

  const draws = [];
  const anims = [];

  function inView(el) {
    const r = el.getBoundingClientRect();
    return r.bottom > -80 && r.top < window.innerHeight + 80;
  }

  function fit(canvas) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    let w = Math.round(rect.width);
    let h = Math.round(rect.height);
    if (w < 20) return null;
    if (h < 20) h = Math.round(w / 2);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    return { ctx, w, h };
  }

  function font(ctx, size, weight) {
    ctx.font = (weight || 400) + ' ' + size + 'px -apple-system,"Microsoft YaHei","PingFang SC",sans-serif';
  }

  function line(ctx, x1, y1, x2, y2, color, width, dash) {
    ctx.save();
    ctx.beginPath();
    ctx.setLineDash(dash || []);
    ctx.strokeStyle = color;
    ctx.lineWidth = width || 1;
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  const fmt = (v, d) => Number(v).toFixed(d === undefined ? 2 : d);

  /* ---------------- 04 Thevenin ---------------- */
  (function () {
    const c = document.getElementById('thevCanvas');
    if (!c) return;
    const rl = document.getElementById('rl');
    const out = document.getElementById('rlOut');
    const iEl = document.getElementById('thevI');
    const vEl = document.getElementById('thevV');
    const pEl = document.getElementById('thevP');
    let state = { rl: 10 };

    function draw() {
      const f = fit(c);
      if (!f) return;
      const { ctx, w, h } = f;
      const L = 48, R = 18, T = 18, B = 38;
      const xmax = 20, ymax = 10;
      const X = v => L + (v / xmax) * (w - L - R);
      const Y = v => h - B - (v / ymax) * (h - T - B);

      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, w, h);

      // grid
      for (let i = 0; i <= 4; i++) {
        const yy = Y((ymax / 4) * i);
        line(ctx, L, yy, w - R, yy, GRID, 1);
        font(ctx, 11); ctx.fillStyle = MUTED; ctx.textAlign = 'right';
        ctx.fillText(fmt((ymax / 4) * i, 1), L - 8, yy + 4);
      }
      for (let i = 0; i <= 5; i++) {
        const xx = X((xmax / 5) * i);
        line(ctx, xx, T, xx, h - B, GRID, 1);
        font(ctx, 11); ctx.fillStyle = MUTED; ctx.textAlign = 'center';
        ctx.fillText(fmt((xmax / 5) * i, 0), xx, h - B + 18);
      }

      // curve
      ctx.beginPath();
      for (let k = 0; k <= 200; k++) {
        const r = (xmax * k) / 200;
        const p = (144 * r) / Math.pow(4 + r, 2);
        const px = X(r), py = Y(p);
        if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = TEAL; ctx.lineWidth = 2.5; ctx.stroke();

      // max marker
      const pmax = 9;
      line(ctx, X(4), Y(pmax), X(4), h - B, TEAL, 1, [4, 4]);
      font(ctx, 11); ctx.fillStyle = TEAL_DARK; ctx.textAlign = 'left';
      ctx.fillText('R_L = R_eq', X(4) + 8, Y(pmax) - 10);

      // operating point
      const p = (144 * state.rl) / Math.pow(4 + state.rl, 2);
      const px = X(state.rl), py = Y(p);
      line(ctx, px, py, px, h - B, AMBER, 1, [3, 3]);
      ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fillStyle = AMBER; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();

      font(ctx, 12); ctx.fillStyle = INK; ctx.textAlign = 'center';
      ctx.fillText('负载电阻 R_L（Ω）', (L + w - R) / 2, h - 8);
      ctx.save();
      ctx.translate(12, (T + h - B) / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = MUTED; ctx.fillText('负载功率 P_L（W）', 0, 0);
      ctx.restore();

      iEl.textContent = fmt(12 / (4 + state.rl), 2) + ' A';
      vEl.textContent = fmt((12 * state.rl) / (4 + state.rl), 2) + ' V';
      pEl.textContent = fmt(p, 2) + ' W';
    }

    rl.addEventListener('input', function () {
      state.rl = parseFloat(rl.value);
      out.textContent = fmt(state.rl, 1) + ' Ω';
      draw();
    });
    draws.push(draw);
    draw();
  })();

  /* ---------------- 06 op amp ---------------- */
  (function () {
    const rin = document.getElementById('rin');
    const rf = document.getElementById('rf');
    if (!rin || !rf) return;
    const rinOut = document.getElementById('rinOut');
    const rfOut = document.getElementById('rfOut');
    const gainOut = document.getElementById('gainOut');
    const voutOut = document.getElementById('voutOut');

    function update() {
      const a = parseFloat(rin.value), b = parseFloat(rf.value);
      const g = -b / a;
      rinOut.textContent = fmt(a, 1) + ' kΩ';
      rfOut.textContent = fmt(b, 1) + ' kΩ';
      gainOut.textContent = (g < 0 ? '−' : '') + fmt(Math.abs(g), 1);
      voutOut.textContent = (g < 0 ? '−' : '') + fmt(Math.abs(g), 1) + ' V';
    }
    rin.addEventListener('input', update);
    rf.addEventListener('input', update);
    update();
  })();

  /* ---------------- 08 RC charging ---------------- */
  (function () {
    const c = document.getElementById('rcCanvas');
    if (!c) return;
    const r = document.getElementById('rval');
    const cap = document.getElementById('cval');
    const rOut = document.getElementById('rvalOut');
    const cOut = document.getElementById('cvalOut');
    const tauOut = document.getElementById('tauOut');
    const tauV = document.getElementById('tauV');
    const state = { R: 10, C: 1, u: 0, hold: 0 };

    function draw() {
      const f = fit(c);
      if (!f) return;
      const { ctx, w, h } = f;
      const L = 50, R = 18, T = 18, B = 38;
      const X = u => L + (u / 5) * (w - L - R);
      const Y = v => h - B - (v / 5) * (h - T - B);

      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);

      for (let i = 0; i <= 5; i++) {
        line(ctx, X(i), T, X(i), h - B, GRID, 1);
        font(ctx, 11); ctx.fillStyle = MUTED; ctx.textAlign = 'center';
        ctx.fillText(i + 'τ', X(i), h - B + 18);
      }
      for (let i = 0; i <= 5; i++) {
        line(ctx, L, Y(i), w - R, Y(i), GRID, 1);
        font(ctx, 11); ctx.fillStyle = MUTED; ctx.textAlign = 'right';
        ctx.fillText(i + 'V', L - 8, Y(i) + 4);
      }

      // 63.2% guide
      line(ctx, X(1), Y(3.16), w - R, Y(3.16), '#c9bfa8', 1, [4, 4]);
      line(ctx, X(1), Y(3.16), X(1), h - B, '#c9bfa8', 1, [4, 4]);
      font(ctx, 11); ctx.fillStyle = AMBER; ctx.textAlign = 'left';
      ctx.fillText('63.2%', X(1) + 6, Y(3.16) - 7);

      // curve
      ctx.beginPath();
      for (let k = 0; k <= 240; k++) {
        const u = (5 * k) / 240;
        const v = 5 * (1 - Math.exp(-u));
        if (k === 0) ctx.moveTo(X(u), Y(v)); else ctx.lineTo(X(u), Y(v));
      }
      ctx.strokeStyle = TEAL; ctx.lineWidth = 2.5; ctx.stroke();

      // moving dot
      const u = Math.min(state.u, 5);
      const v = 5 * (1 - Math.exp(-u));
      line(ctx, X(u), Y(v), X(u), h - B, AMBER, 1, [3, 3]);
      ctx.beginPath(); ctx.arc(X(u), Y(v), 6, 0, Math.PI * 2);
      ctx.fillStyle = AMBER; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();

      font(ctx, 12); ctx.fillStyle = INK; ctx.textAlign = 'center';
      ctx.fillText('时间（以时间常数 τ 为单位）', (L + w - R) / 2, h - 8);

      const tau = state.R * state.C;
      tauOut.textContent = tau >= 1000 ? fmt(tau / 1000, 2) + ' s' : fmt(tau, 1) + ' ms';
      tauV.textContent = '3.16 V';
    }

    function animate(dt) {
      if (!inView(c)) return;
      if (state.hold > 0) {
        state.hold -= dt;
        if (state.hold <= 0) state.u = 0;
      } else {
        state.u += dt * 0.95;
        if (state.u > 5.4) { state.u = 5.4; state.hold = 0.7; }
      }
      draw();
    }

    r.addEventListener('input', function () {
      state.R = parseFloat(r.value);
      rOut.textContent = fmt(state.R, 0) + ' kΩ';
      draw();
    });
    cap.addEventListener('input', function () {
      state.C = parseFloat(cap.value);
      cOut.textContent = fmt(state.C, 1) + ' μF';
      draw();
    });

    draws.push(draw);
    anims.push(animate);
    draw();
  })();

  /* ---------------- 09 damping ---------------- */
  (function () {
    const c = document.getElementById('dampCanvas');
    if (!c) return;
    const q = document.getElementById('qval');
    const qOut = document.getElementById('qvalOut');
    const zOut = document.getElementById('zetaOut');
    const sOut = document.getElementById('dampState');
    const state = { Q: 5 };

    function resp(t, Q) {
      const z = 1 / (2 * Q);
      if (z < 0.9999) {
        const wd = Math.sqrt(Math.max(0, 1 - z * z));
        return 1 - Math.exp(-z * t) * (Math.cos(wd * t) + (z / wd) * Math.sin(wd * t));
      }
      if (z < 1.0001) return 1 - Math.exp(-t) * (1 + t);
      const s1 = -z + Math.sqrt(z * z - 1);
      const s2 = -z - Math.sqrt(z * z - 1);
      return 1 + (s2 * Math.exp(s1 * t) - s1 * Math.exp(s2 * t)) / (s1 - s2);
    }

    function draw() {
      const f = fit(c);
      if (!f) return;
      const { ctx, w, h } = f;
      const L = 46, R = 18, T = 18, B = 38;
      const tmax = 12;
      const X = t => L + (t / tmax) * (w - L - R);
      const Y = v => h - B - ((v + 0.2) / 2.1) * (h - T - B);

      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);

      for (let i = 0; i <= 6; i++) {
        const xx = X((tmax / 6) * i);
        line(ctx, xx, T, xx, h - B, GRID, 1);
        font(ctx, 11); ctx.fillStyle = MUTED; ctx.textAlign = 'center';
        ctx.fillText(fmt((tmax / 6) * i, 0), xx, h - B + 18);
      }
      for (let i = 0; i <= 4; i++) {
        const val = -0.2 + (2.1 / 4) * i;
        line(ctx, L, Y(val), w - R, Y(val), GRID, 1);
        font(ctx, 11); ctx.fillStyle = MUTED; ctx.textAlign = 'right';
        ctx.fillText(fmt(val, 1), L - 8, Y(val) + 4);
      }

      // target
      line(ctx, L, Y(1), w - R, Y(1), '#c9bfa8', 1.5, [5, 4]);
      font(ctx, 11); ctx.fillStyle = '#9a8f77'; ctx.textAlign = 'left';
      ctx.fillText('目标值 1', L + 6, Y(1) - 7);

      // response
      ctx.beginPath();
      for (let k = 0; k <= 400; k++) {
        const t = (tmax * k) / 400;
        const v = resp(t, state.Q);
        if (k === 0) ctx.moveTo(X(t), Y(v)); else ctx.lineTo(X(t), Y(v));
      }
      ctx.strokeStyle = TEAL; ctx.lineWidth = 2.6; ctx.stroke();

      font(ctx, 12); ctx.fillStyle = INK; ctx.textAlign = 'center';
      ctx.fillText('归一化时间', (L + w - R) / 2, h - 8);

      const z = 1 / (2 * state.Q);
      zOut.textContent = fmt(z, 2);
      qOut.textContent = fmt(state.Q, 1);
      if (z > 1.02) sOut.textContent = '过阻尼';
      else if (z > 0.98) sOut.textContent = '临界阻尼';
      else sOut.textContent = '欠阻尼';
    }

    q.addEventListener('input', function () {
      state.Q = parseFloat(q.value);
      draw();
    });
    draws.push(draw);
    draw();
  })();

  /* ---------------- 10 phasor ---------------- */
  (function () {
    const c = document.getElementById('phasorCanvas');
    if (!c) return;
    const pr = document.getElementById('pr');
    const px = document.getElementById('px');
    const prOut = document.getElementById('prOut');
    const pxOut = document.getElementById('pxOut');
    const zO = document.getElementById('zOut');
    const phiO = document.getElementById('phiOut');
    const iO = document.getElementById('iOut');
    const state = { R: 3, XL: 4, ang: 0 };

    function draw() {
      const f = fit(c);
      if (!f) return;
      const { ctx, w, h } = f;
      const cx = w / 2, cy = h / 2;
      const rad = Math.min(w, h) * 0.34;

      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);

      // grid rings
      for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.arc(cx, cy, (rad / 3) * i, 0, Math.PI * 2);
        ctx.strokeStyle = '#efe9dd'; ctx.lineWidth = 1; ctx.stroke();
      }
      line(ctx, cx - rad - 14, cy, cx + rad + 14, cy, GRID, 1);
      line(ctx, cx, cy - rad - 14, cx, cy + rad + 14, GRID, 1);

      const Z = Math.hypot(state.R, state.XL);
      const phi = -Math.atan(state.XL / state.R);
      const Imag = 10 / Z;

      const vx = cx + rad * Math.cos(state.ang);
      const vy = cy - rad * Math.sin(state.ang);
      const iScale = Math.min(0.9, Math.max(0.3, Imag / 6));
      const ix = cx + rad * iScale * Math.cos(state.ang + phi);
      const iy = cy - rad * iScale * Math.sin(state.ang + phi);

      // voltage
      arrow(ctx, cx, cy, vx, vy, TEAL, 3);
      font(ctx, 13, 700); ctx.fillStyle = TEAL_DARK; ctx.textAlign = 'left';
      ctx.fillText('V', vx + 8, vy - 6);
      // current
      arrow(ctx, cx, cy, ix, iy, AMBER, 3);
      font(ctx, 13, 700); ctx.fillStyle = AMBER;
      ctx.fillText('I', ix + 8, iy + 14);

      // angle arc
      ctx.beginPath();
      ctx.arc(cx, cy, 42, state.ang + Math.min(0, phi), state.ang, false);
      ctx.strokeStyle = '#b9b09c'; ctx.lineWidth = 1.5; ctx.stroke();

      font(ctx, 11); ctx.fillStyle = MUTED; ctx.textAlign = 'center';
      ctx.fillText('电压相量固定，电流相量随阻抗转动', cx, h - 10);

      zO.textContent = fmt(Z, 1) + ' Ω';
      phiO.textContent = fmt((phi * 180) / Math.PI, 0) + '°';
      iO.textContent = fmt(Imag, 2) + ' A';
    }

    function arrow(ctx, x1, y1, x2, y2, color, width) {
      const a = Math.atan2(y2 - y1, x2 - x1);
      const len = 10;
      ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - len * Math.cos(a - 0.4), y2 - len * Math.sin(a - 0.4));
      ctx.lineTo(x2 - len * Math.cos(a + 0.4), y2 - len * Math.sin(a + 0.4));
      ctx.closePath(); ctx.fill();
    }

    function animate(dt) {
      if (!inView(c)) return;
      state.ang += dt * 0.7;
      if (state.ang > Math.PI * 2) state.ang -= Math.PI * 2;
      draw();
    }

    pr.addEventListener('input', function () {
      state.R = parseFloat(pr.value); prOut.textContent = fmt(state.R, 1) + ' Ω'; draw();
    });
    px.addEventListener('input', function () {
      state.XL = parseFloat(px.value); pxOut.textContent = fmt(state.XL, 1) + ' Ω'; draw();
    });
    draws.push(draw);
    anims.push(animate);
    draw();
  })();

  /* ---------------- 11 power ---------------- */
  (function () {
    const c = document.getElementById('powerCanvas');
    if (!c) return;
    const pf = document.getElementById('pf');
    const pfOut = document.getElementById('pfOut');
    const pOut = document.getElementById('pOut');
    const qOut = document.getElementById('qOut');
    const phiO = document.getElementById('phiPOut');
    const state = { pf: 0.5 };

    function draw() {
      const f = fit(c);
      if (!f) return;
      const { ctx, w, h } = f;
      const ox = 54, oy = h - 44;
      const span = Math.min(w - ox - 34, 360);
      const S = 1000;
      const P = S * state.pf;
      const Q = S * Math.sqrt(Math.max(0, 1 - state.pf * state.pf));
      const k = Math.min(span / S, (oy - 30) / S);

      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
      line(ctx, ox, oy, ox + span + 10, oy, GRID, 1);
      line(ctx, ox, oy, ox, oy - 220, GRID, 1);

      // triangle
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox + P * k, oy);
      ctx.lineTo(ox + P * k, oy - Q * k);
      ctx.closePath();
      ctx.fillStyle = 'rgba(216,241,236,.55)'; ctx.fill();
      ctx.strokeStyle = TEAL; ctx.lineWidth = 2.2; ctx.stroke();

      // P arrow
      line(ctx, ox, oy, ox + P * k, oy, TEAL_DARK, 2.5);
      font(ctx, 12, 700); ctx.fillStyle = TEAL_DARK; ctx.textAlign = 'center';
      ctx.fillText('P = ' + fmt(P, 0) + ' W', ox + (P * k) / 2, oy + 20);

      // Q arrow
      line(ctx, ox + P * k, oy, ox + P * k, oy - Q * k, AMBER, 2.5);
      ctx.save();
      ctx.translate(ox + P * k + 12, oy - (Q * k) / 2);
      ctx.textAlign = 'left';
      ctx.fillStyle = AMBER;
      ctx.fillText('Q = ' + fmt(Q, 0) + ' var', 0, 0);
      ctx.restore();

      // S label
      font(ctx, 12, 700); ctx.fillStyle = INK; ctx.textAlign = 'center';
      ctx.fillText('S = 1000 VA', ox + (P * k) / 2, oy - Q * k - 12);

      // angle
      const phi = Math.acos(state.pf);
      ctx.beginPath();
      ctx.arc(ox, oy, 46, -phi, 0, false);
      ctx.strokeStyle = '#b9b09c'; ctx.lineWidth = 1.2; ctx.stroke();
      font(ctx, 11); ctx.fillStyle = MUTED; ctx.textAlign = 'left';
      ctx.fillText('φ = ' + fmt((phi * 180) / Math.PI, 0) + '°', ox + 52, oy - 14);

      pfOut.textContent = fmt(state.pf, 2);
      pOut.textContent = fmt(P, 0) + ' W';
      qOut.textContent = fmt(Q, 0) + ' var';
      phiO.textContent = fmt((phi * 180) / Math.PI, 0) + '°';
    }

    pf.addEventListener('input', function () {
      state.pf = parseFloat(pf.value); draw();
    });
    draws.push(draw);
    draw();
  })();

  /* ---------------- 12 Bode ---------------- */
  (function () {
    const c = document.getElementById('bodeCanvas');
    if (!c) return;
    const fc = document.getElementById('fc');
    const fcOut = document.getElementById('fcOut');
    const atOut = document.getElementById('bodeAt');
    const kneeOut = document.getElementById('bodeKnee');
    const state = { fc: 1000 };

    function draw() {
      const f = fit(c);
      if (!f) return;
      const { ctx, w, h } = f;
      const L = 50, R = 18, T = 18, B = 60;
      const lo = Math.log10(state.fc) - 2;
      const hi = Math.log10(state.fc) + 2;
      const X = fq => L + ((Math.log10(fq) - lo) / (hi - lo)) * (w - L - R);
      const Y = db => h - B - ((db + 45) / 50) * (h - T - B);

      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);

      for (let d = Math.ceil(lo); d <= Math.floor(hi); d++) {
        const xx = X(Math.pow(10, d));
        line(ctx, xx, T, xx, h - B, GRID, 1);
        font(ctx, 11); ctx.fillStyle = MUTED; ctx.textAlign = 'center';
        ctx.fillText('10' + sup(d), xx, h - B + 14);
      }
      for (let db = 0; db >= -40; db -= 10) {
        line(ctx, L, Y(db), w - R, Y(db), GRID, 1);
        font(ctx, 11); ctx.fillStyle = MUTED; ctx.textAlign = 'right';
        ctx.fillText(db + ' dB', L - 8, Y(db) + 4);
      }

      // asymptote
      line(ctx, L, Y(0), X(state.fc), Y(0), '#c9bfa8', 1.5, [5, 4]);
      line(ctx, X(state.fc), Y(0), w - R, Y(-40), '#c9bfa8', 1.5, [5, 4]);

      // exact
      ctx.beginPath();
      const n = 260;
      for (let k = 0; k <= n; k++) {
        const lf = lo + ((hi - lo) * k) / n;
        const fq = Math.pow(10, lf);
        const db = -10 * Math.log10(1 + Math.pow(fq / state.fc, 2));
        if (k === 0) ctx.moveTo(X(fq), Y(db)); else ctx.lineTo(X(fq), Y(db));
      }
      ctx.strokeStyle = TEAL; ctx.lineWidth = 2.6; ctx.stroke();

      // knee
      ctx.beginPath(); ctx.arc(X(state.fc), Y(-3), 5, 0, Math.PI * 2);
      ctx.fillStyle = AMBER; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      font(ctx, 11); ctx.fillStyle = AMBER; ctx.textAlign = 'left';
      ctx.fillText('−3 dB', X(state.fc) + 8, Y(-3) - 8);

      font(ctx, 12); ctx.fillStyle = INK; ctx.textAlign = 'center';
      ctx.fillText('频率（对数坐标）', (L + w - R) / 2, h - 4);

      fcOut.textContent = state.fc >= 1000 ? fmt(state.fc / 1000, 1) + ' kHz' : fmt(state.fc, 0) + ' Hz';
      atOut.textContent = '−20 dB';
      kneeOut.textContent = '−3 dB';
    }

    function sup(n) {
      const map = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
      return String(n).split('').map(ch => map[ch] || ch).join('');
    }

    fc.addEventListener('input', function () {
      state.fc = parseFloat(fc.value); draw();
    });
    draws.push(draw);
    draw();
  })();

  /* ---------------- 14 Fourier ---------------- */
  (function () {
    const c = document.getElementById('fourierCanvas');
    if (!c) return;
    const harm = document.getElementById('harm');
    const harmOut = document.getElementById('harmOut');
    const fundOut = document.getElementById('fundOut');
    const state = { n: 5 };

    function target(t) {
      const x = ((t % 1) + 1) % 1;
      return x < 0.5 ? 1 : -1;
    }

    function partial(t, n) {
      let s = 0;
      for (let i = 0; i < n; i++) {
        const k = 2 * i + 1;
        s += (4 / (Math.PI * k)) * Math.sin(2 * Math.PI * k * t);
      }
      return s;
    }

    function draw() {
      const f = fit(c);
      if (!f) return;
      const { ctx, w, h } = f;
      const L = 44, R = 18, T = 18, B = 38;
      const X = t => L + (t / 2) * (w - L - R);
      const Y = v => h - B - ((v + 1.45) / 2.9) * (h - T - B);

      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);

      for (let i = 0; i <= 4; i++) {
        const xx = X(i * 0.5);
        line(ctx, xx, T, xx, h - B, GRID, 1);
        font(ctx, 11); ctx.fillStyle = MUTED; ctx.textAlign = 'center';
        ctx.fillText(fmt(i * 0.5, 1), xx, h - B + 18);
      }
      line(ctx, L, Y(0), w - R, Y(0), GRID, 1);
      line(ctx, L, Y(1), w - R, Y(1), '#f0e7d6', 1);
      line(ctx, L, Y(-1), w - R, Y(-1), '#f0e7d6', 1);

      // target square
      ctx.beginPath();
      for (let k = 0; k < 400; k++) {
        const t = (2 * k) / 400;
        const v = target(t);
        if (k === 0) ctx.moveTo(X(t), Y(v)); else ctx.lineTo(X(t), Y(v));
      }
      ctx.strokeStyle = '#c9bfa8'; ctx.lineWidth = 1.6; ctx.setLineDash([5, 4]); ctx.stroke();
      ctx.setLineDash([]);

      // partial sum
      ctx.beginPath();
      for (let k = 0; k <= 800; k++) {
        const t = (2 * k) / 800;
        const v = partial(t, state.n);
        if (k === 0) ctx.moveTo(X(t), Y(v)); else ctx.lineTo(X(t), Y(v));
      }
      ctx.strokeStyle = TEAL; ctx.lineWidth = 2.4; ctx.stroke();

      font(ctx, 11); ctx.fillStyle = '#9a8f77'; ctx.textAlign = 'left';
      ctx.fillText('虚线：理想方波', L + 6, T + 14);
      ctx.fillStyle = TEAL_DARK;
      ctx.fillText('实线：有限项合成', L + 6, T + 32);

      font(ctx, 12); ctx.fillStyle = INK; ctx.textAlign = 'center';
      ctx.fillText('时间（周期）', (L + w - R) / 2, h - 8);

      harmOut.textContent = state.n + ' 项';
      fundOut.textContent = '1 kHz';
    }

    harm.addEventListener('input', function () {
      state.n = parseInt(harm.value, 10); draw();
    });
    draws.push(draw);
    draw();
  })();

  /* ---------------- 15 transformer ---------------- */
  (function () {
    const c = document.getElementById('xfmrCanvas');
    if (!c) return;
    const turns = document.getElementById('turns');
    const turnsOut = document.getElementById('turnsOut');
    const v2Out = document.getElementById('v2Out');
    const zinOut = document.getElementById('zinOut');
    const i2Out = document.getElementById('i2Out');
    const state = { N: 2 };

    function coil(ctx, x, top, bot, loops, color, dir) {
      const step = (bot - top) / loops;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      for (let i = 0; i < loops; i++) {
        const y0 = top + i * step;
        const y1 = y0 + step;
        ctx.moveTo(x, y0);
        ctx.bezierCurveTo(x + dir * 18, y0 + step * 0.25, x + dir * 18, y1 - step * 0.25, x, y1);
      }
      ctx.stroke();
    }

    function draw() {
      const f = fit(c);
      if (!f) return;
      const { ctx, w, h } = f;
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2;
      const top = 64;
      const bot = h - 64;
      const left = cx - 120;
      const right = cx + 120;
      const N2 = Math.max(2, Math.min(18, Math.round(5 * state.N)));

      // core
      line(ctx, cx - 6, top - 10, cx - 6, bot + 10, '#8a8f9c', 3);
      line(ctx, cx + 6, top - 10, cx + 6, bot + 10, '#8a8f9c', 3);

      // coils
      coil(ctx, cx - 34, top, bot, 5, TEAL, -1);
      coil(ctx, cx + 34, top, bot, N2, AMBER, 1);

      // leads
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 34, top); ctx.lineTo(left, top); ctx.lineTo(left, top + 18);
      ctx.moveTo(cx - 34, bot); ctx.lineTo(left, bot); ctx.lineTo(left, bot - 18);
      ctx.moveTo(cx + 34, top); ctx.lineTo(right, top); ctx.lineTo(right, top + 26);
      ctx.moveTo(cx + 34, bot); ctx.lineTo(right, bot); ctx.lineTo(right, bot - 26);
      ctx.stroke();

      // load resistor
      const rw = 22;
      const rt = top + 26;
      const rb = bot - 26;
      line(ctx, right, rt, right, rb, '#fff', 6);
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = AMBER;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.rect(right - rw / 2, rt, rw, rb - rt);
      ctx.fill();
      ctx.stroke();

      // dots
      ctx.fillStyle = TEAL;
      ctx.beginPath(); ctx.arc(cx - 34, top + 8, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = AMBER;
      ctx.beginPath(); ctx.arc(cx + 34, top + 8, 4, 0, Math.PI * 2); ctx.fill();

      // labels
      font(ctx, 12, 700); ctx.fillStyle = TEAL_DARK; ctx.textAlign = 'center';
      ctx.fillText('一次侧', cx - 78, top - 22);
      ctx.fillStyle = AMBER;
      ctx.fillText('二次侧', cx + 82, top - 22);

      font(ctx, 13, 700); ctx.fillStyle = TEAL_DARK; ctx.textAlign = 'right';
      ctx.fillText('10 V', left - 8, (top + bot) / 2 + 5);
      ctx.fillStyle = AMBER; ctx.textAlign = 'center';
      ctx.fillText(fmt(10 * state.N, 1) + ' V', (cx + 34 + right) / 2, top + 34);

      font(ctx, 11, 400); ctx.fillStyle = MUTED; ctx.textAlign = 'center';
      ctx.fillText('1 : ' + fmt(state.N, 1), cx, bot + 36);
      ctx.fillText('8 Ω 负载', right, bot + 22);

      turnsOut.textContent = fmt(state.N, 1);
      v2Out.textContent = fmt(10 * state.N, 1) + ' V';
      zinOut.textContent = fmt(state.N * state.N * 8, 1) + ' Ω';
      i2Out.textContent = fmt((10 * state.N) / 8, 2) + ' A';
    }

    turns.addEventListener('input', function () {
      state.N = parseFloat(turns.value); draw();
    });
    draws.push(draw);
    draw();
  })();

  /* ---------------- tabs ---------------- */
  (function () {
    const wrap = document.getElementById('methodTabs');
    if (!wrap) return;
    const buttons = wrap.querySelectorAll('.tab');
    buttons.forEach(btn => {
      btn.addEventListener('click', function () {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.tab-body').forEach(b => b.classList.remove('active'));
        const target = document.getElementById('tab-' + btn.dataset.tab);
        if (target) target.classList.add('active');
      });
    });
  })();

  /* ---------------- animated two-terminal element ---------------- */
  (function () {
    const c = document.getElementById('refCanvas');
    if (!c) return;
    const vBtn = document.getElementById('refVBtn');
    const iBtn = document.getElementById('refIBtn');
    const vOut = document.getElementById('refVOut');
    const iOut = document.getElementById('refIOut');
    const pOut = document.getElementById('refPOut');
    const stOut = document.getElementById('refState');
    const state = { v: 6, i: 2, t: 0 };

    function draw() {
      const f = fit(c);
      if (!f) return;
      const { ctx, w, h } = f;
      const cx = w / 2, cy = h / 2;
      const bw = Math.min(150, w * 0.26), bh = Math.min(110, h * 0.34);

      line(ctx, cx, cy - bh / 2, cx, 26, '#475569', 2.4);
      line(ctx, cx, cy + bh / 2, cx, h - 26, '#475569', 2.4);

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(cx - bw / 2, cy - bh / 2, bw, bh, 10);
      ctx.fillStyle = '#fffdf8';
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2.4;
      ctx.stroke();
      ctx.restore();
      font(ctx, 12, 700); ctx.fillStyle = '#3a3f4b'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('二端元件', cx, cy);

      const plusTop = state.v > 0;
      font(ctx, 18, 700); ctx.fillStyle = '#dc2626';
      ctx.fillText(plusTop ? '+' : '−', cx - bw / 2 - 22, cy - bh / 4);
      ctx.fillText(plusTop ? '−' : '+', cx - bw / 2 - 22, cy + bh / 4);
      font(ctx, 11); ctx.fillStyle = '#8a3f06'; ctx.textAlign = 'right';
      ctx.fillText('v', cx - bw / 2 - 40, cy - 2);

      const ax = cx + bw / 2 + 46;
      const yTop = cy - bh / 2 - 8, yBot = cy + bh / 2 + 8;
      const dir = state.i > 0 ? 1 : -1;
      line(ctx, ax, yTop, ax, yBot, '#2563eb', 2.2);
      const tipY = dir > 0 ? yBot : yTop;
      ctx.beginPath();
      ctx.moveTo(ax - 6, tipY - dir * 10);
      ctx.lineTo(ax + 6, tipY - dir * 10);
      ctx.lineTo(ax, tipY);
      ctx.closePath();
      ctx.fillStyle = '#2563eb'; ctx.fill();
      const len = yBot - yTop;
      for (let k = 0; k < 3; k++) {
        let u = (state.t * Math.abs(state.i) * 0.35 + k / 3) % 1;
        let y = dir > 0 ? yTop + u * len : yBot - u * len;
        ctx.beginPath(); ctx.arc(ax, y, 3.2, 0, Math.PI * 2);
        ctx.fillStyle = '#2563eb'; ctx.fill();
      }
      font(ctx, 11); ctx.fillStyle = '#1d4ed8'; ctx.textAlign = 'left';
      ctx.fillText('i', ax + 12, cy - 4);

      const p = state.v * state.i;
      font(ctx, 13, 700); ctx.textAlign = 'center';
      ctx.fillStyle = p >= 0 ? TEAL : AMBER;
      ctx.fillText('p = vi = ' + (p >= 0 ? '+' : '') + p.toFixed(0) + ' W', cx, h - 12);

      vOut.textContent = (state.v > 0 ? '+' : '') + state.v + ' V';
      iOut.textContent = (state.i > 0 ? '+' : '') + state.i + ' A';
      pOut.textContent = (p >= 0 ? '+' : '') + p.toFixed(0) + ' W';
      stOut.textContent = p > 0 ? '吸收功率' : (p < 0 ? '发出功率' : '不耗不供');
      stOut.style.color = p >= 0 ? TEAL_DARK : AMBER;
    }

    function animate(dt) {
      if (!inView(c)) return;
      state.t += dt;
      draw();
    }

    vBtn.addEventListener('click', function () { state.v = -state.v; draw(); });
    iBtn.addEventListener('click', function () { state.i = -state.i; draw(); });
    draws.push(draw);
    anims.push(animate);
    draw();
  })();

  /* ---------------- animated KCL surface ---------------- */
  (function () {
    const c = document.getElementById('kclCanvas');
    if (!c) return;
    const s1 = document.getElementById('kcl1'), s2 = document.getElementById('kcl2'), s3 = document.getElementById('kcl3');
    const o1 = document.getElementById('kcl1Out'), o2 = document.getElementById('kcl2Out'), o3 = document.getElementById('kcl3Out');
    const o4 = document.getElementById('kcl4Out');
    const state = { i1: 2, i2: -1, i3: 0.5, t: 0 };

    function draw() {
      const f = fit(c);
      if (!f) return;
      const { ctx, w, h } = f;
      const cx = w / 2, cy = h / 2 + 4;
      const rx = Math.min(118, w * 0.22), ry = Math.min(80, h * 0.28);
      const i4 = -(state.i1 + state.i2 + state.i3);

      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(216,241,236,.45)';
      ctx.fill();
      ctx.setLineDash([7, 6]);
      ctx.strokeStyle = TEAL;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
      font(ctx, 12, 700); ctx.fillStyle = TEAL_DARK; ctx.textAlign = 'center';
      ctx.fillText('KCL 包围面', cx, cy - ry - 12);

      const branches = [
        { a: 0, val: state.i1, label: 'i₁', color: AMBER },
        { a: Math.PI, val: state.i2, label: 'i₂', color: TEAL },
        { a: -Math.PI / 3, val: state.i3, label: 'i₃', color: PURPLE },
        { a: Math.PI * 2 / 3, val: i4, label: 'i₄', color: BLUE }
      ];
      branches.forEach(function (b) {
        const ex = cx + Math.cos(b.a) * rx;
        const ey = cy + Math.sin(b.a) * ry;
        const ux = Math.cos(b.a), uy = Math.sin(b.a);
        const a = 48;
        const ox = ex + ux * a, oy = ey + uy * a;
        line(ctx, ex, ey, ox, oy, b.color, 2.4);
        const out = b.val >= 0;
        const tx = out ? ox : ex, ty = out ? oy : ey;
        ctx.beginPath();
        ctx.moveTo(tx - ux * 9 - uy * 5, ty - uy * 9 + ux * 5);
        ctx.lineTo(tx - ux * 9 + uy * 5, ty - uy * 9 - ux * 5);
        ctx.lineTo(tx, ty);
        ctx.closePath();
        ctx.fillStyle = b.color; ctx.fill();
        const labX = ox + ux * 9, labY = oy + uy * 9;
        font(ctx, 11, 700); ctx.fillStyle = b.color;
        ctx.textAlign = ux > 0.2 ? 'left' : (ux < -0.2 ? 'right' : 'center');
        ctx.textBaseline = 'middle';
        ctx.fillText(b.label + (b.val >= 0 ? ' 出' : ' 入'), labX, labY);
        const speed = Math.min(1.2, Math.abs(b.val) * 0.28);
        for (let k = 0; k < 3; k++) {
          let u = (state.t * speed + k / 3) % 1;
          if (!out) u = 1 - u;
          const px = ex + (ox - ex) * u, py = ey + (oy - ey) * u;
          ctx.beginPath(); ctx.arc(px, py, 2.8, 0, Math.PI * 2);
          ctx.fillStyle = b.color; ctx.fill();
        }
      });

      o1.textContent = state.i1.toFixed(1) + ' A';
      o2.textContent = state.i2.toFixed(1) + ' A';
      o3.textContent = state.i3.toFixed(1) + ' A';
      o4.textContent = i4.toFixed(1) + ' A';
    }

    function animate(dt) {
      if (!inView(c)) return;
      state.t += dt;
      draw();
    }
    function bind(el, key, out) {
      el.addEventListener('input', function () {
        state[key] = parseFloat(el.value);
        out.textContent = state[key].toFixed(1) + ' A';
        draw();
      });
    }
    bind(s1, 'i1', o1); bind(s2, 'i2', o2); bind(s3, 'i3', o3);
    draws.push(draw); anims.push(animate); draw();
  })();

  /* ---------------- mesh / nodal animated circuit ---------------- */
  (function () {
    const c = document.getElementById('methodCanvas');
    if (!c) return;
    const vsEl = document.getElementById('mVs'), r2El = document.getElementById('mR2');
    const vsOut = document.getElementById('mVsOut'), r2Out = document.getElementById('mR2Out');
    const aOut = document.getElementById('mAOut'), bOut = document.getElementById('mBOut');
    const i1Out = document.getElementById('mI1Out'), i2Out = document.getElementById('mI2Out');
    const eqEl = document.getElementById('methodEq');
    const state = { vs: 12, r2: 6, t: 0 };
    const R1 = 2, R3 = 3, R4 = 6;

    function solve() {
      const vs = state.vs, r2 = state.r2;
      const detM = (R1 + r2) * (r2 + R3 + R4) - r2 * r2;
      const im1 = vs * (r2 + R3 + R4) / detM;
      const im2 = vs * r2 / detM;
      const g11 = 1 / R1 + 1 / r2 + 1 / R3, g12 = -1 / R3, g22 = 1 / R3 + 1 / R4;
      const detG = g11 * g22 - g12 * g12;
      const va = (vs / R1 * g22) / detG;
      const vb = (g11 * 0 - g12 * vs / R1) / detG;
      return { im1: im1, im2: im2, va: va, vb: vb };
    }

    function resBox(ctx, x, y, bw, bh, label) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x - bw / 2, y - bh / 2, bw, bh, 5);
      ctx.fillStyle = '#fffdf8'; ctx.fill();
      ctx.strokeStyle = AMBER; ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
      font(ctx, 10, 700); ctx.fillStyle = '#8a3f06'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, x, y);
    }

    function draw() {
      const f = fit(c);
      if (!f) return;
      const { ctx, w, h } = f;
      const mode = (document.querySelector('#methodTabs .tab.active') || {}).dataset ? document.querySelector('#methodTabs .tab.active').dataset.tab : 'nodal';
      const x0 = 54, x1 = w - 54, y0 = 50, y1 = h - 58;
      const xm = (x0 + x1) / 2;
      const res = solve();

      line(ctx, x0, y0, x1, y0, '#475569', 2.2);
      line(ctx, x0, y1, x1, y1, '#475569', 2.2);
      line(ctx, x0, y0, x0, y1, '#475569', 2.2);
      line(ctx, x1, y0, x1, y1, '#475569', 2.2);
      line(ctx, xm, y0, xm, y1, '#475569', 2.2);

      resBox(ctx, (x0 + xm) / 2, y0, Math.min(70, (xm - x0) * 0.4), 22, 'R₁=2Ω');
      resBox(ctx, (xm + x1) / 2, y0, Math.min(70, (x1 - xm) * 0.4), 22, 'R₃=3Ω');
      const smallM = w < 430;
      resBox(ctx, xm, (y0 + y1) / 2, 22, Math.min(64, (y1 - y0) * 0.35), smallM ? 'R₂' : ('R₂=' + state.r2 + 'Ω'));
      resBox(ctx, x1, (y0 + y1) / 2, 22, Math.min(64, (y1 - y0) * 0.35), smallM ? 'R₄' : 'R₄=6Ω');

      const sy = (y0 + y1) / 2;
      ctx.save();
      ctx.beginPath(); ctx.arc(x0, sy, 17, 0, Math.PI * 2);
      ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 2.2; ctx.stroke();
      ctx.restore();
      font(ctx, 14, 700); ctx.fillStyle = '#dc2626'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('+', x0, sy - 7); ctx.fillText('−', x0, sy + 8);
      font(ctx, 10); ctx.fillStyle = '#8a3f06'; ctx.textAlign = 'right';
      ctx.textAlign = 'left';
      ctx.fillText('Vs=' + state.vs + 'V', x0 + 22, sy - 26);

      function nodeDot(x, y, color) {
        ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = color; ctx.fill();
      }
      nodeDot(xm, y0, TEAL); nodeDot(x1, y0, TEAL); nodeDot(xm, y1, '#8a8f9c');

      if (mode === 'mesh') {
        const left = [[x0, y0], [xm, y0], [xm, y1], [x0, y1]];
        const right = [[xm, y0], [x1, y0], [x1, y1], [xm, y1]];
        const loops = [{ pts: left, val: res.im1, color: TEAL, label: 'i₁' }, { pts: right, val: res.im2, color: AMBER, label: 'i₂' }];
        loops.forEach(function (lp, idx) {
          ctx.save();
          ctx.setLineDash([4, 5]);
          ctx.strokeStyle = lp.color; ctx.lineWidth = 1.3;
          ctx.beginPath();
          lp.pts.forEach(function (p, i) { if (i === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]); });
          ctx.closePath(); ctx.stroke(); ctx.restore();
          const total = 2 * ((xm - x0) + (y1 - y0));
          for (let k = 0; k < 5; k++) {
            let u = (state.t * (0.08 + Math.abs(lp.val) * 0.05) + k / 5) % 1;
            let d = u * total, px, py;
            const w1 = xm - x0, h1 = y1 - y0;
            if (d < w1) { px = x0 + d; py = y0; }
            else if (d < w1 + h1) { px = xm; py = y0 + (d - w1); }
            else if (d < 2 * w1 + h1) { px = xm - (d - w1 - h1); py = y1; }
            else { px = x0; py = y1 - (d - 2 * w1 - h1); }
            ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2);
            ctx.fillStyle = lp.color; ctx.fill();
          }
          font(ctx, 11, 700); ctx.fillStyle = lp.color; ctx.textAlign = 'center';
          ctx.fillText(lp.label + '=' + lp.val.toFixed(2) + 'A', idx === 0 ? (x0 + xm) / 2 : (xm + x1) / 2, y1 - 10);
        });
        eqEl.innerHTML = '(R₁+R₂)i₁ − R₂i₂ = Vs<br>−R₂i₁ + (R₂+R₃+R₄)i₂ = 0';
      } else {
        const pulse = 4 + Math.sin(state.t * 2.2) * 2;
        ctx.beginPath(); ctx.arc(xm, y0, 8 + pulse, 0, Math.PI * 2);
        ctx.strokeStyle = TEAL; ctx.lineWidth = 1.6; ctx.stroke();
        ctx.beginPath(); ctx.arc(x1, y0, 8 + pulse, 0, Math.PI * 2);
        ctx.strokeStyle = TEAL; ctx.lineWidth = 1.6; ctx.stroke();
        font(ctx, 11, 700); ctx.fillStyle = TEAL_DARK; ctx.textAlign = 'center';
        ctx.fillText(smallM ? 'vA' : ('vA=' + res.va.toFixed(2) + 'V'), xm, y0 - 18);
        ctx.fillText(smallM ? 'vB' : ('vB=' + res.vb.toFixed(2) + 'V'), x1, y0 - 18);
        const bh = (y1 - y0) * 0.55;
        const hA = Math.max(4, Math.min(bh, res.va / state.vs * bh));
        const hB = Math.max(4, Math.min(bh, res.vb / state.vs * bh));
        line(ctx, xm - 26, y1, xm - 26, y1 - hA, TEAL, 7);
        line(ctx, x1 - 26, y1, x1 - 26, y1 - hB, TEAL, 7);
        eqEl.innerHTML = '(vA−Vs)/R₁ + vA/R₂ + (vA−vB)/R₃ = 0<br>(vB−vA)/R₃ + vB/R₄ = 0';
      }

      aOut.textContent = res.va.toFixed(2) + ' V';
      bOut.textContent = res.vb.toFixed(2) + ' V';
      i1Out.textContent = res.im1.toFixed(2) + ' A';
      i2Out.textContent = res.im2.toFixed(2) + ' A';
    }

    function animate(dt) {
      if (!inView(c)) return;
      state.t += dt;
      draw();
    }
    vsEl.addEventListener('input', function () { state.vs = parseFloat(vsEl.value); vsOut.textContent = state.vs + ' V'; draw(); });
    r2El.addEventListener('input', function () { state.r2 = parseFloat(r2El.value); r2Out.textContent = state.r2 + ' Ω'; draw(); });
    document.querySelectorAll('#methodTabs .tab').forEach(function (b) {
      b.addEventListener('click', function () { setTimeout(draw, 0); });
    });
    draws.push(draw); anims.push(animate); draw();
  })();

  /* ---------------- controlled sources ---------------- */
  (function () {
    const c = document.getElementById('depCanvas');
    if (!c) return;
    const tabs = document.querySelectorAll('#depTabs .tab');
    const kEl = document.getElementById('depK');
    const kOut = document.getElementById('depKOut');
    const typeEl = document.getElementById('depType');
    const outEl = document.getElementById('depOut');
    const eqEl = document.getElementById('depEq');
    const state = { type: 'vcvs', k: 2, t: 0 };

    function calc() {
      const k = state.k, vx = 2, ix = 1.5;
      if (state.type === 'vcvs') return { v: k * vx, unit: 'V', name: 'VCVS', eq: 'v_c = μ v_x', ctrl: 'v_x = 2 V', out: 'μ = ' + k.toFixed(1) };
      if (state.type === 'vccs') return { v: k * vx, unit: 'A', name: 'VCCS', eq: 'i_c = g_m v_x', ctrl: 'v_x = 2 V', out: 'g_m = ' + k.toFixed(1) + ' S' };
      if (state.type === 'ccvs') return { v: k * ix, unit: 'V', name: 'CCVS', eq: 'v_c = r_m i_x', ctrl: 'i_x = 1.5 A', out: 'r_m = ' + k.toFixed(1) + ' Ω' };
      return { v: k * ix, unit: 'A', name: 'CCCS', eq: 'i_c = β i_x', ctrl: 'i_x = 1.5 A', out: 'β = ' + k.toFixed(1) };
    }

    function draw() {
      const f = fit(c);
      if (!f) return;
      const { ctx, w, h } = f;
      const cx = w / 2, cy = h / 2;
      const r = Math.min(54, h * 0.24);
      const info = calc();

      line(ctx, 26, cy, cx - r * 1.5, cy, '#475569', 2.2);
      ctx.beginPath(); ctx.moveTo(cx - r * 1.5, cy); ctx.lineTo(cx - r * 1.5 - 9, cy - 5); ctx.lineTo(cx - r * 1.5 - 9, cy + 5); ctx.closePath();
      ctx.fillStyle = '#0f766e'; ctx.fill();
      font(ctx, 9, 700); ctx.fillStyle = '#0b5d57'; ctx.textAlign = 'left';
      ctx.fillText(info.ctrl, 18, cy - 10);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r * 1.25, cy); ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r * 1.25, cy);
      ctx.closePath();
      ctx.fillStyle = '#f5f0ff'; ctx.fill();
      ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 2.2; ctx.stroke();
      ctx.restore();
      font(ctx, 11, 700); ctx.fillStyle = '#6d28d9'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(info.name, cx, cy + 2);

      line(ctx, cx + r * 1.25, cy, w - 30, cy, '#475569', 2.2);
      ctx.beginPath(); ctx.moveTo(w - 30, cy); ctx.lineTo(w - 39, cy - 5); ctx.lineTo(w - 39, cy + 5); ctx.closePath();
      ctx.fillStyle = '#b45309'; ctx.fill();
      font(ctx, 9, 700); ctx.fillStyle = '#8a3f06'; ctx.textAlign = 'right';
      ctx.fillText((info.unit === 'V' ? 'v_c' : 'i_c') + '=' + info.v.toFixed(2) + info.unit, w - 10, cy - 24);

      typeEl.textContent = info.name + ' · ' + info.out;
      outEl.textContent = info.v.toFixed(2) + ' ' + info.unit;
      eqEl.innerHTML = info.eq + '<br>' + info.ctrl + ' → ' + (info.unit === 'V' ? 'v_c' : 'i_c') + ' = ' + info.v.toFixed(2) + ' ' + info.unit;
    }

    function animate(dt) { if (!inView(c)) return; state.t += dt; draw(); }
    tabs.forEach(function (b) {
      b.addEventListener('click', function () {
        tabs.forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        state.type = b.dataset.dep;
        draw();
      });
    });
    kEl.addEventListener('input', function () { state.k = parseFloat(kEl.value); kOut.textContent = state.k.toFixed(1); draw(); });
    draws.push(draw); anims.push(animate); draw();
  })();

  /* ---------------- supernode pack / unpack ---------------- */
  (function () {
    const c = document.getElementById('superCanvas');
    if (!c) return;
    const btn = document.getElementById('superBtn');
    const st = document.getElementById('superState');
    const eq = document.getElementById('superEq');
    const state = { packed: false, t: 0 };

    function draw() {
      const f = fit(c);
      if (!f) return;
      const { ctx, w, h } = f;
      const ax = w * 0.32, bx = w * 0.68, ny = h * 0.28, gy = h - 42;
      const sy = (ny + gy) / 2;

      line(ctx, ax, ny, bx, ny, '#475569', 2.2);
      ctx.save();
      ctx.beginPath(); ctx.arc((ax + bx) / 2, ny, 16, 0, Math.PI * 2);
      ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
      font(ctx, 12, 700); ctx.fillStyle = '#dc2626'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('+', (ax + bx) / 2, ny - 6); ctx.fillText('−', (ax + bx) / 2, ny + 7);
      font(ctx, 9); ctx.fillStyle = '#8a3f06'; ctx.fillText('Vs=6V', (ax + bx) / 2, ny - 24);

      [ax, bx].forEach(function (x) {
        line(ctx, x, ny, x, gy, '#475569', 2.2);
        line(ctx, x, sy - 14, x, sy + 14, AMBER, 7);
        line(ctx, x, gy, x, gy + 8, '#475569', 2.2);
        line(ctx, x - 10, gy + 8, x + 10, gy + 8, '#475569', 2);
        line(ctx, x - 6, gy + 13, x + 6, gy + 13, '#475569', 2);
      });
      font(ctx, 10, 700); ctx.fillStyle = '#8a3f06'; ctx.textAlign = 'left';
      ctx.fillText('R₁', ax + 10, sy);
      ctx.fillText('R₂', bx + 10, sy);

      [[ax, 'vA'], [bx, 'vB']].forEach(function (p) {
        ctx.beginPath(); ctx.arc(p[0], ny, 4, 0, Math.PI * 2);
        ctx.fillStyle = TEAL; ctx.fill();
        font(ctx, 10, 700); ctx.fillStyle = TEAL_DARK; ctx.textAlign = 'center';
        ctx.fillText(p[1], p[0], ny - 12);
      });

      if (state.packed) {
        const x0 = ax - 46, x1 = bx + 46, y0 = ny - 36, y1 = gy + 18;
        ctx.save();
        ctx.setLineDash([7, 6]);
        ctx.lineDashOffset = -state.t * 14;
        ctx.strokeStyle = AMBER; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(x0, y0, x1 - x0, y1 - y0, 14); ctx.stroke();
        ctx.restore();
        font(ctx, 11, 700); ctx.fillStyle = AMBER; ctx.textAlign = 'center';
        ctx.fillText('超节点', (ax + bx) / 2, y0 - 8);
      }

      st.textContent = state.packed ? '超节点：1 条 KCL + 1 条电压约束' : '普通节点：A、B 各 1 条 KCL';
      eq.innerHTML = state.packed
        ? 'KCL(包围面)：i₁ + i₂ = 0<br>电压约束：vA − vB = Vs'
        : 'KCL(A)：i₁ + i_AB = 0<br>KCL(B)：i₂ − i_AB = 0<br>外加：vA − vB = Vs';
    }
    function animate(dt) { if (!inView(c)) return; state.t += dt; draw(); }
    btn.addEventListener('click', function () {
      state.packed = !state.packed;
      btn.textContent = state.packed ? '拆开超节点' : '打包超节点';
      draw();
    });
    draws.push(draw); anims.push(animate); draw();
  })();

  /* ---------------- capacitor / inductor analogy ---------------- */
  (function () {
    const c = document.getElementById('clCanvas');
    if (!c) return;
    const btn = document.getElementById('clBtn');
    const driveEl = document.getElementById('clDrive');
    const driveOut = document.getElementById('clDriveOut');
    const modeEl = document.getElementById('clMode');
    const stateEl = document.getElementById('clState');
    const valEl = document.getElementById('clVal');
    const state = { mode: 'C', drive: 0.6, level: 0.42, speed: 0.2, angle: 0, t: 0 };

    function draw() {
      const f = fit(c);
      if (!f) return;
      const { ctx, w, h } = f;
      const cx = w / 2, cy = h / 2;

      if (state.mode === 'C') {
        const tw = Math.min(150, w * 0.3), th = Math.min(130, h * 0.55);
        const tx = cx - tw / 2, ty = cy - th / 2;
        ctx.save();
        ctx.beginPath(); ctx.roundRect(tx, ty, tw, th, 10); ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 2.2; ctx.stroke(); ctx.restore();
        const lvl = state.level * (th - 8);
        ctx.save(); ctx.beginPath(); ctx.roundRect(tx + 4, ty + th - 4 - lvl, tw - 8, lvl, 5);
        ctx.fillStyle = 'rgba(37,99,235,.28)'; ctx.fill(); ctx.restore();
        line(ctx, cx, ty, cx, ty - 32, '#475569', 2.2);
        ctx.beginPath(); ctx.moveTo(cx, ty - 32); ctx.lineTo(cx - 5, ty - 23); ctx.lineTo(cx + 5, ty - 23); ctx.closePath(); ctx.fillStyle = '#0f766e'; ctx.fill();
        font(ctx, 10, 700); ctx.fillStyle = '#0b5d57'; ctx.textAlign = 'left';
        ctx.fillText('i 流入', cx + 10, ty - 24);
        const yy = ty + th - 4 - lvl;
        ctx.beginPath(); ctx.arc(tx + tw + 18, yy, 4, 0, Math.PI * 2); ctx.fillStyle = '#2563eb'; ctx.fill();
        font(ctx, 11, 700); ctx.fillStyle = '#1d4ed8'; ctx.textAlign = 'left';
        ctx.fillText('v', tx + tw + 28, yy + 4);
        font(ctx, 12, 700); ctx.fillStyle = '#1d4ed8'; ctx.textAlign = 'center';
        ctx.fillText('v = q / C', cx, h - 12);
      } else {
        const r = Math.min(66, h * 0.26);
        ctx.save();
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = '#f5f0ff'; ctx.fill(); ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 2.4; ctx.stroke();
        ctx.translate(cx, cy); ctx.rotate(state.angle);
        for (let i = 0; i < 6; i++) {
          ctx.rotate(Math.PI / 3);
          line(ctx, 0, 0, r * 0.82, 0, '#7c3aed', 3);
        }
        ctx.restore();
        line(ctx, 30, cy, cx - r, cy, '#475569', 2.2);
        ctx.beginPath(); ctx.moveTo(cx - r, cy); ctx.lineTo(cx - r - 9, cy - 5); ctx.lineTo(cx - r - 9, cy + 5); ctx.closePath(); ctx.fillStyle = '#0f766e'; ctx.fill();
        font(ctx, 10, 700); ctx.fillStyle = '#0b5d57'; ctx.textAlign = 'left';
        ctx.fillText('i 通过', 30, cy - 12);
        font(ctx, 12, 700); ctx.fillStyle = '#6d28d9'; ctx.textAlign = 'center';
        ctx.fillText('v = L di/dt', cx, h - 12);
      }

      modeEl.textContent = state.mode === 'C' ? '电容' : '电感';
      const active = Math.abs(state.drive) > 0.02;
      stateEl.textContent = state.mode === 'C' ? (state.drive > 0 ? '充电' : '放电') : (active ? (state.drive > 0 ? '加速' : '减速') : '匀速');
      valEl.textContent = (state.mode === 'C' ? state.level : state.speed).toFixed(2);
    }

    function animate(dt) {
      if (!inView(c)) return;
      state.t += dt;
      if (state.mode === 'C') {
        state.level += state.drive * dt * 0.18;
        if (state.level > 0.95) state.level = 0.95;
        if (state.level < 0.05) state.level = 0.05;
      } else {
        state.speed += state.drive * dt * 0.55;
        state.speed = Math.max(-1, Math.min(1, state.speed));
        state.angle += state.speed * dt * 2.6;
      }
      draw();
    }
    btn.addEventListener('click', function () {
      state.mode = state.mode === 'C' ? 'L' : 'C';
      btn.textContent = state.mode === 'C' ? '切换：电容 / 电感' : '切换：电感 / 电容';
      draw();
    });
    driveEl.addEventListener('input', function () {
      state.drive = parseFloat(driveEl.value);
      driveOut.textContent = state.drive.toFixed(2);
      draw();
    });
    draws.push(draw); anims.push(animate); draw();
  })();

  /* ---------------- time domain vs s-domain ---------------- */
  (function () {
    const c = document.getElementById('sdCanvas');
    if (!c) return;
    const btn = document.getElementById('sdBtn');
    const modeEl = document.getElementById('sdMode');
    const eqEl = document.getElementById('sdEq');
    const state = { s: false, t: 0 };

    function card(ctx, x, y, w, h, title, color, active) {
      ctx.save();
      ctx.globalAlpha = active ? 1 : 0.42;
      ctx.beginPath(); ctx.roundRect(x, y, w, h, 10);
      ctx.fillStyle = '#fffdf8'; ctx.fill();
      ctx.strokeStyle = color; ctx.lineWidth = active ? 2.2 : 1.2; ctx.stroke();
      ctx.restore();
      font(ctx, 10, 700); ctx.fillStyle = color; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(title, x + 12, y + 15);
    }

    function draw() {
      const f = fit(c);
      if (!f) return;
      const { ctx, w, h } = f;
      const ch = Math.min(64, (h - 30) / 2);
      const ty = 10, by = h - ch - 10;
      card(ctx, 12, ty, w - 24, ch, '时域', TEAL, !state.s);
      card(ctx, 12, by, w - 24, ch, 's 域', AMBER, state.s);

      ctx.save();
      ctx.globalAlpha = state.s ? 0.4 : 1;
      const cy1 = ty + ch / 2 + 6;
      line(ctx, 44, cy1 - 18, 44, cy1 - 8, '#475569', 2);
      line(ctx, 32, cy1 - 8, 56, cy1 - 8, '#2563eb', 3);
      line(ctx, 32, cy1, 56, cy1, '#2563eb', 3);
      line(ctx, 44, cy1, 44, cy1 + 12, '#475569', 2);
      font(ctx, 10, 700); ctx.fillStyle = '#1d4ed8'; ctx.textAlign = 'left';
      ctx.fillText('i = C dv/dt', 70, cy1 - 2);
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = state.s ? 1 : 0.4;
      const cy2 = by + ch / 2 + 6;
      ctx.beginPath(); ctx.roundRect(34, cy2 - 16, 52, 26, 5);
      ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = AMBER; ctx.lineWidth = 2; ctx.stroke();
      font(ctx, 10, 700); ctx.fillStyle = '#8a3f06'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('1/sC', 60, cy2 - 3);
      line(ctx, 86, cy2 - 3, 104, cy2 - 3, '#475569', 2);
      ctx.beginPath(); ctx.arc(116, cy2 - 3, 12, 0, Math.PI * 2);
      ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 2; ctx.stroke();
      font(ctx, 11, 700); ctx.fillStyle = '#dc2626'; ctx.textAlign = 'center';
      ctx.fillText('+', 116, cy2 - 7); ctx.fillText('−', 116, cy2 + 4);
      font(ctx, 9, 700); ctx.fillStyle = '#8a3f06'; ctx.textAlign = 'left';
      ctx.fillText('v(0⁻)/s', 134, cy2 - 3);
      ctx.restore();

      modeEl.textContent = state.s ? 's 域' : '时域';
      eqEl.textContent = state.s ? 'V(s) = I(s)/(sC) + v(0⁻)/s' : 'i(t) = C dv/dt';
    }

    function animate(dt) { if (!inView(c)) return; state.t += dt; draw(); }
    btn.addEventListener('click', function () {
      state.s = !state.s;
      btn.textContent = state.s ? '切换回时域' : '切换到 s 域';
      draw();
    });
    draws.push(draw); anims.push(animate); draw();
  })();

  /* ---------------- KCL node ---------------- */
  (function () {
    const c = document.getElementById('kclNodeCanvas');
    if (!c) return;
    const a1 = document.getElementById('kn1'), a2 = document.getElementById('kn2');
    const o1 = document.getElementById('kn1Out'), o2 = document.getElementById('kn2Out'), o3 = document.getElementById('kn3Out');
    const state = { i1: 2, i2: -1, t: 0 };

    function draw() {
      const f = fit(c);
      if (!f) return;
      const { ctx, w, h } = f;
      const cx = w / 2, cy = h / 2 + 4;
      const i3 = -(state.i1 + state.i2);
      const branches = [
        { dx: 1, dy: 0, val: state.i1, label: 'i₁', color: AMBER },
        { dx: -1, dy: 0, val: state.i2, label: 'i₂', color: TEAL },
        { dx: 0, dy: -1, val: i3, label: 'i₃', color: PURPLE }
      ];
      branches.forEach(function (b) {
        const len = Math.min(w * 0.32, h * 0.28);
        const ex = cx + b.dx * len, ey = cy + b.dy * len;
        line(ctx, cx, cy, ex, ey, b.color, 2.4);
        const out = b.val >= 0;
        const tx = out ? ex : cx, ty = out ? ey : cy;
        const ux = b.dx, uy = b.dy, s = out ? 1 : -1;
        ctx.beginPath();
        ctx.moveTo(tx - ux * 9 - uy * 6, ty - uy * 9 + ux * 6);
        ctx.lineTo(tx - ux * 9 + uy * 6, ty - uy * 9 - ux * 6);
        ctx.lineTo(tx, ty);
        ctx.closePath(); ctx.fillStyle = b.color; ctx.fill();
        const lx = ex + (ux !== 0 ? ux * 14 : 0);
        const ly = uy === 0 ? cy + 4 : (uy < 0 ? ey + 18 : ey - 6);
        font(ctx, 12, 700); ctx.fillStyle = b.color;
        ctx.textAlign = ux !== 0 ? (ux > 0 ? 'left' : 'right') : 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(b.label, lx, ly);
        for (let k = 0; k < 3; k++) {
          let u = (state.t * Math.min(1, Math.abs(b.val) * 0.3) + k / 3) % 1;
          if (!out) u = 1 - u;
          ctx.beginPath(); ctx.arc(cx + (ex - cx) * u, cy + (ey - cy) * u, 3.2, 0, Math.PI * 2);
          ctx.fillStyle = b.color; ctx.fill();
        }
      });
      ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fillStyle = '#0f766e'; ctx.fill();
      font(ctx, 10, 700); ctx.fillStyle = TEAL_DARK; ctx.textAlign = 'center';
      ctx.fillText('节点', cx, cy + 22);

      o1.textContent = state.i1.toFixed(1) + ' A';
      o2.textContent = state.i2.toFixed(1) + ' A';
      o3.textContent = i3.toFixed(1) + ' A';
    }
    function animate(dt) { if (!inView(c)) return; state.t += dt; draw(); }
    a1.addEventListener('input', function () { state.i1 = parseFloat(a1.value); draw(); });
    a2.addEventListener('input', function () { state.i2 = parseFloat(a2.value); draw(); });
    draws.push(draw); anims.push(animate); draw();
  })();

  /* ---------------- KVL loop ---------------- */
  (function () {
    const c = document.getElementById('kvlCanvas');
    if (!c) return;
    const btn = document.getElementById('kvlBtn');
    const sumEl = document.getElementById('kvlSum');
    const stEl = document.getElementById('kvlState');
    const state = { u: 0, running: false, hold: 0, t: 0 };

    function valueAt(u) {
      if (u < 0.25) return 12 * (u / 0.25);
      if (u < 0.5) return 12 - 4 * ((u - 0.25) / 0.25);
      if (u < 0.75) return 8 - 8 * ((u - 0.5) / 0.25);
      return 0;
    }

    function draw() {
      const f = fit(c);
      if (!f) return;
      const { ctx, w, h } = f;
      const x0 = 58, x1 = w - 58, y0 = 48, y1 = h - 52;
      const sy = (y0 + y1) / 2;
      line(ctx, x0, y0, x1, y0, '#475569', 2.2);
      line(ctx, x1, y0, x1, y1, '#475569', 2.2);
      line(ctx, x1, y1, x0, y1, '#475569', 2.2);
      line(ctx, x0, y0, x0, y1, '#475569', 2.2);

      const active = state.u < 0.25 ? 'src' : (state.u < 0.5 ? 'r1' : (state.u < 0.75 ? 'r2' : ''));
      ctx.save(); ctx.beginPath(); ctx.arc(x0, sy, 17, 0, Math.PI * 2);
      ctx.fillStyle = '#fff'; ctx.fill();
      ctx.strokeStyle = '#dc2626'; ctx.lineWidth = active === 'src' ? 3.4 : 2; ctx.stroke(); ctx.restore();
      font(ctx, 13, 700); ctx.fillStyle = '#dc2626'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('+', x0, sy - 6); ctx.fillText('−', x0, sy + 7);
      font(ctx, 10, 700); ctx.fillStyle = '#8a3f06'; ctx.textAlign = 'left';
      ctx.fillText('12 V', x0 + 22, sy - 22);

      ctx.save(); ctx.beginPath(); ctx.roundRect((x0 + x1) / 2 - 32, y0 - 11, 64, 22, 5);
      ctx.fillStyle = '#fffdf8'; ctx.fill(); ctx.strokeStyle = AMBER; ctx.lineWidth = active === 'r1' ? 3.4 : 2; ctx.stroke(); ctx.restore();
      font(ctx, 10, 700); ctx.fillStyle = '#8a3f06'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('R₁=4Ω', (x0 + x1) / 2, y0);
      ctx.fillText('−4 V', (x0 + x1) / 2, y0 - 20);

      ctx.save(); ctx.beginPath(); ctx.roundRect(x1 - 11, sy - 32, 22, 64, 5);
      ctx.fillStyle = '#fffdf8'; ctx.fill(); ctx.strokeStyle = AMBER; ctx.lineWidth = active === 'r2' ? 3.4 : 2; ctx.stroke(); ctx.restore();
      font(ctx, 10, 700); ctx.fillStyle = '#8a3f06'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('R₂=8Ω', x1 + 16, sy - 8);
      ctx.fillText('−8 V', x1 + 16, sy + 10);

      const per = 2 * (y1 - y0) + 2 * (x1 - x0), d = state.u * per;
      let px, py;
      if (d < (y1 - y0)) { px = x0; py = y1 - d; }
      else if (d < (y1 - y0) + (x1 - x0)) { px = x0 + (d - (y1 - y0)); py = y0; }
      else if (d < 2 * (y1 - y0) + (x1 - x0)) { px = x1; py = y0 + (d - (y1 - y0) - (x1 - x0)); }
      else { px = x1 - (d - 2 * (y1 - y0) - (x1 - x0)); py = y1; }

      ctx.save();
      ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#0f766e'; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();

      const sum = valueAt(state.u);
      sumEl.textContent = sum.toFixed(1) + ' V';
      stEl.textContent = state.u >= 0.999 ? '回到起点：ΣV = 0' : (state.running ? '绕行中…' : '等待出发');
    }

    function animate(dt) {
      if (!inView(c)) return;
      if (!state.running) return;
      state.t += dt;
      if (state.hold > 0) { state.hold -= dt; if (state.hold <= 0) { state.u = 0; state.running = false; btn.textContent = '再绕一圈'; } draw(); return; }
      state.u += dt * 0.16;
      if (state.u >= 1) { state.u = 1; state.hold = 1.2; }
      draw();
    }

    btn.addEventListener('click', function () {
      if (state.u >= 1) state.u = 0;
      state.running = true; state.hold = 0; btn.textContent = '绕行中…'; draw();
    });
    draws.push(draw); anims.push(animate); draw();
  })();

  /* ---------------- two-port / transformer dots ---------------- */
  (function () {
    const c = document.getElementById('portCanvas');
    if (!c) return;
    const nEl = document.getElementById('portN'), nOut = document.getElementById('portNOut');
    const v2El = document.getElementById('portV2'), i2El = document.getElementById('portI2');
    const state = { N: 2, t: 0 };

    function draw() {
      const f = fit(c);
      if (!f) return;
      const { ctx, w, h } = f;
      const cy = h / 2;
      const lx = w * 0.32, rx = w * 0.68;
      const top = cy - 58, bot = cy + 58;

      // ports and coils
      line(ctx, 18, top, lx, top, '#475569', 2.2);
      line(ctx, 18, bot, lx, bot, '#475569', 2.2);
      line(ctx, rx, top, w - 18, top, '#475569', 2.2);
      line(ctx, rx, bot, w - 18, bot, '#475569', 2.2);

      function coil(x, color, phase) {
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.arc(x, top + 14 + i * 26, 12, -Math.PI / 2, Math.PI / 2, phase % 2 === 0);
          ctx.strokeStyle = color; ctx.lineWidth = 2.2; ctx.stroke();
        }
      }
      coil(lx, TEAL, 0); coil(rx, AMBER, 1);
      line(ctx, (lx + rx) / 2 - 5, top - 8, (lx + rx) / 2 - 5, bot + 8, '#8a8f9c', 2.6);
      line(ctx, (lx + rx) / 2 + 5, top - 8, (lx + rx) / 2 + 5, bot + 8, '#8a8f9c', 2.6);

      ctx.beginPath(); ctx.arc(lx, top - 8, 4, 0, Math.PI * 2); ctx.fillStyle = TEAL; ctx.fill();
      ctx.beginPath(); ctx.arc(rx, top - 8, 4, 0, Math.PI * 2); ctx.fillStyle = AMBER; ctx.fill();
      font(ctx, 9, 700); ctx.fillStyle = TEAL_DARK; ctx.textAlign = 'center';
      ctx.fillText('同名端', (lx + rx) / 2, top - 20);

      const v1 = 10, i1 = 2.5;
      const v2 = v1 * state.N, i2 = -i1 / state.N;
      font(ctx, 10, 700); ctx.fillStyle = TEAL_DARK; ctx.textAlign = 'right';
      ctx.fillText('v₁=10V', lx - 8, top - 8);
      ctx.fillText('i₁=2.5A', lx - 8, bot + 16);
      font(ctx, 10, 700); ctx.fillStyle = '#8a3f06'; ctx.textAlign = 'left';
      ctx.fillText('v₂=' + v2.toFixed(1) + 'V', rx + 8, top - 8);
      ctx.fillText('i₂=' + i2.toFixed(2) + 'A', rx + 8, bot + 16);

      for (let k = 0; k < 4; k++) {
        let u = (state.t * 0.5 + k / 4) % 1;
        ctx.beginPath(); ctx.arc(18 + u * (lx - 18), top, 3, 0, Math.PI * 2); ctx.fillStyle = TEAL; ctx.fill();
        ctx.beginPath(); ctx.arc(rx + u * (w - 18 - rx), bot, 3, 0, Math.PI * 2); ctx.fillStyle = AMBER; ctx.fill();
      }

      nOut.textContent = state.N.toFixed(1);
      v2El.textContent = v2.toFixed(1) + ' V';
      i2El.textContent = i2.toFixed(2) + ' A';
    }

    function animate(dt) { if (!inView(c)) return; state.t += dt; draw(); }
    nEl.addEventListener('input', function () { state.N = parseFloat(nEl.value); draw(); });
    draws.push(draw); anims.push(animate); draw();
  })();

  /* ---------------- per-chapter bridge ---------------- */
  (function () {
    const bridges = {
      math: ['初中数学', '把公式变成看得见的图', '电压、电流、电阻'],
      intro: ['数学工具箱', '电压、电流、电阻的物理图像', '三个基本量'],
      quantities: ['物理直觉', '可测量、参考方向与功率', 'KCL / KVL'],
      laws: ['端口 v-i 关系', '连接约束：KCL / KVL', '等效与系统求解'],
      equivalent: ['KCL / KVL', '复杂网络怎样变简单', '节点法 / 网孔法'],
      methods: ['等效化简', '通用地列方程', '受控源与运放'],
      active: ['KCL / KVL', '受控源、运放与反馈', '储能与动态'],
      storage: ['受控源', '电容、电感的记忆', '一阶电路'],
      firstorder: ['储能元件', '一个时间常数', '二阶电路'],
      secondorder: ['一阶电路', '两个储能元件与振荡', '正弦稳态'],
      phasor: ['二阶暂态', '正弦稳态的复数化', '功率与频响'],
      power: ['相量', '有功、无功与功率因数', '频率响应'],
      frequency: ['功率', '滤波、Bode 与带宽', '拉普拉斯'],
      laplace: ['频率响应', '微分方程变代数', '傅里叶'],
      fourier: ['拉普拉斯', '波形拆成频谱', '双口与变压器'],
      twoport: ['傅里叶 / 网络', '端口参数与变压器', '公式墙'],
      thread: ['全书章节', '六条线怎样互相换乘', '公式墙'],
      formula: ['全书章节', '一页纸速查', '自测与复习']
    };
    document.querySelectorAll('section.chapter').forEach(function (sec) {
      const b = bridges[sec.id];
      if (!b) return;
      const lead = sec.querySelector('.lead');
      if (!lead) return;
      const div = document.createElement('div');
      div.className = 'chapter-bridge';
      div.innerHTML = '<span>上游：<b>' + b[0] + '</b></span><span class="now">本章：' + b[1] + '</span><span>下游：<b>' + b[2] + '</b></span>';
      lead.parentNode.insertBefore(div, lead);
    });
  })();


  /* ---------------- PDF supplement reader ---------------- */
  (function () {
    const frame = document.getElementById('pdfFrame');
    if (!frame) return;
    const title = document.getElementById('pdfTitle');
    const open = document.getElementById('pdfOpen');
    const cards = Array.prototype.slice.call(document.querySelectorAll('.pdf-card'));
    cards.forEach(function (card) {
      card.addEventListener('click', function () {
        cards.forEach(function (c) { c.classList.remove('active'); });
        card.classList.add('active');
        const src = card.getAttribute('data-pdf');
        frame.src = src + '#view=FitH';
        title.textContent = card.getAttribute('data-title');
        open.href = src;
        open.hidden = false;
      });
    });
  })();

/* ---------------- animation loop ---------------- */
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    for (let i = 0; i < anims.length; i++) anims[i](dt);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  /* ---------------- resize ---------------- */
  let rt = null;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () { draws.forEach(fn => fn()); }, 120);
  });
})();


