/* 静水力学天平 Hydrostatic balance */
(function () {
  const G = GemLab, T = G.T;
  G.buildHeader('balance');
  G.initTabs();

  /* ================= 3D 模型 Model ================= */
  const v = (G.viewer = new G.Viewer(G.$('#viewer'), { cam: [4.6, 4.2, 6.2], target: [0, 1.6, 0], minD: 2.5, maxD: 16 }));
  const shell = G.mat(0xdfe3e8, { roughness: 0.45 });
  const dark = G.mat(0x2a2e35, { roughness: 0.5 });
  const chrome = G.mat(0xc9ced6, { roughness: 0.2, metalness: 0.9 });
  const wire = G.mat(0xb8bec8, { roughness: 0.3, metalness: 0.8 });

  // 电子天平 Electronic balance
  const bal = new THREE.Group();
  bal.add(G.rbox(3.4, 0.6, 2.8, 0.2, shell, [0, 0.3, 0]));
  const lcd = G.canvasTexture(256, 80, (ctx, w, h, text) => {
    ctx.fillStyle = '#0d1a10'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#8dff9a'; ctx.font = 'bold 44px ui-monospace, Menlo, monospace'; ctx.textAlign = 'right';
    ctx.fillText(text || '0.000', w - 70, 56);
    ctx.font = 'bold 26px sans-serif'; ctx.fillText('ct', w - 20, 56);
  });
  const panel = G.box(1.6, 0.42, 0.1, dark, [0, 0.42, 1.42], [-0.35, 0, 0]);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.36), new THREE.MeshBasicMaterial({ map: lcd.tex }));
  screen.position.set(-0.12, 0.44, 1.49); screen.rotation.x = -0.35;
  screen.scale.set(0.85, 0.85, 1);
  const tareBtn = G.box(0.16, 0.06, 0.12, G.mat(0x3c8cff), [0.62, 0.43, 1.5], [-0.35, 0, 0]);
  bal.add(panel, screen, tareBtn);
  bal.add(G.cyl(0.9, 0.9, 0.05, chrome, [0, 0.63, -0.1], null, 48));
  v.add(bal);
  v.addPart(bal, { zh: '电子天平', en: 'Electronic balance', dzh: '精度 0.001ct；前面是显示屏和归零（TARE）键。', den: 'Reads to 0.001 ct; display and TARE key at the front.' });

  // 烧杯架（跨过秤盘，不接触）Beaker bridge (straddles the pan, not touching)
  const bridge = G.group(
    G.box(0.9, 0.9, 0.08, dark, [0, 1.05, 1.05]),
    G.box(0.9, 0.9, 0.08, dark, [0, 1.05, -1.25]),
    G.box(0.9, 0.06, 2.38, dark, [0, 1.5, -0.1])
  );
  v.add(bridge);
  v.addPart(bridge, { zh: '烧杯架（桥架）', en: 'Beaker bridge', dzh: '架在秤盘上方但不接触秤盘，所以烧杯和水的重量不计入读数。', den: 'Stands over the pan without touching it, so the beaker and water are not weighed.' });

  const beaker = G.group(
    G.mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.1, 40, 1, true), G.glassMat(0xe8f4ff, 0.22), [0, 2.08, -0.1]),
    G.cyl(0.55, 0.55, 0.02, G.glassMat(0xe8f4ff, 0.3), [0, 1.54, -0.1])
  );
  const water = G.cyl(0.53, 0.53, 0.82, new THREE.MeshPhongMaterial({ color: 0x3f9cff, transparent: true, opacity: 0.32, depthWrite: false, shininess: 80 }), [0, 1.96, -0.1]);
  water.castShadow = false;
  beaker.add(water);
  v.add(beaker);
  v.addPart(beaker, { zh: '烧杯与蒸馏水', en: 'Beaker of distilled water', dzh: '用蒸馏水，可加一滴洗洁精减小表面张力。', den: 'Use distilled water; a drop of detergent reduces surface tension.' });

  // 称量架：立在秤盘上，上有空气盘，下吊水中吊篮 Frame on the pan: air pan on top, basket hanging in water
  const frame = new THREE.Group();
  [-0.72, 0.72].forEach((x) => {
    frame.add(G.cyl(0.03, 0.03, 2.3, wire, [x, 1.81, -0.1], null, 12));
    frame.add(G.box(0.2, 0.03, 0.3, wire, [x, 0.67, -0.1]));
  });
  frame.add(G.rod([-0.72, 2.96, -0.1], [0.72, 2.96, -0.1], 0.03, wire));
  frame.add(G.cyl(0.28, 0.24, 0.07, chrome, [0, 3.02, -0.1]));
  frame.add(G.rod([0, 2.96, -0.1], [0, 1.78, -0.1], 0.012, wire));
  frame.add(G.torus(0.2, 0.015, wire, [0, 1.74, -0.1], [Math.PI / 2, 0, 0]));
  frame.add(G.cyl(0.2, 0.2, 0.01, wire, [0, 1.7, -0.1]));
  v.add(frame);
  v.addPart(frame, { zh: '称量架（空气盘 + 吊篮）', en: 'Weighing frame (air pan + basket)', dzh: '立在秤盘上：顶部空气盘称空气中重量，水中吊篮称水中重量。', den: 'Sits on the pan: the top pan weighs in air, the basket weighs in water.' });

  const POS = {
    off: new THREE.Vector3(1.25, 0.62, 0.55),
    air: new THREE.Vector3(0, 3.06, -0.1),
    water: new THREE.Vector3(0, 1.72, -0.1),
  };
  let gemObj = null;
  const gemHolder = new THREE.Group(); // 固定容器 stable container for the control
  v.add(gemHolder);
  let dragging = false;
  const S = 0.32;
  function setGem3D(gem) {
    if (gemObj) gemHolder.remove(gemObj);
    gemObj = G.makeGem(gem, S);
    gemObj.position.copy(POS.off).add(new THREE.Vector3(0, 0.43 * S, 0));
    gemHolder.add(gemObj);
  }
  let fallingGem = null; // 自由模式：松手后宝石自由下落 free mode: the stone falls when released
  v.tick((dt) => {
    if (!gemObj || dragging || fallingGem) return;
    const target = POS[st.pos].clone().add(new THREE.Vector3(0, 0.43 * S, 0));
    gemObj.position.lerp(target, 1 - Math.exp(-5 * dt));
  });

  /* ================= 状态 State ================= */
  const MYSTERY = { id: 'mystery', zh: '❓未知宝石', en: 'Mystery stone', css: '#9aa4b0', color: 0xb8c0c8 };
  const st = { pick: null, gem: null, pos: 'off', tared: false, drift: 0.012, mass: 2, A: null, W: null, shown: false, correct: false,
    smashed: false, shorted: false }; // 自由模式的破坏：烧杯碎了、天平短路 free-mode damage: broken beaker, short circuit
  let guide = null;

  function reading() {
    let r = st.tared ? 0 : st.drift;
    if (st.pos === 'air') r += st.mass;
    if (st.pos === 'water') r += st.smashed ? st.mass : st.mass - st.mass / st.gem.sg; // 水洒光了就没有浮力 no water, no buoyancy
    return r;
  }
  function updateUI() {
    const r = reading();
    const txt = st.shorted ? 'Err' : r.toFixed(3);
    G.$('#display').textContent = st.shorted ? '⚡ Err ⚡' : txt + ' ct';
    if (!st.shorted) lcd.redraw(txt);
    G.$('#valA').textContent = st.A == null ? '—' : st.A.toFixed(3) + ' ct';
    G.$('#valW').textContent = st.W == null ? '—' : st.W.toFixed(3) + ' ct';
    G.$('#where').innerHTML = { off: T('宝石在桌面', 'stone on bench'), air: T('空气中', 'in air'), water: T('水中', 'in water') }[st.pos] + (st.tared ? '' : ' · ' + T('未归零', 'not tared'));
    G.$('#badge').innerHTML = T(st.pick.zh, st.pick.en);
    G.$('#b-tare').classList.toggle('done', st.tared);
  }
  function move(pos) {
    st.pos = pos;
    if (pos === 'air') st.A = reading();
    if (pos === 'water') st.W = reading();
    updateUI();
  }
  function showResult(userVal) {
    const box = G.$('#result');
    box.classList.remove('hidden');
    if (st.A == null || st.W == null) {
      box.className = 'result bad';
      box.innerHTML = T('请先分别称出空气中重量 A 和水中重量 W。', 'Weigh the stone in air (A) and in water (W) first.');
      return;
    }
    const sg = st.A / (st.A - st.W);
    let html = `SG = ${st.A.toFixed(3)} ÷ (${st.A.toFixed(3)} − ${st.W.toFixed(3)}) = ${st.A.toFixed(3)} ÷ ${(st.A - st.W).toFixed(3)} = <b>${sg.toFixed(2)}</b>`;
    let ok = true;
    if (userVal != null) {
      ok = Math.abs(userVal - sg) <= 0.02;
      if (ok) st.correct = true;
      html = (ok ? '✅ ' + T('正确！', 'Correct!') : '❌ ' + T(`你的答案 ${userVal}，再算一次：`, `Your answer was ${userVal}. Check again:`, `คำตอบของคุณคือ ${userVal} ลองคำนวณอีกครั้ง:`)) + '<br>' + html;
    }
    const realSg = st.gem.sg;
    if (Math.abs(sg - realSg) > 0.03) html += `<div class="note" style="margin-top:6px">${T('结果偏离真实值较多：是不是忘了先归零？', 'The result is well off: did you forget to tare first?')}</div>`;
    const cands = G.gems.filter((g) => Math.abs(g.sg - sg) <= 0.06);
    html += `<div style="margin-top:6px">${T('相对密度接近的宝石', 'Gems with a similar SG')}：${cands.length ? cands.map((g) => T(g.zh, g.en) + ` (${g.sg.toFixed(2)})`).join('、') : T('无', 'none')}</div>`;
    if (st.pick.id === 'mystery') html += `<div class="note" style="margin-top:6px">${T('答案', 'Answer')}：${T(st.gem.zh, st.gem.en)}（SG ${st.gem.sg.toFixed(2)}）${T('。只靠 SG 常常无法唯一确定，要结合折射率等其他测试。', '. SG alone is often not enough: combine it with RI and other tests.')}</div>`;
    box.className = 'result ' + (ok ? 'good' : 'bad');
    box.innerHTML = html;
  }

  G.gemPicker(G.$('#gem-picker'), [MYSTERY].concat(G.gems.filter((g) => g.id !== 'synruby')), (pick) => {
    st.pick = pick;
    st.correct = false;
    if (guide) guide.restart();
    st.gem = pick.id === 'mystery' ? G.gems[Math.floor(Math.random() * G.gems.length)] : pick;
    st.mass = +(1.2 + Math.random() * 2.6).toFixed(3);
    st.drift = +(0.006 + Math.random() * 0.01).toFixed(3);
    st.pos = 'off'; st.tared = false; st.A = st.W = null;
    G.$('#result').classList.add('hidden');
    G.$('#ans').value = '';
    setGem3D(pick.id === 'mystery' ? MYSTERY : pick);
    updateUI();
  }, 'ruby');

  G.$('#b-tare').addEventListener('click', () => {
    if (st.pos !== 'off') {
      const box = G.$('#result');
      box.className = 'result bad';
      box.innerHTML = T('请先取下宝石再归零。', 'Remove the stone before taring.');
      return;
    }
    st.tared = true; tareBtn.position.z = 1.46; setTimeout(() => (tareBtn.position.z = 1.5), 200); updateUI();
  });
  G.$('#b-air').addEventListener('click', () => move('air'));
  G.$('#b-water').addEventListener('click', () => move('water'));
  G.$('#b-off').addEventListener('click', () => move('off'));
  G.$('#check').addEventListener('click', () => {
    const val = parseFloat(G.$('#ans').value);
    showResult(isNaN(val) ? null : val);
  });
  G.$('#reveal').addEventListener('click', () => showResult(null));
  G.onLang(updateUI);

  /* ================= 在 3D 模型上直接操作 Operate the 3D model ================= */
  // 拖动宝石到空气盘 / 水中吊篮 / 桌面，松手时吸附到最近的位置 Drag the stone; it snaps to the nearest spot
  const LABEL = { off: ['桌面', 'bench'], air: ['空气盘', 'air pan'], water: ['水中吊篮', 'water basket'] };
  v.addControl(gemHolder, {
    hint: ['拖动宝石到空气盘或水中吊篮（点击也可依次切换）', 'Drag the stone to the air pan or water basket (or click)'],
    onDragStart: () => {},
    onDrag: () => {
      dragging = true;
      const n = new THREE.Vector3();
      v.camera.getWorldDirection(n);
      const p = v.rayOnPlane(gemObj.position.toArray(), n.toArray());
      if (p) gemObj.position.copy(p);
    },
    onDragEnd: () => {
      if (!dragging) return;
      dragging = false;
      if (G.isFree()) { fallingGem = { vy: 0, y0: gemObj.position.y }; return; } // 自由模式：真的掉下去 free mode: it really falls
      let best = null, bd = 1.1;
      Object.keys(POS).forEach((k) => {
        const d = gemObj.position.distanceTo(POS[k]);
        if (d < bd) { bd = d; best = k; }
      });
      if (best && best !== st.pos) { move(best); v.say('宝石放到了' + LABEL[best][0], 'Stone moved to the ' + LABEL[best][1]); }
      else if (!best) v.say('请放到空气盘、水中吊篮或桌面上', 'Drop it on the air pan, in the basket or on the bench');
    },
    onClick: () => {
      const next = { off: 'air', air: 'water', water: 'off' }[st.pos];
      move(next);
      v.say('宝石放到了' + LABEL[next][0], 'Stone moved to the ' + LABEL[next][1]);
    },
  });
  v.addControl(tareBtn, { hint: ['点击：归零（TARE）', 'Click: TARE'], onClick: () => G.$('#b-tare').click() });

  /* ================= 自由模式：高处丢宝石 → 砸碎烧杯 → 水流进天平 → 短路冒火花 =================
     Free mode: drop the stone from high up → it smashes the beaker → water floods the balance → sparks */
  const sb = G.sandbox(v, { surfaces: () => [bal, bridge, v.floor] });
  const BEAKER_C = new THREE.Vector3(0, 0, -0.1), WATER_TOP = 2.37, SMASH_H = 0.45, AIM_R = 0.2, RIM_Y = 2.64; // 只能轻轻、对准吊篮放 only a gentle, well-aimed drop is safe
  const shards = [], puddles = [], sparks = [];
  const glass = new THREE.MeshPhongMaterial({ color: 0x9fd3ff, emissive: 0x1a3a5a, specular: 0xffffff, shininess: 150, transparent: true, opacity: 0.8, side: THREE.DoubleSide }); // 碎玻璃带点蓝，桌上看得见 bluish shards that show on the bench
  const waterMat = new THREE.MeshPhongMaterial({ color: 0x3f9cff, transparent: true, opacity: 0.45, depthWrite: false, shininess: 90, side: THREE.DoubleSide });
  let spill = 0, sparkT = 0, zapLight = null;

  function smash(why) {
    st.smashed = true;
    beaker.visible = false;
    G.shake(v, 0.12, 0.5);
    // 碎玻璃四处飞 Shards fly everywhere
    for (let i = 0; i < 22; i++) {
      const a = -0.25 * Math.PI + Math.random() * 1.1 * Math.PI, h = 1.55 + Math.random() * 1.0; // 主要飞向前方和右侧，看得见 mostly towards the front and right, where you can see it
      const g = new THREE.BufferGeometry();
      const sz = 0.16 + Math.random() * 0.22;
      g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, sz, 0, sz * 0.3, sz * 0.4, sz * 0.9, 0], 3));
      g.computeVertexNormals();
      const m = new THREE.Mesh(g, glass);
      m.position.set(Math.cos(a) * 0.55, h, -0.1 + Math.sin(a) * 0.55);
      v.add(m);
      shards.push(m);
      const sp = 0.6 + Math.random() * 0.9;
      sb.drop(m, { vel: [Math.cos(a) * sp, 0.8 + Math.random() * 1.2, Math.sin(a) * sp], spin: [Math.random() * 9, Math.random() * 9, Math.random() * 9] });
    }
    // 水洒出来 The water spills
    water.visible = false;
    spill = 0.001;
    v.say('💥 ' + G.T(...(why || ['宝石从太高的地方掉下去，把烧杯砸碎了！', 'Dropped from too high: the stone smashed the beaker!'])));
    updateUI();
  }
  function addPuddle(pos, maxR) {
    const mesh = new THREE.Mesh(new THREE.CircleGeometry(1, 48), waterMat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.copy(pos);
    mesh.scale.set(0.01, 0.01, 1);
    mesh.renderOrder = 4;
    v.add(mesh);
    puddles.push({ mesh, maxR });
  }
  function shortCircuit() {
    st.shorted = true;
    zapLight = new THREE.PointLight(0x9fd8ff, 0, 4);
    zapLight.position.set(0, 0.6, 1.5);
    v.add(zapLight);
    G.shake(v, 0.06, 0.35);
    v.say('⚡ ' + G.T('水流进了天平，短路冒火花了！', 'Water got into the balance: short circuit and sparks!'));
    updateUI();
  }
  function sparkBurst(n) {
    const at = new THREE.Vector3((Math.random() - 0.5) * 1.4, 0.5 + Math.random() * 0.2, 1.45);
    for (let i = 0; i < n; i++) {
      const s2 = G.makeGlow(Math.random() < 0.5 ? 0xfff2a0 : 0x9fd8ff, 0.12 + Math.random() * 0.12);
      s2.position.copy(at);
      v.add(s2);
      sparks.push({ s: s2, vel: new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 3, Math.random() * 2), life: 0.35 + Math.random() * 0.3 });
    }
    if (zapLight) zapLight.intensity = 3;
  }
  // 短路时碰天平会触电 Touching the shorted balance gives you a shock
  const zap = document.createElement('div');
  zap.className = 'zap-flash';
  v.el.appendChild(zap);
  v.el.addEventListener('pointerdown', () => {
    if (!st.shorted) return;
    zap.classList.remove('on'); void zap.offsetWidth; zap.classList.add('on');
    sparkBurst(14);
    G.shake(v, 0.1, 0.3);
    v.say('⚡ ' + G.T('哎呀，触电了！先修好再用', 'Ouch, an electric shock! Repair it first'));
  }, true);

  v.tick((dt) => {
    // 宝石下落 The falling stone
    if (fallingGem && fallingGem.broken) { /* 正在碎 shattering */ }
    else if (fallingGem && gemObj) {
      const p = gemObj.position;
      fallingGem.vy -= 9.8 * 0.7 * dt;
      p.y += fallingGem.vy * dt;
      const half = 0.43 * S;
      const rBeaker = Math.hypot(p.x - BEAKER_C.x, p.z - BEAKER_C.z);
      const onBal = Math.abs(p.x) < 1.7 && Math.abs(p.z) < 1.4;
      if (!st.smashed && rBeaker > 0.42 && rBeaker < 0.7 && p.y - half <= RIM_Y && fallingGem.y0 - half > RIM_Y) {
        // 砸到烧杯口 Hit the rim of the beaker
        fallingGem = null;
        smash(['宝石砸在烧杯口上，烧杯碎了！', 'The stone hit the rim and the beaker broke!']);
        move('water');
      } else if (rBeaker < 0.5 && !st.smashed && p.y - half <= WATER_TOP) {
        // 落进烧杯：要轻、要对准吊篮 Into the beaker: it must be gentle and aimed at the basket
        const h = fallingGem.y0 - WATER_TOP;
        fallingGem = null;
        if (h > SMASH_H) smash();
        else if (rBeaker > AIM_R) smash(['没对准吊篮，宝石砸到烧杯底，烧杯碎了！', 'Missed the basket: the stone hit the bottom and the beaker broke!']);
        else v.say('💧 ' + G.T('轻轻放进了吊篮，很好！', 'Gently into the basket: well done!'));
        move('water');
      } else if (rBeaker < 0.3 && p.y - half <= POS.air.y && fallingGem.y0 > POS.air.y + 0.1 && p.y > POS.air.y - 0.2) {
        if (fallingGem.y0 - POS.air.y > 0.5 && !st.smashed) {
          // 摔得太狠：在空气盘上弹起来，掉进烧杯 Too hard: it bounces off the pan into the beaker
          fallingGem.vy = 1.4;
          const a = Math.random() * Math.PI * 2;
          p.x = BEAKER_C.x + Math.cos(a) * 0.4; p.z = BEAKER_C.z + Math.sin(a) * 0.4;
          v.say('💢 ' + G.T('咚！宝石砸在空气盘上弹进了烧杯', 'Bang! The stone bounced off the air pan into the beaker'));
        } else { fallingGem = null; move('air'); v.say('宝石落在了空气盘上', 'The stone landed on the air pan'); }
      } else if (rBeaker < 0.5 && st.smashed && p.y - half <= POS.water.y) {
        fallingGem = null; move('water');
      } else if (p.y - half <= (onBal ? 0.62 : 0)) {
        p.y = (onBal ? 0.62 : 0) + half;
        const drop = fallingGem.y0 - p.y;
        fallingGem = null;
        if (drop > 0.9) {
          // 没拿稳，掉下去摔碎了，换一颗新的 Dropped from too high: it shatters, then a new one appears
          fallingGem = { vy: 0, y0: p.y, broken: true };
          G.shatterGem(v, gemObj, st.gem, () => { fallingGem = null; setGem3D(st.pick.id === 'mystery' ? MYSTERY : st.pick); move('off'); G.popIn(v, gemObj); });
        } else {
          move('off');
          v.say('宝石掉到了' + (onBal ? '天平上' : '桌上'), 'The stone fell onto the ' + (onBal ? 'balance' : 'bench'));
        }
      }
    }
    // 水慢慢摊开，流到天平里 The water spreads and runs into the balance
    if (spill > 0) {
      if (spill < 0.02) { addPuddle(new THREE.Vector3(0, 0.66, -0.1), 1.55); addPuddle(new THREE.Vector3(1.0, 0.01, 1.6), 1.4); }
      spill += dt;
      puddles.forEach((q) => { const r = Math.min(q.maxR, q.maxR * Math.min(1, spill / 1.6)); q.mesh.scale.set(r, r, 1); });
      if (spill > 1.1 && !st.shorted) shortCircuit();
      if (spill > 2) spill = 2;
    }
    // 短路：一阵阵火花，屏幕乱跳 Short circuit: bursts of sparks, a glitching display
    if (st.shorted) {
      sparkT -= dt;
      if (sparkT <= 0) { sparkBurst(6 + Math.floor(Math.random() * 8)); sparkT = 0.25 + Math.random() * 0.7; }
      if (Math.random() < 0.3) lcd.redraw(['Err', '8.8.8.8', '', '-.---', 'E-07'][Math.floor(Math.random() * 5)]);
      if (zapLight) zapLight.intensity = Math.max(0, zapLight.intensity - dt * 10);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const k = sparks[i];
      k.life -= dt;
      k.vel.y -= 9 * dt;
      k.s.position.addScaledVector(k.vel, dt);
      k.s.material.opacity = Math.max(0, k.life * 2);
      if (k.life <= 0) { v.scene.remove(k.s); sparks.splice(i, 1); }
    }
  });
  /* ---------- 扫把：扫掉碎玻璃和地上的水 Broom: sweep away glass and spilled water ---------- */
  const BROOM_HOME = new THREE.Vector3(-1.4, 0.04, 2.5);
  const broom = new THREE.Group();
  const straw = G.mat(0xd9b46a, { roughness: 0.95 });
  broom.add(G.box(0.7, 0.08, 0.22, G.mat(0xc0392b, { roughness: 0.6 }), [0, 0.2, 0]));       // 扫把头 head
  for (let i = 0; i < 12; i++) broom.add(G.box(0.05, 0.2, 0.18, straw, [-0.32 + i * 0.058, 0.07, 0], [0, 0, (i - 5.5) * 0.03]));  // 扫把毛 bristles
  broom.add(G.rod([0, 0.24, 0], [0, 2.2, -0.5], 0.035, G.mat(0x8b5a2b, { roughness: 0.7 })));   // 扫把杆 handle
  broom.position.copy(BROOM_HOME);
  broom.rotation.y = 0.5;
  broom.visible = false;
  v.add(broom);
  v.addPart(broom, { zh: '扫把', en: 'Broom', dzh: '把碎玻璃和洒出来的水扫干净。', den: 'Sweeps up broken glass and spilled water.' });
  let sweeping = false, lastSweep = null, sweptCount = 0;
  const messLeft = () => shards.length + puddles.length;
  v.addControl(broom, {
    hint: ['按住拖动：把碎玻璃和水扫走', 'Hold and drag: sweep away the glass and water'],
    markerIf: () => messLeft() > 0,
    spin: false,
    onDragStart: () => { sweeping = true; lastSweep = null; },
    onDrag: () => {
      const p = v.rayOnPlane([0, 0.04, 0], [0, 1, 0]);
      if (!p) return;
      broom.position.set(p.x, 0.04, p.z);
      if (lastSweep) {
        const d = new THREE.Vector3(p.x - lastSweep.x, 0, p.z - lastSweep.z);
        const len = Math.min(d.length(), 0.4);
        if (len > 0.001) {
          d.normalize();
          broom.rotation.y = Math.atan2(-d.x, -d.z) + Math.PI / 2; // 扫把头横着推 the head pushes sideways-on
          // 碰到的碎玻璃被推着走，推远了就扫进簸箕 Shards in reach get pushed along, then swept away
          for (let i = shards.length - 1; i >= 0; i--) {
            const m = shards[i];
            if (Math.hypot(m.position.x - p.x, m.position.z - p.z) < 0.6) {
              m.position.addScaledVector(d, len * 0.9);
              m.userData.swept = (m.userData.swept || 0) + len;
              if (m.userData.swept > 0.9) { v.scene.remove(m); sb.forget(m); shards.splice(i, 1); sweptCount++; }
            }
          }
          // 水也被扫开、变小 Water gets spread out and shrinks
          for (let i = puddles.length - 1; i >= 0; i--) {
            const q = puddles[i], r = q.mesh.scale.x;
            if (Math.hypot(q.mesh.position.x - p.x, q.mesh.position.z - p.z) < r + 0.4) {
              const nr = r - len * 0.35;
              q.maxR = nr;
              if (nr < 0.06) { v.scene.remove(q.mesh); puddles.splice(i, 1); } else q.mesh.scale.set(nr, nr, 1);
            }
          }
          afterClean();
        }
      }
      lastSweep = p.clone();
    },
    onDragEnd: () => {
      sweeping = false;
      if (shards.length) v.say('🧹 ' + G.T('还有 ' + shards.length + ' 片碎玻璃', shards.length + ' pieces of glass left', 'เหลือเศษแก้วอีก ' + shards.length + ' ชิ้น'));
      else if (puddles.length) v.say('🧹 ' + G.T('玻璃扫完了，再把水扫干', 'Glass done: now sweep up the water'));
    },
  });
  // 扫干净了：天平晾干，短路解除 All swept: the balance dries out and the short circuit stops
  function afterClean() {
    if (!puddles.length) spill = 0; // 水没了就不会再短路 no water, no more shorting
    if (st.shorted && !puddles.length) {
      st.shorted = false;
      if (zapLight) { v.scene.remove(zapLight); zapLight = null; }
      v.say('✨ ' + G.T('水扫干了，天平晾干后恢复正常', 'The water is gone: the balance dries out and works again'));
      updateUI(); lcd.redraw(reading().toFixed(3));
    }
    if (!shards.length && !puddles.length && sweptCount) {
      if (!st.smashed) allFixed();
      else v.say('🧹 ' + G.T('扫干净了！去拿右边那个新烧杯装上', 'All clean! Now fetch the new beaker on the right'));
    }
  }
  function allFixed() {
    if (!messLeft() && !st.smashed && !st.shorted) { sb.fixed(); v.say('✅ ' + G.T('全部收拾好了，可以继续称量', 'All tidied up: you can weigh again')); }
  }

  /* ---------- 备用烧杯：自己拿到桥架上换上 Spare beaker: carry it onto the bridge yourself ---------- */
  const SPARE_HOME = new THREE.Vector3(2.35, -1.53, 0.1); // 杯底落在桌面 its base sits on the bench
  const spare = beaker.clone(true);
  spare.position.copy(SPARE_HOME);
  spare.visible = false;
  v.add(spare);
  v.addPart(spare, { zh: '新烧杯（装好蒸馏水）', en: 'New beaker (filled with distilled water)', dzh: '烧杯碎了以后，拿这个新的放到桥架上。', den: 'If the beaker breaks, put this new one on the bridge.' });
  let carrying = false;
  v.addControl(spare, {
    hint: ['按住拿起新烧杯，放到桥架上', 'Pick up the new beaker and put it on the bridge'],
    markerIf: () => st.smashed,
    spin: false,
    onDragStart: () => { carrying = true; },
    onDrag: () => {
      const n = new THREE.Vector3();
      v.camera.getWorldDirection(n);
      const c = spare.position.clone().add(new THREE.Vector3(0, 2.08, -0.1)); // 烧杯中心 beaker centre
      const p = v.rayOnPlane(c.toArray(), n.toArray());
      if (p) spare.position.copy(p).sub(new THREE.Vector3(0, 2.08, -0.1));
    },
    onDragEnd: () => {
      carrying = false;
      if (spare.position.length() < 0.8) {
        // 放好了：新烧杯就位 In place: the new beaker takes over
        spare.visible = false;
        spare.position.copy(SPARE_HOME);
        beaker.visible = true; water.visible = true;
        st.smashed = false;
        v.say('🫙 ' + G.T('新烧杯放好了', 'New beaker in place'));
        if (st.pos === 'water') move('water');
        updateUI();
        allFixed();
      } else v.say(G.T('要放到天平中间的桥架上', 'Put it on the bridge in the middle of the balance'));
    },
  });
  v.tick((dt) => {
    broom.visible = G.isFree() && (st.smashed || st.shorted || messLeft() > 0);
    spare.visible = st.smashed && G.isFree();
    if (!carrying && spare.visible) spare.position.lerp(SPARE_HOME, 1 - Math.exp(-6 * dt));
    if (!sweeping && !messLeft()) broom.position.lerp(BROOM_HOME, 1 - Math.exp(-4 * dt));
  });

  sb.onRepair(() => {
    broom.position.copy(BROOM_HOME); spare.position.copy(SPARE_HOME); sweptCount = 0;
    shards.forEach((m) => { v.scene.remove(m); sb.forget(m); }); shards.length = 0;
    puddles.forEach((q) => v.scene.remove(q.mesh)); puddles.length = 0;
    sparks.forEach((k) => v.scene.remove(k.s)); sparks.length = 0;
    if (zapLight) { v.scene.remove(zapLight); zapLight = null; }
    beaker.visible = true; water.visible = true;
    spill = 0; st.smashed = false; st.shorted = false;
    fallingGem = null;
    move('off');
  });

  /* ================= 分步指引 Step guide ================= */
  // 第一步：擦宝石 Step one: wipe the stone
  const wipe = G.addWipe(v, { getGem: () => gemObj });

  guide = G.guide({
    viewer: v,
    reset: () => { wipe.reset(); move('off'); st.tared = false; st.A = st.W = null; st.correct = false; G.$('#ans').value = ''; G.$('#result').classList.add('hidden'); updateUI(); },
    steps: [
      wipe.step(),
      { t: ['宝石不放上去，先归零', 'With no stone on, tare the balance'], how: ['点击天平前面的蓝色 TARE 键', 'Click the blue TARE key on the front'],
        target: tareBtn, done: () => st.tared, act: () => G.$('#b-tare').click() },
      { t: ['称空气中重量 A', 'Weigh the stone in air (A)'], how: ['把宝石拖到最上面的空气盘里', 'Drag the stone onto the top (air) pan'],
        target: gemHolder, done: () => st.A != null && st.pos === 'air', act: () => move('air') },
      { t: ['称水中重量 W', 'Weigh the stone in water (W)'], how: ['把宝石拖进烧杯里的吊篮', 'Drag the stone into the basket in the beaker'],
        target: gemHolder, done: () => st.W != null && st.pos === 'water', act: () => move('water') },
      { t: ['计算 SG = A ÷ (A − W)，填入并检查', 'Work out SG = A ÷ (A − W), enter it and check'], how: ['在下方输入答案（两位小数），点“检查答案”', 'Type your answer (2 decimals) below and press Check'],
        target: null, done: () => st.correct, act: () => { G.$('#ans').value = (st.A / (st.A - st.W)).toFixed(2); G.$('#check').click(); } },
      { t: ['取下宝石，擦干', 'Take the stone out and dry it'], how: ['把宝石拖回桌面（或点击它）', 'Drag the stone back onto the bench (or click it)'],
        target: gemHolder, done: () => st.pos === 'off', act: () => move('off') },
    ],
  });

  G.$('#sg-table').innerHTML = `<tr><th>${T('宝石', 'Gem')}</th><th>SG</th></tr>` +
    G.gems.filter((g) => g.id !== 'synruby').slice().sort((a, b) => a.sg - b.sg).map((g) => `<tr><td>${T(g.zh, g.en)}</td><td class="num">${g.sg.toFixed(2)}</td></tr>`).join('');

  G.renderParts(G.$('#parts-list'), v);
  G.renderQuiz(G.$('#quiz'), [
    { q: ['宝石空气中重 2.00ct，水中重 1.50ct，SG 是多少？', 'A stone weighs 2.00 ct in air and 1.50 ct in water. Its SG is…'],
      o: [['1.33', '1.33'], ['4.00', '4.00'], ['0.50', '0.50'], ['3.00', '3.00']], a: 1,
      e: ['SG = 2.00 ÷ (2.00 − 1.50) = 4.00，可能是刚玉。', 'SG = 2.00 ÷ (2.00 − 1.50) = 4.00, possibly corundum.'] },
    { q: ['“A − W” 代表什么？', 'What does “A − W” represent?'],
      o: [['宝石的体积', 'the stone’s volume'], ['同体积水的重量（浮力）', 'the weight of an equal volume of water (buoyancy)'], ['宝石的折射率', 'the RI'], ['天平误差', 'balance error']], a: 1,
      e: ['根据阿基米德原理，浮力等于排开水的重量。', 'By Archimedes’ principle, buoyancy equals the weight of water displaced.'] },
    { q: ['为什么烧杯架不能接触秤盘？', 'Why must the beaker bridge not touch the pan?'],
      o: [['否则烧杯和水的重量会计入读数', 'otherwise the beaker and water get weighed'], ['会划伤秤盘', 'it scratches the pan'], ['会漏水', 'it leaks'], ['没有原因', 'no reason']], a: 0,
      e: ['只有称量架和宝石的重量应该作用在秤盘上。', 'Only the frame and the stone should act on the pan.'] },
    { q: ['宝石表面附着气泡会使测得的 SG？', 'Bubbles stuck to the stone make the SG…'],
      o: [['偏低', 'too low'], ['偏高', 'too high'], ['不变', 'unchanged'], ['变成 0', 'zero']], a: 0,
      e: ['气泡增加浮力，使水中重量 W 偏小，A − W 变大，SG 偏低。', 'Bubbles add buoyancy, so W is too small, A − W too large and SG too low.'] },
    { q: ['哪种宝石不适合静水称重？', 'Which stone should not be weighed in water?'],
      o: [['钻石', 'diamond'], ['绿松石', 'turquoise'], ['红宝石', 'ruby'], ['石英', 'quartz']], a: 1,
      e: ['绿松石、欧泊等多孔宝石会吸水，甚至受损。', 'Porous stones like turquoise and opal absorb water and can be damaged.'] },
  ]);
})();
