/* 查尔斯滤色镜 Chelsea filter */
(function () {
  const G = GemLab, T = G.T;
  G.buildHeader('chelsea');
  G.initTabs();

  /* ================= 3D 模型 Model ================= */
  const v = (G.viewer = new G.Viewer(G.$('#viewer'), { cam: [3.6, 2.6, 4.4], target: [0, 0.9, 0.6], minD: 1, maxD: 14 }));
  const dark = G.mat(0x1d2026, { roughness: 0.6 });
  const chrome = G.mat(0xc9ced6, { roughness: 0.2, metalness: 0.9 });

  // 宝石托 Pedestal
  const ped = G.group(G.cyl(0.35, 0.45, 0.6, G.mat(0x111317, { roughness: 0.9 }), [0, 0.3, 0]));
  v.add(ped);

  // 台灯 Desk lamp
  const lamp = new THREE.Group();
  lamp.add(G.cyl(0.45, 0.5, 0.12, dark, [0, 0.06, 0]));
  lamp.add(G.rod([0, 0.1, 0], [0.3, 1.5, 0], 0.05, chrome));
  lamp.add(G.rod([0.3, 1.5, 0], [1.1, 2.0, 0], 0.05, chrome));
  const shade = G.mesh(new THREE.ConeGeometry(0.35, 0.5, 32, 1, true), G.mat(0x2b3a55, { side: THREE.DoubleSide }), [1.25, 1.85, 0], [0, 0, 0.75]);
  lamp.add(shade);
  const bulbMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffe2a8, emissiveIntensity: 1.6 });
  lamp.add(G.sph(0.13, bulbMat, [1.4, 1.72, 0]));
  lamp.position.set(-1.9, 0, -0.3);
  v.add(lamp);
  const spot = new THREE.SpotLight(0xffe7b8, 1.4, 8, 0.6, 0.5);
  spot.position.set(-0.55, 1.75, -0.3);
  spot.target.position.set(0, 0.7, 0);
  v.add(spot, spot.target);
  v.addPart(lamp, { zh: '强白光光源', en: 'Strong white light', dzh: '用白炽灯或强光手电。光线越强，红色反应越明显。', den: 'An incandescent lamp or strong torch. The stronger the light, the clearer the red reaction.' });

  // 滤色镜 The filter
  const filter = new THREE.Group();
  const filterGlass = G.cyl(0.4, 0.4, 0.05, new THREE.MeshPhongMaterial({ color: 0x0f3a32, transparent: true, opacity: 0.3, shininess: 100, depthWrite: false }), [0, 0, 0], null, 48);
  filter.add(G.torus(0.42, 0.05, dark, [0, 0, 0], [Math.PI / 2, 0, 0]));
  filter.add(filterGlass);
  filter.add(G.box(0.22, 0.05, 0.75, dark, [0, 0, 0.75]));
  filter.add(G.torus(0.12, 0.025, chrome, [0, 0, 1.22], [0, 0, 0]));
  v.add(filter);
  v.addPart(filter, { zh: '查尔斯滤色镜', en: 'Chelsea filter', dzh: '两片明胶滤片叠合，只透过黄绿光（约 570nm）和深红光（约 690nm 以上）。', den: 'Two gelatin filters combined; transmits only yellow-green (~570 nm) and deep red (> ~690 nm).' });

  const filterPose = {
    table: { pos: [1.3, 0.04, 1.2], rot: [0, 0.6, 0] },
    eye: { pos: [0, 0.92, 1.85], rot: [Math.PI / 2, 0, 0] },
  };
  const camPose = { table: [3.6, 2.6, 4.4], eye: [0, 0.95, 3.25] };
  const tgtPose = { table: [0, 0.9, 0.6], eye: [0, 0.8, 0] };

  let gemObj = null;
  function setGem3D(gem) {
    if (gemObj) v.scene.remove(gemObj);
    gemObj = G.makeGem(gem, 0.55);
    gemObj.position.set(0, 0.6 + (gem.cut === 'cab' ? 0 : 0.43 * 0.55), 0);
    gemObj.rotation.x = 0.35;
    v.add(gemObj);
    v.addPart(gemObj, { zh: '宝石：' + gem.zh, en: 'Stone: ' + gem.en, dzh: '滤色镜下：' + gem.chelsea.zh, den: 'Through the filter: ' + gem.chelsea.en });
    v.parts = v.parts.filter((p) => p.obj === gemObj || !p.info.zh.startsWith('宝石：'));
  }

  /* ================= 状态 State ================= */
  const st = { gem: null, look: 'naked', moving: false };
  v.tick((dt, t) => {
    const pose = st.look === 'filter' ? 'eye' : 'table';
    const fp = filterPose[pose];
    filter.position.lerp(new THREE.Vector3(...fp.pos), 1 - Math.exp(-6 * dt));
    filter.rotation.x = G.approach(filter.rotation.x, fp.rot[0], 6, dt);
    filter.rotation.y = G.approach(filter.rotation.y, fp.rot[1], 6, dt);
    if (st.moving) {
      // 镜头移动到目标位置后停止，之后可自由拖动 move the camera, then hand control back
      const goal = new THREE.Vector3(...camPose[pose]);
      v.camera.position.lerp(goal, 1 - Math.exp(-5 * dt));
      v.controls.target.lerp(new THREE.Vector3(...tgtPose[pose]), 1 - Math.exp(-5 * dt));
      if (v.camera.position.distanceTo(goal) < 0.01) st.moving = false;
    }
    if (gemObj) gemObj.rotation.y = t * 0.4;
  });

  /* ================= 对比画面 Comparison ================= */
  const cmp = G.$('#compare');
  function drawCompare() {
    const { ctx, w, h } = G.fitCanvas(cmp);
    const gem = st.gem, half = w / 2;
    const panel = (x0, bg, color, title) => {
      const g = ctx.createRadialGradient(x0 + half / 2, h / 2, 10, x0 + half / 2, h / 2, half * 0.7);
      g.addColorStop(0, bg[0]); g.addColorStop(1, bg[1]);
      ctx.fillStyle = g; ctx.fillRect(x0, 0, half, h);
      const R = Math.min(half, h) * 0.3, cx = x0 + half / 2, cy = h / 2 + 8;
      const c = G.hexToRgb(color);
      const gg = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R);
      gg.addColorStop(0, G.rgba(G.mix(c, [255, 255, 255], 0.35), 1));
      gg.addColorStop(0.6, G.rgba(c, 1));
      gg.addColorStop(1, G.rgba(G.mix(c, [0, 0, 0], 0.5), 1));
      if (gem.cut === 'cab') {
        ctx.beginPath(); ctx.ellipse(cx, cy, R, R * 0.75, 0, 0, Math.PI * 2); ctx.fillStyle = gg; ctx.fill();
      } else G.drawBrilliantTop(ctx, cx, cy, R, { fill: gg, edge: 'rgba(255,255,255,.25)', lineW: 1 });
      ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(x0 + 8, 8, half - 16, 22);
      ctx.fillStyle = '#e7edf6'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(title, x0 + half / 2, 23);
    };
    panel(0, ['#e9e6de', '#a7a39a'], gem.css, G.tx('肉眼', 'Naked eye'));
    panel(half, ['#2c4a3c', '#0e1a14'], gem.chelsea.css, G.tx('滤色镜下', 'Through filter'));
    ctx.fillStyle = '#0e131b'; ctx.fillRect(half - 1, 0, 2, h);
  }

  // 透过率曲线 Transmission curve
  const curve = G.$('#curve');
  const filterT = (l) => 0.42 * Math.exp(-(((l - 572) / 22) ** 2)) + 0.92 / (1 + Math.exp(-(l - 692) / 9));
  function drawCurve() {
    const { ctx, w, h } = G.fitCanvas(curve);
    ctx.fillStyle = '#05070b'; ctx.fillRect(0, 0, w, h);
    const L0 = 400, L1 = 720, pad = 22, ph = h - pad - 10;
    const X = (l) => ((l - L0) / (L1 - L0)) * w;
    for (let x = 0; x < w; x++) {
      const l = L0 + (x / w) * (L1 - L0), tt = filterT(l), c = G.wlRGB(l);
      ctx.fillStyle = G.rgba(c, 0.85);
      ctx.fillRect(x, 10 + ph * (1 - tt), 1, ph * tt);
      ctx.fillStyle = G.rgba(c, 0.12);
      ctx.fillRect(x, 10, 1, ph * (1 - tt));
    }
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let x = 0; x < w; x++) {
      const l = L0 + (x / w) * (L1 - L0), y = 10 + ph * (1 - filterT(l));
      x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
    ctx.fillStyle = '#93a3bb'; ctx.font = '10px ui-monospace, Menlo, monospace'; ctx.textAlign = 'center';
    for (let l = 400; l <= 700; l += 50) ctx.fillText(l, G.clamp(X(l), 12, w - 12), h - 4);
    ctx.textAlign = 'left'; ctx.fillStyle = '#e7edf6'; ctx.font = '11px sans-serif';
    ctx.fillText(G.tx('黄绿光', 'yellow-green'), X(545), 10 + ph * 0.48);
    ctx.textAlign = 'right';
    ctx.fillText(G.tx('深红光', 'deep red'), X(718), 22);
  }

  /* ================= 界面 UI ================= */
  function updateUI() {
    const gem = st.gem;
    if (gemObj) G.setGemColor(gemObj, st.look === 'filter' ? gem.chelsea.css : gem.css);
    G.$('#badge').innerHTML = T(gem.zh, gem.en) + ' · ' + (st.look === 'filter' ? T('透过滤色镜', 'through filter') : T('肉眼', 'naked eye'));
    const red = ['ruby', 'synruby', 'emerald', 'spinel'].includes(gem.id); // 变红的宝石 stones that turn red
    const box = G.$('#result');
    box.className = 'result ' + (red ? 'bad' : 'good');
    box.innerHTML = `<b>${T(gem.zh, gem.en)}</b> → ${T(gem.chelsea.zh, gem.chelsea.en)}
      <div class="note" style="margin-top:6px">${red
        ? T('出现红色：说明宝石透过深红光、吸收黄绿光，常见于铬（或钴）致色。', 'Red: the stone passes deep red and absorbs yellow-green, typical of chromium (or cobalt).')
        : T('没有变红：宝石透过的主要是黄绿光，或者整体吸收较强。', 'No red: the stone mainly passes yellow-green, or absorbs strongly overall.')}</div>`;
    drawCompare();
    drawCurve();
  }

  G.gemPicker(G.$('#gem-picker'), G.gems, (gem) => { st.gem = gem; setGem3D(gem); updateUI(); }, 'emerald');
  G.seg(G.$('#look'), [{ v: 'naked', zh: '肉眼观察', en: 'Naked eye' }, { v: 'filter', zh: '透过滤色镜看（3D）', en: 'Look through the filter (3D)' }],
    (x) => { st.look = x; st.moving = true; updateUI(); }, 'naked');
  window.addEventListener('resize', updateUI);
  G.onLang(updateUI);

  G.renderParts(G.$('#parts-list'), v);
  G.renderQuiz(G.$('#quiz'), [
    { q: ['查尔斯滤色镜主要透过哪两段光？', 'Which two kinds of light does the Chelsea filter pass?'],
      o: [['蓝光和紫光', 'blue and violet'], ['黄绿光和深红光', 'yellow-green and deep red'], ['紫外光和红外光', 'UV and infrared'], ['所有颜色', 'all colours']], a: 1,
      e: ['约 570nm 黄绿光和 690nm 以上的深红光。', 'Yellow-green around 570 nm and deep red above about 690 nm.'] },
    { q: ['祖母绿和绿色玻璃在滤色镜下通常有什么区别？', 'How do emerald and green glass usually differ under the filter?'],
      o: [['都变红', 'both turn red'], ['祖母绿变红，玻璃仍为绿色', 'emerald turns red, glass stays green'], ['祖母绿仍绿，玻璃变红', 'emerald stays green, glass turns red'], ['都变黑', 'both go black']], a: 1,
      e: ['铬吸收黄绿光、透过深红光，所以祖母绿显红。', 'Chromium absorbs yellow-green and passes deep red, so emerald looks red.'] },
    { q: ['观察时滤色镜应该放在哪里？', 'Where should you hold the filter?'],
      o: [['紧贴眼睛', 'close to the eye'], ['放在宝石上', 'on the stone'], ['放在灯上', 'over the lamp'], ['放在宝石下面', 'under the stone']], a: 0,
      e: ['滤色镜贴近眼睛，宝石在强光下，距离约 30–40cm。', 'Filter at the eye, stone in strong light about 30–40 cm away.'] },
    { q: ['只凭滤色镜变红，能确定是天然祖母绿吗？', 'If a green stone turns red, is it definitely natural emerald?'],
      o: [['能', 'yes'], ['不能，合成祖母绿和染色宝石也可能变红', 'no: synthetics and dyed stones can also turn red']], a: 1,
      e: ['滤色镜只是辅助工具，必须结合折射仪、放大观察等。', 'The filter is only a helper; combine it with RI and magnification.'] },
    { q: ['蓝色钴玻璃在滤色镜下呈什么颜色？', 'What colour is blue cobalt glass through the filter?'],
      o: [['红色', 'red'], ['蓝色', 'blue'], ['无色', 'colourless'], ['黄色', 'yellow']], a: 0,
      e: ['钴也透过深红光，可用来区分蓝色玻璃/合成尖晶石与蓝宝石。', 'Cobalt also passes deep red, which separates cobalt glass/synthetic spinel from sapphire.'] },
  ]);
})();
