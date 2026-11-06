/* 折射仪 Refractometer */
(function () {
  const G = GemLab, T = G.T;
  G.buildHeader('refractometer');
  G.initTabs();

  /* ================= 3D 模型 Model ================= */
  const v = (G.viewer = new G.Viewer(G.$('#viewer'), { cam: [4.4, 4.6, 7.0], target: [0.55, 0.9, 0.3], minD: 2.5, maxD: 16 }));
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
  // 中空的盖子：顶板 + 四面侧壁，内部高度足够容纳宝石 Hollow hood: top + four walls, tall enough to clear the stone
  coverPivot.add(
    G.box(1.4, 0.06, 1.25, grey, [0, 0.5, 0.62]),
    G.box(1.4, 0.47, 0.05, grey, [0, 0.255, 1.22]),
    G.box(1.4, 0.47, 0.05, grey, [0, 0.255, 0.03]),
    G.box(0.05, 0.47, 1.25, grey, [-0.675, 0.255, 0.62]),
    G.box(0.05, 0.47, 1.25, grey, [0.675, 0.255, 0.62]),
    G.box(0.32, 0.06, 0.1, chrome, [0, 0.32, 1.28]), // 把手 handle
    G.cyl(0.04, 0.04, 1.3, chrome, [0, 0.02, 0], [0, 0, Math.PI / 2]) // 铰链 hinge
  );
  coverPivot.rotation.x = -1.9;
  v.add(coverPivot);
  v.addPart(coverPivot, { zh: '遮光盖', en: 'Cover', dzh: '读数时盖上，挡住杂光。', den: 'Closed while reading to keep out stray light.' });

  // 目镜筒从机身端面伸出，接口处用法兰盖住 Eyepiece tube leaves the end face; a flange covers the joint
  const eyepiece = new THREE.Group();
  eyepiece.add(
    G.cyl(0.24, 0.24, 1.0, black, [0, 0.5, 0]),
    G.cyl(0.33, 0.33, 0.06, grey, [0, 0.17, 0]),
    G.cyl(0.3, 0.3, 0.25, grey, [0, 1.05, 0]),
    G.cyl(0.2, 0.2, 0.01, G.glassMat(0x6688cc, 0.7), [0, 1.18, 0])
  );
  eyepiece.position.set(1.55, 0.52, 0);
  eyepiece.rotation.z = -1.2;
  v.add(eyepiece);
  v.addPart(eyepiece, { zh: '目镜', en: 'Eyepiece', dzh: '看到内置刻度和明暗分界（阴影边）；可调焦使刻度清晰。', den: 'Shows the built-in scale and the shadow edge; focus it until the scale is sharp.' });

  const polCap = G.group(G.cyl(0.33, 0.33, 0.08, G.mat(0x30343a), [0, 0, 0]), G.cyl(0.26, 0.26, 0.085, G.glassMat(0x404858, 0.8), [0, 0, 0]),
    G.box(0.5, 0.09, 0.03, G.mat(0xffffff), [0, 0, 0]));
  // 偏光片：用时套在目镜末端（只绕目镜轴转动），不用时放在桌上
  // Polarizing filter: on the end of the eyepiece when used (turns only about the eyepiece axis), on the bench otherwise
  eyepiece.updateMatrixWorld(true);
  const CAP_ON = eyepiece.localToWorld(new THREE.Vector3(0, 1.23, 0));
  const CAP_OFF = new THREE.Vector3(2.35, 0.045, 0.95);
  const qEye = eyepiece.quaternion.clone();
  const qFlat = new THREE.Quaternion();
  // 装上/取下的路线：先抬起，再对准目镜轴线，沿轴线套上去，避免穿过镜筒
  // Fit/remove path: lift, line up with the eyepiece axis, slide on along it (no passing through the tube)
  const EYE_AXIS = new THREE.Vector3(0, 1, 0).applyQuaternion(qEye);
  const capPath = new THREE.CubicBezierCurve3(CAP_OFF.clone(), CAP_OFF.clone().add(new THREE.Vector3(0, 1.1, 0)),
    CAP_ON.clone().addScaledVector(EYE_AXIS, 0.9), CAP_ON.clone());
  const capAnim = { t: 0, vis: 0 }; // t：0 在桌上，1 套在目镜上；vis：显示用的连续角度 t: 0 bench → 1 fitted; vis: continuous display angle
  const ease = (x) => x * x * (3 - 2 * x);
  polCap.position.copy(CAP_OFF);
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

  const bottle = G.group(G.cyl(0.2, 0.2, 0.5, G.mat(0x6a3a10, { transparent: true, opacity: 0.85, roughness: 0.1 }), [0, 0.25, 0]), G.cyl(0.12, 0.12, 0.2, black, [0, 0.6, 0]));
  bottle.position.set(1.2, 0, 1.5);
  v.add(bottle);
  v.addPart(bottle, { zh: '接触液（RI≈1.79）', en: 'Contact liquid (RI ≈ 1.79)', dzh: '在宝石与棱镜之间形成光学接触。有毒，避免接触皮肤。', den: 'Makes optical contact between stone and prism. Toxic: avoid skin contact.' });

  const drop = G.sph(0.12, G.glassMat(0xffe9a0, 0.7), [-0.4, 1.37, 0]);
  drop.scale.set(1, 0.25, 1);
  drop.visible = false;
  v.add(drop);

  const cloth = G.box(1.2, 0.02, 0.9, G.mat(0x2c4a6e, { roughness: 1 }), [0.2, 0.01, 1.7]);
  v.add(cloth);

  /* ---------- 擦拭纸 Lens tissue ---------- */
  const TISSUE_HOME = new THREE.Vector3(-1.35, 0.04, 1.45);
  const tissue = G.group(
    G.box(0.5, 0.05, 0.36, G.mat(0xf4f1ea, { roughness: 0.95 }), [0, 0, 0]),
    G.box(0.44, 0.03, 0.3, G.mat(0xe6e1d6, { roughness: 1 }), [0.02, 0.04, -0.01], [0, 0.15, 0])
  );
  tissue.position.copy(TISSUE_HOME);
  v.add(tissue);
  v.addPart(tissue, { zh: '擦拭纸（蘸酒精）', en: 'Lens tissue (with alcohol)', dzh: '用来擦净棱镜和宝石表面的油污和指纹，否则读数会模糊。', den: 'Wipes grease and fingerprints off the prism and stone; otherwise the edge is blurred.' });

  // 污渍贴图：灰色油斑 + 指纹弧线 Smudge texture: grease spots and fingerprint arcs
  function smudgeTex(seed, w, h, round) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d'), rnd = G.rng(seed);
    if (round) { x.beginPath(); x.arc(w / 2, h / 2, w / 2, 0, Math.PI * 2); x.clip(); }
    for (let i = 0; i < 14; i++) {
      const cx = rnd() * w, cy = rnd() * h, r = 6 + rnd() * w * 0.12;
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, 'rgba(120,110,90,.55)'); g.addColorStop(1, 'rgba(120,110,90,0)');
      x.fillStyle = g; x.fillRect(0, 0, w, h);
    }
    x.strokeStyle = 'rgba(90,85,75,.45)'; x.lineWidth = 1.2;
    const fx = w * (0.3 + rnd() * 0.4), fy = h * (0.3 + rnd() * 0.4);
    for (let k = 1; k < 9; k++) { x.beginPath(); x.ellipse(fx, fy, k * w * 0.018, k * h * 0.03, 0.4, 0.3, Math.PI * 1.7); x.stroke(); }
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    return t;
  }
  const prismDirt = new THREE.Mesh(new THREE.PlaneGeometry(0.88, 0.48), new THREE.MeshBasicMaterial({ map: smudgeTex('prism', 256, 140), transparent: true, depthWrite: false }));
  prismDirt.rotation.x = -Math.PI / 2;
  prismDirt.position.set(-0.4, 1.372, 0);
  v.add(prismDirt);
  let gemDirt = null; // 贴在宝石表面的污渍 smudges on the stone's surface

  /* ---------- 滴管（插在接触液瓶里）Dropper (sits in the bottle) ---------- */
  const DROPPER_HOME = new THREE.Vector3(1.2, 0.42, 1.5);
  const dropper = new THREE.Group();
  const bulb = G.sph(0.09, G.mat(0x1a1a1a, { roughness: 0.8 }), [0, 0.42, 0]);
  bulb.scale.set(1, 1.4, 1);
  dropper.add(bulb, G.cyl(0.07, 0.07, 0.06, black, [0, 0.3, 0]), G.cyl(0.03, 0.012, 0.5, G.glassMat(0xffffff, 0.5), [0, 0.02, 0]));
  const tipDrop = G.sph(0.035, G.glassMat(0xffe9a0, 0.9), [0, -0.25, 0]);
  tipDrop.visible = false;
  dropper.add(tipDrop);
  dropper.position.copy(DROPPER_HOME);
  v.add(dropper);
  v.addPart(dropper, { zh: '滴管', en: 'Dropper', dzh: '从接触液瓶中吸取液体，在棱镜中央滴一小滴。', den: 'Picks up contact liquid and puts a tiny drop in the middle of the prism.' });
  const fallSph = G.sph(0.035, G.glassMat(0xffe9a0, 0.9), [0, 0, 0]);
  fallSph.visible = false;
  v.add(fallSph);

  // 清洁进度条（显示在 3D 画面上方）cleaning progress shown over the 3D view
  const hud = document.createElement('div');
  hud.className = 'clean-hud';
  v.el.appendChild(hud);
  const bar = (k) => `<span class="pbar"><i style="width:${Math.round(k * 100)}%"></i></span>`;

  let gemObj = null;
  let prismVol = 0; // 自由模式棱镜上的液滴数 drops on the prism in free mode
  const gemHolder = new THREE.Group(); // 固定容器，方便注册操作 stable container for the control
  v.add(gemHolder);
  const gemOff = new THREE.Vector3(0.2, 0.24, 1.7), gemOn = new THREE.Vector3(-0.4, 1.38 + 0.17 * 0.6, 0);
  function setGem3D(gem) {
    if (gemObj) gemHolder.remove(gemObj);
    gemObj = G.makeGem(gem, 0.6);
    gemObj.position.copy(gemOff);
    gemHolder.add(gemObj);
    gemDirt = G.dirtOverlay(gemObj);
    if (typeof updateDirt === 'function' && st) updateDirt();
  }

  /* ================= 状态 State ================= */
  const st = { gem: null, rot: 0, pol: 'none', polAng: 0, polVis: 0, polTurn: 0, exact: false, spot: 1.58, records: [], looked: false, prismClean: 0, gemClean: 0,
    f: { clean: false, liquid: false, placed: false, cover: false, light: false } };
  // 指引模式按顺序完成这 5 件事；step = 从头连续完成了几件。自由模式下可以任意组合
  // Guided mode does these five in order; step = how many are done in a row. Free mode allows any combination.
  const FLAGS = ['clean', 'liquid', 'placed', 'cover', 'light'];
  Object.defineProperty(st, 'step', {
    get() { let i = 0; while (i < 5 && st.f[FLAGS[i]]) i++; return i; },
    set(k) { FLAGS.forEach((n, i) => (st.f[n] = i < k)); },
  });
  const F = st.f;
  const readable = () => F.light && F.placed && F.liquid;
  let gemFall = null; // 自由模式：宝石正在往下掉 free mode: the stone is falling
  let gemDrag = null, gemMoved = false, dragTissue = false, dragDropper = false, dropMoved = false, falling = null;
  let guide = null;
  const STEPS = [
    ['清洁棱镜与宝石', 'Clean prism & stone'],
    ['点一滴接触液', 'Apply a drop of contact liquid'],
    ['宝石台面朝下放到棱镜上', 'Place the stone table-down'],
    ['合上遮光盖', 'Close the cover'],
    ['打开 589nm 光源', 'Switch on the 589 nm light'],
  ];
  function renderSteps() {
    if (!G.$('#steps')) return; // 旧的步骤按钮已由分步指引代替 replaced by the guide
    G.$('#steps').innerHTML = STEPS.map((s, i) =>
      `<div class="step-row ${i < st.step ? 'done' : ''}"><span class="num">${i < st.step ? '✓' : i + 1}</span>
       <button class="btn ${i === st.step ? 'primary' : ''}" data-i="${i}" ${i !== st.step ? 'disabled' : ''}>${T(s[0], s[1])}</button></div>`).join('');
    G.$$('#steps button').forEach((b) => b.addEventListener('click', () => { st.step = +b.dataset.i + 1; refresh(); }));
  }

  v.tick((dt) => {
    if (!gemObj) return;
    const k = 1 - Math.exp(-6 * dt);
    if (gemFall && gemObj) {
      // 宝石往下掉，落地就摔碎 The stone falls and shatters on landing
      if (!gemFall.broken) {
        gemFall.vy -= 9.8 * 0.7 * dt;
        gemObj.position.y += gemFall.vy * dt;
        if (gemObj.position.y <= gemOff.y) {
          gemObj.position.y = gemOff.y;
          if (gemFall.y0 - gemOff.y > 0.8) {
            gemFall.broken = true;
            G.shatterGem(v, gemObj, st.gem, () => { gemFall = null; setGem3D(st.gem); G.popIn(v, gemObj); });
          } else gemFall = null;
        }
      }
    } else if (gemDrag !== 'move') gemObj.position.lerp(F.placed ? gemOn : gemOff, k);
    const flip = F.placed ? Math.PI : 0;
    gemObj.rotation.x = G.approach(gemObj.rotation.x, flip, 6, dt);
    gemObj.rotation.y = G.approach(gemObj.rotation.y, (st.rot * Math.PI) / 180, 6, dt);
    if (gemDirt) gemDirt.visible = st.gemClean < 1;
    if (!dragTissue) tissue.position.lerp(TISSUE_HOME, k);
    if (!dragDropper) dropper.position.lerp(DROPPER_HOME, k);
    // 液滴落下 falling drop
    if (falling) {
      falling.y -= dt * 2.5;
      fallSph.position.set(falling.x, falling.y, falling.z);
      fallSph.visible = true;
      if (falling.y <= 1.39) {
        falling = null;
        fallSph.visible = false;
        F.liquid = true;
        drop.scale.set(0.2, 0.05, 0.2);
        refresh();
        v.say('滴好了！一小滴就够', 'Drop applied: one small drop is enough');
      }
    }
    if (drop.visible && !prismVol) drop.scale.lerp(new THREE.Vector3(1, 0.25, 1), k);
    coverPivot.rotation.x = G.approach(coverPivot.rotation.x, F.cover ? 0 : -1.9, 5, dt);
    // 偏光片位置与朝向 filter pose
    const on = st.pol !== 'none';
    capAnim.t = Math.min(1, Math.max(0, capAnim.t + (on ? 1 : -1) * dt * 1.4));
    polCap.position.copy(capPath.getPoint(ease(capAnim.t)));
    // 转动角度连续变化，不会从 179° 倒转回 0° The angle changes continuously, never spinning back from 179° to 0°
    capAnim.vis = G.approach(capAnim.vis, st.polVis, 14, dt);
    const spin = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), (capAnim.vis * Math.PI) / 180);
    const tilt = ease(Math.min(1, Math.max(0, (capAnim.t - 0.15) / 0.6)));
    polCap.quaternion.copy(qFlat).slerp(qEye.clone().multiply(spin), tilt);
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
    const gem = st.gem;
    const msg = (zh, en) => {
      ctx.fillStyle = '#8a8f60'; ctx.font = '13px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(G.tx(zh, en), cx, h / 2);
    };
    if (!F.light) { msg('光源没有打开', 'The light is off'); return; }
    // 盖子开着会漏进杂光，暗区变灰 Open cover lets stray light in: the dark area turns grey
    const BRIGHT = '#e9eda0', HALF = 'rgba(160,165,70,1)', DARK = F.cover ? '#16170a' : '#3b3d24';
    let e = edges(gem, st.rot);
    let low, high, spotMode = gem.spot && F.placed && F.liquid;
    let note = null;
    if (!F.placed) {
      // 没有宝石：有接触液只看到液体线，没有就全亮 No stone: only the liquid line, or all bright
      low = high = F.liquid ? LIQ : MAX + 0.1;
      note = ['棱镜上没有宝石', 'No stone on the prism'];
    } else if (!F.liquid) {
      // 宝石和棱镜之间是空气：没有光学接触，看不到阴影边 Air gap: no optical contact, no shadow edge
      low = high = MAX + 0.1;
      note = ['没有接触液：宝石和棱镜之间是空气，看不到阴影边', 'No contact liquid: air between stone and prism, so no shadow edge'];
    } else if (e.otl) { low = high = LIQ; }
    else { low = Math.min(e.low, LIQ); high = Math.min(e.high, LIQ); }
    const flooded = prismVol >= 4;
    const blurPx = F.placed && F.liquid && (!F.clean || flooded) ? 12 : 2; // 没擦干净或液体太多，阴影边发虚 dirty or flooded: blurred edge
    if (F.placed && F.liquid && !F.clean) note = ['棱镜或宝石没擦干净，阴影边模糊', 'Prism or stone not cleaned: the edge is blurred'];
    else if (F.placed && F.liquid && flooded) note = ['接触液太多，阴影边发虚', 'Too much liquid: the edge is fuzzy'];
    else if (F.placed && F.liquid && !F.cover) note = ['盖子没合上，杂光让对比变差', 'Cover open: stray light lowers the contrast'];
    // 偏光片：两条光线互相垂直偏振，转动时中间区域按 sin² 变亮或变暗
    // Filter: the two rays are polarized at right angles, so the middle band follows sin²
    let midFill = HALF;
    if (st.pol !== 'none' && !spotMode) {
      const m = Math.pow(Math.sin((st.polAng * Math.PI) / 180), 2);
      const dk = F.cover ? [22, 23, 10] : [59, 61, 36], br = [233, 237, 160];
      midFill = `rgb(${dk.map((d, i) => Math.round(d + (br[i] - d) * m)).join(',')})`;
    }

    if (spotMode) {
      ctx.fillStyle = '#121208'; ctx.fillRect(0, 0, w, h);
    } else {
      // 亮区 → 半亮区 → 暗区 bright → half → dark
      const g1 = ctx.createLinearGradient(0, top, 0, Y(low));
      g1.addColorStop(0, '#f4f6c0'); g1.addColorStop(1, BRIGHT);
      ctx.fillStyle = g1; ctx.fillRect(0, 0, w, Y(low));
      ctx.fillStyle = midFill; ctx.fillRect(0, Y(low), w, Math.max(0, Y(high) - Y(low)));
      ctx.fillStyle = DARK; ctx.fillRect(0, Y(high), w, h - Y(high));
      // 边界柔化 soften edges
      [low, high].forEach((ri) => {
        const g = ctx.createLinearGradient(0, Y(ri) - blurPx, 0, Y(ri) + blurPx);
        g.addColorStop(0, 'rgba(233,237,160,0)'); g.addColorStop(0.5, 'rgba(120,124,60,.5)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(0, Y(ri) - blurPx, w, blurPx * 2);
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

    if (note) {
      // 每种语言一行，过长自动换行，放在视野中部 one line per language, wrapped, in the middle of the field
      ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
      const L = G.lang || 'both';
      const parts = [];
      if (['zh', 'both', 'zhth'].includes(L)) parts.push(note[0]);
      if (['en', 'both'].includes(L)) parts.push(note[1]);
      if (['th', 'zhth'].includes(L)) parts.push(G.th(note[1]));
      const maxW = w * 0.62, lines = [];
      parts.forEach((t) => {
        let cur = '';
        const units = /\s/.test(t) ? t.split(/(\s+)/) : Array.from(t);
        units.forEach((u) => {
          if (ctx.measureText(cur + u).width > maxW && cur.trim()) { lines.push(cur.trim()); cur = u.trimStart(); }
          else cur += u;
        });
        if (cur.trim()) lines.push(cur.trim());
      });
      const lh = 16, boxH = lines.length * lh + 10;
      const y0 = Y(Math.min(low, MAX)) > h * 0.5 ? h * 0.2 : h * 0.62; // 避开阴影边 keep clear of the shadow edge
      ctx.fillStyle = 'rgba(0,0,0,.78)';
      ctx.fillRect(cx - maxW / 2 - 10, y0, maxW + 20, boxH);
      ctx.fillStyle = '#ffd166';
      lines.forEach((t, i) => ctx.fillText(t, cx, y0 + 17 + i * lh));
    }
    if (st.exact && F.placed && F.liquid) {
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
    if (r[0].spot) { box.innerHTML = T(`<b>点测读数 ≈ ${gem.ri.n.toFixed(2)}</b>：集合体弧面宝石只读到两位小数。1.66 左右是翡翠的典型值。`, `<b>Spot reading ≈ ${gem.ri.n.toFixed(2)}</b>: read to two decimals for cabochons. About 1.66 is typical of jadeite.`, `<b>ค่าแบบจุด ≈ ${gem.ri.n.toFixed(2)}</b>: อัญมณีหลังเบี้ยอ่านทศนิยม 2 ตำแหน่ง ค่าประมาณ 1.66 เป็นค่าปกติของหยกเจไดต์`); box.classList.add('good'); return; }
    const angles = new Set(r.map((x) => x.rot));
    if (angles.size < 4) { box.innerHTML = T(`已记录 ${r.length} 次（${angles.size} 个角度），请继续在不同角度记录。`, `${r.length} readings at ${angles.size} angles: keep recording at other angles.`, `บันทึก ${r.length} ครั้ง ใน ${angles.size} มุม: บันทึกต่อในมุมอื่น`); return; }
    const lows = r.map((x) => x.low), highs = r.map((x) => x.high);
    const minL = Math.min(...lows), maxL = Math.max(...lows), minH = Math.min(...highs), maxH = Math.max(...highs);
    const dr = maxH - minL;
    let txt;
    if (dr < 0.002) txt = T(`<b>单折射</b>：读数恒定 ${minL.toFixed(3)}，DR ≈ 0。`, `<b>Singly refractive</b>: constant reading ${minL.toFixed(3)}, DR ≈ 0.`, `<b>หักเหแสงเดี่ยว</b>: ค่าคงที่ ${minL.toFixed(3)}, DR ≈ 0`);
    else {
      const lowFixed = maxL - minL < 0.0015, highFixed = maxH - minH < 0.0015;
      let kind;
      if (lowFixed && !highFixed) kind = T('一轴晶，<b>正光性 (+)</b>：低值边固定（ω），高值边移动。', 'Uniaxial <b>positive (+)</b>: the low edge (ω) stays, the high edge moves.');
      else if (highFixed && !lowFixed) kind = T('一轴晶，<b>负光性 (−)</b>：高值边固定（ω），低值边移动。', 'Uniaxial <b>negative (−)</b>: the high edge (ω) stays, the low edge moves.');
      else kind = T('<b>二轴晶</b>：两条阴影边都在移动。', '<b>Biaxial</b>: both edges move.');
      txt = T(`<b>双折射</b>，RI ${minL.toFixed(3)} – ${maxH.toFixed(3)}，<b>DR = ${dr.toFixed(3)}</b>。`, `<b>Doubly refractive</b>, RI ${minL.toFixed(3)} – ${maxH.toFixed(3)}, <b>DR = ${dr.toFixed(3)}</b>.`, `<b>หักเหแสงคู่</b>, RI ${minL.toFixed(3)} – ${maxH.toFixed(3)}, <b>DR = ${dr.toFixed(3)}</b>`) + '<br>' + kind;
    }
    box.innerHTML = txt + `<div class="note" style="margin-top:6px">${T('参考值', 'Reference')}：${T(gem.zh, gem.en)} RI ${G.riText(gem)}，${G.opticText(gem)}</div>`;
    box.classList.add('good');
  }

  /* ================= 界面 UI ================= */
  function refresh() {
    renderSteps();
    drop.visible = F.liquid;
    updateDirt();
    lampFaceMat.emissiveIntensity = F.light ? 1.5 : 0;
    lampLight.intensity = F.light ? 1.2 : 0;
    G.$('#rot-val').textContent = st.rot + '°';
    G.$('#spot-group').classList.toggle('hidden', !st.gem.spot);
    G.$('#badge').innerHTML = T(st.gem.zh, st.gem.en) + (readable() ? ' · ' + T('可以读数', 'ready to read') : '');
    G.$('#obs-mode').innerHTML = st.gem.spot ? T('点测法', 'Spot method') : st.pol === 'none' ? T('无偏光片', 'No filter') : T('偏光片 ' + Math.round(st.polAng) + '°', 'Filter ' + Math.round(st.polAng) + '°', 'ฟิลเตอร์ ' + Math.round(st.polAng) + '°');
    G.$('#pol-ang-row').classList.toggle('hidden', st.pol === 'none');
    G.$('#pol-ang').value = Math.round(st.polAng);
    G.$('#pol-ang-val').textContent = Math.round(st.polAng) + '°';
    G.$('#rec').disabled = !readable();
    draw();
    if (guide) guide.check(); // 角度一变就更新读数题 refresh the reading question as soon as the angle changes
  }

  G.gemPicker(G.$('#gem-picker'), G.gems.filter((g) => g.id !== 'synruby'), (gem) => {
    st.gem = gem; st.step = 0; st.rot = 0; st.records = []; st.looked = false; st.prismClean = 0; st.gemClean = 0;
    updateDirt();
    if (guide) guide.restart();
    G.$('#rot').value = 0;
    setGem3D(gem); renderRecords(); refresh();
  }, 'ruby');
  const segPol = G.seg(G.$('#pol'), [{ v: 'none', zh: '不用', en: 'None' }, { v: 'on', zh: '装上', en: 'Fitted' }], (x) => { st.pol = x; refresh(); }, 'none');
  const turnPol = (deg) => {
    const a = ((st.polAng + deg) % 180 + 180) % 180;
    st.polTurn += Math.abs(deg);
    st.polVis += deg; // 显示角度不取模 display angle is not wrapped
    st.polAng = a;
    refresh();
  };
  G.$('#pol-ang').addEventListener('input', (e) => { const a = +e.target.value; st.polTurn += Math.abs(a - st.polAng); st.polVis += a - st.polAng; st.polAng = a; refresh(); });
  G.$('#rot').addEventListener('input', (e) => { st.rot = +e.target.value; refresh(); });
  G.$('#spot').addEventListener('input', (e) => { st.spot = +e.target.value; refresh(); });
  G.$('#exact').addEventListener('change', (e) => { st.exact = e.target.checked; refresh(); });
  G.$('#rec').addEventListener('click', () => { st.records.push(current()); renderRecords(); });
  G.$('#clear').addEventListener('click', () => { st.records = []; renderRecords(); });
  window.addEventListener('resize', draw);

  /* ================= 在 3D 模型上直接操作 Operate the 3D model ================= */
  // 按步骤推进；顺序不对时给出提示 Advance the procedure; warn when out of order
  const NEED = [['先用擦拭纸把棱镜和宝石擦干净', 'Clean the prism and stone first'], ['先点接触液', 'Apply the contact liquid first'], ['先把宝石放上棱镜', 'Place the stone first'], ['先合上盖子', 'Close the cover first'], ['先打开光源', 'Switch on the light first']];
  const doStep = (k) => {
    if (st.step === k) { st.step = k + 1; refresh(); return true; }
    if (st.step < k) v.say(...NEED[st.step]);
    return false;
  };
  /* ---- 擦拭：拖动擦拭纸在棱镜或宝石上来回擦 Wipe: rub the tissue over the prism or stone ---- */
  function updateDirt() {
    prismDirt.material.opacity = 1 - st.prismClean;
    prismDirt.visible = st.prismClean < 1;
    if (gemDirt) gemDirt.material.opacity = 1 - st.gemClean;
    hud.classList.toggle('hidden', F.clean);
    hud.innerHTML = '🧻 ' + T('棱镜', 'Prism') + ` ${bar(st.prismClean)} ${Math.round(st.prismClean * 100)}%` +
      ' · ' + T('宝石', 'Stone') + ` ${bar(st.gemClean)} ${Math.round(st.gemClean * 100)}%`;
  }
  function checkClean() {
    if (!F.clean && st.prismClean >= 1 && st.gemClean >= 1) {
      F.clean = true; refresh();
      v.say('清洁完成！', 'All clean!');
    }
  }
  const surfaces = () => [prismG, body, cloth, v.floor].concat(gemObj ? [gemObj] : []);
  let lastWipe = null;
  v.addControl(tissue, {
    hint: ['按住拖动：在棱镜和宝石上来回擦', 'Hold and drag: rub over the prism and the stone'],
    markerIf: () => st.step === 0,
    onClick: () => v.say('按住擦拭纸不放，拖到棱镜或宝石上来回擦', 'Hold the tissue and rub it back and forth over the prism or stone'),
    onDragStart: () => { lastWipe = null; },
    onDrag: () => {
      dragTissue = true;
      const h = v.ray.intersectObjects(surfaces(), true)[0];
      if (!h) return;
      const p = h.point;
      let on = null;
      for (let o = h.object; o; o = o.parent) { if (o === prismG) on = 'prism'; if (o === gemObj) on = 'gem'; }
      if (gemObj && !F.placed && Math.hypot(p.x - gemObj.position.x, p.z - gemObj.position.z) < 0.4) on = 'gem';
      tissue.position.set(p.x, p.y + 0.05, p.z);
      if (lastWipe && on) {
        const d = Math.min(lastWipe.distanceTo(p), 0.3); // 每次移动的擦拭量 rubbing per move
        if (on === 'prism') {
          st.prismClean = Math.min(1, st.prismClean + d * 0.16 * (1.4 - 0.9 * st.prismClean)); // 越干净越难擦 slower near the end
          // 擦棱镜会把接触液也擦掉 wiping the prism also wipes off the liquid
          if (F.liquid && !F.placed && G.isFree()) { F.liquid = false; wipePrismLiquid(); refresh(); v.say('接触液被擦掉了', 'The contact liquid was wiped off'); }
        }
        if (on === 'gem' && !F.placed) st.gemClean = Math.min(1, st.gemClean + d * 0.2 * (1.4 - 0.9 * st.gemClean));
        updateDirt();
        checkClean();
      }
      lastWipe = p.clone();
    },
    onDragEnd: () => {
      dragTissue = false;
      if (!F.clean && (st.prismClean < 1 || st.gemClean < 1) && lastWipe) {
        v.say(st.prismClean < 1 ? '棱镜还没擦干净，继续擦' : '宝石还没擦干净，继续擦', st.prismClean < 1 ? 'The prism is not clean yet: keep rubbing' : 'The stone is not clean yet: keep rubbing');
      }
    },
  });

  /* ---- 自由模式：接触液想滴多少就滴多少，会溢出、流下、积成一滩 ----
     Free mode: drop as much liquid as you like; it spreads, overflows, runs down and pools */
  const sb = G.sandbox(v, { surfaces: () => surfaces() });
  const liqMat = new THREE.MeshPhongMaterial({ color: 0xf2a91c, emissive: 0x6a3d00, shininess: 140, specular: 0xffffff, transparent: true, opacity: 0.82, depthWrite: false, side: THREE.DoubleSide }); // 琥珀色、有光泽，桌面上看得清 amber and glossy so it shows on the bench
  const puddles = [];
  const freeDrops = [];
  function freeDrop() {
    freeDrops.push({ p: dropper.position.clone().add(new THREE.Vector3(0, -0.25, 0)), vy: 0 });
  }
  function addPuddle(point, amount) {
    let pd = puddles.find((q) => q.mesh.position.distanceTo(point) < q.r + 0.12);
    if (!pd) {
      const mesh = new THREE.Mesh(new THREE.CircleGeometry(1, 40), liqMat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.copy(point).add(new THREE.Vector3(0, 0.006, 0));
      mesh.renderOrder = 4;
      v.add(mesh);
      pd = { mesh, r: 0, vol: 0 };
      puddles.push(pd);
    }
    pd.vol += amount;
    pd.r = Math.min(1.6, 0.1 * Math.sqrt(pd.vol) + 0.06);
    pd.mesh.scale.set(pd.r, pd.r, 1);
    sb.setBroken();
    return pd;
  }
  const runs = []; // 从棱镜边缘流下去的液体 liquid running off the prism edge
  function landDrop(pt, onPrism) {
    if (onPrism) {
      prismVol++;
      F.liquid = true;
      drop.visible = true;
      if (!drop.userData.mat0) drop.userData.mat0 = drop.material;
      if (prismVol >= 2) drop.material = liqMat; // 多了以后看得出是一大摊 a big puddle shows clearly
      const s2 = Math.min(1 + (prismVol - 1) * 0.28, 2.3);
      drop.scale.set(s2, 0.25 + Math.min(prismVol, 8) * 0.03, s2);
      if (prismVol === 4) v.say('💧 ' + G.T('接触液太多了！阴影边会发虚', 'Too much liquid! The edge goes fuzzy'));
      if (prismVol >= 6) {
        // 棱镜装不下：从前边流下去 The prism overflows: it runs off the front
        runs.push({ p: new THREE.Vector3(-0.4 + (Math.random() - 0.5) * 0.5, 1.36, 0.27), vy: 0 });
        if (prismVol === 6) v.say('🌊 ' + G.T('溢出来了！液体顺着机身往下流', 'It overflows and runs down the body!'));
      }
      sb.setBroken();
      refresh();
    } else addPuddle(pt, 1);
  }
  v.tick((dt) => {
    // 滴下去的液滴 Falling drops
    for (let i = freeDrops.length - 1; i >= 0; i--) {
      const d = freeDrops[i];
      if (!d.mesh) { d.mesh = G.sph(0.035, liqMat, [0, 0, 0]); v.add(d.mesh); }
      d.vy -= 6 * dt; d.p.y += d.vy * dt; d.mesh.position.copy(d.p);
      const rc = new THREE.Raycaster(d.p.clone().add(new THREE.Vector3(0, 0.1, 0)), new THREE.Vector3(0, -1, 0));
      const h = rc.intersectObjects(surfaces().concat([prismG]), true)[0];
      const gy = h ? h.point.y : 0;
      if (d.p.y <= gy + 0.01) {
        let onPrism = false;
        if (h) for (let o = h.object; o; o = o.parent) if (o === prismG) onPrism = true;
        v.scene.remove(d.mesh);
        freeDrops.splice(i, 1);
        landDrop(h ? h.point : d.p.clone().setY(0), onPrism);
      }
    }
    // 沿机身流下的细流，落到桌上积成一滩 Streams running down to the bench
    for (let i = runs.length - 1; i >= 0; i--) {
      const r = runs[i];
      if (!r.mesh) { r.mesh = G.cyl(0.03, 0.03, 0.12, liqMat, [0, 0, 0]); v.add(r.mesh); }
      r.vy -= 4 * dt; r.p.y += r.vy * dt; r.p.z += dt * 0.25;
      r.mesh.position.copy(r.p);
      if (r.p.y <= 0.05) { v.scene.remove(r.mesh); runs.splice(i, 1); addPuddle(new THREE.Vector3(r.p.x, 0.0, r.p.z + 0.1), 2); }
    }
  });
  sb.onRepair(() => {
    puddles.forEach((q) => v.scene.remove(q.mesh)); puddles.length = 0;
    runs.forEach((r) => r.mesh && v.scene.remove(r.mesh)); runs.length = 0;
    prismVol = 0; F.liquid = false; drop.scale.set(1, 0.25, 1); if (drop.userData.mat0) drop.material = drop.userData.mat0; refresh();
  });
  // 擦棱镜也会把多余的液体擦掉 Wiping the prism removes the extra liquid
  const wipePrismLiquid = () => { if (prismVol) { prismVol = 0; drop.scale.set(1, 0.25, 1); if (drop.userData.mat0) drop.material = drop.userData.mat0; } };

  /* ---- 滴液：把滴管拖到棱镜中央上方，松开 Drop: drag the dropper over the prism and let go ---- */
  v.addControl(dropper, {
    hint: ['按住拖到棱镜中央上方，松开就滴一滴', 'Drag over the middle of the prism and let go to drop'],
    markerIf: () => st.step === 1,
    onClick: () => v.say('按住滴管，拖到棱镜中央上方再松开', 'Hold the dropper, drag it over the prism centre and let go'),
    onDragStart: () => { dropMoved = false; },
    onDrag: () => {
      dragDropper = true; dropMoved = true;
      tipDrop.visible = !F.liquid;
      const p = v.rayOnPlane([0, 1.68, 0], [0, 1, 0]);
      if (p) dropper.position.set(p.x, 1.68, p.z);
    },
    onDragEnd: () => {
      dragDropper = false;
      tipDrop.visible = false;
      if (!dropMoved) return;
      const near = Math.hypot(dropper.position.x + 0.4, dropper.position.z) < 0.32;
      if (G.isFree()) { freeDrop(); return; }
      if (!near) { v.say('要滴在棱镜中央，再试一次', 'Drop it in the middle of the prism: try again'); return; }
      if (!G.isFree() && !F.clean) { v.say(...NEED[0]); return; }
      if (G.isFree()) { freeDrop(); return; } // 自由模式：想滴多少滴多少 free mode: drop as much as you like
      if (F.placed) { v.say('宝石已经在棱镜上了，先取下宝石', 'The stone is already on the prism: take it off first'); return; }
      if (F.liquid) { v.say('已经滴过接触液了，一滴就够', 'The liquid is already on: one drop is enough'); return; }
      falling = { x: dropper.position.x, y: dropper.position.y - 0.25, z: dropper.position.z };
    },
  });

  /* ---- 宝石：拖到棱镜上松开；放好后左右拖动转动 Stone: drag onto the prism; then drag sideways to turn ---- */
  v.addControl(gemHolder, {
    hint: ['拖到棱镜上松开；放好后左右拖动可转动宝石', 'Drag onto the prism and let go; once placed, drag sideways to turn it'],
    markerIf: () => st.step === 2 || st.step >= 5,
    onClick: () => {
      if (!F.placed) v.say('按住宝石，拖到棱镜中央再松开', 'Hold the stone, drag it onto the prism and let go');
      else if (G.isFree()) { F.placed = false; F.liquid = false; refresh(); v.say('宝石已取下（接触液也随之带走）', 'Stone taken off (the liquid comes off with it)'); }
    },
    spin: () => F.placed, // 放好后转动可以无极拖动 endless drag only when turning
    onDragStart: () => { gemDrag = F.placed ? 'rotate' : 'move'; gemMoved = false; },
    onDrag: (dx) => {
      if (gemDrag === 'rotate') {
        st.rot = Math.round(G.clamp(st.rot + dx * 0.5, 0, 180));
        G.$('#rot').value = st.rot;
        refresh();
        return;
      }
      gemMoved = true;
      const p = v.rayOnPlane([0, 1.75, 0], [0, 1, 0]);
      if (p) gemObj.position.set(p.x, 1.75, p.z);
    },
    onDragEnd: () => {
      const was = gemDrag;
      gemDrag = null;
      if (was !== 'move' || !gemMoved) return;
      if (Math.hypot(gemObj.position.x + 0.4, gemObj.position.z) > 0.5) {
        if (G.isFree()) gemFall = { vy: 0, y0: gemObj.position.y }; // 自由模式：没拿稳就掉下去 free mode: it just drops
        return; // 指引模式：自动回到布上 guided: it goes back to the cloth
      }
      if (!G.isFree() && st.step < 2) { v.say(...NEED[st.step]); return; }
      F.placed = true; refresh();
      v.say('宝石已台面朝下放好', 'Stone placed table-down');
    },
  });
  v.addControl(coverPivot, { hint: ['点击：开 / 合遮光盖', 'Click: open / close the cover'], markerIf: () => st.step === 3,
    onClick: () => {
      if (F.cover) { F.cover = false; refresh(); }
      else if (G.isFree() || st.step >= 3) { F.cover = true; refresh(); }
      else v.say(...NEED[st.step]);
    } });
  v.addControl(lamp, { hint: ['点击：开 / 关 589nm 光源', 'Click: 589 nm light on / off'], markerIf: () => st.step === 4,
    onClick: () => {
      if (F.light) { F.light = false; refresh(); return; }
      if (G.isFree() || st.step >= 4) { F.light = true; refresh(); G.lookAt('.obs'); }
      else v.say(...NEED[st.step]);
    } });
  v.addControl(polCap, {
    get hint() { return st.pol === 'none' ? ['点击：把偏光片装到目镜上', 'Click: fit the filter on the eyepiece'] : ['左右拖动：转动偏光片', 'Drag sideways to turn the filter']; },
    markerIf: () => st.step >= 5,
    onClick: () => { if (st.pol === 'none') segPol.set('on'); },
    onDrag: (dx, dy) => { if (st.pol !== 'none') turnPol((dx - dy) * 0.8); },
  });
  v.addControl(eyepiece, { hint: ['点击：从目镜读数', 'Click: read through the eyepiece'], markerIf: () => st.step >= 5,
    onClick: () => { st.looked = true; G.lookAt('.obs'); } });

  /* ================= 分步指引 Step guide ================= */
  const go = (k) => { st.step = Math.max(st.step, k); refresh(); };
  const angles = () => new Set(st.records.map((r) => r.rot)).size;
  /* 观察题 Observation questions */
  const fmt = (x) => x.toFixed(3);
  const readPick = {
    sig: () => st.gem.id + ':' + Math.round(st.rot),
    ready: () => readable(),
    wait: ['先完成前面的步骤，看到清晰的阴影边后再读数', 'Finish the earlier steps; read once you see a clear shadow edge'],
    q: () => { const a = Math.round(st.rot); return ['宝石现在转到 ' + a + '°，刻度读数是？', 'The stone is at ' + a + '°. What does the scale read?', 'ตอนนี้อัญมณีหมุนไปที่ ' + a + '° อ่านค่าบนสเกลได้เท่าใด?']; },
    o: () => {
      const r = current();
      if (r.otl) return [['看不到阴影边：超出量程（OTL）', 'No edge: over the limit (OTL)'], '1.720', '1.760', '1.544'];
      const ok = (v) => v >= 1.43 && v <= 1.79; // 选项都在刻度范围内 keep options on the scale
      if (r.spot || Math.abs(r.high - r.low) < 0.002) {
        const v = r.low, out = [fmt(v)];
        [0.02, -0.03, 0.05, -0.06, 0.09, -0.09].forEach((d) => { if (out.length < 4 && ok(v + d)) out.push(fmt(v + d)); });
        return out;
      }
      // 双折射：两条边一起读 Doubly refractive: read both edges
      const pair = (a, b) => fmt(a) + ' / ' + fmt(b);
      const out = [pair(r.low, r.high)];
      [[0.015, 0.015], [-0.04, -0.04], [0, -0.025], [-0.02, 0], [-0.07, -0.03], [-0.1, -0.1]].forEach(([da, db]) => {
        if (out.length < 4 && ok(r.low + da) && ok(r.high + db) && r.low + da < r.high + db - 0.002) out.push(pair(r.low + da, r.high + db));
      });
      return out;
    },
    a: 0,
    onRight: () => { G.$('#rec').click(); v.say('📝 ' + T('已记录 ', 'Recorded ', 'บันทึกแล้ว ') + Math.round(st.rot) + '°'); },
    after: () => ['已记录（共 ' + angles() + ' 个角度）。转动宝石到新的角度，再读一次。', 'Recorded (' + angles() + ' angles so far). Turn the stone to a new angle and read again.', 'บันทึกแล้ว (รวม ' + angles() + ' มุม) หมุนอัญมณีไปมุมใหม่แล้วอ่านอีกครั้ง'],
  };
  const edgeKind = () => { const r = current(); return r.otl ? 'otl' : r.spot ? 'spot' : st.gem.optic === 'DR' ? 'dr' : 'sr'; };
  const EDGE_E = {
    sr: ['单折射宝石只有一个折射率，所以只有一条边。', 'A singly refractive stone has one RI, so there is one edge.'],
    dr: ['双折射宝石有两个折射率，所以有两条边，两者之差就是双折射率。', 'A doubly refractive stone has two RIs, so two edges; their difference is the birefringence.'],
    otl: ['它的折射率高于接触液（约 1.79），看不到阴影边：超出量程。', 'Its RI is above the contact liquid (about 1.79), so there is no edge: over the limit.'],
    spot: ['弧面宝石用点测法，只得到一个近似读数。', 'A cabochon uses the spot method and gives one approximate reading.'],
  };

  // 面板里的记录按钮只在自由模式显示 The panel's record button shows in free mode only
  const recVis = () => G.$('#rec').classList.toggle('hidden', !G.isFree());
  G.onMode(recVis);
  recVis();

  guide = G.guide({
    viewer: v,
    reset: () => { st.step = 0; st.rot = 0; st.records = []; st.looked = false; st.prismClean = 0; st.gemClean = 0; updateDirt(); st.polAng = 0; st.polVis = 0; st.polTurn = 0; segPol.set('none'); G.$('#rot').value = 0; renderRecords(); refresh(); },
    steps: [
      { t: ['用擦拭纸清洁棱镜和宝石', 'Clean the prism and stone with lens tissue'], how: ['按住左前方的擦拭纸，拖到棱镜上来回擦，再拖到宝石上擦，直到上方两个进度条都满', 'Hold the tissue (front left) and rub it over the prism, then over the stone, until both bars at the top are full'],
        target: tissue, done: () => st.step >= 1, act: () => { st.prismClean = st.gemClean = 1; updateDirt(); go(1); } },
      { t: ['在棱镜中央点一小滴接触液', 'Put a tiny drop of contact liquid on the prism'], how: ['按住瓶里的滴管拖出来，移到棱镜中央上方再松开', 'Drag the dropper out of the bottle, hold it over the middle of the prism and let go'], target: dropper, done: () => st.step >= 2, act: () => go(2) },
      { t: ['把宝石台面朝下放到液滴上', 'Place the stone table-down on the drop'], how: ['按住布上的宝石，拖到棱镜中央再松开，它会自动台面朝下', 'Drag the stone from the cloth onto the middle of the prism and let go; it turns table-down'], target: gemHolder, done: () => st.step >= 3, act: () => go(3) },
      { t: ['合上遮光盖', 'Close the cover'], how: ['点击竖起来的盖子', 'Click the raised cover'], target: coverPivot, done: () => st.step >= 4, act: () => go(4) },
      { t: ['打开 589nm 黄光光源', 'Switch on the 589 nm yellow light'], how: ['点击左边的光源', 'Click the light source on the left'], target: lamp, done: () => st.step >= 5, act: () => go(5) },
      { t: ['从目镜看刻度', 'Look at the scale through the eyepiece'], how: ['点击右边的目镜，左上角的目镜窗口会显示刻度', 'Click the eyepiece on the right; the eyepiece window at the top left shows the scale'], target: eyepiece, done: () => st.looked, act: () => { st.looked = true; G.lookAt('.obs'); } },
      { t: ['读出明暗分界线的数值并记录', 'Read the shadow edge and record it'], how: ['在刻度上找到亮区和暗区的分界，读到小数点后三位，再在下面选出你读到的数值（选对就会记录）', 'Find where light meets dark, read to 3 decimals, then pick your reading below (a correct pick is recorded)'],
        target: null, done: () => st.records.length >= 1, act: () => G.$('#rec').click(), pick: readPick },
      { t: ['转动宝石，在 4 个以上角度分别记录', 'Turn the stone and record at 4 or more angles'], how: ['左右拖动棱镜上的宝石（或用滑杆），每转到一个新角度，就在下面选出这个角度的读数', 'Drag the stone sideways (or use the slider); at each new angle, pick that angle’s reading below'],
        target: gemHolder, done: () => angles() >= 4,
        pick: readPick, act: () => { [0, 45, 90, 135].forEach((a) => { st.rot = a; st.records.push(current()); }); G.$('#rot').value = st.rot; renderRecords(); refresh(); },
        ask: { sig: () => st.gem.id, keepOrder: true, q: ['转动宝石时，你看到几条阴影边？', 'As you turn the stone, how many shadow edges do you see?'],
          o: [['只有一条（或一个读数），位置不变', 'One edge (or one reading) that stays put'], ['两条边（双折射）', 'Two edges (doubly refractive)'], ['看不到阴影边', 'No edge at all']],
          a: () => ({ sr: 0, spot: 0, dr: 1, otl: 2 })[edgeKind()], e: () => EDGE_E[edgeKind()] } },
      { t: ['装上偏光片并转动，分辨两条阴影边', 'Fit the polarizing filter and turn it to separate the two edges'], how: ['点击桌上的偏光片装到目镜上，再左右拖动它转动：两条阴影边会轮流出现；单折射宝石只有一条边', 'Click the filter on the bench to fit it, then drag it sideways to turn it: the two edges appear in turn. A singly refractive stone shows one edge only'],
        target: polCap, done: () => st.pol !== 'none' && st.polTurn >= 60, act: () => { segPol.set('on'); turnPol(90); },
        ask: { sig: () => st.gem.id, q: ['转动偏光片时，阴影边有什么变化？', 'What happens to the edges as you turn the filter?'],
          o: [['两条边轮流出现、消失', 'The two edges appear and vanish in turn'], ['没有明显变化（只有一条边或没有边）', 'No real change (one edge, or none)'], ['整个视域变成红色', 'The whole field turns red']],
          a: () => (edgeKind() === 'dr' ? 0 : 1),
          e: () => (edgeKind() === 'dr' ? ['两条光线的振动方向互相垂直，偏光片每次只让一条通过。', 'The two rays vibrate at right angles, and the filter lets one through at a time.']
            : ['只有一条边（或没有边）时，偏光片分不出第二条边。', 'With one edge (or none) the filter has no second edge to reveal.']) } },
      { t: ['看分析结果，测完打开盖子擦净棱镜', 'Read the analysis, then open the cover and clean up'], how: ['先看下方的自动分析，再点击盖子打开', 'Check the analysis below, then click the cover to open it'],
        target: coverPivot, done: () => !F.cover, act: () => { F.cover = false; refresh(); } },
    ],
  });
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
