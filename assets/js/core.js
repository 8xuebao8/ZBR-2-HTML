/* 公共功能：双语、导航、标签页、宝石选择、部件列表、测验
   Shared helpers: bilingual text, navigation, tabs, gem picker, parts list, quiz */
(function () {
  const G = (window.GemLab = window.GemLab || {});

  // 双语片段 Bilingual inline / block text
  G.T = (zh, en) => `<span class="zh">${zh}</span><span class="en">${en}</span>`;
  G.P = (zh, en) => `<p class="zh">${zh}</p><p class="en">${en}</p>`;
  G.$ = (sel, root = document) => root.querySelector(sel);
  G.$$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  G.instruments = [
    { id: 'microscope', file: 'microscope.html', icon: '🔬', zh: '宝石显微镜', en: 'Gem Microscope', dzh: '放大观察内含物与表面特征', den: 'Magnify inclusions and surface features' },
    { id: 'refractometer', file: 'refractometer.html', icon: '📏', zh: '折射仪', en: 'Refractometer', dzh: '测量折射率 RI 与双折射率', den: 'Measure refractive index and birefringence' },
    { id: 'polariscope', file: 'polariscope.html', icon: '◐', zh: '偏光镜', en: 'Polariscope', dzh: '区分单折射、双折射与集合体', den: 'Tell singly, doubly refractive and aggregates apart' },
    { id: 'spectroscope', file: 'spectroscope.html', icon: '🌈', zh: '分光镜', en: 'Spectroscope', dzh: '观察吸收光谱，推断致色元素', den: 'Read absorption spectra and colouring elements' },
    { id: 'chelsea', file: 'chelsea-filter.html', icon: '🔴', zh: '查尔斯滤色镜', en: 'Chelsea Filter', dzh: '快速检查铬致色宝石', den: 'Quick check for chromium-coloured stones' },
    { id: 'uv', file: 'uv-lamp.html', icon: '💡', zh: '紫外荧光灯', en: 'UV Lamp (LW / SW)', dzh: '长波 365nm / 短波 254nm 荧光观察', den: 'Long-wave 365 nm / short-wave 254 nm fluorescence' },
    { id: 'balance', file: 'hydrostatic-balance.html', icon: '⚖️', zh: '静水力学天平', en: 'Hydrostatic Balance', dzh: '静水称重法测相对密度 SG', den: 'Find specific gravity by hydrostatic weighing' },
  ];

  /* ---------- 语言 Language ---------- */
  const LANG_KEY = 'gemlab-lang';
  function getLang() {
    try { return localStorage.getItem(LANG_KEY) || 'both'; } catch (e) { return 'both'; }
  }
  G.setLang = function (mode) {
    document.body.classList.remove('lang-zh', 'lang-en', 'lang-both');
    document.body.classList.add('lang-' + mode);
    document.documentElement.lang = mode === 'en' ? 'en' : 'zh-CN';
    G.$$('.lang-switch button').forEach((b) => b.classList.toggle('active', b.dataset.lang === mode));
    try { localStorage.setItem(LANG_KEY, mode); } catch (e) { /* 忽略 ignore */ }
    G.lang = mode;
    (G._langListeners || []).forEach((fn) => fn(mode));
  };
  G.onLang = (fn) => (G._langListeners = G._langListeners || []).push(fn);
  // 画布上用的文字 Text for canvas drawing
  G.tx = (zh, en) => (G.lang === 'zh' ? zh : G.lang === 'en' ? en : zh + ' ' + en);

  /* ---------- 顶栏 Header ---------- */
  G.buildHeader = function (activeId) {
    const el = document.getElementById('topbar');
    if (!el) return;
    el.className = 'topbar';
    el.innerHTML = `
      <a class="brand" href="index.html"><span class="logo">💎</span><span class="brand-text">${G.T('宝石仪器实验室', 'Gem Instrument Lab')}</span></a>
      <nav class="inst-nav">${G.instruments
        .map((i) => `<a href="${i.file}" class="${i.id === activeId ? 'active' : ''}">${i.icon} ${G.T(i.zh, i.en)}</a>`)
        .join('')}</nav>
      <div class="lang-switch">
        <button data-lang="zh">中</button><button data-lang="both">中/EN</button><button data-lang="en">EN</button>
      </div>`;
    G.$$('.lang-switch button', el).forEach((b) => b.addEventListener('click', () => G.setLang(b.dataset.lang)));
  };

  /* ---------- 标签页 Tabs ---------- */
  G.initTabs = function (root = document) {
    const btns = G.$$('.tab-btn', root);
    btns.forEach((b) =>
      b.addEventListener('click', () => {
        btns.forEach((x) => x.classList.toggle('active', x === b));
        G.$$('.tab-body', root).forEach((t) => t.classList.toggle('active', t.id === 'tab-' + b.dataset.tab));
      })
    );
  };

  /* ---------- 宝石选择 Gem picker ---------- */
  G.gemPicker = function (container, gems, onChange, selectedId) {
    container.classList.add('chips');
    container.innerHTML = gems
      .map((g) => `<button class="chip" data-id="${g.id}"><span class="dot" style="background:${g.css}"></span>${G.T(g.zh, g.en)}</button>`)
      .join('');
    const select = (id) => {
      G.$$('.chip', container).forEach((c) => c.classList.toggle('active', c.dataset.id === id));
      onChange(gems.find((g) => g.id === id));
    };
    G.$$('.chip', container).forEach((c) => c.addEventListener('click', () => select(c.dataset.id)));
    select(selectedId || gems[0].id);
    return { select };
  };

  /* ---------- 分段按钮 Segmented buttons ---------- */
  G.seg = function (container, options, onChange, value) {
    container.classList.add('seg');
    container.innerHTML = options.map((o) => `<button data-v="${o.v}">${G.T(o.zh, o.en)}</button>`).join('');
    const set = (v, silent) => {
      G.$$('button', container).forEach((b) => b.classList.toggle('active', b.dataset.v === String(v)));
      if (!silent) onChange(v);
    };
    G.$$('button', container).forEach((b) => b.addEventListener('click', () => set(b.dataset.v)));
    set(value ?? options[0].v);
    return { set };
  };

  /* ---------- 部件卡片与列表 Part card & list ---------- */
  G.showPartCard = function (info) {
    const card = document.getElementById('part-card');
    if (!card) return;
    if (!info) { card.classList.add('hidden'); return; }
    card.innerHTML = `<button class="close" aria-label="close">×</button>
      <h3>${G.T(info.zh, info.en)}</h3>${G.P(info.dzh || '', info.den || '')}`;
    card.classList.remove('hidden');
    G.$('.close', card).onclick = () => { card.classList.add('hidden'); G.viewer && G.viewer.highlight(null); };
  };
  G.renderParts = function (listEl, viewer) {
    listEl.className = 'parts-list';
    listEl.innerHTML = viewer.parts
      .map((p, i) => `<button data-i="${i}"><b>${G.T(p.info.zh, p.info.en)}</b><div class="pdesc">${G.T(p.info.dzh || '', p.info.den || '')}</div></button>`)
      .join('');
    G.$$('button', listEl).forEach((b) =>
      b.addEventListener('click', () => {
        const p = viewer.parts[+b.dataset.i];
        viewer.highlight(p.obj);
        G.showPartCard(p.info);
      })
    );
  };

  /* ---------- 测验 Quiz ---------- */
  G.renderQuiz = function (container, questions) {
    let answered = 0, correct = 0;
    container.innerHTML =
      `<div class="quiz-score"></div>` +
      questions
        .map(
          (q, qi) => `<div class="quiz-q" data-qi="${qi}">
        <div class="q">${qi + 1}. ${G.T(q.q[0], q.q[1])}</div>
        <div class="opts">${q.o.map((o, oi) => `<button class="opt" data-oi="${oi}">${String.fromCharCode(65 + oi)}. ${G.T(o[0], o[1])}</button>`).join('')}</div>
        <div class="explain hidden">${G.T(q.e[0], q.e[1])}</div></div>`
        )
        .join('');
    const score = G.$('.quiz-score', container);
    const upd = () => (score.innerHTML = G.T(`得分：${correct} / ${questions.length}`, `Score: ${correct} / ${questions.length}`));
    upd();
    G.$$('.quiz-q', container).forEach((qEl) => {
      const q = questions[+qEl.dataset.qi];
      G.$$('.opt', qEl).forEach((b) =>
        b.addEventListener('click', () => {
          if (qEl.dataset.done) return;
          qEl.dataset.done = 1;
          answered++;
          const oi = +b.dataset.oi;
          if (oi === q.a) correct++;
          else b.classList.add('wrong');
          G.$$('.opt', qEl)[q.a].classList.add('right');
          G.$('.explain', qEl).classList.remove('hidden');
          upd();
        })
      );
    });
  };

  /* ---------- 画布工具 Canvas helpers ---------- */
  // 让画布适配高分屏 Fit canvas to its CSS size with devicePixelRatio
  G.fitCanvas = function (canvas, cssW, cssH) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = cssW || canvas.clientWidth || 300;
    const h = cssH || canvas.clientHeight || 300;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w, h };
  };
  // 可复现的随机数 Seeded random
  G.rng = function (seed) {
    let s = 0;
    for (const c of String(seed)) s = (s * 31 + c.charCodeAt(0)) >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  G.hexToRgb = (hex) => {
    const n = typeof hex === 'number' ? hex : parseInt(hex.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  G.rgba = (rgb, a) => `rgba(${rgb[0] | 0},${rgb[1] | 0},${rgb[2] | 0},${a})`;
  G.mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  G.clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // 波长 → RGB（380–750nm）Wavelength to RGB
  G.wlRGB = function (l) {
    let r = 0, g = 0, b = 0;
    if (l < 440) { r = -(l - 440) / 60; b = 1; }
    else if (l < 490) { g = (l - 440) / 50; b = 1; }
    else if (l < 510) { g = 1; b = -(l - 510) / 20; }
    else if (l < 580) { r = (l - 510) / 70; g = 1; }
    else if (l < 645) { r = 1; g = -(l - 645) / 65; }
    else { r = 1; }
    let f = 1;
    if (l < 420) f = 0.3 + (0.7 * (l - 380)) / 40;
    else if (l > 680) f = 0.3 + (0.7 * (750 - l)) / 70;
    f = G.clamp(f, 0, 1);
    return [255 * Math.pow(r * f, 0.8), 255 * Math.pow(g * f, 0.8), 255 * Math.pow(b * f, 0.8)];
  };

  // 俯视刻面宝石轮廓（圆钻型）Top view of a round brilliant
  G.drawBrilliantTop = function (ctx, cx, cy, R, opt) {
    const { fill, edge, lineW = 1 } = opt;
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    ctx.strokeStyle = edge; ctx.lineWidth = lineW * 1.4; ctx.stroke();
    ctx.lineWidth = lineW;
    const t = R * 0.55, n = 8;
    const tv = [], gv = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.PI / 8;
      tv.push([cx + Math.cos(a) * t, cy + Math.sin(a) * t]);
    }
    for (let i = 0; i < n * 2; i++) {
      const a = (i / (n * 2)) * Math.PI * 2 + Math.PI / 8;
      gv.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]);
    }
    ctx.beginPath();
    tv.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    ctx.closePath();
    for (let i = 0; i < n; i++) {
      const p = tv[i], q = tv[(i + 1) % n];
      const mid = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
      const ma = Math.atan2(mid[1] - cy, mid[0] - cx);
      const star = [cx + Math.cos(ma) * R * 0.78, cy + Math.sin(ma) * R * 0.78];
      ctx.moveTo(p[0], p[1]); ctx.lineTo(star[0], star[1]); ctx.lineTo(q[0], q[1]);
      ctx.moveTo(p[0], p[1]); ctx.lineTo(gv[i * 2][0], gv[i * 2][1]);
      ctx.moveTo(star[0], star[1]); ctx.lineTo(gv[i * 2 + 1][0], gv[i * 2 + 1][1]);
    }
    ctx.strokeStyle = edge;
    ctx.stroke();
    ctx.restore();
  };

  document.addEventListener('DOMContentLoaded', () => G.setLang(getLang()));
})();
