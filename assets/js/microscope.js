/* 宝石显微镜 Gem microscope */
(function () {
  const G = GemLab, T = G.T;
  G.buildHeader('microscope');
  G.initTabs();

  /* ================= 3D 模型 Model ================= */
  const v = (G.viewer = new G.Viewer(G.$('#viewer'), { cam: [5.6, 4.8, 6.6], target: [0, 2, 0], minD: 3, maxD: 16 }));
  const cream = G.mat(0xe8e4dc, { roughness: 0.55 });
  const dark = G.mat(0x2a2e35, { roughness: 0.45, metalness: 0.35 });
  const black = G.mat(0x141619, { roughness: 0.6 });
  const chrome = G.mat(0xc9ced6, { roughness: 0.22, metalness: 0.9 });

  // 底座 Base
  const base = G.group(G.rbox(3.2, 0.7, 2.6, 0.22, cream, [0, 0.35, 0]));
  base.add(G.box(0.25, 0.08, 0.12, black, [-1.2, 0.5, 1.32])); // 电源开关 power switch
  v.add(base);
  v.addPart(base, { zh: '底座与光源', en: 'Base & light source', dzh: '内置灯泡，从下方照亮宝石；前面是电源开关。', den: 'Holds the lamp that lights the stone from below; power switch at the front.' });

  // 光井与光阑 Light well & iris
  const well = new THREE.Group();
  well.position.set(0, 0.7, 0.3);
  well.add(G.cyl(0.6, 0.6, 0.06, chrome, [0, 0.03, 0]));
  const lightMat = new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0xfff1cc, emissiveIntensity: 0 });
  const lightDisc = G.cyl(0.46, 0.46, 0.02, lightMat, [0, 0.065, 0]);
  well.add(lightDisc);
  const stop = G.cyl(0.26, 0.26, 0.022, black, [0, 0.08, 0]); // 暗域挡光板 darkfield stop
  well.add(stop);
  const irisLever = G.box(0.4, 0.04, 0.06, black, [0.75, 0.04, 0]);
  well.add(irisLever);
  v.add(well);
  v.addPart(well, { zh: '光井与光阑', en: 'Light well & iris diaphragm', dzh: '光线从这里射出；拨动光阑杆可改变通光孔径，调节亮度和对比度。', den: 'Light comes up here; the iris lever changes the opening to control brightness and contrast.' });

  // 暗域/亮域切换杆 Darkfield / brightfield switch
  const dfLever = G.group(G.box(0.1, 0.1, 0.5, black, [0, 0, 0.25]));
  dfLever.position.set(1.1, 0.72, 1.0);
  v.add(dfLever);
  v.addPart(dfLever, { zh: '暗域 / 亮域切换', en: 'Dark / bright-field switch', dzh: '推入挡光板 = 暗域照明（黑背景，内含物发亮）；拉出 = 亮域照明。', den: 'Baffle in = darkfield (black background, inclusions glow); out = brightfield.' });

  // 光束 Light beams
  const beamMat = new THREE.MeshBasicMaterial({ color: 0xfff3d0, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const beamBright = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.42, 0.62, 32, 1, true), beamMat);
  beamBright.position.set(0, 1.08, 0.3);
  const beamDark = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.46, 0.62, 32, 1, true), beamMat.clone());
  beamDark.position.copy(beamBright.position);
  v.add(beamBright, beamDark);

  // 支柱 Pillar
  const pillar = G.cyl(0.16, 0.16, 3.6, chrome, [0, 2.5, -0.9]);
  v.add(pillar);
  v.addPart(pillar, { zh: '支柱', en: 'Pillar', dzh: '支撑镜体，镜体沿支柱上下移动。', den: 'Supports the optical head, which moves up and down along it.' });

  // 镜体（随调焦上下移动）Optical head (moves with focus)
  const head = new THREE.Group();
  v.add(head);
  const block = G.box(0.7, 0.9, 0.62, dark, [0, 3.0, -0.78]);
  const arm = G.box(0.5, 0.4, 1.0, dark, [0, 3.25, -0.2]);
  head.add(block, arm);
  const knobL = G.knob(0.34, 0.18, dark, [-0.47, 2.95, -0.78], [0, 0, Math.PI / 2]);
  const knobR = G.knob(0.34, 0.18, dark, [0.47, 2.95, -0.78], [0, 0, Math.PI / 2]);
  const knobs = G.group(knobL, knobR);
  head.add(knobs);
  v.addPart(knobs, { zh: '调焦旋钮', en: 'Focus knobs', dzh: '转动使镜体升降，让不同深度的内含物依次清晰。', den: 'Raise or lower the head so features at different depths come into focus.' });

  const zoomBody = G.cyl(0.42, 0.42, 1.0, dark, [0, 2.95, 0.3]);
  head.add(zoomBody);
  const zoomKnob = G.knob(0.5, 0.2, dark, [0, 3.05, 0.3]);
  head.add(zoomKnob);
  v.addPart(zoomKnob, { zh: '变倍旋钮', en: 'Zoom knob', dzh: '连续改变放大倍数（常见 10–60 倍）。', den: 'Changes magnification continuously (typically 10–60×).' });

  const objective = G.group(G.cyl(0.3, 0.22, 0.35, black, [0, 2.3, 0.3]), G.cyl(0.18, 0.18, 0.02, G.glassMat(0x88aaff, 0.6), [0, 2.12, 0.3]));
  head.add(objective);
  v.addPart(objective, { zh: '物镜', en: 'Objective lens', dzh: '最靠近宝石的镜头，形成第一次放大的像。', den: 'The lens nearest the stone; forms the first magnified image.' });

  const binoc = G.box(1.1, 0.45, 0.62, dark, [0, 3.62, 0.3]);
  head.add(binoc);
  const eyepieces = new THREE.Group();
  [-0.27, 0.27].forEach((x) => {
    const tube = G.group(G.cyl(0.12, 0.12, 0.9, black, [0, 0.45, 0]), G.cyl(0.16, 0.16, 0.16, black, [0, 0.9, 0]));
    tube.position.set(x, 3.75, 0.45);
    tube.rotation.x = 0.6;
    eyepieces.add(tube);
  });
  head.add(eyepieces);
  v.addPart(eyepieces, { zh: '目镜（双目）', en: 'Eyepieces (binocular)', dzh: '通常为 10 倍；双目观察有立体感。可调瞳距和视度。', den: 'Usually 10×; two eyepieces give a 3D view. Adjust for eye spacing and focus.' });

  // 宝石夹 Stone holder
  const holder = new THREE.Group();
  holder.add(G.cyl(0.07, 0.07, 0.9, chrome, [-1.2, 1.15, 0.3]));
  holder.add(G.cyl(0.18, 0.2, 0.1, black, [-1.2, 0.75, 0.3]));
  holder.add(G.rod([-1.2, 1.55, 0.3], [-0.32, 1.48, 0.33], 0.035, chrome));
  holder.add(G.rod([-1.2, 1.55, 0.3], [-0.32, 1.48, 0.27], 0.035, chrome));
  holder.add(G.rod([-0.32, 1.48, 0.36], [-0.12, 1.45, 0.36], 0.025, chrome));
  holder.add(G.rod([-0.32, 1.48, 0.24], [-0.12, 1.45, 0.24], 0.025, chrome));
  v.add(holder);
  v.addPart(holder, { zh: '宝石夹', en: 'Stone holder (tweezers)', dzh: '夹住宝石腰棱，可转动、倾斜，从不同方向观察。', den: 'Grips the stone by its girdle and can tilt/turn it to view from any direction.' });

  // 顶光灯 Overhead lamp
  const lamp = new THREE.Group();
  lamp.add(G.rod([1.3, 0.7, -0.6], [1.3, 2.3, -0.3], 0.05, chrome));
  lamp.add(G.rod([1.3, 2.3, -0.3], [0.8, 2.6, 0.2], 0.05, chrome));
  const lampHeadMat = new THREE.MeshStandardMaterial({ color: 0x333333, emissive: 0xfff6e0, emissiveIntensity: 0 });
  const lampHead = G.cyl(0.2, 0.28, 0.25, lampHeadMat, [0.75, 2.5, 0.25], [0.5, 0, 0.5]);
  lamp.add(lampHead);
  v.add(lamp);
  v.addPart(lamp, { zh: '顶光灯（反射光）', en: 'Overhead lamp (reflected light)', dzh: '从上方照射宝石表面，用来观察抛光、刻面棱和表面特征。', den: 'Lights the surface from above to inspect polish, facet edges and surface features.' });

  let gemObj = null;
  function setGem3D(gem) {
    if (gemObj) v.scene.remove(gemObj);
    gemObj = G.makeGem(gem, 0.42);
    gemObj.position.set(0, 1.45, 0.3);
    v.add(gemObj);
    v.addPart(gemObj, { zh: '宝石：' + gem.zh, en: 'Stone: ' + gem.en, dzh: gem.incNote.zh, den: gem.incNote.en });
    v.parts = v.parts.filter((p) => p.obj === gemObj || !p.info.zh.startsWith('宝石：'));
    G.renderParts(G.$('#parts-list'), v);
  }

  /* ================= 状态 State ================= */
  const st = { gem: null, light: 'on', mode: 'dark', zoom: 15, focus: 20 };

  function update3D() {
    const on = st.light === 'on';
    lightMat.emissiveIntensity = on && st.mode !== 'top' ? 1.2 : 0;
    stop.visible = st.mode === 'dark';
    beamBright.visible = on && st.mode === 'bright';
    beamDark.visible = on && st.mode === 'dark';
    lampHeadMat.emissiveIntensity = on && st.mode === 'top' ? 1.4 : 0;
    dfLever.position.z = st.mode === 'dark' ? 1.0 : 1.25;
  }
  v.tick((dt) => {
    head.position.y = G.approach(head.position.y, (50 - st.focus) * 0.004, 8, dt);
    const kz = (st.zoom - 10) * 0.06;
    zoomKnob.rotation.y = G.approach(zoomKnob.rotation.y, kz, 8, dt);
    knobs.children.forEach((k) => (k.rotation.x = G.approach(k.rotation.x, st.focus * 0.05, 8, dt)));
  });

  /* ================= 目镜画面 Eyepiece view ================= */
  const faceC = G.$('#layer-face'), incC = G.$('#layer-inc');
  const SURFACE = 12, INCL = 62; // 表面与内含物所在深度 depths

  function render() {
    const gem = st.gem;
    const f = G.fitCanvas(faceC), ic = G.fitCanvas(incC);
    const ctx = f.ctx, w = f.w, h = f.h, cx = w / 2, cy = h / 2;
    const ix = ic.ctx;
    ctx.clearRect(0, 0, w, h);
    ix.clearRect(0, 0, w, h);
    const on = st.light === 'on';
    if (!on) {
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#556'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(G.tx('光源已关闭', 'Light is off'), cx, cy);
      faceC.style.filter = incC.style.filter = 'none';
      return;
    }
    const R = w * 0.19 * (st.zoom / 10);
    const col = G.hexToRgb(gem.css);
    const mode = st.mode;

    // 背景 Background
    if (mode === 'bright') {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.7);
      g.addColorStop(0, '#fbf7ee'); g.addColorStop(1, '#cfc8b8');
      ctx.fillStyle = g;
    } else ctx.fillStyle = mode === 'dark' ? '#000' : '#0b0b0e';
    ctx.fillRect(0, 0, w, h);

    // 宝石本体 Gem body
    let fill, edge;
    if (mode === 'dark') {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
      g.addColorStop(0, G.rgba(G.mix(col, [0, 0, 0], 0.55), 1));
      g.addColorStop(1, G.rgba(G.mix(col, [0, 0, 0], 0.8), 1));
      fill = g; edge = 'rgba(255,255,255,.22)';
    } else if (mode === 'bright') {
      fill = G.rgba(col, gem.id === 'diamond' ? 0.18 : 0.6); edge = 'rgba(0,0,0,.35)';
    } else {
      fill = G.rgba(G.mix(col, [0, 0, 0], 0.6), 1); edge = 'rgba(255,255,255,.75)';
    }
    const lw = Math.max(0.8, R / 140);
    if (gem.cut === 'cab') {
      ctx.save();
      ctx.beginPath(); ctx.ellipse(cx, cy, R, R * 0.75, 0, 0, Math.PI * 2);
      ctx.fillStyle = mode === 'dark' ? G.rgba(G.mix(col, [0, 0, 0], 0.35), 1) : fill;
      ctx.fill();
      ctx.strokeStyle = edge; ctx.lineWidth = lw * 1.5; ctx.stroke();
      if (mode === 'top') {
        const g = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, 0, cx - R * 0.3, cy - R * 0.3, R * 0.5);
        g.addColorStop(0, 'rgba(255,255,255,.6)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g; ctx.fill();
      }
      ctx.restore();
    } else {
      G.drawBrilliantTop(ctx, cx, cy, R, { fill, edge, lineW: lw });
      if (mode === 'top') {
        ctx.save();
        const g = ctx.createLinearGradient(cx - R * 0.5, cy - R * 0.5, cx + R * 0.3, cy + R * 0.3);
        g.addColorStop(0, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.beginPath(); ctx.arc(cx, cy, R * 0.55, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
        ctx.restore();
      }
    }

    // 内含物 Inclusions
    ix.save();
    ix.beginPath();
    if (gem.cut === 'cab') ix.ellipse(cx, cy, R, R * 0.75, 0, 0, Math.PI * 2);
    else ix.arc(cx, cy, R, 0, Math.PI * 2);
    ix.clip();
    const ink = mode === 'bright' ? [25, 20, 18] : [255, 247, 228];
    const alphaK = mode === 'top' ? 0.25 : 1;
    const ctxI = { ix, cx, cy, R, ink, a: alphaK, lw, col, mode, P: (u, vv) => [cx + u * R, cy + vv * R] };
    gem.inc.forEach((type, k) => INC[type] && INC[type](ctxI, G.rng(gem.id + type + k)));
    ix.restore();

    // 景深模糊 Depth of field
    const blur = (d) => Math.min(9, Math.abs(st.focus - d) * 0.11 * (st.zoom / 20 + 0.5));
    faceC.style.filter = `blur(${blur(SURFACE).toFixed(2)}px)`;
    incC.style.filter = `blur(${blur(INCL).toFixed(2)}px)`;
  }

  /* ---------- 内含物绘制 Inclusion painters ---------- */
  const line = (c, a, b, alpha, w) => {
    c.ix.strokeStyle = G.rgba(c.ink, alpha * c.a); c.ix.lineWidth = w || c.lw;
    c.ix.beginPath(); c.ix.moveTo(...c.P(...a)); c.ix.lineTo(...c.P(...b)); c.ix.stroke();
  };
  const dot = (c, u, vv, r, alpha) => {
    c.ix.fillStyle = G.rgba(c.ink, alpha * c.a);
    c.ix.beginPath(); c.ix.arc(...c.P(u, vv), Math.max(0.6, r * c.R), 0, Math.PI * 2); c.ix.fill();
  };
  const rot = (u, vv, a) => [u * Math.cos(a) - vv * Math.sin(a), u * Math.sin(a) + vv * Math.cos(a)];
  const tint = (c, k, alpha) => G.rgba(c.mode === 'bright' ? G.mix(c.col, [0, 0, 0], k) : G.mix(c.col, [255, 255, 255], k), alpha * c.a);

  const needles = (c, rnd, dirs, n, len) => {
    for (let cl = 0; cl < 4; cl++) {
      const cu = (rnd() - 0.5) * 1.1, cv = (rnd() - 0.5) * 1.1;
      for (let i = 0; i < n; i++) {
        const a = (dirs[Math.floor(rnd() * dirs.length)] + (rnd() - 0.5) * 3) * Math.PI / 180;
        const L = len[0] + rnd() * (len[1] - len[0]);
        const u = cu + (rnd() - 0.5) * 0.45, vv = cv + (rnd() - 0.5) * 0.45;
        const d = [Math.cos(a) * L / 2, Math.sin(a) * L / 2];
        line(c, [u - d[0], vv - d[1]], [u + d[0], vv + d[1]], 0.35 + rnd() * 0.4, c.lw * 0.8);
      }
    }
  };
  const INC = {
    silk: (c, rnd) => needles(c, rnd, [0, 60, 120], 22, [0.04, 0.16]),
    needles2: (c, rnd) => needles(c, rnd, [35, 145], 10, [0.12, 0.4]),
    fingerprint: (c, rnd) => {
      const u0 = (rnd() - 0.5) * 0.8, v0 = (rnd() - 0.5) * 0.8, a = rnd() * Math.PI;
      for (let row = 0; row < 7; row++) {
        for (let t = -0.32; t < 0.32; t += 0.014) {
          if (rnd() < 0.3) continue;
          const [x, y] = rot(t, (row - 3) * 0.04 + 0.025 * Math.sin(t * 11 + row), a);
          dot(c, u0 + x, v0 + y, 0.006 + rnd() * 0.004, 0.75);
        }
      }
    },
    curved: (c) => {
      c.ix.lineWidth = c.lw * 2.2;
      for (let k = 0; k < 14; k++) {
        c.ix.strokeStyle = tint(c, 0.45, k % 2 ? 0.25 : 0.4);
        c.ix.beginPath();
        c.ix.arc(c.cx + 2.6 * c.R, c.cy - 1.6 * c.R, (2.3 + k * 0.075) * c.R, 0, Math.PI * 2);
        c.ix.stroke();
      }
    },
    bubbles: (c, rnd) => {
      for (let i = 0; i < 14; i++) {
        const u = (rnd() - 0.5) * 1.5, vv = (rnd() - 0.5) * 1.5, r = (0.012 + rnd() * 0.045) * c.R;
        const [x, y] = c.P(u, vv);
        c.ix.lineWidth = Math.max(1, r * 0.35);
        c.ix.strokeStyle = G.rgba(c.ink, 0.9 * c.a);
        c.ix.beginPath(); c.ix.arc(x, y, r, 0, Math.PI * 2); c.ix.stroke();
        c.ix.fillStyle = G.rgba(c.mode === 'bright' ? [255, 255, 255] : c.ink, 0.5 * c.a);
        c.ix.beginPath(); c.ix.arc(x - r * 0.2, y - r * 0.2, r * 0.25, 0, Math.PI * 2); c.ix.fill();
      }
    },
    zoning: (c) => {
      c.ix.lineWidth = c.R * 0.045;
      for (let k = 0; k < 7; k++) {
        const r = 0.3 + k * 0.12;
        c.ix.strokeStyle = tint(c, 0.35, k % 2 ? 0.18 : 0.42);
        c.ix.beginPath();
        for (let i = 0; i <= 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          const p = c.P(0.2 + Math.cos(a) * r, -0.1 + Math.sin(a) * r);
          i ? c.ix.lineTo(...p) : c.ix.moveTo(...p);
        }
        c.ix.stroke();
      }
    },
    threephase: (c, rnd) => {
      for (let n = 0; n < 6; n++) {
        const u = (rnd() - 0.5) * 1.2, vv = (rnd() - 0.5) * 1.2, L = 0.1 + rnd() * 0.12, W = 0.035 + rnd() * 0.02, a = 0.35 + (rnd() - 0.5) * 0.2;
        const pts = [];
        for (let i = 0; i < 12; i++) {
          const t = (i / 12) * Math.PI * 2;
          const j = 0.75 + rnd() * 0.45;
          const [x, y] = rot(Math.cos(t) * L * j, Math.sin(t) * W * j, a);
          pts.push(c.P(u + x, vv + y));
        }
        c.ix.beginPath(); pts.forEach((p, i) => (i ? c.ix.lineTo(...p) : c.ix.moveTo(...p))); c.ix.closePath();
        c.ix.fillStyle = G.rgba(c.ink, 0.08 * c.a); c.ix.fill();
        c.ix.strokeStyle = G.rgba(c.ink, 0.8 * c.a); c.ix.lineWidth = c.lw; c.ix.stroke();
        const [bx, by] = rot(-L * 0.45, 0, a);
        c.ix.beginPath(); c.ix.arc(...c.P(u + bx, vv + by), W * 0.45 * c.R, 0, Math.PI * 2); c.ix.stroke(); // 气泡 gas
        const [sx, sy] = c.P(u + rot(L * 0.4, 0, a)[0], vv + rot(L * 0.4, 0, a)[1]);
        const s = W * 0.6 * c.R;
        c.ix.save(); c.ix.translate(sx, sy); c.ix.rotate(a); c.ix.strokeRect(-s / 2, -s / 2, s, s); c.ix.restore(); // 石盐 halite cube
      }
    },
    jardin: (c, rnd) => {
      const walk = (u, vv, a, depth) => {
        let x = u, y = vv;
        for (let i = 0; i < 9; i++) {
          a += (rnd() - 0.5) * 0.8;
          const nx = x + Math.cos(a) * 0.05, ny = y + Math.sin(a) * 0.05;
          line(c, [x, y], [nx, ny], 0.45, c.lw);
          if (depth < 2 && rnd() < 0.25) walk(nx, ny, a + (rnd() > 0.5 ? 0.9 : -0.9), depth + 1);
          x = nx; y = ny;
        }
      };
      for (let i = 0; i < 4; i++) walk((rnd() - 0.5) * 1.2, (rnd() - 0.5) * 1.2, rnd() * 6.28, 0);
      for (let i = 0; i < 60; i++) dot(c, (rnd() - 0.5) * 1.6, (rnd() - 0.5) * 1.6, 0.004, 0.35);
    },
    crystal: (c, rnd) => {
      for (let n = 0; n < 7; n++) {
        const u = (rnd() - 0.5) * 1.3, vv = (rnd() - 0.5) * 1.3, s = 0.02 + rnd() * 0.04, k = 4 + Math.floor(rnd() * 3);
        c.ix.beginPath();
        for (let i = 0; i < k; i++) {
          const a = (i / k) * Math.PI * 2 + rnd() * 0.5;
          const p = c.P(u + Math.cos(a) * s, vv + Math.sin(a) * s);
          i ? c.ix.lineTo(...p) : c.ix.moveTo(...p);
        }
        c.ix.closePath();
        c.ix.fillStyle = n < 2 ? 'rgba(10,10,10,.95)' : G.rgba(c.ink, (c.mode === 'bright' ? 0.75 : 0.18) * c.a);
        c.ix.fill();
        c.ix.strokeStyle = G.rgba(c.ink, 0.9 * c.a); c.ix.lineWidth = c.lw; c.ix.stroke();
      }
    },
    feather: (c, rnd) => {
      for (let n = 0; n < 2; n++) {
        const u = (rnd() - 0.5) * 0.9, vv = (rnd() - 0.5) * 0.9, a = rnd() * 6.28;
        c.ix.beginPath();
        const pts = [];
        for (let i = 0; i <= 16; i++) {
          const t = (i / 16) * Math.PI;
          const r = 0.12 + rnd() * 0.05;
          pts.push(rot(Math.cos(t) * r * 1.6, Math.sin(t) * r * 0.7, a));
        }
        pts.forEach((p, i) => (i ? c.ix.lineTo(...c.P(u + p[0], vv + p[1])) : c.ix.moveTo(...c.P(u + p[0], vv + p[1]))));
        c.ix.closePath();
        c.ix.fillStyle = G.rgba(c.ink, 0.13 * c.a); c.ix.fill();
        pts.forEach((p) => line(c, [u, vv], [u + p[0], vv + p[1]], 0.25, c.lw * 0.7));
      }
    },
    octahedra: (c, rnd) => {
      for (let row = 0; row < 3; row++) {
        const u0 = -0.6 + rnd() * 0.3, v0 = -0.5 + row * 0.38 + rnd() * 0.1, a = 0.3;
        for (let i = 0; i < 7; i++) {
          const [x, y] = rot(i * 0.16, 0, a);
          const s = 0.022 + rnd() * 0.012;
          const p = c.P(u0 + x, v0 + y);
          c.ix.save(); c.ix.translate(...p); c.ix.rotate(Math.PI / 4);
          c.ix.strokeStyle = G.rgba(c.ink, 0.85 * c.a); c.ix.lineWidth = c.lw;
          c.ix.strokeRect(-s * c.R / 2, -s * c.R / 2, s * c.R, s * c.R);
          c.ix.beginPath(); c.ix.moveTo(-s * c.R / 2, -s * c.R / 2); c.ix.lineTo(s * c.R / 2, s * c.R / 2); c.ix.stroke();
          c.ix.restore();
        }
      }
    },
    lilypad: (c, rnd) => {
      for (let n = 0; n < 4; n++) {
        const u = (rnd() - 0.5) * 1.1, vv = (rnd() - 0.5) * 1.1, r = 0.08 + rnd() * 0.06;
        c.ix.beginPath();
        for (let i = 0; i <= 28; i++) {
          const a = (i / 28) * Math.PI * 2, rr = r * (0.85 + rnd() * 0.25);
          const p = c.P(u + Math.cos(a) * rr, vv + Math.sin(a) * rr * 0.8);
          i ? c.ix.lineTo(...p) : c.ix.moveTo(...p);
        }
        c.ix.fillStyle = G.rgba(c.ink, 0.12 * c.a); c.ix.fill();
        c.ix.strokeStyle = G.rgba(c.ink, 0.55 * c.a); c.ix.lineWidth = c.lw; c.ix.stroke();
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          line(c, [u, vv], [u + Math.cos(a) * r * 0.8, vv + Math.sin(a) * r * 0.65], 0.25, c.lw * 0.7);
        }
        c.ix.fillStyle = 'rgba(15,15,15,.95)';
        c.ix.beginPath(); c.ix.arc(...c.P(u, vv), r * 0.18 * c.R, 0, Math.PI * 2); c.ix.fill();
      }
    },
    doubling: (c) => {
      // 亭部刻面棱的重影 Doubled pavilion facet edges
      [[0, 0], [0.035, 0.014]].forEach(([du, dv]) => {
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
          line(c, [du, dv], [du + Math.cos(a) * 0.95, dv + Math.sin(a) * 0.95], 0.4, c.lw);
        }
      });
    },
    tiger: (c) => {
      c.ix.save();
      c.ix.beginPath(); c.ix.moveTo(...c.P(-1, -1)); c.ix.lineTo(...c.P(0.6, -1)); c.ix.lineTo(...c.P(-0.2, 0.9)); c.ix.closePath(); c.ix.clip();
      c.ix.lineWidth = c.R * 0.035;
      for (let k = -14; k < 14; k++) {
        c.ix.strokeStyle = tint(c, 0.25, k % 2 ? 0.15 : 0.45);
        const [a1, b1] = rot(-1.5, k * 0.07, 0.5), [a2, b2] = rot(1.5, k * 0.07, 0.5);
        c.ix.beginPath(); c.ix.moveTo(...c.P(a1, b1)); c.ix.lineTo(...c.P(a2, b2)); c.ix.stroke();
      }
      c.ix.restore();
    },
    granular: (c, rnd) => {
      for (let i = 0; i < 320; i++) {
        const u = (rnd() - 0.5) * 2, vv = (rnd() - 0.5) * 1.6, r = 0.03 + rnd() * 0.05;
        c.ix.strokeStyle = G.rgba(c.ink, 0.1 * c.a); c.ix.lineWidth = c.lw * 0.8;
        c.ix.beginPath(); c.ix.ellipse(...c.P(u, vv), r * c.R, r * 0.6 * c.R, rnd() * 3, 0, Math.PI * 2); c.ix.stroke();
      }
      for (let i = 0; i < 28; i++) {
        const [x, y] = c.P((rnd() - 0.5) * 1.6, (rnd() - 0.5) * 1.2);
        c.ix.save(); c.ix.translate(x, y); c.ix.rotate(rnd() * 3);
        c.ix.fillStyle = G.rgba(c.mode === 'bright' ? [60, 80, 60] : [235, 255, 240], 0.7 * c.a);
        c.ix.fillRect(-0.03 * c.R, -0.008 * c.R, 0.06 * c.R, 0.016 * c.R);
        c.ix.restore();
      }
    },
    swirl: (c) => {
      for (let k = 0; k < 9; k++) {
        c.ix.strokeStyle = G.rgba(c.ink, 0.22 * c.a); c.ix.lineWidth = c.lw * 1.6;
        c.ix.beginPath();
        for (let x = -1; x <= 1; x += 0.02) {
          const y = -0.6 + k * 0.14 + 0.07 * Math.sin(x * 4.5 + k * 0.8);
          const p = c.P(x, y);
          x === -1 ? c.ix.moveTo(...p) : c.ix.lineTo(...p);
        }
        c.ix.stroke();
      }
    },
    cleavage: (c, rnd) => {
      for (let i = 0; i < 9; i++) {
        const a = [0, 60, 120][i % 3] * Math.PI / 180, L = 0.3 + rnd() * 0.35;
        const u = (rnd() - 0.5) * 1.0, vv = (rnd() - 0.5) * 1.0, d = [Math.cos(a) * L / 2, Math.sin(a) * L / 2];
        line(c, [u - d[0], vv - d[1]], [u + d[0], vv + d[1]], 0.6, c.lw * 1.2);
        c.ix.strokeStyle = `hsla(${(i * 47) % 360},90%,65%,${0.35 * c.a})`;
        c.ix.lineWidth = c.lw * 3;
        c.ix.beginPath(); c.ix.moveTo(...c.P(u - d[0] * 0.6, vv - d[1] * 0.6)); c.ix.lineTo(...c.P(u + d[0] * 0.3, vv + d[1] * 0.3)); c.ix.stroke();
      }
    },
  };

  /* ================= 界面 UI ================= */
  const modeText = {
    dark: ['暗域照明：黑背景上内含物发亮，最容易发现内含物。', 'Darkfield: inclusions glow against a black background, so they are easy to find.'],
    bright: ['亮域照明：内含物呈暗色轮廓，适合观察色带、弧形生长纹和气泡。', 'Brightfield: inclusions show as dark outlines. Best for colour zoning, curved striae and bubbles.'],
    top: ['顶光（反射光）：主要看表面——刻面棱、抛光痕；内部特征几乎看不到。', 'Overhead light: mainly shows the surface, such as facet edges and polish. Internal features are faint.'],
  };
  function updateUI() {
    G.$('#zoom-val').textContent = st.zoom + '×';
    const depth = st.focus < 25 ? T('表面', 'surface') : st.focus < 80 ? T('宝石内部', 'inside') : T('底部', 'bottom');
    G.$('#focus-val').innerHTML = depth;
    G.$('#obs-mode').innerHTML = `${st.zoom}× · ` + { dark: T('暗域', 'Darkfield'), bright: T('亮域', 'Brightfield'), top: T('顶光', 'Overhead') }[st.mode];
    G.$('#badge').innerHTML = T(st.gem.zh, st.gem.en) + ' · ' + st.zoom + '×';
    const m = modeText[st.mode];
    G.$('#result').innerHTML = `<b>${T('观察要点', 'What to look for')}：</b>${T(st.gem.incNote.zh, st.gem.incNote.en)}<div class="note" style="margin-top:6px">${T(m[0], m[1])}</div>`;
    update3D();
    render();
  }

  G.gemPicker(G.$('#gem-picker'), G.gems, (gem) => { st.gem = gem; setGem3D(gem); updateUI(); }, 'ruby');
  G.seg(G.$('#power'), [{ v: 'on', zh: '开', en: 'On' }, { v: 'off', zh: '关', en: 'Off' }], (x) => { st.light = x; updateUI(); }, 'on');
  G.seg(G.$('#illum'), [
    { v: 'dark', zh: '暗域', en: 'Darkfield' }, { v: 'bright', zh: '亮域', en: 'Brightfield' }, { v: 'top', zh: '顶光', en: 'Overhead' },
  ], (x) => { st.mode = x; updateUI(); }, 'dark');
  G.$('#zoom').addEventListener('input', (e) => { st.zoom = +e.target.value; updateUI(); });
  G.$('#focus').addEventListener('input', (e) => { st.focus = +e.target.value; updateUI(); });
  window.addEventListener('resize', render);
  G.onLang(updateUI);

  G.renderParts(G.$('#parts-list'), v);
  G.renderQuiz(G.$('#quiz'), [
    { q: ['暗域照明下，内含物看起来是什么样子？', 'Under darkfield lighting, inclusions look…'],
      o: [['黑背景上的亮点/亮线', 'bright against a black background'], ['亮背景上的黑影', 'dark on a bright background'], ['完全看不见', 'invisible'], ['都是彩色的', 'always rainbow-coloured']], a: 0,
      e: ['暗域照明挡住直射光，内含物散射斜射光而发亮。', 'Direct light is blocked; inclusions scatter the oblique light and glow.'] },
    { q: ['弧形生长纹 + 气泡，最可能说明这颗红宝石是？', 'Curved striae plus gas bubbles in a ruby suggest it is…'],
      o: [['天然红宝石', 'natural'], ['焰熔法合成红宝石', 'flame-fusion synthetic'], ['红色玻璃', 'red glass'], ['红色尖晶石', 'red spinel']], a: 1,
      e: ['焰熔法晶体一层层弧形生长，并常留下气泡。', 'Flame-fusion boules grow in curved layers and often trap gas bubbles.'] },
    { q: ['“三相包体”（液体+气泡+晶体）是哪种宝石的典型特征？', 'Three-phase inclusions (liquid + gas + crystal) are typical of…'],
      o: [['哥伦比亚祖母绿', 'Colombian emerald'], ['钻石', 'diamond'], ['紫晶', 'amethyst'], ['玻璃', 'glass']], a: 0,
      e: ['哥伦比亚祖母绿的三相包体中常含立方体石盐晶体。', 'Colombian emeralds often contain three-phase inclusions with a cubic halite crystal.'] },
    { q: ['刚玉（红/蓝宝石）中的金红石针通常以多少度相交？', 'Rutile needles in corundum usually cross at…'],
      o: [['45°', '45°'], ['60° / 120°', '60° / 120°'], ['90°', '90°'], ['随机', 'random angles']], a: 1,
      e: ['刚玉为三方晶系，丝状物沿三个方向排列，夹角 60°/120°。', 'Corundum is trigonal, so silk lies in three directions at 60°/120°.'] },
    { q: ['想观察刻面棱是否锐利、表面抛光痕，应选择？', 'To check facet edges and polish marks you should use…'],
      o: [['暗域照明', 'darkfield'], ['亮域照明', 'brightfield'], ['顶光（反射光）', 'overhead (reflected) light'], ['关闭光源', 'no light']], a: 2,
      e: ['表面特征要用反射光观察。', 'Surface features are seen in reflected light.'] },
    { q: ['从台面看到明显的“后刻面棱重影”，说明宝石？', 'Strong doubling of back facet edges means the gem…'],
      o: [['是单折射', 'is singly refractive'], ['双折射率较大', 'has high birefringence'], ['是玻璃', 'is glass'], ['被染色', 'is dyed']], a: 1,
      e: ['双折射率越大重影越明显，例如橄榄石、锆石。', 'The higher the birefringence the stronger the doubling, e.g. peridot, zircon.'] },
  ]);
})();
