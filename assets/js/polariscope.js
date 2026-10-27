/* 偏光镜 Polariscope */
(function () {
  const G = GemLab, T = G.T;
  G.buildHeader('polariscope');
  G.initTabs();

  /* ================= 3D 模型 Model ================= */
  const v = (G.viewer = new G.Viewer(G.$('#viewer'), { cam: [4.2, 4.6, 5.4], target: [0, 1.3, 0], minD: 2.5, maxD: 14 }));
  const dark = G.mat(0x24272d, { roughness: 0.5, metalness: 0.3 });
  const chrome = G.mat(0xc9ced6, { roughness: 0.2, metalness: 0.9 });
  const white = new THREE.MeshBasicMaterial({ color: 0xffffff });

  const base = G.group(G.cyl(1.25, 1.4, 0.55, dark, [0, 0.275, 0], null, 48), G.box(0.3, 0.12, 0.12, G.mat(0x111111), [0, 0.25, 1.35]));
  v.add(base);
  v.addPart(base, { zh: '底座与光源', en: 'Base & light source', dzh: '内有灯泡，从下方向上照明；前面是电源开关。', den: 'Holds the lamp that shines upward; power switch on the front.' });

  const polMat = new THREE.MeshStandardMaterial({ color: 0x2a2e36, emissive: 0xfff4dc, emissiveIntensity: 0.55, roughness: 0.3 });
  const polarizer = G.group(G.cyl(0.95, 0.95, 0.04, polMat, [0, 0.57, 0], null, 48), G.box(1.7, 0.01, 0.03, white, [0, 0.595, 0]));
  v.add(polarizer);
  v.addPart(polarizer, { zh: '下偏光片（起偏器）', en: 'Lower filter (polarizer)', dzh: '固定不动，把灯光变成单一方向振动的平面偏振光。白线表示振动方向。', den: 'Fixed. Turns the lamp light into plane-polarized light; the white line shows its vibration direction.' });

  const stage = new THREE.Group();
  stage.position.y = 0.66;
  stage.add(G.cyl(0.8, 0.8, 0.04, G.glassMat(0xcfe8ff, 0.3), [0, 0, 0], null, 48));
  stage.add(G.box(0.08, 0.05, 0.25, G.mat(0xff9f43), [0, 0.02, 0.68]));
  v.add(stage);
  v.addPart(stage, { zh: '旋转载物台', en: 'Rotating stage', dzh: '放宝石的玻璃台，可转动 360°。橙色标记显示转角。', den: 'Glass stage that turns 360° with the stone; the orange tab shows the angle.' });

  const post = G.cyl(0.09, 0.09, 2.6, chrome, [0, 1.85, -1.2]);
  const armArm = G.box(0.16, 0.12, 0.35, chrome, [0, 2.7, -1.05]);
  v.add(post, armArm);
  v.addPart(post, { zh: '支架', en: 'Stand', dzh: '支撑上偏光片，可调节高度。', den: 'Holds the analyzer; its height can be adjusted.' });

  const analyzer = new THREE.Group();
  analyzer.position.set(0, 2.7, 0);
  analyzer.add(G.torus(0.95, 0.06, chrome, [0, 0, 0], [Math.PI / 2, 0, 0]));
  analyzer.add(G.cyl(0.93, 0.93, 0.03, G.glassMat(0x3a4250, 0.55), [0, 0, 0], null, 48));
  analyzer.add(G.box(1.7, 0.01, 0.03, white, [0, 0.025, 0]));
  analyzer.add(G.box(0.3, 0.05, 0.12, chrome, [1.05, 0, 0]));
  v.add(analyzer);
  v.addPart(analyzer, { zh: '上偏光片（检偏器）', en: 'Upper filter (analyzer)', dzh: '可转动。与下偏光片垂直时为“正交”（视域最暗），平行时视域最亮。', den: 'Can be turned. Crossed with the polarizer the field is darkest; parallel it is brightest.' });

  const cono = new THREE.Group();
  cono.add(G.sph(0.3, G.glassMat(0xe8f6ff, 0.45), [0, 0, 0]));
  cono.add(G.rod([0.25, 0.1, 0], [1.5, 0.6, 0.4], 0.03, chrome));
  cono.position.set(0, 1.4, 0);
  v.add(cono);
  v.addPart(cono, { zh: '干涉球（锥光镜）', en: 'Conoscope sphere', dzh: '放在宝石上方的玻璃小球，把会聚的偏振光变成可观察的干涉图。', den: 'A glass sphere held over the stone that turns converging light into a visible interference figure.' });

  const beamMat = new THREE.MeshBasicMaterial({ color: 0xfff3d8, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false });
  const beamLow = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.6, 40, 1, true), beamMat.clone());
  beamLow.position.y = 0.95;
  const beamUp = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 1.3, 40, 1, true), beamMat.clone());
  beamUp.position.y = 1.95;
  [beamLow, beamUp].forEach((b) => (b.material.side = THREE.DoubleSide));
  v.add(beamLow, beamUp);

  let gemObj = null;
  function setGem3D(gem) {
    if (gemObj) stage.remove(gemObj);
    gemObj = G.makeGem(gem, 0.55);
    gemObj.position.y = 0.02 + (gem.cut === 'cab' ? 0 : 0.43 * 0.55);
    stage.add(gemObj);
  }

  /* ================= 状态与光学 State & optics ================= */
  const st = { gem: null, rot: 0, ana: 'cross', auto: false, cono: false, seen: new Array(72).fill(null), shown: false };

  // 正交偏光下的亮度 Brightness between crossed polars (0–1)
  function crossBright(gem, deg) {
    if (gem.optic === 'DR') return Math.sin(2 * ((deg + 20) * Math.PI) / 180) ** 2;
    if (gem.optic === 'AGG') return 0.62;
    return 0.03 + (gem.adr || 0) * (0.5 + 0.5 * Math.sin((deg * Math.PI) / 45)) + (gem.strain ? 0.08 : 0);
  }
  function viewBright(gem, deg) {
    const b = crossBright(gem, deg);
    return st.ana === 'cross' ? b : 1 - b * 0.85;
  }

  v.tick((dt) => {
    if (st.auto) {
      st.rot = (st.rot + dt * 30) % 360;
      G.$('#rot').value = Math.round(st.rot);
      updateUI(true);
    }
    stage.rotation.y = G.approach(stage.rotation.y, (-st.rot * Math.PI) / 180, 10, dt);
    analyzer.rotation.y = G.approach(analyzer.rotation.y, st.ana === 'cross' ? Math.PI / 2 : 0, 6, dt);
    cono.visible = st.cono;
    const b = viewBright(st.gem, st.rot);
    beamUp.material.opacity = 0.015 + 0.12 * b;
    beamLow.material.opacity = 0.05;
  });

  /* ================= 画面 View ================= */
  const cvs = G.$('#view');
  const off = document.createElement('canvas');
  off.width = off.height = 180;

  function gemPath(ctx, cx, cy, R, ang) {
    ctx.beginPath();
    for (let i = 0; i <= 64; i++) {
      const t = (i / 64) * Math.PI * 2;
      const c = Math.cos(t), s = Math.sin(t);
      // 圆角矩形（枕形）cushion shape
      const k = Math.pow(Math.abs(c) ** 4 + Math.abs(s) ** 4, -0.25);
      const x = c * k * R * 1.05, y = s * k * R * 0.85;
      const X = cx + x * Math.cos(ang) - y * Math.sin(ang), Y = cy + x * Math.sin(ang) + y * Math.cos(ang);
      i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
    }
    ctx.closePath();
  }

  function drawInterference(gem) {
    const ox = off.getContext('2d');
    const N = off.width, img = ox.createImageData(N, N), d = img.data;
    const th = (st.rot * Math.PI) / 180;
    const biax = gem.char[0] === 'B';
    const k = Math.min(gem.dr * 350, 5);
    const m = 0.38, p1 = [m * Math.cos(th), m * Math.sin(th)];
    const lam = [0.65, 0.55, 0.45];
    const parallel = st.ana !== 'cross';
    for (let j = 0; j < N; j++) {
      for (let i = 0; i < N; i++) {
        const x = (i / N) * 2 - 1, y = (j / N) * 2 - 1, rr = x * x + y * y;
        const o = (j * N + i) * 4;
        if (rr > 1) { d[o + 3] = 0; continue; }
        let cross, r;
        if (biax) {
          const a1 = Math.atan2(y - p1[1], x - p1[0]), a2 = Math.atan2(y + p1[1], x + p1[0]);
          const d1 = Math.hypot(x - p1[0], y - p1[1]), d2 = Math.hypot(x + p1[0], y + p1[1]);
          cross = Math.sin(a1 + a2) ** 2; // sin²(2ψ)，ψ=(a1+a2)/2
          r = k * d1 * d2 * 1.6;
        } else {
          const phi = Math.atan2(y, x);
          cross = Math.sin(2 * phi) ** 2;
          r = k * rr;
          if (gem.bullseye) {
            const rho = Math.sqrt(rr), t = G.clamp((rho - 0.1) / 0.25, 0, 1);
            cross = 1 - t + t * cross;
            r += 0.2;
          }
        }
        for (let c = 0; c < 3; c++) {
          let I = cross * Math.sin((Math.PI * r) / lam[c]) ** 2;
          if (parallel) I = 1 - I;
          d[o + c] = 255 * (0.04 + 0.92 * I);
        }
        d[o + 3] = 255;
      }
    }
    ox.putImageData(img, 0, 0);
  }

  function draw() {
    const { ctx, w, h } = G.fitCanvas(cvs);
    const cx = w / 2, cy = h / 2, gem = st.gem;
    const crossed = st.ana === 'cross';
    ctx.fillStyle = crossed ? '#06070a' : '#c9ced8';
    ctx.fillRect(0, 0, w, h);

    if (st.cono && gem.optic === 'DR') {
      drawInterference(gem);
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, w * 0.42, 0, Math.PI * 2); ctx.clip();
      ctx.drawImage(off, cx - w * 0.42, cy - w * 0.42, w * 0.84, w * 0.84);
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,.25)';
      ctx.beginPath(); ctx.arc(cx, cy, w * 0.42, 0, Math.PI * 2); ctx.stroke();
      return;
    }

    const col = G.hexToRgb(gem.css);
    const ang = (-st.rot * Math.PI) / 180;
    const R = w * 0.27;
    const b = viewBright(gem, st.rot);
    const lit = G.mix(col, [255, 255, 255], 0.45);
    const base = crossed ? G.mix([10, 10, 14], lit, b) : G.mix(G.mix(col, [255, 255, 255], 0.3), [20, 20, 25], 1 - b);
    ctx.save();
    gemPath(ctx, cx, cy, R, ang);
    ctx.fillStyle = G.rgba(base, 1);
    ctx.fill();
    ctx.clip();

    const rnd = G.rng(gem.id);
    if (crossed && gem.optic === 'AGG') {
      // 集合体：斑驳的亮点 aggregate: mottled grains
      for (let i = 0; i < 260; i++) {
        const x = cx + (rnd() - 0.5) * R * 2.2, y = cy + (rnd() - 0.5) * R * 2.2, ph = rnd() * 6.28;
        const k = 0.5 + 0.5 * Math.sin(ph + (st.rot * Math.PI) / 45);
        ctx.fillStyle = G.rgba(G.mix([20, 30, 25], lit, 0.4 + 0.6 * k), 0.55);
        ctx.beginPath(); ctx.arc(x, y, 3 + rnd() * 6, 0, Math.PI * 2); ctx.fill();
      }
    }
    if (crossed && gem.adr) {
      // 异常消光：不规则亮斑 anomalous extinction: patches
      for (let i = 0; i < 6; i++) {
        const x = cx + (rnd() - 0.5) * R * 1.4, y = cy + (rnd() - 0.5) * R * 1.4, ph = rnd() * 6.28;
        const k = gem.adr * 2.2 * (0.5 + 0.5 * Math.sin(ph + (st.rot * Math.PI) / 60));
        const g = ctx.createRadialGradient(x, y, 0, x, y, R * 0.45);
        g.addColorStop(0, G.rgba([220, 225, 240], k)); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      }
    }
    if (crossed && gem.strain) {
      // 玻璃的蛇形应力带 snake-like strain bands
      ctx.lineWidth = R * 0.12;
      for (let k = 0; k < 4; k++) {
        const a = 0.18 + 0.15 * Math.sin((st.rot * Math.PI) / 90 + k);
        ctx.strokeStyle = `rgba(200,215,235,${a})`;
        ctx.beginPath();
        for (let x = -1.2; x <= 1.2; x += 0.05) {
          const y = -0.6 + k * 0.4 + 0.15 * Math.sin(x * 3.2 + k * 1.3);
          const X = cx + x * R, Y = cy + y * R;
          x === -1.2 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y);
        }
        ctx.stroke();
      }
    }
    if (gem.cut !== 'cab') G.drawBrilliantTop(ctx, cx, cy, R * 0.9, { edge: crossed ? `rgba(255,255,255,${0.04 + b * 0.12})` : 'rgba(0,0,0,.12)', lineW: 1 });
    ctx.restore();
    gemPath(ctx, cx, cy, R, ang);
    ctx.strokeStyle = crossed ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.25)';
    ctx.stroke();

    if (st.cono) {
      ctx.fillStyle = crossed ? '#9aa6b8' : '#333';
      ctx.font = '13px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(G.tx('看不到干涉图', 'No interference figure'), cx, h - 22);
    }
  }

  // 亮度记录条：显示已经转过的角度的亮度 Brightness trace for the angles visited
  const meter = G.$('#meter');
  function drawMeter() {
    const { ctx, w, h } = G.fitCanvas(meter);
    ctx.fillStyle = '#0b0e14'; ctx.fillRect(0, 0, w, h);
    const n = st.seen.length, bw = w / n;
    st.seen.forEach((b, i) => {
      if (b == null) return;
      ctx.fillStyle = `rgba(255,236,170,${0.15 + 0.85 * b})`;
      ctx.fillRect(i * bw, h - 12 - b * (h - 28), Math.max(1, bw - 1), b * (h - 28) + 2);
    });
    ctx.fillStyle = '#5ec8ff';
    ctx.fillRect((st.rot / 360) * w - 1, 0, 2, h);
    ctx.fillStyle = '#93a3bb'; ctx.font = '10px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(G.tx('亮度记录（转动宝石时生成）', 'Brightness trace (builds as you rotate)'), 4, 11);
    ctx.textAlign = 'right';
    ['0°', '90°', '180°', '270°', '360°'].forEach((t, i) => { ctx.textAlign = i === 0 ? 'left' : i === 4 ? 'right' : 'center'; ctx.fillText(t, (i / 4) * w, h - 1); });
  }

  /* ================= 界面 UI ================= */
  function answerText(gem) {
    const p = gem.polar || (gem.optic === 'DR' ? { zh: '双折射：转动一周四明四暗', en: 'DR: four light / four dark positions per turn' } : { zh: '单折射：转动一周始终黑暗', en: 'SR: stays dark all the way round' });
    let s = `<b>${T(gem.zh, gem.en)}</b>：${T(p.zh, p.en)}<br>${T('光性', 'Optic character')}：${G.opticText(gem)}`;
    if (gem.optic === 'DR') {
      const cn = gem.conoNote || (gem.char[0] === 'U' ? { zh: '一轴晶干涉图：黑十字 + 彩色同心圆环', en: 'Uniaxial figure: black cross with coloured rings' } : { zh: '二轴晶干涉图：两个“眼”，转动时黑带分开成弧形', en: 'Biaxial figure: two “eyes”; the brushes split into curves as you rotate' });
      s += `<br>${T('干涉图', 'Figure')}：${T(cn.zh, cn.en)}`;
    }
    return s;
  }

  function updateUI(fromTick) {
    const idx = Math.floor(st.rot / 5) % 72;
    if (st.ana === 'cross' && !st.cono) st.seen[idx] = crossBright(st.gem, st.rot);
    G.$('#rot-val').textContent = Math.round(st.rot) + '°';
    G.$('#obs-mode').innerHTML = (st.ana === 'cross' ? T('正交偏光', 'Crossed') : T('平行偏光', 'Parallel')) + (st.cono ? ' · ' + T('干涉球', 'Conoscope') : '');
    G.$('#badge').innerHTML = T(st.gem.zh, st.gem.en) + ' · ' + Math.round(st.rot) + '°';
    if (!fromTick) {
      const r = G.$('#result');
      r.classList.toggle('hidden', !st.shown);
      r.innerHTML = answerText(st.gem);
    }
    draw();
    drawMeter();
  }

  G.gemPicker(G.$('#gem-picker'), G.gems.filter((g) => g.id !== 'synruby'), (gem) => {
    st.gem = gem; st.seen.fill(null); st.shown = false;
    setGem3D(gem); updateUI();
  }, 'ruby');
  G.seg(G.$('#analyzer'), [{ v: 'cross', zh: '正交（暗）', en: 'Crossed (dark)' }, { v: 'para', zh: '平行（亮）', en: 'Parallel (light)' }], (x) => { st.ana = x; updateUI(); }, 'cross');
  G.$('#rot').addEventListener('input', (e) => { st.rot = +e.target.value; updateUI(); });
  G.$('#auto').addEventListener('change', (e) => (st.auto = e.target.checked));
  G.$('#cono').addEventListener('change', (e) => { st.cono = e.target.checked; updateUI(); });
  G.$('#answer').addEventListener('click', () => { st.shown = !st.shown; updateUI(); });
  window.addEventListener('resize', () => updateUI());
  G.onLang(() => updateUI());

  G.renderParts(G.$('#parts-list'), v);
  G.renderQuiz(G.$('#quiz'), [
    { q: ['正交偏光下转动宝石 360°，出现“四明四暗”，说明宝石是？', 'Four light and four dark positions in 360° between crossed polars means…'],
      o: [['单折射', 'singly refractive'], ['双折射', 'doubly refractive'], ['集合体', 'an aggregate'], ['不透明', 'opaque']], a: 1,
      e: ['双折射宝石每转 90° 就有一次消光（变暗）。', 'A DR stone goes dark (extinction) every 90°.'] },
    { q: ['翡翠在正交偏光下转动时表现为？', 'Between crossed polars jadeite…'],
      o: [['始终黑暗', 'stays dark'], ['四明四暗', 'shows 4 light / 4 dark'], ['始终明亮', 'stays light'], ['变成红色', 'turns red']], a: 2,
      e: ['翡翠是集合体，由许多取向不同的小晶体组成。', 'Jadeite is an aggregate of many randomly oriented crystals.'] },
    { q: ['单折射宝石出现不规则的明暗斑块，这叫？', 'Patchy light areas in an isotropic stone are called…'],
      o: [['多色性', 'pleochroism'], ['异常消光', 'anomalous extinction'], ['干涉图', 'an interference figure'], ['荧光', 'fluorescence']], a: 1,
      e: ['由内部应力引起，常见于玻璃、合成尖晶石、石榴石和钻石。', 'Caused by internal strain; common in glass, synthetic spinel, garnet and diamond.'] },
    { q: ['双折射宝石在什么情况下转动也一直黑暗？', 'When can a DR stone stay dark all the way round?'],
      o: [['沿光轴方向观察时', 'when viewed along an optic axis'], ['光源太亮时', 'when the light is too bright'], ['宝石很小时', 'when it is small'], ['从不会', 'never']], a: 0,
      e: ['沿光轴方向光不发生双折射，所以要换几个方向观察。', 'There is no double refraction along an optic axis, so always check several directions.'] },
    { q: ['一轴晶的干涉图是什么样？', 'A uniaxial interference figure looks like…'],
      o: [['黑十字 + 彩色圆环', 'a black cross with coloured rings'], ['一片均匀的红色', 'an even red'], ['不规则斑块', 'irregular patches'], ['看不到任何东西', 'nothing at all']], a: 0,
      e: ['石英比较特别，中心没有黑十字，叫“牛眼”干涉图。', 'Quartz is special: no cross in the centre, the “bull’s-eye”.'] },
  ]);
})();
