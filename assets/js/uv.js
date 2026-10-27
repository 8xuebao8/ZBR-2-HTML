/* 紫外荧光灯 UV lamp (LW 365 nm / SW 254 nm) */
(function () {
  const G = GemLab, T = G.T;
  G.buildHeader('uv');
  G.initTabs();

  /* ================= 3D 模型 Model ================= */
  const v = (G.viewer = new G.Viewer(G.$('#viewer'), { cam: [0.6, 3.2, 6.4], target: [0, 0.9, 0], minD: 2.5, maxD: 14 }));
  const wall = G.mat(0x17191e, { roughness: 0.95 });
  const dark = G.mat(0x2a2e35, { roughness: 0.5 });

  // 暗箱 Viewing cabinet
  const cab = G.group(
    G.box(4.4, 2.6, 0.08, wall, [0, 1.3, -1.4]),
    G.box(0.08, 2.6, 2.8, wall, [-2.2, 1.3, 0]),
    G.box(0.08, 2.6, 2.8, wall, [2.2, 1.3, 0]),
    G.box(4.48, 0.1, 2.9, dark, [0, 2.63, 0]),
    G.box(4.4, 0.08, 2.8, wall, [0, 0.04, 0])
  );
  v.add(cab);
  v.addPart(cab, { zh: '暗箱', en: 'Viewing cabinet', dzh: '挡住环境光，让微弱的荧光也能看清，同时保护眼睛不受紫外线直射。', den: 'Blocks room light so faint glows are visible, and shields your eyes from the UV.' });

  // 灯管 Lamp tubes
  const lampBox = G.box(2.6, 0.28, 0.6, dark, [0, 2.42, -0.3]);
  const lwMat = new THREE.MeshStandardMaterial({ color: 0x222233, emissive: 0x7a3cff, emissiveIntensity: 0 });
  const swMat = new THREE.MeshStandardMaterial({ color: 0x222233, emissive: 0x9fb2ff, emissiveIntensity: 0 });
  const tubeLW = G.cyl(0.06, 0.06, 2.1, lwMat, [0, 2.24, -0.45], [0, 0, Math.PI / 2], 16);
  const tubeSW = G.cyl(0.06, 0.06, 2.1, swMat, [0, 2.24, -0.15], [0, 0, Math.PI / 2], 16);
  [tubeLW, tubeSW].forEach((t) => (t.castShadow = false));
  const lamp = G.group(lampBox, tubeLW, tubeSW);
  v.add(lamp);
  v.addPart(lamp, { zh: '紫外灯管', en: 'UV tubes', dzh: '后排：长波 LW 365nm；前排：短波 SW 254nm。灯管外有滤片，挡掉大部分可见光。', den: 'Back tube: long-wave 365 nm; front tube: short-wave 254 nm. Filters block most visible light.' });

  // 开关 Switch
  const lever = G.group(G.box(0.06, 0.4, 0.06, G.mat(0xff9f43), [0, 0.2, 0]));
  lever.position.set(2.32, 1.5, 0.9);
  const sw = G.group(G.rbox(0.2, 0.6, 0.5, 0.06, dark, [2.3, 1.5, 0.9], [0, Math.PI / 2, 0]), lever);
  v.add(sw);
  v.addPart(sw, { zh: '切换开关 OFF / LW / SW', en: 'Switch OFF / LW / SW', dzh: '选择关闭、长波或短波。', den: 'Selects off, long-wave or short-wave.' });

  // 托盘 Tray
  const tray = G.box(3.6, 0.04, 1.9, G.mat(0x08090b, { roughness: 1 }), [0, 0.1, 0.15]);
  v.add(tray);
  v.addPart(tray, { zh: '黑色无荧光托盘', en: 'Black non-fluorescent tray', dzh: '背景本身不能发荧光，否则会干扰观察。', den: 'The background must not fluoresce itself.' });

  const uvLight = new THREE.PointLight(0x6a2cff, 0, 6);
  uvLight.position.set(0, 2.1, -0.2);
  v.add(uvLight);

  // 宝石阵列 Gem array
  const items = G.gems.map((gem, i) => {
    const col = i % 4, row = Math.floor(i / 4);
    const obj = G.makeGem(gem, 0.34);
    obj.position.set(-1.35 + col * 0.9, 0.12 + (gem.cut === 'cab' ? 0 : 0.43 * 0.34), -0.45 + row * 0.6);
    const glow = G.makeGlow(0xffffff, 0.6);
    glow.position.set(0, 0.1, 0);
    obj.add(glow);
    v.add(obj);
    v.addPart(obj, partInfo(gem));
    return { gem, obj, glow };
  });

  function strengthWord(s) {
    if (s <= 0.02) return ['惰性', 'inert'];
    if (s < 0.25) return ['弱', 'weak'];
    if (s < 0.6) return ['中', 'moderate'];
    return ['强', 'strong'];
  }
  function partInfo(gem) {
    const lw = strengthWord(gem.uv.lw[0]), sw = strengthWord(gem.uv.sw[0]);
    return { zh: gem.zh, en: gem.en, dzh: `长波：${lw[0]}；短波：${sw[0]}。${gem.uvNote.zh}`, den: `LW: ${lw[1]}; SW: ${sw[1]}. ${gem.uvNote.en}` };
  }

  /* ================= 状态 State ================= */
  const st = { mode: 'off', room: false, sel: null };
  function apply() {
    const uvOn = st.mode !== 'off';
    const dark = !st.room;
    v.hemi.intensity = dark ? (uvOn ? 0.05 : 0.12) : 0.8;
    v.key.intensity = dark ? 0.02 : 0.95;
    v.fill.intensity = dark ? 0.02 : 0.35;
    lwMat.emissiveIntensity = st.mode === 'lw' ? 2 : 0;
    swMat.emissiveIntensity = st.mode === 'sw' ? 1.2 : 0;
    uvLight.intensity = st.mode === 'lw' ? 0.9 : st.mode === 'sw' ? 0.35 : 0;
    lever.rotation.x = st.mode === 'off' ? 0 : st.mode === 'lw' ? -0.6 : 0.6;
    const k = dark ? 1 : 0.35;
    items.forEach(({ gem, obj, glow }) => {
      const f = uvOn ? gem.uv[st.mode] : [0, '#000'];
      const s = f[0] * k;
      G.setGemEmissive(obj, f[1], s * 1.6);
      glow.material.color.set(f[1]);
      glow.material.opacity = s * 0.95;
      glow.visible = s > 0.01;
      const sz = 0.8 + f[0] * 1.6;
      glow.scale.set(sz, sz, 1);
    });
    G.$('#sw-warn').classList.toggle('hidden', st.mode !== 'sw');
    G.$('#badge').innerHTML = { off: T('紫外灯关闭', 'UV off'), lw: T('长波 LW 365nm', 'Long-wave 365 nm'), sw: T('短波 SW 254nm', 'Short-wave 254 nm') }[st.mode];
    renderTable();
    renderSel();
  }

  function renderSel() {
    const gem = st.sel;
    if (!gem) return;
    const lw = strengthWord(gem.uv.lw[0]), sw = strengthWord(gem.uv.sw[0]);
    G.$('#result').innerHTML = `<b>${T(gem.zh, gem.en)}</b><br>
      ${T('长波', 'LW')}：<span class="dot-inline" style="color:${gem.uv.lw[0] > 0.02 ? gem.uv.lw[1] : '#666'}">●</span> ${T(lw[0], lw[1])}
      &nbsp; ${T('短波', 'SW')}：<span style="color:${gem.uv.sw[0] > 0.02 ? gem.uv.sw[1] : '#666'}">●</span> ${T(sw[0], sw[1])}
      <div class="note" style="margin-top:6px">${T(gem.uvNote.zh, gem.uvNote.en)}</div>`;
  }
  function renderTable() {
    const cell = (f) => {
      const w = strengthWord(f[0]);
      return `<span style="color:${f[0] > 0.02 ? f[1] : '#555'}">●</span> ${T(w[0], w[1])}`;
    };
    G.$('#table').innerHTML = `<tr><th>${T('宝石', 'Gem')}</th><th>${T('长波 LW', 'LW')}</th><th>${T('短波 SW', 'SW')}</th></tr>` +
      G.gems.map((g) => `<tr><td>${T(g.zh, g.en)}</td><td>${cell(g.uv.lw)}</td><td>${cell(g.uv.sw)}</td></tr>`).join('');
  }

  G.seg(G.$('#mode'), [{ v: 'off', zh: '关闭', en: 'Off' }, { v: 'lw', zh: '长波 LW 365nm', en: '' }, { v: 'sw', zh: '短波 SW 254nm', en: '' }], (x) => { st.mode = x; apply(); }, 'lw');
  G.$('#room').addEventListener('change', (e) => { st.room = !e.target.checked; apply(); });
  G.gemPicker(G.$('#gem-picker'), G.gems, (gem) => {
    st.sel = gem;
    const it = items.find((i) => i.gem === gem);
    if (it) { v.highlight(it.obj); G.showPartCard(partInfo(gem)); }
    renderSel();
  }, 'ruby');
  v.onPick = (info, obj) => {
    G.showPartCard(info);
    const it = items.find((i) => i.obj === obj);
    if (it) { st.sel = it.gem; G.$$('#gem-picker .chip').forEach((c) => c.classList.toggle('active', c.dataset.id === it.gem.id)); renderSel(); }
  };
  G.onLang(apply);
  apply();

  G.renderParts(G.$('#parts-list'), { parts: v.parts.slice(0, 4), highlight: (o) => v.highlight(o) });
  G.renderQuiz(G.$('#quiz'), [
    { q: ['长波紫外灯的波长是？', 'The long-wave UV wavelength is…'],
      o: [['254nm', '254 nm'], ['365nm', '365 nm'], ['589nm', '589 nm'], ['694nm', '694 nm']], a: 1,
      e: ['长波 365nm，短波 254nm。589nm 是折射仪用的钠光。', 'LW 365 nm, SW 254 nm. 589 nm is the sodium light used on the refractometer.'] },
    { q: ['哪种元素常常使宝石没有荧光？', 'Which element often quenches fluorescence?'],
      o: [['铬', 'chromium'], ['铁', 'iron'], ['碳', 'carbon'], ['氧', 'oxygen']], a: 1,
      e: ['铁会“熄灭”荧光，所以蓝宝石、铁铝榴石、橄榄石通常惰性。', 'Iron quenches it, so sapphire, almandine and peridot are usually inert.'] },
    { q: ['钻石在长波紫外灯下最常见的荧光颜色是？', 'The most common LW fluorescence colour of diamond is…'],
      o: [['红色', 'red'], ['蓝色', 'blue'], ['绿色', 'green'], ['没有颜色', 'none']], a: 1,
      e: ['约三分之一的钻石有蓝色荧光，强弱不一。', 'About a third of diamonds fluoresce blue, with varying strength.'] },
    { q: ['使用短波紫外灯最需要注意什么？', 'What is most important when using SW UV?'],
      o: [['保护眼睛和皮肤', 'protect your eyes and skin'], ['开亮室内灯', 'turn on the room lights'], ['把宝石泡在水里', 'put the stone in water'], ['越近越好', 'get as close as possible']], a: 0,
      e: ['短波紫外线可灼伤眼睛和皮肤。', 'Short-wave UV can burn the eyes and skin.'] },
    { q: ['关闭紫外灯后宝石仍然发光，这叫？', 'A glow that continues after the lamp is off is called…'],
      o: [['荧光', 'fluorescence'], ['磷光', 'phosphorescence'], ['色散', 'dispersion'], ['多色性', 'pleochroism']], a: 1,
      e: ['磷光是延迟发光，例如某些钻石、合成钻石。', 'Phosphorescence is delayed glow, seen in some natural and synthetic diamonds.'] },
  ]);
})();
