/* 折射仪 Refractometer */
(function () {
  const G = GemLab, T = G.T;
  G.buildHeader('refractometer');
  G.initTabs();

  /* ================= 3D 模型 Model ================= */
  const v = (G.viewer = new G.Viewer(G.$('#viewer'), { cam: [4.2, 4.4, 6.2], target: [0, 0.9, 0.3], minD: 2.5, maxD: 16 }));
  const black = G.mat(0x1a1c20, { roughness: 0.55, metalness: 0.2 });
  const grey = G.mat(0x3a3f47, { roughness: 0.4, metalness: 0.4 });
  const chrome = G.mat(0xc9ced6, { roughness: 0.2, metalness: 0.9 });

  const body = G.group(G.rbox(3.4, 0.9, 1.6, 0.2, black, [0, 0.45, 0]), G.box(2.2, 0.4, 1.4, black, [-0.4, 1.08, 0]));
  v.add(body);
  v.addPart(body, { zh: '仪器主体', en: 'Housing', dzh: '内部有反射镜、透镜和刻度片，把阴影边成像到目镜中。', den: 'Contains mirrors, lenses and the scale that image the shadow edge into the eyepiece.' });

  const plate = G.box(1.5, 0.06, 1.2, chrome, [-0.4, 1.31, 0]);
  const prism = G.box(0.9, 0.05, 0.5, G.glassMat(0x9fdcff, 0.65), [-0.4, 1.345, 0]);
  const prismG = G.group(plate, prism);
  v.add(prismG);
  v.addPart(prismG, { zh: '棱镜（测台）', en: 'Prism (hemicylinder)', dzh: '高折射率铅玻璃（n≈1.86–1.89），宝石放在它上面。玻璃较软，小心别划伤。', den: 'High-RI lead glass (n ≈ 1.86–1.89) the stone sits on. It is soft: do not scratch it.' });

  const coverPivot = new THREE.Group();
  coverPivot.position.set(-0.4, 1.36, -0.62);
  coverPivot.add(G.box(1.4, 0.08, 1.25, grey, [0, 0.05, 0.62]));
  coverPivot.rotation.x = -1.9;
  v.add(coverPivot);
  v.addPart(coverPivot, { zh: '遮光盖', en: 'Cover', dzh: '读数时盖上，挡住杂光。', den: 'Closed while reading to keep out stray light.' });

  const eyepiece = new THREE.Group();
  eyepiece.add(G.cyl(0.24, 0.24, 1.0, black, [0, 0.5, 0]), G.cyl(0.3, 0.3, 0.25, grey, [0, 1.05, 0]));
  eyepiece.position.set(1.45, 0.75, 0);
  eyepiece.rotation.z = -1.2;
  v.add(eyepiece);
  v.addPart(eyepiece, { zh: '目镜', en: 'Eyepiece', dzh: '看到内置刻度和明暗分界（阴影边）；可调焦使刻度清晰。', den: 'Shows the built-in scale and the shadow edge; focus it until the scale is sharp.' });

  const polCap = G.group(G.cyl(0.33, 0.33, 0.08, G.mat(0x30343a), [0, 0, 0]), G.cyl(0.26, 0.26, 0.085, G.glassMat(0x404858, 0.8), [0, 0, 0]),
    G.box(0.5, 0.09, 0.03, G.mat(0xffffff), [0, 0, 0]));
  polCap.position.set(2.45, 1.21, 0);
  polCap.rotation.z = -1.2;
  v.add(polCap);
  v.addPart(polCap, { zh: '偏光片', en: 'Polarizing filter', dzh: '套在目镜上转动，可让双折射宝石的两条阴影边分别出现，便于分辨。', den: 'Fits over the eyepiece; turning it isolates each of the two edges of a doubly refractive stone.' });

  const lampFaceMat = new THREE.MeshStandardMaterial({ color: 0x333300, emissive: 0xffc640, emissiveIntensity: 0 });
  const lamp = G.group(G.rbox(0.8, 0.9, 0.7, 0.12, grey, [0, 0.45, 0]), G.cyl(0.18, 0.18, 0.08, lampFaceMat, [0.42, 0.6, 0], [0, 0, Math.PI / 2]));
  lamp.position.set(-2.6, 0, 0);
  v.add(lamp);
  const lampLight = new THREE.PointLight(0xffc640, 0, 4);
  lampLight.position.set(-2.0, 0.7, 0);
  v.add(lampLight);
  v.addPart(lamp, { zh: '单色光源（589nm）', en: 'Monochromatic light (589 nm)', dzh: '黄色钠光，让阴影边清晰锐利；白光下边界会变成彩虹色带。', den: 'Yellow sodium-wavelength light gives a sharp edge; white light gives a coloured fringe.' });

  const bottle = G.group(G.cyl(0.2, 0.2, 0.5, G.mat(0x6a3a10, { transparent: true, opacity: 0.85, roughness: 0.1 }), [0, 0.25, 0]), G.cyl(0.12, 0.12, 0.2, black, [0, 0.6, 0]), G.cyl(0.05, 0.02, 0.25, black, [0, 0.82, 0]));
  bottle.position.set(1.2, 0, 1.5);
  v.add(bottle);
  v.addPart(bottle, { zh: '接触液（RI≈1.79）', en: 'Contact liquid (RI ≈ 1.79)', dzh: '在宝石与棱镜之间形成光学接触。有毒，避免接触皮肤。', den: 'Makes optical contact between stone and prism. Toxic: avoid skin contact.' });

  const drop = G.sph(0.12, G.glassMat(0xffe9a0, 0.7), [-0.4, 1.37, 0]);
  drop.scale.set(1, 0.25, 1);
  drop.visible = false;
  v.add(drop);

  const cloth = G.box(1.2, 0.02, 0.9, G.mat(0x2c4a6e, { roughness: 1 }), [0.2, 0.01, 1.7]);
  v.add(cloth);

  let gemObj = null;
  const gemOff = new THREE.Vector3(0.2, 0.24, 1.7), gemOn = new THREE.Vector3(-0.4, 1.38 + 0.17 * 0.6, 0);
  function setGem3D(gem) {
    if (gemObj) v.scene.remove(gemObj);
    gemObj = G.makeGem(gem, 0.6);
    gemObj.position.copy(gemOff);
    v.add(gemObj);
  }

  /* ================= 状态 State ================= */
  const st = { gem: null, step: 0, rot: 0, pol: 'none', exact: false, spot: 1.58, records: [] };
  const STEPS = [
    ['清洁棱镜与宝石', 'Clean prism & stone'],
    ['点一滴接触液', 'Apply a drop of contact liquid'],
    ['宝石台面朝下放到棱镜上', 'Place the stone table-down'],
    ['合上遮光盖', 'Close the cover'],
    ['打开 589nm 光源', 'Switch on the 589 nm light'],
  ];
  function renderSteps() {
    G.$('#steps').innerHTML = STEPS.map((s, i) =>
      `<div class="step-row ${i < st.step ? 'done' : ''}"><span class="num">${i < st.step ? '✓' : i + 1}</span>
       <button class="btn ${i === st.step ? 'primary' : ''}" data-i="${i}" ${i !== st.step ? 'disabled' : ''}>${T(s[0], s[1])}</button></div>`).join('');
    G.$$('#steps button').forEach((b) => b.addEventListener('click', () => { st.step = +b.dataset.i + 1; refresh(); }));
  }

  v.tick((dt) => {
    if (!gemObj) return;
    const target = st.step >= 3 ? gemOn : gemOff;
    gemObj.position.lerp(target, 1 - Math.exp(-6 * dt));
    const flip = st.step >= 3 ? Math.PI : 0;
    gemObj.rotation.x = G.approach(gemObj.rotation.x, flip, 6, dt);
    gemObj.rotation.y = G.approach(gemObj.rotation.y, (st.rot * Math.PI) / 180, 6, dt);
    coverPivot.rotation.x = G.approach(coverPivot.rotation.x, st.step >= 4 ? 0 : -1.9, 5, dt);
    polCap.rotation.x = G.approach(polCap.rotation.x, st.pol === '90' ? Math.PI / 2 : 0, 6, dt);
  });

  /* ================= 读数计算 Readings ================= */
  const S = (deg) => Math.sin((deg * Math.PI) / 180) ** 2;
  function edges(gem, ang) {
    const r = gem.ri;
    if (gem.otl) return { otl: true };
    if (r.n) return { low: r.n, high: r.n };
    if (r.o) {
      const m = r.o + (r.e - r.o) * S(ang);
      return { low: Math.min(r.o, m), high: Math.max(r.o, m) };
    }
    return { low: r.a + (r.b - r.a) * S(ang), high: r.g - (r.g - r.b) * S(ang + 40) };
  }

  const MIN = 1.35, MAX = 1.8, LIQ = 1.79;
  const cvs = G.$('#scale');
  function draw() {
    const { ctx, w, h } = G.fitCanvas(cvs);
    const top = h * 0.08, span = h * 0.84;
    const Y = (ri) => top + ((ri - MIN) / (MAX - MIN)) * span;
    const cx = w / 2;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    const ready = st.step >= 5;
    const gem = st.gem;
    const msg = (zh, en) => {
      ctx.fillStyle = '#8a8f60'; ctx.font = '13px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(G.tx(zh, en), cx, h / 2);
    };
    if (!ready) {
      if (st.step === 4) msg('请打开光源', 'Switch on the light');
      else msg('请完成准备步骤', 'Finish the set-up steps');
      return;
    }
    const BRIGHT = '#e9eda0', HALF = 'rgba(160,165,70,1)', DARK = '#16170a';
    let e = edges(gem, st.rot);
    let low, high, spotMode = gem.spot;
    if (e.otl) { low = high = LIQ; }
    else { low = Math.min(e.low, LIQ); high = Math.min(e.high, LIQ); }
    if (st.pol === '0') high = low;
    else if (st.pol === '90') low = high;

    if (spotMode) {
      ctx.fillStyle = '#121208'; ctx.fillRect(0, 0, w, h);
    } else {
      // 亮区 → 半亮区 → 暗区 bright → half → dark
      const g1 = ctx.createLinearGradient(0, top, 0, Y(low));
      g1.addColorStop(0, '#f4f6c0'); g1.addColorStop(1, BRIGHT);
      ctx.fillStyle = g1; ctx.fillRect(0, 0, w, Y(low));
      ctx.fillStyle = HALF; ctx.fillRect(0, Y(low), w, Math.max(0, Y(high) - Y(low)));
      ctx.fillStyle = DARK; ctx.fillRect(0, Y(high), w, h - Y(high));
      // 边界柔化 soften edges
      [low, high].forEach((ri) => {
        const g = ctx.createLinearGradient(0, Y(ri) - 2, 0, Y(ri) + 2);
        g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.25)');
        ctx.fillStyle = g; ctx.fillRect(0, Y(ri) - 2, w, 4);
      });
      // 接触液线 liquid line
      ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(0, Y(LIQ), w, h - Y(LIQ));
    }

    // 刻度（亮区黑字，暗区亮字）Scale: dark text on bright, light text on dark
    const drawScale = (color) => {
      ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 1;
      ctx.font = '11px ui-monospace, Menlo, monospace'; ctx.textAlign = 'right';
      for (let i = 0; i <= Math.round((MAX - MIN) * 100); i++) {
        const ri = MIN + i / 100, y = Y(ri);
        const major = i % 5 === 0;
        ctx.beginPath(); ctx.moveTo(cx - (major ? 16 : 8), y); ctx.lineTo(cx, y); ctx.stroke();
        if (major) ctx.fillText(ri.toFixed(2), cx - 20, y + 4);
      }
      ctx.beginPath(); ctx.moveTo(cx, Y(MIN)); ctx.lineTo(cx, Y(MAX)); ctx.stroke();
    };
    const boundary = spotMode ? -1 : Y(low);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, w, Math.max(0, boundary)); ctx.clip(); drawScale('rgba(30,30,10,.9)'); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.rect(0, Math.max(0, boundary), w, h); ctx.clip(); drawScale('rgba(225,230,160,.75)'); ctx.restore();

    if (spotMode) {
      // 点测法：液滴小像 spot image
      const y = Y(st.spot), r = 9, diff = st.spot - gem.ri.n;
      const k = G.clamp(0.5 - diff / 0.02, 0, 1); // 亮的比例 fraction bright
      ctx.save();
      ctx.beginPath(); ctx.ellipse(cx + 34, y, r * 1.3, r, 0, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = DARK; ctx.fillRect(cx + 20, y - r, 30, r * 2);
      ctx.fillStyle = BRIGHT; ctx.fillRect(cx + 20, y - r, 30, r * 2 * k);
      ctx.restore();
      ctx.strokeStyle = 'rgba(233,237,160,.6)';
      ctx.beginPath(); ctx.ellipse(cx + 34, y, r * 1.3, r, 0, 0, Math.PI * 2); ctx.stroke();
    }

    if (st.exact) {
      ctx.font = 'bold 12px ui-monospace, Menlo, monospace'; ctx.textAlign = 'left';
      // dy：低值标签放在边上方，高值标签放在下方，避免重叠 labels above/below the edge
      const label = (ri, txt, dy) => {
        const y = Y(ri) + dy;
        ctx.strokeStyle = '#5ec8ff'; ctx.beginPath(); ctx.moveTo(cx + 2, Y(ri)); ctx.lineTo(cx + 10, y); ctx.stroke();
        ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillRect(cx + 10, y - 9, 118, 16);
        ctx.fillStyle = '#5ec8ff'; ctx.fillText(txt, cx + 14, y + 3);
      };
      if (e.otl) label(LIQ, G.tx('OTL 超出量程', 'OTL'), -14);
      else if (spotMode) label(gem.ri.n, '≈ ' + gem.ri.n.toFixed(2), -18);
      else {
        label(low, low.toFixed(3), -14);
        if (high - low > 0.0005) label(high, high.toFixed(3), 14);
      }
    }
  }

  /* ================= 记录与判读 Records & interpretation ================= */
  function current() {
    const e = edges(st.gem, st.rot);
    if (e.otl) return { rot: st.rot, otl: true };
    if (st.gem.spot) return { rot: st.rot, low: st.gem.ri.n, high: st.gem.ri.n, spot: true };
    return { rot: st.rot, low: +e.low.toFixed(3), high: +e.high.toFixed(3) };
  }
  function renderRecords() {
    const r = st.records;
    G.$('#records').innerHTML =
      `<tr><th>#</th><th>${T('转角', 'Angle')}</th><th>${T('低值', 'Low')}</th><th>${T('高值', 'High')}</th></tr>` +
      (r.length ? r.map((x, i) => `<tr><td>${i + 1}</td><td class="num">${x.rot}°</td>
        <td class="num">${x.otl ? 'OTL' : x.spot ? '≈' + x.low.toFixed(2) : x.low.toFixed(3)}</td>
        <td class="num">${x.otl ? '—' : x.spot ? '—' : x.high.toFixed(3)}</td></tr>`).join('')
        : `<tr><td colspan="4" class="note">${T('还没有记录。完成准备后转动宝石，每转一次记录一次。', 'No readings yet. After set-up, turn the stone and record at each position.')}</td></tr>`);
    interpret();
  }
  function interpret() {
    const box = G.$('#interp'), r = st.records, gem = st.gem;
    box.className = 'result';
    if (!r.length) { box.innerHTML = T('至少在 4 个不同角度记录读数后，这里会帮你分析。', 'Record at least 4 different angles and the analysis appears here.'); return; }
    if (r[0].otl) { box.innerHTML = T('<b>超出量程（OTL）</b>：只能看到接触液 1.79 处的界线，说明宝石折射率高于 1.79（如钻石、锆石、合成立方氧化锆）。', '<b>Over the limit (OTL)</b>: only the liquid line at 1.79 is visible, so the RI is above 1.79 (e.g. diamond, zircon, CZ).'); box.classList.add('good'); return; }
    if (r[0].spot) { box.innerHTML = T(`<b>点测读数 ≈ ${gem.ri.n.toFixed(2)}</b>：集合体弧面宝石只读到两位小数。1.66 左右是翡翠的典型值。`, `<b>Spot reading ≈ ${gem.ri.n.toFixed(2)}</b>: read to two decimals for cabochons. About 1.66 is typical of jadeite.`); box.classList.add('good'); return; }
    const angles = new Set(r.map((x) => x.rot));
    if (angles.size < 4) { box.innerHTML = T(`已记录 ${r.length} 次（${angles.size} 个角度），请继续在不同角度记录。`, `${r.length} readings at ${angles.size} angles: keep recording at other angles.`); return; }
    const lows = r.map((x) => x.low), highs = r.map((x) => x.high);
    const minL = Math.min(...lows), maxL = Math.max(...lows), minH = Math.min(...highs), maxH = Math.max(...highs);
    const dr = maxH - minL;
    let txt;
    if (dr < 0.002) txt = T(`<b>单折射</b>：读数恒定 ${minL.toFixed(3)}，DR ≈ 0。`, `<b>Singly refractive</b>: constant reading ${minL.toFixed(3)}, DR ≈ 0.`);
    else {
      const lowFixed = maxL - minL < 0.0015, highFixed = maxH - minH < 0.0015;
      let kind;
      if (lowFixed && !highFixed) kind = T('一轴晶，<b>正光性 (+)</b>：低值边固定（ω），高值边移动。', 'Uniaxial <b>positive (+)</b>: the low edge (ω) stays, the high edge moves.');
      else if (highFixed && !lowFixed) kind = T('一轴晶，<b>负光性 (−)</b>：高值边固定（ω），低值边移动。', 'Uniaxial <b>negative (−)</b>: the high edge (ω) stays, the low edge moves.');
      else kind = T('<b>二轴晶</b>：两条阴影边都在移动。', '<b>Biaxial</b>: both edges move.');
      txt = T(`<b>双折射</b>，RI ${minL.toFixed(3)} – ${maxH.toFixed(3)}，<b>DR = ${dr.toFixed(3)}</b>。`, `<b>Doubly refractive</b>, RI ${minL.toFixed(3)} – ${maxH.toFixed(3)}, <b>DR = ${dr.toFixed(3)}</b>.`) + '<br>' + kind;
    }
    box.innerHTML = txt + `<div class="note" style="margin-top:6px">${T('参考值', 'Reference')}：${T(gem.zh, gem.en)} RI ${G.riText(gem)}，${G.opticText(gem)}</div>`;
    box.classList.add('good');
  }

  /* ================= 界面 UI ================= */
  function refresh() {
    renderSteps();
    drop.visible = st.step >= 2;
    lampFaceMat.emissiveIntensity = st.step >= 5 ? 1.5 : 0;
    lampLight.intensity = st.step >= 5 ? 1.2 : 0;
    G.$('#rot-val').textContent = st.rot + '°';
    G.$('#spot-group').classList.toggle('hidden', !st.gem.spot);
    G.$('#badge').innerHTML = T(st.gem.zh, st.gem.en) + (st.step >= 5 ? ' · ' + T('可以读数', 'ready to read') : '');
    G.$('#obs-mode').innerHTML = st.gem.spot ? T('点测法', 'Spot method') : st.pol === 'none' ? T('无偏光片', 'No filter') : T('偏光片 ' + st.pol + '°', 'Filter ' + st.pol + '°');
    G.$('#rec').disabled = st.step < 5;
    draw();
  }

  G.gemPicker(G.$('#gem-picker'), G.gems.filter((g) => g.id !== 'synruby'), (gem) => {
    st.gem = gem; st.step = 0; st.rot = 0; st.records = [];
    G.$('#rot').value = 0;
    setGem3D(gem); renderRecords(); refresh();
  }, 'ruby');
  G.seg(G.$('#pol'), [{ v: 'none', zh: '不用', en: 'None' }, { v: '0', zh: '0°', en: '' }, { v: '90', zh: '90°', en: '' }], (x) => { st.pol = x; refresh(); }, 'none');
  G.$('#rot').addEventListener('input', (e) => { st.rot = +e.target.value; refresh(); });
  G.$('#spot').addEventListener('input', (e) => { st.spot = +e.target.value; refresh(); });
  G.$('#exact').addEventListener('change', (e) => { st.exact = e.target.checked; refresh(); });
  G.$('#quick').addEventListener('click', () => { st.step = 5; refresh(); });
  G.$('#rec').addEventListener('click', () => { st.records.push(current()); renderRecords(); });
  G.$('#clear').addEventListener('click', () => { st.records = []; renderRecords(); });
  window.addEventListener('resize', draw);
  G.onLang(() => { refresh(); renderRecords(); });

  G.renderParts(G.$('#parts-list'), v);
  G.renderQuiz(G.$('#quiz'), [
    { q: ['折射仪的测量原理是？', 'A refractometer works by…'],
      o: [['光的色散', 'dispersion'], ['全反射临界角', 'the critical angle of total internal reflection'], ['光的吸收', 'absorption'], ['荧光', 'fluorescence']], a: 1,
      e: ['阴影边的位置由临界角决定，而临界角由宝石的折射率决定。', 'The shadow edge is set by the critical angle, which depends on the gem’s RI.'] },
    { q: ['为什么钻石在常规折射仪上测不出读数？', 'Why can’t a diamond be read on a standard refractometer?'],
      o: [['钻石太硬', 'it is too hard'], ['折射率 2.417 超过接触液上限（约 1.79）', 'its RI of 2.417 is above the liquid limit (≈1.79)'], ['钻石不透明', 'it is opaque'], ['钻石是单折射', 'it is singly refractive']], a: 1,
      e: ['高于接触液折射率的宝石都会“超出量程（OTL）”。', 'Anything above the liquid’s RI is “over the limit” (OTL).'] },
    { q: ['转动宝石时，一条边不动、另一条边向低值方向移动，说明？', 'One edge stays still while the other moves to lower values. The stone is…'],
      o: [['单折射', 'singly refractive'], ['一轴晶正光性', 'uniaxial positive'], ['一轴晶负光性', 'uniaxial negative'], ['二轴晶', 'biaxial']], a: 2,
      e: ['移动的是 ε 边：ε < ω 为负光性，例如红宝石、祖母绿。', 'The moving edge is ε; ε < ω means negative, e.g. ruby, emerald.'] },
    { q: ['红宝石读数 1.762–1.770，双折射率（DR）是多少？', 'Ruby reads 1.762–1.770. What is the DR?'],
      o: [['0.008', '0.008'], ['1.766', '1.766'], ['0.080', '0.080'], ['3.532', '3.532']], a: 0,
      e: ['DR = 最大值 − 最小值 = 1.770 − 1.762 = 0.008。', 'DR = highest − lowest = 1.770 − 1.762 = 0.008.'] },
    { q: ['标准读数应使用什么光源？', 'Which light gives standard readings?'],
      o: [['白光', 'white light'], ['589nm 黄色单色光', '589 nm yellow monochromatic light'], ['紫外光', 'UV light'], ['红外光', 'infrared']], a: 1,
      e: ['单色光使阴影边锐利；白光会产生彩色边。', 'Monochromatic light gives a sharp edge; white light gives a coloured fringe.'] },
    { q: ['弧面型翡翠应该怎样测折射率？', 'How should a jadeite cabochon be measured?'],
      o: [['点测法（远视法）', 'spot (distant vision) method'], ['加更多接触液', 'use lots of liquid'], ['不能测', 'it can’t be measured'], ['用紫外灯', 'with a UV lamp']], a: 0,
      e: ['点测法读数约 1.66，只读到两位小数。', 'The spot reading is about 1.66, read to two decimals.'] },
  ]);
})();
