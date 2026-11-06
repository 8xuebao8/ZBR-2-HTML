/* 首页 3D 实验室：实验台上摆着六台仪器，点击进入对应页面
   Home-page 3D lab: six instruments on a bench, click one to open its page */
(function () {
  const G = window.GemLab;

  G.buildLab = function (el) {
    const v = new G.Viewer(el, { cam: [0, 3.4, 7.5], target: [0, 1.75, -2.5], floor: false, fov: 36 });
    const c = v.controls;
    c.enablePan = false;
    c.minPolarAngle = 0.95;
    c.maxPolarAngle = 1.5;
    c.minAzimuthAngle = -0.65;
    c.maxAzimuthAngle = 0.65;
    v.markerMode = 'off';
    v.key.shadow.camera.left = -10; v.key.shadow.camera.right = 10;
    v.key.shadow.camera.updateProjectionMatrix();

    const M = {
      white: G.mat(0xeef0f2, { roughness: 0.4 }),
      black: G.mat(0x1b1d22, { roughness: 0.45 }),
      dark: G.mat(0x30353d, { roughness: 0.5 }),
      grey: G.mat(0x8a9099, { roughness: 0.35, metalness: 0.5 }),
      chrome: G.mat(0xc9ced6, { roughness: 0.2, metalness: 0.9 }),
      brass: G.mat(0xc8a24a, { roughness: 0.3, metalness: 0.8 }),
    };

    /* ---------- 房间 Room ---------- */
    const floorTex = G.canvasTexture(512, 512, (x, w, h) => {
      x.fillStyle = '#d9dde3'; x.fillRect(0, 0, w, h);
      x.strokeStyle = '#b8bec8'; x.lineWidth = 4;
      for (let i = 0; i <= 4; i++) {
        x.beginPath(); x.moveTo(i * 128, 0); x.lineTo(i * 128, h); x.stroke();
        x.beginPath(); x.moveTo(0, i * 128); x.lineTo(w, i * 128); x.stroke();
      }
    });
    floorTex.tex.wrapS = floorTex.tex.wrapT = THREE.RepeatWrapping;
    floorTex.tex.repeat.set(5, 4);
    const floor = G.mesh(new THREE.PlaneGeometry(20, 14), G.mat(0xffffff, { map: floorTex.tex, roughness: 0.7 }), [0, 0, 1], [-Math.PI / 2, 0, 0]);
    floor.castShadow = false;
    const wallMat = G.mat(0xe7ecf2, { roughness: 0.9 });
    const back = G.mesh(new THREE.PlaneGeometry(20, 7), wallMat, [0, 3.5, -4.2]);
    const left = G.mesh(new THREE.PlaneGeometry(14, 7), wallMat, [-10, 3.5, 1], [0, Math.PI / 2, 0]);
    const right = G.mesh(new THREE.PlaneGeometry(14, 7), wallMat, [10, 3.5, 1], [0, -Math.PI / 2, 0]);
    // 墙裙 Skirting / wainscot stripe
    const stripe = G.box(20, 0.12, 0.04, G.mat(0x3d6f9e), [0, 1.9, -4.17]);
    v.add(floor, back, left, right, stripe);

    // 实验台 Lab bench
    const bench = new THREE.Group();
    bench.add(G.box(14.4, 0.08, 1.8, G.mat(0x2b3038, { roughness: 0.35 }), [0, 0.96, -2.7]));
    bench.add(G.box(14.1, 0.92, 1.6, G.mat(0xf3f5f7, { roughness: 0.6 }), [0, 0.46, -2.75]));
    for (let i = 0; i < 8; i++) {
      const x = -6.15 + i * 1.757;
      bench.add(G.box(0.02, 0.86, 0.02, G.mat(0xc5cbd3), [x - 0.878, 0.46, -1.94]));
      bench.add(G.box(0.5, 0.05, 0.05, M.chrome, [x, 0.78, -1.92]));
    }
    bench.add(G.box(14.1, 0.08, 1.5, G.mat(0x9aa2ad), [0, 0.04, -2.8]));
    v.add(bench);

    // 墙上的标牌 Wall sign
    const sign = G.canvasTexture(1024, 256, (x, w, h) => {
      x.fillStyle = '#16324f'; x.fillRect(0, 0, w, h);
      x.strokeStyle = '#5ec8ff'; x.lineWidth = 10; x.strokeRect(10, 10, w - 20, h - 20);
      x.fillStyle = '#ffffff'; x.textAlign = 'center'; x.textBaseline = 'middle';
      const title = '💎 ' + G.tx('宝石仪器实验室', 'Gem Instrument Lab');
      let fs = 64;
      do { x.font = `bold ${fs}px "PingFang SC","Microsoft YaHei",Tahoma,sans-serif`; fs -= 2; } while (x.measureText(title).width > w - 90 && fs > 20);
      x.fillText(title, w / 2, h / 2 - 22);
      x.font = '34px Tahoma,sans-serif'; x.fillStyle = '#9fd8ff';
      x.fillText('GEM TESTING LAB', w / 2, h / 2 + 50);
    });
    v.add(G.mesh(new THREE.PlaneGeometry(4, 1), new THREE.MeshBasicMaterial({ map: sign.tex }), [0, 3.25, -4.18]));
    G.onLang(() => sign.redraw());

    // 两侧墙架和瓶子 Wall shelves with bottles
    const bottleCols = [0x7fc8a9, 0xe0a458, 0x9ab8e8, 0xd36b6b, 0xc9b6e4, 0x88c0d0];
    [-5, 5].forEach((sx, si) => {
      [2.45, 3.35].forEach((sy, row) => {
        v.add(G.box(3.6, 0.06, 0.45, G.mat(0xb08a5a, { roughness: 0.7 }), [sx, sy, -3.95]));
        for (let k = 0; k < 6; k++) {
          const col = bottleCols[(k + si * 2 + row) % bottleCols.length];
          const bx = sx - 1.4 + k * 0.56, h = 0.28 + ((k * 7 + row * 3) % 4) * 0.06;
          const bottle = G.group(
            G.cyl(0.1, 0.11, h, G.glassMat(col, 0.75), [0, h / 2, 0]),
            G.cyl(0.04, 0.05, 0.08, M.black, [0, h + 0.04, 0])
          );
          bottle.position.set(bx, sy + 0.03, -3.9);
          v.add(bottle);
        }
      });
    });

    // 凳子 Stools
    [-4.6, -1.5, 1.5, 4.6].forEach((x) => {
      v.add(G.group(
        G.cyl(0.32, 0.32, 0.07, G.mat(0x2f6fa8, { roughness: 0.6 }), [x, 0.72, -1.15]),
        G.cyl(0.04, 0.04, 0.7, M.chrome, [x, 0.36, -1.15]),
        G.cyl(0.28, 0.3, 0.03, M.chrome, [x, 0.02, -1.15])
      ));
    });

    // 台面上的小宝石 Gems on the bench
    [['ruby', -6.7, -2.2], ['emerald', -0.95, -2.0], ['sapphire', 2.85, -2.1], ['diamond', 6.75, -2.25]].forEach(([id, x, z]) => {
      const gm = G.makeGem(G.gemById(id), 0.16);
      gm.position.set(x, 1.0 + 0.43 * 0.16, z);
      v.add(gm);
    });

    // 暖色补光 Warm room light
    const warm = new THREE.PointLight(0xfff1dc, 0.55, 22);
    warm.position.set(0, 5.5, 1);
    v.add(warm);

    /* ---------- 六台仪器（简化模型）Six instruments (simplified) ---------- */
    const build = {
      microscope() {
        const g = new THREE.Group();
        g.add(G.rbox(0.9, 0.22, 0.75, 0.08, M.white, [0, 0.11, 0]));
        g.add(G.cyl(0.24, 0.24, 0.04, M.black, [0, 0.24, 0.08]));
        g.add(G.box(0.16, 1.05, 0.16, M.white, [0, 0.74, -0.27]));
        g.add(G.box(0.22, 0.2, 0.5, M.white, [0, 1.12, -0.08]));
        g.add(G.cyl(0.13, 0.1, 0.26, M.black, [0, 0.95, 0.1]));
        g.add(G.box(0.36, 0.17, 0.3, M.white, [0, 1.25, 0.08]));
        [-0.09, 0.09].forEach((x) => g.add(G.cyl(0.055, 0.055, 0.32, M.black, [x, 1.43, 0.2], [-0.55, 0, 0])));
        [-0.15, 0.15].forEach((x) => g.add(G.knob(0.09, 0.06, M.black, [x * 1.2, 0.85, -0.27], [0, 0, Math.PI / 2])));
        g.add(G.box(0.12, 0.05, 0.06, M.brass, [0.22, 0.24, 0.3]));
        return g;
      },
      refractometer() {
        const g = new THREE.Group();
        g.add(G.rbox(0.8, 0.34, 0.5, 0.08, M.dark, [0, 0.17, 0]));
        g.add(G.box(0.34, 0.08, 0.34, M.black, [-0.12, 0.38, 0]));
        g.add(G.cyl(0.08, 0.08, 0.45, M.black, [0.5, 0.36, 0], [0, 0, -1.15]));
        g.add(G.cyl(0.1, 0.1, 0.08, M.grey, [0.7, 0.45, 0], [0, 0, -1.15]));
        // 黄色钠光灯 Yellow sodium lamp
        g.add(G.cyl(0.14, 0.16, 0.06, M.dark, [-0.65, 0.03, 0.05]));
        g.add(G.cyl(0.03, 0.03, 0.45, M.chrome, [-0.65, 0.27, 0.05]));
        g.add(G.box(0.2, 0.14, 0.14, M.dark, [-0.58, 0.52, 0.05]));
        g.add(G.box(0.02, 0.1, 0.1, G.mat(0xffc04a, { emissive: 0xffb020, emissiveIntensity: 1.2 }), [-0.47, 0.52, 0.05]));
        const glow = G.makeGlow(0xffc04a, 0.45); glow.position.set(-0.44, 0.52, 0.05); g.add(glow);
        return g;
      },
      polariscope() {
        const g = new THREE.Group();
        g.add(G.rbox(0.66, 0.26, 0.66, 0.08, M.dark, [0, 0.13, 0]));
        g.add(G.cyl(0.24, 0.24, 0.03, G.mat(0xdfe8ff, { emissive: 0xcfe0ff, emissiveIntensity: 0.9 }), [0, 0.275, 0]));
        g.add(G.cyl(0.04, 0.04, 0.7, M.chrome, [0, 0.61, -0.26]));
        g.add(G.box(0.1, 0.06, 0.28, M.dark, [0, 0.93, -0.14]));
        g.add(G.torus(0.24, 0.035, M.black, [0, 0.93, 0.05], [Math.PI / 2, 0, 0]));
        g.add(G.cyl(0.23, 0.23, 0.012, G.glassMat(0x334455, 0.75), [0, 0.93, 0.05]));
        const gem = G.makeGem(G.gemById('peridot'), 0.14);
        gem.position.set(0, 0.35, 0); g.add(gem);
        return g;
      },
      chelsea() {
        const g = new THREE.Group();
        g.add(G.cyl(0.2, 0.22, 0.05, M.dark, [0, 0.025, 0]));
        g.add(G.cyl(0.025, 0.025, 0.35, M.chrome, [0, 0.2, 0]));
        const lens = G.group(
          G.torus(0.17, 0.035, M.black, [0, 0, 0]),
          G.cyl(0.16, 0.16, 0.02, G.glassMat(0xb0304a, 0.8), [0, 0, 0], [Math.PI / 2, 0, 0]),
          G.box(0.07, 0.3, 0.04, M.black, [0, -0.3, 0])
        );
        lens.position.set(0, 0.68, 0);
        lens.rotation.y = -0.4;
        g.add(lens);
        const em = G.makeGem(G.gemById('emerald'), 0.16);
        em.position.set(0.32, 0.07, 0.2); g.add(em);
        const ru = G.makeGem(G.gemById('ruby'), 0.14);
        ru.position.set(-0.3, 0.06, 0.22); g.add(ru);
        return g;
      },
      uv() {
        const g = new THREE.Group();
        const box = G.mat(0x22252b, { roughness: 0.6, side: THREE.DoubleSide });
        g.add(G.box(0.95, 0.04, 0.6, box, [0, 0.02, 0]));
        g.add(G.box(0.95, 0.6, 0.04, box, [0, 0.3, -0.28]));
        g.add(G.box(0.04, 0.6, 0.6, box, [-0.455, 0.3, 0]));
        g.add(G.box(0.04, 0.6, 0.6, box, [0.455, 0.3, 0]));
        g.add(G.box(0.95, 0.04, 0.6, box, [0, 0.6, 0]));
        // 紫光灯管 Violet tube
        g.add(G.box(0.7, 0.04, 0.06, G.mat(0x9a6bff, { emissive: 0x8a4dff, emissiveIntensity: 1.5 }), [0, 0.56, 0.05]));
        g.add(G.box(0.85, 0.14, 0.3, M.grey, [0, 0.69, -0.05]));
        const pl = new THREE.PointLight(0x8a4dff, 1.2, 1.4); pl.position.set(0, 0.45, 0.1); g.add(pl);
        const ru = G.makeGem(G.gemById('ruby'), 0.17);
        ru.position.set(0, 0.04 + 0.43 * 0.17, 0.05);
        G.setGemEmissive(ru, 0xff2a3a, 0.9);
        g.add(ru);
        const glow = G.makeGlow(0xff3355, 0.35); glow.position.set(0, 0.1, 0.05); g.add(glow);
        return g;
      },
      balance() {
        const g = new THREE.Group();
        g.add(G.rbox(0.8, 0.16, 0.65, 0.06, M.white, [0, 0.08, 0]));
        const lcd = G.canvasTexture(128, 48, (x, w, h) => {
          x.fillStyle = '#0f2a1e'; x.fillRect(0, 0, w, h);
          x.fillStyle = '#7dffb0'; x.font = 'bold 30px monospace'; x.textAlign = 'right'; x.textBaseline = 'middle';
          x.fillText('3.52 ct', w - 8, h / 2 + 2);
        });
        g.add(G.box(0.36, 0.1, 0.03, M.dark, [0, 0.11, 0.33]));
        g.add(G.mesh(new THREE.PlaneGeometry(0.3, 0.075), new THREE.MeshBasicMaterial({ map: lcd.tex }), [0, 0.11, 0.347]));
        g.add(G.cyl(0.2, 0.2, 0.02, M.chrome, [0, 0.17, -0.02]));
        // 跨桥与水杯 Bridge and beaker
        [-0.36, 0.36].forEach((x) => g.add(G.box(0.04, 0.42, 0.26, M.grey, [x, 0.37, -0.02])));
        g.add(G.box(0.76, 0.03, 0.26, M.grey, [0, 0.58, -0.02]));
        g.add(G.cyl(0.16, 0.16, 0.36, G.glassMat(0xddeeff, 0.3), [0, 0.775, -0.02]));
        g.add(G.cyl(0.15, 0.15, 0.26, G.glassMat(0x5aa9e6, 0.45), [0, 0.725, -0.02]));
        // 吊篮 Hanging basket
        g.add(G.rod([0, 0.18, -0.02], [0, 1.08, -0.02], 0.006, M.chrome));
        g.add(G.rod([0, 1.08, -0.02], [-0.2, 1.08, -0.02], 0.006, M.chrome));
        g.add(G.torus(0.06, 0.008, M.chrome, [0, 0.68, -0.02], [Math.PI / 2, 0, 0]));
        return g;
      },
    };

    const xs = [-5.3, -3.2, -1.1, 1.1, 3.2, 5.3];
    const ringMat = () => new THREE.MeshBasicMaterial({ color: 0x5ec8ff, transparent: true, opacity: 0.2, depthWrite: false });
    const items = G.instruments.map((inst, k) => {
      const holder = new THREE.Group();
      holder.position.set(xs[k], 1.0, -2.55);
      const model = build[inst.id]();
      model.rotation.y = -xs[k] * 0.035; // 稍微朝向观众 turn slightly towards the viewer
      model.scale.setScalar(1.35);
      holder.add(model);
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.78, 0.86, 48), ringMat());
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.006;
      holder.add(ring);
      // 隐形的点击区域，方便点中 Invisible hit box so the whole area is clickable
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const hit = G.box(1.75, size.y + 0.2, 1.5, new THREE.MeshBasicMaterial({ visible: false }), [0, (size.y + 0.2) / 2, 0]);
      hit.castShadow = hit.receiveShadow = false;
      holder.add(hit);
      v.add(holder);
      const go = () => { location.href = inst.file; };
      v.addControl(holder, { hint: [inst.zh, inst.en], onClick: go });

      // 名牌 Name tag (HTML link)
      const tag = document.createElement('a');
      tag.className = 'lab-tag';
      tag.href = inst.file;
      tag.innerHTML = `<b>${inst.icon} ${G.T(inst.zh, inst.en)}</b><small>${G.T('点击进入', 'Click to enter')} →</small>`;
      el.appendChild(tag);
      const item = { inst, holder, model, ring, tag, top: size.y + 0.25, lift: 0 };
      tag.addEventListener('mouseenter', () => (hoverTag = item));
      tag.addEventListener('mouseleave', () => (hoverTag = null));
      tag.addEventListener('focus', () => (hoverTag = item));
      tag.addEventListener('blur', () => (hoverTag = null));
      return item;
    });
    G.addThai(el);

    // 不需要黄色提示点和提示开关 No hotspot dots or toggle here
    if (v._toggle) v._toggle.remove();
    v.tip.remove();

    /* ---------- 悬停 Hover ---------- */
    let hover3d = null, hoverTag = null;
    const dom = v.renderer.domElement;
    dom.addEventListener('pointermove', (e) => {
      const o = v._pick(e, 'control');
      hover3d = items.find((it) => it.holder === o) || null;
    });
    dom.addEventListener('pointerleave', () => (hover3d = null));

    /* ---------- 名牌位置与动画 Tag positions & animation ---------- */
    const p = new THREE.Vector3();
    v.tick((dt, t) => {
      const cur = hoverTag || hover3d;
      const w = el.clientWidth, h = el.clientHeight;
      items.forEach((it, k) => {
        const on = it === cur;
        it.lift = G.approach(it.lift, on ? 0.12 : 0, 10, dt);
        it.model.position.y = it.lift;
        it.ring.material.opacity = on ? 0.95 : 0.18 + 0.1 * Math.sin(t * 2.2 + k);
        it.ring.material.color.set(on ? 0xffd166 : 0x5ec8ff);
        p.set(0, it.top + it.lift * 1.35, 0);
        it.holder.localToWorld(p);
        p.project(v.camera);
        const visible = p.z < 1 && Math.abs(p.x) < 1.05 && Math.abs(p.y) < 1.05;
        it.tag.style.display = visible ? '' : 'none';
        it.tag.style.left = ((p.x + 1) / 2) * w + 'px';
        it.tag.style.top = ((1 - p.y) / 2) * h + 'px';
        it.tag.classList.toggle('on', on);
      });
    });

    /* ---------- 按画面宽高自动取景 Fit the bench to the frame ---------- */
    const dir = new THREE.Vector3(0, 0.2, 1).normalize();
    const fit = () => {
      const aspect = (el.clientWidth || 1) / (el.clientHeight || 1);
      const half = Math.tan(THREE.MathUtils.degToRad(v.camera.fov / 2));
      const dist = Math.max(7.1 / (half * aspect), 2.2 / half);
      c.maxDistance = dist * 1.15;
      c.minDistance = Math.min(dist * 0.5, 6);
      v.camera.position.copy(c.target).addScaledVector(dir, dist);
      c.update();
    };
    fit();
    if (window.ResizeObserver) new ResizeObserver(fit).observe(el);
    return v;
  };
})();
