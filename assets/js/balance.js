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
  const S = 0.32;
  function setGem3D(gem) {
    if (gemObj) v.scene.remove(gemObj);
    gemObj = G.makeGem(gem, S);
    gemObj.position.copy(POS.off).add(new THREE.Vector3(0, 0.43 * S, 0));
    v.add(gemObj);
  }
  v.tick((dt) => {
    if (!gemObj) return;
    const target = POS[st.pos].clone().add(new THREE.Vector3(0, 0.43 * S, 0));
    gemObj.position.lerp(target, 1 - Math.exp(-5 * dt));
  });

  /* ================= 状态 State ================= */
  const MYSTERY = { id: 'mystery', zh: '❓未知宝石', en: 'Mystery stone', css: '#9aa4b0', color: 0xb8c0c8 };
  const st = { pick: null, gem: null, pos: 'off', tared: false, drift: 0.012, mass: 2, A: null, W: null, shown: false };

  function reading() {
    let r = st.tared ? 0 : st.drift;
    if (st.pos === 'air') r += st.mass;
    if (st.pos === 'water') r += st.mass - st.mass / st.gem.sg;
    return r;
  }
  function updateUI() {
    const r = reading();
    const txt = r.toFixed(3);
    G.$('#display').textContent = txt + ' ct';
    lcd.redraw(txt);
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
      html = (ok ? '✅ ' + T('正确！', 'Correct!') : '❌ ' + T(`你的答案 ${userVal}，再算一次：`, `Your answer was ${userVal}. Check again:`)) + '<br>' + html;
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
