/* 公共功能：双语、导航、标签页、宝石选择、部件列表、测验
   Shared helpers: bilingual text, navigation, tabs, gem picker, parts list, quiz */
(function () {
  const G = (window.GemLab = window.GemLab || {});

  // 多语片段：中文 / English / ไทย。泰语按英文原文在 G.TH 词典里查找
  // Text in three languages. Thai is looked up in the G.TH dictionary by the English text.
  G.TH = G.TH || {};
  G._miss = new Set(); // 词典里找不到的英文（调试用）English keys missing a Thai entry
  const norm = (x) => String(x).replace(/\s+/g, ' ').trim();
  G.th = (en, th) => {
    if (th != null) return th;
    const k = norm(en);
    if (k in G.TH) return G.TH[k];
    if (k && /[A-Za-z]/.test(k)) G._miss.add(k);
    return en;
  };
  G.T = (zh, en, th) => `<span class="zh">${zh}</span><span class="en">${en}</span><span class="th">${G.th(en, th)}</span>`;
  G.P = (zh, en, th) => `<p class="zh">${zh}</p><p class="en">${en}</p><p class="th">${G.th(en, th)}</p>`;
  // 给页面里写死的英文元素补上泰语 Add a Thai twin to every static English element
  G.addThai = function (root = document) {
    G.$$('.en', root).forEach((el) => {
      const nx = el.nextElementSibling;
      if (nx && nx.classList.contains('th')) return;
      const t = el.cloneNode(false);
      t.classList.remove('en');
      t.classList.add('th');
      t.innerHTML = G.th(el.innerHTML);
      el.after(t);
    });
  };
  G.$ = (sel, root = document) => root.querySelector(sel);
  G.$$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  G.instruments = [
    { id: 'microscope', file: 'microscope.html', icon: '🔬', zh: '宝石显微镜', en: 'Gem Microscope', dzh: '放大观察内含物与表面特征', den: 'Magnify inclusions and surface features' },
    { id: 'refractometer', file: 'refractometer.html', icon: '📏', zh: '折射仪', en: 'Refractometer', dzh: '测量折射率 RI 与双折射率', den: 'Measure refractive index and birefringence' },
    { id: 'polariscope', file: 'polariscope.html', icon: '◐', zh: '偏光镜', en: 'Polariscope', dzh: '区分单折射、双折射与集合体', den: 'Tell singly, doubly refractive and aggregates apart' },
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
    if (!['zh', 'en', 'th', 'both', 'zhth'].includes(mode)) mode = 'both';
    document.body.classList.remove('lang-zh', 'lang-en', 'lang-th', 'lang-both', 'lang-zhth');
    document.body.classList.add('lang-' + mode);
    document.documentElement.lang = { en: 'en', th: 'th' }[mode] || 'zh-CN';
    G.$$('.lang-switch button').forEach((b) => b.classList.toggle('active', b.dataset.lang === mode));
    try { localStorage.setItem(LANG_KEY, mode); } catch (e) { /* 忽略 ignore */ }
    G.lang = mode;
    (G._langListeners || []).forEach((fn) => fn(mode));
  };
  G.onLang = (fn) => (G._langListeners = G._langListeners || []).push(fn);
  // 画布上用的文字 Text for canvas drawing
  G.tx = (zh, en, th) => {
    const t = G.th(en, th);
    return { zh, en, th: t, zhth: zh + ' ' + t }[G.lang] || zh + ' ' + en;
  };

  /* ---------- 顶栏 Header ---------- */
  G.buildHeader = function (activeId) {
    const el = document.getElementById('topbar');
    if (!el) return;
    el.className = 'topbar';
    el.innerHTML = `
      <a class="brand" href="index.html"><span class="logo">💎</span><span class="brand-text">${G.T('宝石仪器实验室', 'Gem Instrument Lab')}</span></a>
      <nav class="inst-nav">${G.instruments
        .map((i) => `<a href="${i.file}" class="${i.id === activeId ? 'active' : ''}">${i.icon} ${G.T(i.zh, i.en)}</a>`)
        .join('')}<a href="gem-data.html" class="${activeId === 'gemdata' ? 'active' : ''}">📊 ${G.T('宝石数据', 'Gem data')}</a></nav>
      <div class="lang-switch">
        <button data-lang="zh">中</button><button data-lang="both">中/EN</button><button data-lang="en">EN</button><button data-lang="th">ไทย</button><button data-lang="zhth">中/ไทย</button>
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
    container.innerHTML = options.map((o) => `<button data-v="${o.v}">${o.same || G.T(o.zh, o.en)}</button>`).join(''); // same：各语言相同 same in every language
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
      <h3>${G.T(info.zh, info.en, info.th)}</h3>${G.P(info.dzh || '', info.den || '', info.dth)}`;
    card.classList.remove('hidden');
    G.$('.close', card).onclick = () => { card.classList.add('hidden'); G.viewer && G.viewer.highlight(null); };
  };
  G.renderParts = function (listEl, viewer) {
    listEl.className = 'parts-list';
    listEl.innerHTML = viewer.parts
      .map((p, i) => `<button data-i="${i}"><b>${G.T(p.info.zh, p.info.en, p.info.th)}</b><div class="pdesc">${G.T(p.info.dzh || '', p.info.den || '', p.info.dth)}</div></button>`)
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
    const upd = () => (score.innerHTML = G.T(`得分：${correct} / ${questions.length}`, `Score: ${correct} / ${questions.length}`, `คะแนน: ${correct} / ${questions.length}`));
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

  // 切到“模拟操作”标签并闪烁某个区域 Show the simulation tab and flash an element
  G.lookAt = function (sel) {
    const simBtn = G.$('.tab-btn[data-tab="sim"]');
    if (simBtn && !simBtn.classList.contains('active')) simBtn.click();
    const el = G.$(sel);
    if (!el) return;
    if (!el.closest('.dock')) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); // 固定区不用滚动 the dock is always visible
    el.classList.remove('flash');
    void el.offsetWidth;
    el.classList.add('flash');
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

  /* ---------- 模式：指引 / 自由 Mode: guided / free ---------- */
  G.mode = (() => { try { return localStorage.getItem('gemlab-mode') || 'guide'; } catch (e) { return 'guide'; } })();
  G.isFree = () => G.mode === 'free';
  G.onMode = (fn) => (G._modeL = G._modeL || []).push(fn);
  G.setMode = (m) => {
    G.mode = m;
    try { localStorage.setItem('gemlab-mode', m); } catch (e) { /* 忽略 ignore */ }
    (G._modeL || []).forEach((fn) => fn(m));
  };

  /* ---------- 分步指引 Step-by-step guide ----------
     steps: [{ t: [中, En], how: [中, En], target: 3D 物体, done: () => bool, act: 帮我完成, confirm: 手动确认 }] */
  G.guide = function ({ viewer, steps, reset }) {
    const host = G.$('.dock-guide') || document.getElementById('tab-sim');
    if (!host) return;
    const box = document.createElement('div');
    box.className = 'guide';
    host.prepend(box);
    // 模式切换条 Mode switch
    const modeBar = document.createElement('div');
    modeBar.className = 'mode-bar';
    host.prepend(modeBar);
    const modeSeg = document.createElement('div');
    const freeNote = document.createElement('div');
    freeNote.className = 'free-note';
    modeBar.append(modeSeg, freeNote);
    function applyMode() {
      const free = G.isFree();
      box.classList.toggle('hidden', free);
      freeNote.classList.toggle('hidden', !free);
      freeNote.innerHTML = '🕹 ' + G.T('自由模式：没有步骤限制，可以按任意顺序操作 3D 模型和右侧控件。黄点标出所有可操作的部件。',
        'Free mode: no fixed steps. Operate the 3D model and the controls in any order. Yellow dots mark every part you can use.');
      if (viewer && viewer.setMarkerMode) viewer.setMarkerMode(free ? 'all' : 'guide');
    }
    G.seg(modeSeg, [{ v: 'guide', zh: '🧭 指引模式', en: 'Guided mode' }, { v: 'free', zh: '🕹 自由模式', en: 'Free mode' }], (m) => { if (m !== G.mode) G.setMode(m); }, G.mode);
    G.onMode(applyMode);
    G.onLang(applyMode);
    let cur = 0, open = true;
    const confirmed = new Set();
    /* 观察题：step.ask = { q, o, a, e, sig, onRight, keepOrder }
       观察类步骤要先答对问题才能进入下一步 Observation steps need a correct answer before moving on */
    const passed = new Set(); // 已答对并点了“继续” answered and continued
    const asks = new Map();
    const TT = (x) => (typeof x === 'string' ? x : G.T(...x));
    const val = (x) => (typeof x === 'function' ? x() : x);
    const readyOf = (s) => (s.done ? !!s.done() : true);
    let lastReady = null;
    function getAsk(i) {
      const s = steps[i];
      const sig = String(s.ask.sig ? s.ask.sig() : '');
      let A = asks.get(i);
      if (!A || A.sig !== sig) {
        const opts = val(s.ask.o);
        const order = opts.map((_, k) => k);
        if (!s.ask.keepOrder) {
          const rnd = G.rng('ask' + i + sig);
          for (let k = order.length - 1; k > 0; k--) { const j = Math.floor(rnd() * (k + 1)); [order[k], order[j]] = [order[j], order[k]]; }
        }
        A = { sig, opts, order, a: new Set([].concat(val(s.ask.a))), q: val(s.ask.q), e: s.ask.e ? val(s.ask.e) : null, wrong: new Set(), right: false };
        asks.set(i, A);
      }
      return A;
    }
    /* 可重复的读数题：step.pick = { q, o, a, sig, ready, wait, onRight, after }
       每次状态（如转动角度）变了就出一道新题，答对时执行 onRight（例如记录读数）
       Repeatable reading question: a new one each time sig changes; onRight runs on a correct pick */
    const picks = new Map();
    let lastPickSig = null;
    function getPick(i) {
      const s = steps[i];
      const sig = String(s.pick.sig());
      let A = picks.get(i);
      if (!A || A.sig !== sig) {
        const opts = val(s.pick.o);
        const order = opts.map((_, k) => k);
        const rnd = G.rng('pick' + i + sig);
        for (let k = order.length - 1; k > 0; k--) { const j = Math.floor(rnd() * (k + 1)); [order[k], order[j]] = [order[j], order[k]]; }
        A = { sig, opts, order, a: new Set([].concat(val(s.pick.a))), q: val(s.pick.q), wrong: new Set(), right: false };
        picks.set(i, A);
      }
      return A;
    }
    function pickHTML(i) {
      const s = steps[i];
      if (s.pick.ready && !s.pick.ready()) return `<div class="ga-wait">❓ ${TT(val(s.pick.wait))}</div>`;
      const A = getPick(i);
      return `<div class="guide-ask guide-pick">
        <div class="ga-q">❓ ${TT(A.q)}</div>
        <div class="ga-opts">${A.order.map((k) => `<button class="opt${A.right && A.a.has(k) ? ' right' : ''}${A.wrong.has(k) ? ' wrong' : ''}" data-k="${k}" ${A.right || A.wrong.has(k) ? 'disabled' : ''}>${TT(A.opts[k])}</button>`).join('')}</div>
        ${A.right ? `<div class="ga-e good">✓ ${s.pick.after ? TT(val(s.pick.after)) : G.T('答对了！', 'Correct!')}</div>`
          : A.wrong.size ? `<div class="ga-e bad">✗ ${G.T('再仔细看看刻度，换一个答案试试', 'Look at the scale again and try another answer')}</div>` : ''}
      </div>`;
    }
    function askHTML(i) {
      const s = steps[i];
      if (!readyOf(s)) return `<div class="ga-wait">❓ ${G.T('完成上面的操作后，这里会出现一个观察问题', 'Finish the action above and an observation question will appear here')}</div>`;
      const A = getAsk(i);
      return `<div class="guide-ask">
        <div class="ga-q">❓ ${TT(A.q)}</div>
        <div class="ga-opts">${A.order.map((k) => `<button class="opt${A.right && A.a.has(k) ? ' right' : ''}${A.wrong.has(k) ? ' wrong' : ''}" data-k="${k}" ${A.right || A.wrong.has(k) ? 'disabled' : ''}>${TT(A.opts[k])}</button>`).join('')}</div>
        ${A.right ? `<div class="ga-e good">✓ ${G.T('答对了！', 'Correct!')} ${A.e ? TT(A.e) : ''}</div><button class="btn primary guide-next">${G.T('继续', 'Continue')} →</button>`
          : A.wrong.size ? `<div class="ga-e bad">✗ ${G.T('再观察一下，换一个答案试试', 'Look again and try another answer')}</div>` : ''}
      </div>`;
    }
    let hold = -1; // 刚回退到的步骤：状态变化前不自动跳过 step just returned to: no auto-skip until the state changes
    const isDone = (i) => {
      if (confirmed.has(i)) return true;
      const d = steps[i].done ? !!steps[i].done() : !!steps[i].ask;
      if (steps[i].ask) return d && passed.has(i);
      if (i === hold) {
        if (!d) { hold = -1; return false; } // 状态已不满足，解除保持 condition cleared: release the hold
        return false;
      }
      return d;
    };
    function render() {
      const all = cur >= steps.length;
      box.innerHTML = `
        <div class="guide-head">
          <b>🧭 ${G.T('跟着做', 'Follow the steps')}</b>
          <span class="guide-count">${Math.min(cur, steps.length)} / ${steps.length}</span>
          <span style="flex:1"></span>
          <button class="btn guide-back" ${cur === 0 ? 'disabled' : ''} title="${G.tx('上一步', 'Back one step')}">← <span class="lbl">${G.T('上一步', 'Back one step')}</span></button>
          <button class="btn guide-restart" title="${G.tx('重新开始', 'Restart')}">↺ <span class="lbl">${G.T('重新开始', 'Restart')}</span></button>
          <button class="btn guide-fold">${open ? '▾' : '▸'}</button>
        </div>
        <div class="guide-bar"><i style="width:${(Math.min(cur, steps.length) / steps.length) * 100}%"></i></div>
        ${open ? `<ol class="guide-list">${steps.map((s, i) => {
          const cls = i < cur ? 'done' : i === cur ? 'now' : '';
          let extra = '';
          if (i === cur) {
            extra = `<div class="guide-how">${s.how ? '👉 ' + G.T(s.how[0], s.how[1]) : ''}</div>
              ${s.pick && !(s.done && s.done()) ? pickHTML(i) : ''}
              ${s.ask ? askHTML(i) : ''}
              <div class="btn-row" style="margin-top:6px">
                ${s.btn ? `<button class="btn primary guide-tool">${TT(val(s.btn.label))}</button>` : ''}
                ${s.confirm && !s.ask ? `<button class="btn primary guide-ok">✓ ${G.T('我完成了', 'Done')}</button>` : ''}
                ${s.act || s.ask ? `<button class="btn guide-act">${G.T('帮我做这一步', 'Do it for me')}</button>` : ''}
              </div>`;
          }
          return `<li class="${cls}"><span class="gnum">${i < cur ? '✓' : i + 1}</span><div>${G.T(s.t[0], s.t[1])}${extra}</div></li>`;
        }).join('')}</ol>` : ''}
        ${all ? `<div class="result good">🎉 ${G.T('全部步骤完成！可以换一颗宝石再练习，或点“重新开始”。', 'All steps done! Try another stone or press Restart.')}</div>` : ''}`;
      const nowLi = G.$('li.now', box), list = G.$('.guide-list', box);
      if (nowLi && list && list.scrollHeight > list.clientHeight) {
        // 有观察题时让问题露出来，否则当前步骤滚到最上 Show the question if there is one, else put the step at the top
        const q = G.$('.guide-ask', nowLi);
        list.scrollTop = Math.max(0, q && q.offsetTop + q.offsetHeight > list.clientHeight ? Math.min(q.offsetTop - 8, nowLi.offsetTop + nowLi.offsetHeight - list.clientHeight) : nowLi.offsetTop - 6);
      }
      if (cur < steps.length && steps[cur].ask) lastReady = readyOf(steps[cur]);
      lastPickSig = cur < steps.length && steps[cur].pick ? String(steps[cur].pick.sig()) + (steps[cur].pick.ready ? ':' + steps[cur].pick.ready() : '') : null;
      G.$$('.guide-pick .opt', box).forEach((b) => (b.onclick = () => {
        const A = getPick(cur), k = +b.dataset.k;
        if (A.a.has(k)) { A.right = true; steps[cur].pick.onRight(); }
        else A.wrong.add(k);
        render();
        check();
      }));
      G.$$('.guide-ask:not(.guide-pick) .opt', box).forEach((b) => (b.onclick = () => {
        const A = getAsk(cur), k = +b.dataset.k;
        if (A.a.has(k)) { A.right = true; if (steps[cur].ask.onRight) steps[cur].ask.onRight(); }
        else A.wrong.add(k);
        render();
      }));
      const tool = G.$('.guide-tool', box);
      if (tool) tool.onclick = () => { steps[cur].btn.run(); render(); check(); };
      const nx = G.$('.guide-next', box);
      if (nx) nx.onclick = () => { hold = -1; passed.add(cur); check(); };
      G.$('.guide-restart', box).onclick = () => { cur = 0; hold = -1; confirmed.clear(); passed.clear(); asks.clear(); picks.clear(); reset && reset(); render(); };
      G.$('.guide-fold', box).onclick = () => { open = !open; render(); };
      G.$('.guide-back', box).onclick = back;
      const ok = G.$('.guide-ok', box);
      if (ok) ok.onclick = () => { hold = -1; confirmed.add(cur); check(); };
      const act = G.$('.guide-act', box);
      if (act) act.onclick = () => {
        hold = -1;
        const i0 = cur, s = steps[i0]; // 先记下是哪一步：act 里可能已经推进了 remember the step; act may advance the guide
        const A = s.ask ? getAsk(i0) : null;
        if (s.act) s.act();
        if (A) {
          // 帮我做：直接给出正确答案 Do it for me: reveal the right answer
          if (s.ask.onRight) s.ask.onRight();
          if (viewer) viewer.say('💡 ' + G.T('答案：', 'Answer: ') + TT(A.opts[[...A.a][0]]));
        }
        confirmed.add(i0);
        check();
      };
    }
    // 回退一步：先复位，再把前面的步骤自动重做一遍 Back one step: reset, then replay the earlier steps
    function back() {
      if (cur === 0) return;
      const k = Math.min(cur, steps.length) - 1;
      confirmed.clear();
      passed.clear();
      asks.clear();
      if (reset) reset();
      for (let i = 0; i < k; i++) {
        try { if (steps[i].act) steps[i].act(); if (steps[i].ask && steps[i].ask.onRight) steps[i].ask.onRight(); } catch (e) { /* 忽略 ignore */ }
        confirmed.add(i);
      }
      cur = k;
      hold = steps[k].ask ? -1 : k; // 这一步要重新动手做（观察题本身就要重答）this step must be redone (questions are re-asked anyway)
      render();
      if (viewer) viewer.say('↩ ' + G.T('回到：', 'Back to: ') + G.T(steps[k].t[0], steps[k].t[1]));
    }
    function check() {
      if (G.isFree()) return;
      let moved = false;
      while (cur < steps.length && isDone(cur)) { cur++; moved = true; }
      // 操作完成后显示观察题 Show the question once the action is done
      if (!moved && cur < steps.length && steps[cur].ask && readyOf(steps[cur]) !== lastReady) render();
      // 角度等状态变了，出一道新的读数题 State changed (e.g. angle): new reading question
      else if (!moved && cur < steps.length && steps[cur].pick) {
        const p = steps[cur].pick, sig = String(p.sig()) + (p.ready ? ':' + p.ready() : '');
        if (sig !== lastPickSig) render();
      }
      if (moved) {
        render();
        if (viewer) viewer.say('✓ ' + (cur < steps.length ? G.T('下一步：', 'Next: ') + G.T(steps[cur].t[0], steps[cur].t[1]) : G.T('全部完成！', 'All done!')));
      }
    }
    // 只给当前步骤的部件显示提示点 Hotspot only on the current step's part
    if (viewer) {
      viewer.guideTarget = () => (G.isFree() ? undefined : cur < steps.length ? steps[cur].target || null : null);
      let acc = 0;
      viewer.tick((dt) => { acc += dt; if (acc > 0.15) { acc = 0; check(); } });
    }
    G.onLang(render);
    render();
    applyMode();
    return { check, render, back, restart: () => { cur = 0; hold = -1; confirmed.clear(); passed.clear(); asks.clear(); render(); } };
  };


  /* ---------- 固定观察区 Fixed dock ----------
     右侧面板顶部固定一块区域：左边是目镜画面，右边是“跟着做”；下面的内容单独滚动
     A fixed band at the top of the side panel: eyepiece view on the left, step guide on the right; the rest scrolls */
  G.buildDock = function () {
    const panel = G.$('.inst-layout .panel');
    if (!panel || G.$('.dock')) return;
    const scroll = document.createElement('div');
    scroll.className = 'panel-scroll';
    while (panel.firstChild) scroll.appendChild(panel.firstChild);
    const dock = document.createElement('div');
    dock.className = 'dock';
    const obs = G.$('.obs[data-float]', scroll);
    if (obs) {
      obs.classList.add('dock-obs');
      if (!obs.querySelector('.eyepiece')) dock.classList.add('wide-obs');
      dock.appendChild(obs);
    } else dock.classList.add('no-obs');
    const guideSlot = document.createElement('div');
    guideSlot.className = 'dock-guide';
    dock.appendChild(guideSlot);
    panel.append(dock, scroll);
    panel.classList.add('has-dock');
  };
  G.buildDock();

  document.addEventListener('DOMContentLoaded', () => { G.addThai(); G.setLang(getLang()); });
})();
