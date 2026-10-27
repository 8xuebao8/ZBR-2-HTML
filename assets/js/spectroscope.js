/* 分光镜 Spectroscope */
(function () {
  const G = GemLab, T = G.T;
  G.buildHeader('spectroscope');
  G.initTabs();

  /* ================= 3D 模型 Model ================= */
  const v = (G.viewer = new G.Viewer(G.$('#viewer'), { cam: [4.6, 3.6, 5.4], target: [0, 1.4, 0], minD: 2.5, maxD: 16 }));
  const dark = G.mat(0x24272d, { roughness: 0.5, metalness: 0.3 });
  const brass = G.mat(0xc8a24a, { roughness: 0.3, metalness: 0.85 });
  const chrome = G.mat(0xc9ced6, { roughness: 0.2, metalness: 0.9 });

  // 光纤冷光源 Fibre-optic light source
  const src = G.group(G.rbox(1.4, 0.9, 1.1, 0.15, dark, [0, 0.45, 0]), G.knob(0.15, 0.1, chrome, [0.45, 0.55, 0.56], [Math.PI / 2, 0, 0]));
  src.position.set(-2.5, 0, 0);
  v.add(src);
  const neckMat = G.mat(0x30343b, { roughness: 0.6 });
  let neck = null;
  const tipMat = new THREE.MeshStandardMaterial({ color: 0x777777, emissive: 0xffffff, emissiveIntensity: 1.3 });
  const tip = G.cyl(0.07, 0.07, 0.12, tipMat, [0, 0, 0]);
  const tipGlow = G.makeGlow(0xfff6e0, 0.7);
  const tipG = G.group(tip, tipGlow);
  v.add(tipG);
  const srcPart = G.group(src);
  v.add(srcPart);
  v.addPart(srcPart, { zh: '光纤冷光源', en: 'Fibre-optic light', dzh: '提供强白光；光纤传导，宝石不易发热。', den: 'Strong white light carried by a fibre so the stone does not heat up.' });

  // 载物台（带孔）Stage with an aperture
  const stage = G.group(
    G.cyl(0.7, 0.7, 0.06, dark, [0, 0.95, 0], null, 40),
    G.cyl(0.08, 0.08, 0.95, chrome, [0.55, 0.475, 0.0]),
    G.cyl(0.3, 0.35, 0.05, dark, [0.55, 0.02, 0])
  );
  v.add(stage);
  v.addPart(stage, { zh: '载物台（中间有通光孔）', en: 'Stage with aperture', dzh: '透射法时光线从台下穿过小孔和宝石。', den: 'For transmitted light, light passes up through the hole and the stone.' });

  // 分光镜（绕宝石转动）Spectroscope (pivots about the stone)
  const pivot = new THREE.Group();
  pivot.position.set(0, 1.05, 0);
  v.add(pivot);
  const scope = new THREE.Group();
  scope.position.y = 0.55;
  const slitRing = G.knob(0.22, 0.18, brass, [0, 0.1, 0]);
  scope.add(slitRing);
  scope.add(G.cyl(0.17, 0.17, 1.3, brass, [0, 0.85, 0]));
  const drawTube = G.cyl(0.15, 0.15, 0.6, G.mat(0x9a7a30, { metalness: 0.85, roughness: 0.3 }), [0, 1.6, 0]);
  scope.add(drawTube);
  scope.add(G.cyl(0.2, 0.2, 0.12, G.mat(0x111111), [0, 1.9, 0]));
  pivot.add(scope);
  v.addPart(scope, { zh: '手持式分光镜', en: 'Hand spectroscope', dzh: '下端是可调狭缝（滚花环），中间是棱镜组或光栅，上端是可拉动调焦的目镜筒。', den: 'Adjustable slit at the bottom (knurled ring), prisms or grating inside, sliding draw-tube eyepiece at the top.' });

  // 光束 Light beams
  const beamMat = new THREE.MeshBasicMaterial({ color: 0xfff6e0, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false });
  let beams = [];

  let gemObj = null;
  function setGem3D(gem) {
    if (gemObj) v.scene.remove(gemObj);
    gemObj = null;
    if (gem.id === 'none') return;
    gemObj = G.makeGem(gem, 0.45);
    gemObj.position.set(0, 0.98 + (gem.cut === 'cab' ? 0 : 0.43 * 0.45), 0);
    if (gem.cut !== 'cab') gemObj.rotation.x = Math.PI; // 台面朝下 table down
    if (gem.cut !== 'cab') gemObj.position.y = 0.98 + 0.17 * 0.45;
    v.add(gemObj);
  }

  function layout() {
    const refl = st.method === 'refl';
    pivot.rotation.z = refl ? -0.55 : 0;
    // 光纤路径 fibre path
    const end = refl ? new THREE.Vector3(-0.85, 1.55, 0) : new THREE.Vector3(0, 0.5, 0);
    const pts = refl
      ? [new THREE.Vector3(-2.3, 0.9, 0), new THREE.Vector3(-2.0, 1.8, 0), new THREE.Vector3(-1.3, 1.9, 0), end]
      : [new THREE.Vector3(-2.3, 0.9, 0), new THREE.Vector3(-1.7, 1.0, 0), new THREE.Vector3(-0.6, 0.15, 0), new THREE.Vector3(0, 0.25, 0), end];
    if (neck) v.scene.remove(neck);
    neck = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.05, 10), neckMat);
    neck.castShadow = true;
    v.add(neck);
    tipG.position.copy(end);
    const gemP = new THREE.Vector3(0, 1.05, 0);
    tip.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), gemP.clone().sub(end).normalize());
    beams.forEach((b) => v.scene.remove(b));
    const scopeEnd = new THREE.Vector3(0, 0.6, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), pivot.rotation.z).add(pivot.position);
    beams = [G.rod(end.toArray(), gemP.toArray(), 0.05, beamMat), G.rod(gemP.toArray(), scopeEnd.toArray(), 0.04, beamMat)];
    beams.forEach((b) => { b.castShadow = false; v.add(b); });
  }

  /* ================= 光谱计算 Spectrum ================= */
  const st = { gem: null, type: 'prism', method: 'trans', slit: 35, focus: 50, ann: false, hover: null };
  const L0 = 400, L1 = 700;
  const lamAt = (f) => {
    if (st.type === 'grating') return L0 + (L1 - L0) * f;
    const inv = 1 / (L0 * L0) + f * (1 / (L1 * L1) - 1 / (L0 * L0));
    return 1 / Math.sqrt(inv);
  };
  const fAt = (l) => (st.type === 'grating' ? (l - L0) / (L1 - L0) : (1 / (l * l) - 1 / (L0 * L0)) / (1 / (L1 * L1) - 1 / (L0 * L0)));
  function blurNm() { return 0.4 + st.slit * 0.06 + Math.abs(st.focus - 50) * 0.12; }
  function brightness() { return G.clamp(0.12 + st.slit / 55, 0.12, 1) * (st.method === 'refl' ? 0.65 : 1); }
  function transmit(gem, l, bl) {
    let Tt = 1, E = 0;
    for (const f of gem.spec || []) {
      const w = Math.sqrt(f.w * f.w + bl * bl);
      const d = (l - f.nm) / (w / 2);
      const prof = f.w >= 15 ? Math.exp(-(d ** 4) * 0.693) : Math.exp(-0.693 * d * d);
      const s = f.w >= 15 ? f.s : f.s * Math.sqrt(f.w / w);
      if (f.em) E += s * prof;
      else Tt *= 1 - s * prof;
    }
    return [Tt, E];
  }

  const cvs = G.$('#spec');
  function draw() {
    const { ctx, w, h } = G.fitCanvas(cvs);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
    const top = 24, bandH = 84, gem = st.gem, bl = blurNm(), br = brightness();
    for (let x = 0; x < w; x++) {
      const l = lamAt(x / w);
      const [Tt, E] = transmit(gem, l, bl);
      const c = G.wlRGB(l);
      const k = br * Tt;
      ctx.fillStyle = G.rgba([Math.min(255, c[0] * k + E * 255 * br), Math.min(255, c[1] * k + E * 120 * br), Math.min(255, c[2] * k + E * 80 * br)], 1);
      ctx.fillRect(x, top, 1, bandH);
    }
    // 上下边缘的狭缝感 soft slit edges
    const g = ctx.createLinearGradient(0, top, 0, top + bandH);
    g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(0.15, 'rgba(0,0,0,0)'); g.addColorStop(0.85, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.55)');
    ctx.fillStyle = g; ctx.fillRect(0, top, w, bandH);

    // 刻度 Scale
    const sy = top + bandH + 6;
    ctx.strokeStyle = '#8fa0b8'; ctx.fillStyle = '#8fa0b8'; ctx.font = '10px ui-monospace, Menlo, monospace'; ctx.textAlign = 'center';
    let lastLab = -99;
    for (let l = L0; l <= L1; l += 10) {
      const x = fAt(l) * w, major = l % 50 === 0;
      ctx.beginPath(); ctx.moveTo(x, sy); ctx.lineTo(x, sy + (major ? 9 : 4)); ctx.stroke();
      if (major && x - lastLab > 30) { ctx.fillText(l, G.clamp(x, 12, w - 12), sy + 20); lastLab = x; }
    }
    ctx.fillText('nm', w - 12, sy + 32);
    ctx.textAlign = 'left';
    ctx.fillText(G.tx('紫', 'Violet'), 2, sy + 32);
    ctx.textAlign = 'right';
    ctx.fillText(G.tx('红', 'Red'), w - 26, sy + 32);

    // 标注 Annotations
    if (st.ann) {
      ctx.font = '10px ui-monospace, Menlo, monospace'; ctx.textAlign = 'center';
      // 相距太近的线只标第一条 only label the first line of a close cluster
      let lastX = -99;
      (gem.spec || []).filter((f) => f.s >= 0.3 && f.nm > L0 + 15).sort((a, b) => a.nm - b.nm).forEach((f) => {
        const x = fAt(f.nm) * w;
        ctx.strokeStyle = f.em ? '#ffb347' : '#5ec8ff'; ctx.fillStyle = ctx.strokeStyle;
        ctx.beginPath(); ctx.moveTo(x, top - 4); ctx.lineTo(x, top + 6); ctx.stroke();
        if (x - lastX > 30) { ctx.fillText(Math.round(f.nm), G.clamp(x, 14, w - 14), top - 8); lastX = x; }
      });
    }
    // 鼠标位置 Hover
    if (st.hover != null) {
      const x = st.hover * w;
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, top + bandH); ctx.stroke(); ctx.setLineDash([]);
    }
  }
  cvs.addEventListener('mousemove', (e) => {
    const r = cvs.getBoundingClientRect();
    st.hover = (e.clientX - r.left) / r.width;
    G.$('#hover-nm').textContent = Math.round(lamAt(st.hover)) + ' nm';
    draw();
  });
  cvs.addEventListener('mouseleave', () => { st.hover = null; G.$('#hover-nm').textContent = ''; draw(); });

  /* ================= 界面 UI ================= */
  function updateUI() {
    const gem = st.gem;
    const sl = st.slit < 20 ? T('窄（暗但清晰）', 'narrow (dark, sharp)') : st.slit > 65 ? T('宽（亮但模糊）', 'wide (bright, blurred)') : T('适中', 'medium');
    G.$('#slit-val').innerHTML = sl;
    G.$('#badge').innerHTML = T(gem.zh, gem.en) + ' · ' + (st.method === 'trans' ? T('透射法', 'transmitted') : T('反射法', 'reflected'));
    let html = gem.id === 'none'
      ? T('没有宝石时看到的是连续光谱：从紫到红没有暗线。先熟悉它，再和宝石的光谱对比。', 'With no stone you see a continuous spectrum, violet to red with no dark lines. Learn it first, then compare.')
      : `<b>${T(gem.zh, gem.en)}</b>：${T(gem.specNote.zh, gem.specNote.en)}`;
    if (st.type === 'prism') html += `<div class="note" style="margin-top:6px">${T('棱镜式：注意蓝紫区被拉宽，红区被压缩。', 'Prism type: the blue-violet end is stretched and the red end squeezed.')}</div>`;
    if (st.method === 'refl') html += `<div class="note">${T('反射法亮度较低，适合不透明或颜色很深的宝石。', 'Reflected light is dimmer; use it for opaque or very dark stones.')}</div>`;
    G.$('#result').innerHTML = html;
    slitRing.rotation.y = st.slit * 0.04;
    drawTube.position.y = 1.5 + st.focus * 0.002;
    draw();
  }

  const list = [{ id: 'none', zh: '无宝石（白光）', en: 'No stone (white light)', css: '#ffffff', spec: [] }].concat(G.gems.filter((g) => g.id !== 'synruby'));
  G.gemPicker(G.$('#gem-picker'), list, (gem) => { st.gem = gem; setGem3D(gem); updateUI(); }, 'ruby');
  G.seg(G.$('#type'), [{ v: 'prism', zh: '棱镜式', en: 'Prism' }, { v: 'grating', zh: '光栅式', en: 'Grating' }], (x) => { st.type = x; updateUI(); }, 'prism');
  G.seg(G.$('#method'), [{ v: 'trans', zh: '透射法', en: 'Transmitted' }, { v: 'refl', zh: '反射法', en: 'Reflected' }], (x) => { st.method = x; layout(); updateUI(); }, 'trans');
  G.$('#slit').addEventListener('input', (e) => { st.slit = +e.target.value; updateUI(); });
  G.$('#focus').addEventListener('input', (e) => { st.focus = +e.target.value; updateUI(); });
  G.$('#ann').addEventListener('change', (e) => { st.ann = e.target.checked; draw(); });
  window.addEventListener('resize', draw);
  G.onLang(updateUI);
  layout();

  G.renderParts(G.$('#parts-list'), v);
  G.renderQuiz(G.$('#quiz'), [
    { q: ['光谱上的暗线代表什么？', 'What does a dark line in the spectrum mean?'],
      o: [['宝石发出的光', 'light emitted by the gem'], ['被宝石吸收的波长', 'a wavelength absorbed by the gem'], ['仪器损坏', 'a broken instrument'], ['宝石有裂纹', 'a crack']], a: 1,
      e: ['致色元素吸收特定波长，在光谱上形成暗线或暗带。', 'Colouring elements absorb specific wavelengths, leaving dark lines or bands.'] },
    { q: ['红区 694nm 附近的锐利双线是哪种元素的特征？', 'A sharp doublet near 694 nm in the red is typical of…'],
      o: [['铁', 'iron'], ['铬', 'chromium'], ['钴', 'cobalt'], ['铜', 'copper']], a: 1,
      e: ['这是红宝石的铬线。祖母绿的铬线在 683/680nm。', 'It is ruby’s chromium line. Emerald’s chromium lines are at 683/680 nm.'] },
    { q: ['蓝宝石光谱中最重要的特征是？', 'The key feature in a blue sapphire’s spectrum is…'],
      o: [['450nm 吸收带', 'a 450 nm band'], ['694nm 双线', 'a 694 nm doublet'], ['437nm 线', 'a 437 nm line'], ['没有吸收', 'no absorption']], a: 0,
      e: ['450nm 带由铁引起。', 'The 450 nm band is caused by iron.'] },
    { q: ['颜色很深或不透明的宝石应该用哪种方法？', 'Which method suits dark or opaque stones?'],
      o: [['透射法', 'transmitted light'], ['反射法', 'reflected light'], ['紫外灯', 'UV lamp'], ['都不行', 'neither']], a: 1,
      e: ['光无法穿透时，就从表面反射进入分光镜。', 'If light cannot pass through, reflect it off the surface into the spectroscope.'] },
    { q: ['翡翠光谱中具有诊断意义的吸收线是？', 'Which line is diagnostic for jadeite?'],
      o: [['415.5nm', '415.5 nm'], ['437nm', '437 nm'], ['505nm', '505 nm'], ['694nm', '694 nm']], a: 1,
      e: ['437nm 线是硬玉（翡翠）的特征线；415.5nm 是开普系列钻石的线。', '437 nm is the jadeite line; 415.5 nm belongs to Cape diamonds.'] },
    { q: ['狭缝开得太宽会怎样？', 'What happens if the slit is opened too wide?'],
      o: [['光谱太暗', 'the spectrum is too dark'], ['谱线变模糊', 'the lines blur'], ['颜色反转', 'the colours reverse'], ['看不到红色', 'red disappears']], a: 1,
      e: ['宽狭缝亮但模糊，窄狭缝清晰但暗，需要找到平衡。', 'Wide is bright but blurred, narrow is sharp but dark: find the balance.'] },
  ]);
})();
