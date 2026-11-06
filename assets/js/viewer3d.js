/* 3D 查看器与建模工具（基于 Three.js r147，全局 THREE）
   3D viewer and modelling helpers (Three.js r147, global THREE) */
(function () {
  const G = (window.GemLab = window.GemLab || {});

  class Viewer {
    constructor(el, opt = {}) {
      this.el = el;
      (G._viewers = G._viewers || []).push(this); // 便于调试 for debugging
      const r = (this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }));
      r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      r.setClearColor(0x000000, 0);
      r.outputEncoding = THREE.sRGBEncoding;
      r.shadowMap.enabled = true;
      r.shadowMap.type = THREE.PCFSoftShadowMap;
      Object.assign(r.domElement.style, { display: 'block', width: '100%', height: '100%', touchAction: 'none' });
      el.appendChild(r.domElement);

      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(opt.fov || 38, 1, 0.05, 200);
      this.camera.position.fromArray(opt.cam || [6, 5, 8]);

      const c = (this.controls = new THREE.OrbitControls(this.camera, r.domElement));
      c.target.fromArray(opt.target || [0, 1, 0]);
      c.enableDamping = true;
      c.dampingFactor = 0.08;
      c.minDistance = opt.minD || 2;
      c.maxDistance = opt.maxD || 25;
      c.maxPolarAngle = Math.PI * 0.49;
      c.autoRotate = !!opt.autoRotate;
      c.autoRotateSpeed = opt.autoRotateSpeed || 1.2;
      c.update();
      this.home = { cam: this.camera.position.clone(), target: c.target.clone() };

      this.hemi = new THREE.HemisphereLight(0xeef3ff, 0x8a94a6, 0.8);
      this.key = new THREE.DirectionalLight(0xffffff, 0.95);
      this.key.position.set(5, 10, 6);
      this.key.castShadow = true;
      this.key.shadow.mapSize.set(1024, 1024);
      const sc = this.key.shadow.camera;
      sc.left = sc.bottom = -8; sc.right = sc.top = 8; sc.near = 1; sc.far = 30;
      this.key.shadow.bias = -0.0005;
      this.fill = new THREE.DirectionalLight(0xa8c0ff, 0.35);
      this.fill.position.set(-6, 4, -4);
      this.scene.add(this.hemi, this.key, this.fill);

      if (opt.floor !== false) {
        const f = new THREE.Mesh(
          new THREE.CircleGeometry(opt.floorR || 7, 72),
          new THREE.MeshStandardMaterial({ color: 0xc9d3de, roughness: 0.95, metalness: 0 })
        );
        f.rotation.x = -Math.PI / 2;
        f.receiveShadow = true;
        this.scene.add(f);
        this.floor = f;
      }

      this.parts = [];
      this.tickers = [];
      this.helper = null;
      this.clock = new THREE.Clock();
      this._initPick();

      const resize = () => {
        const w = el.clientWidth || 1, h = el.clientHeight || 1;
        r.setSize(w, h, false);
        this.camera.aspect = w / h;
        // 画面比正方形窄时加大视角，左右不被裁掉 Widen the view on narrow frames so the sides stay in shot
        const base = opt.fov || 38;
        this.camera.fov = w / h < 1 ? (2 * Math.atan(Math.tan((base * Math.PI) / 360) / (w / h)) * 180) / Math.PI : base;
        this.camera.updateProjectionMatrix();
      };
      resize();
      if (window.ResizeObserver) new ResizeObserver(resize).observe(el);
      else window.addEventListener('resize', resize);

      const loop = () => {
        requestAnimationFrame(loop);
        const dt = Math.min(this.clock.getDelta(), 0.05);
        const t = this.clock.elapsedTime;
        this.tickers.forEach((fn) => fn(dt, t));
        if (this.helper) this.helper.update();
        c.update();
        r.render(this.scene, this.camera);
      };
      loop();
    }

    add(...objs) { this.scene.add(...objs); return objs[0]; }
    tick(fn) { this.tickers.push(fn); }

    // 注册可点击部件 Register a clickable part
    addPart(obj, info) {
      obj.userData.part = info;
      this.parts.push({ obj, info });
      return obj;
    }

    highlight(obj) {
      if (this.helper) { this.scene.remove(this.helper); this.helper.geometry.dispose(); this.helper = null; }
      if (obj) {
        this.helper = new THREE.BoxHelper(obj, 0x5ec8ff);
        this.helper.material.depthTest = false;
        this.helper.material.transparent = true;
        this.helper.renderOrder = 999;
        this.scene.add(this.helper);
      }
    }

    /* ---------- 交互：点击部件、拖动/点击可操作部件 Interaction ---------- */
    _initPick() {
      const ray = (this.ray = new THREE.Raycaster());
      const ndc = new THREE.Vector2();
      const dom = this.renderer.domElement;
      this.ctls = [];
      this.markerMode = 'guide'; // guide 当前步骤 / all 全部 / off 关闭
      let down = null, last = null, moved = 0;

      // 转动类控件（只用 dx/dy 的）支持无极拖动 Rotate-type controls (using only dx/dy) drag endlessly
      const spinCursor = document.createElement('div');
      spinCursor.className = 'spin-cursor hidden';
      spinCursor.textContent = '⟲';
      this.el.appendChild(spinCursor);
      let locked = false, fx = 0, fy = 0;
      const isSpin = (c) => (c.spin !== undefined ? (typeof c.spin === 'function' ? c.spin() : c.spin) : !!c.onDrag && c.onDrag.length >= 1 && c.onDrag.length <= 2);
      const startLock = (e) => {
        if (locked || !dom.requestPointerLock) return;
        const r = this.el.getBoundingClientRect();
        fx = e.clientX - r.left; fy = e.clientY - r.top;
        try { const pr = dom.requestPointerLock(); if (pr && pr.catch) pr.catch(() => {}); } catch (err) { /* 不支持就照常拖 fall back to a normal drag */ }
      };
      const stopLock = () => {
        spinCursor.classList.add('hidden');
        if (document.pointerLockElement === dom) document.exitPointerLock();
      };
      document.addEventListener('pointerlockchange', () => {
        locked = document.pointerLockElement === dom;
        spinCursor.classList.toggle('hidden', !locked);
        if (locked) { spinCursor.style.left = fx + 'px'; spinCursor.style.top = fy + 'px'; }
        else if (this.active && this._spinDrag) endDrag(null); // 按 Esc 退出时结束拖动 Esc ends the drag
      });

      const tip = (this.tip = document.createElement('div'));
      tip.className = 'ctl-tip hidden';
      this.el.appendChild(tip);

      const setRay = (e) => {
        const r = dom.getBoundingClientRect();
        ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        ray.setFromCamera(ndc, this.camera);
      };
      // 沿射线找第一个带 key 的物体（透明光束等会被跳过）First hit carrying userData[key]
      const pick = (e, key) => {
        this.scene.updateMatrixWorld(); // 确保位置是最新的 make sure positions are current
        setRay(e);
        for (const h of ray.intersectObjects(this.scene.children, true)) {
          let o = h.object;
          if (!o.visible) continue;
          while (o && !o.userData[key]) o = o.parent;
          if (o) return o.userData.ctlObj || o;
        }
        return null;
      };
      this._pick = pick;

      // 捕获阶段先于 OrbitControls 处理，拖动部件时不旋转视角 Capture phase: runs before OrbitControls
      this.el.addEventListener('pointerdown', (e) => {
        if (e.target !== dom) return;
        down = last = [e.clientX, e.clientY];
        moved = 0;
        const o = pick(e, 'control');
        if (o && o.userData.control.enabled !== false) {
          this.active = o;
          this.controls.enabled = false;
          tip.classList.add('hidden');
          const c = o.userData.control;
          c.onDragStart && c.onDragStart(e, this);
          this._spinDrag = isSpin(c);
          dom.style.cursor = c.onDrag ? 'grabbing' : 'pointer';
        }
      }, true);

      window.addEventListener('pointermove', (e) => {
        if (this.active) {
          const c = this.active.userData.control;
          let dx, dy;
          if (locked) {
            // 鼠标被锁定：用移动量，假光标到边缘就从另一边出来 Locked: use movement; the stand-in cursor wraps around
            dx = e.movementX; dy = e.movementY;
            const r = this.el.getBoundingClientRect();
            fx = (((fx + dx) % r.width) + r.width) % r.width;
            fy = (((fy + dy) % r.height) + r.height) % r.height;
            spinCursor.style.left = fx + 'px';
            spinCursor.style.top = fy + 'px';
          } else {
            setRay(e);
            dx = e.clientX - last[0]; dy = e.clientY - last[1];
            last = [e.clientX, e.clientY];
          }
          moved += Math.abs(dx) + Math.abs(dy);
          if (moved > 3 && this._spinDrag) startLock(e);
          if (c.onDrag && moved > 3) c.onDrag(dx, dy, e, this);
          return;
        }
        if (e.target !== dom || down) return;
        // 悬停提示 Hover hint
        const o = pick(e, 'control');
        if (o && o.userData.control.enabled !== false) {
          const c = o.userData.control;
          dom.style.cursor = c.onDrag ? 'grab' : 'pointer';
          const r = this.el.getBoundingClientRect();
          tip.innerHTML = (c.onDrag ? '✋ ' : '👆 ') + G.T(c.hint[0], c.hint[1]);
          tip.style.left = Math.min(e.clientX - r.left + 14, r.width - 220) + 'px';
          tip.style.top = e.clientY - r.top + 14 + 'px';
          tip.classList.remove('hidden');
        } else {
          dom.style.cursor = '';
          tip.classList.add('hidden');
        }
      });

      const endDrag = (e) => {
        const o = this.active, c = o.userData.control;
        this.active = null;
        this._spinDrag = false;
        this.controls.enabled = true;
        dom.style.cursor = '';
        stopLock();
        if (e && moved <= 5 && c.onClick) c.onClick(e, this);
        c.onDragEnd && c.onDragEnd(e, this);
      };
      window.addEventListener('pointerup', (e) => {
        const wasDown = down;
        down = null;
        if (this.active) { endDrag(e); return; }
        if (!wasDown || e.target !== dom || Math.hypot(e.clientX - wasDown[0], e.clientY - wasDown[1]) > 5) return;
        const o = pick(e, 'part');
        if (o) {
          this.highlight(o);
          (this.onPick || G.showPartCard)(o.userData.part, o);
        } else {
          this.highlight(null);
          G.showPartCard(null);
        }
      });

      // 提示点的位置与跳动 Marker position & pulse
      const box = new THREE.Box3();
      // 提示点贴在部件朝向镜头的表面上 Put each dot on the part's camera-facing surface
      const ray2 = new THREE.Raycaster(), tmpBox = new THREE.Box3(), dir = new THREE.Vector3();
      const shown = (o, root) => { for (let x = o; x; x = x.parent) { if (!x.visible) return false; if (x === root) break; } return true; };
      const solidMeshes = (obj) => {
        const out = [];
        obj.traverse((o) => {
          const m = o.material;
          if (o.isMesh && m && m.visible !== false && m.blending !== THREE.AdditiveBlending && !(m.transparent && m.opacity < 0.15) && shown(o, obj)) out.push(o);
        });
        return out;
      };
      const anchor = (obj, out) => {
        const ms = solidMeshes(obj);
        if (!ms.length) return box.setFromObject(obj).getCenter(out);
        box.makeEmpty();
        ms.forEach((m) => box.expandByObject(m));
        const c = box.getCenter(new THREE.Vector3());
        const cam = this.camera.position;
        const hitAt = (p) => {
          ray2.set(cam, dir.copy(p).sub(cam).normalize());
          const h = ray2.intersectObjects(ms, false)[0];
          return h ? h.point : null;
        };
        let hit = hitAt(c);
        if (!hit) {
          // 中心是空的（圆环、支架）：改用离中心最近的零件 Hollow centre: try the parts nearest to it
          const cands = ms.map((m) => tmpBox.setFromObject(m).getCenter(new THREE.Vector3()))
            .sort((a, b) => a.distanceToSquared(c) - b.distanceToSquared(c));
          for (let i = 0; i < cands.length && i < 8 && !hit; i++) hit = hitAt(cands[i]);
        }
        return out.copy(hit || c);
      };
      this.tick((dt, t) => {
        this.ctls.forEach(({ obj, marker, opt }, i) => {
          // 指引模式：只标当前步骤的部件 Guide mode: only the current step's part
          const tgt = this.guideTarget ? this.guideTarget() : undefined;
          const guided = this.markerMode === 'guide' && tgt !== undefined;
          // all：标出全部可操作部件 'all' marks every operable part
          const on = this.markerMode !== 'off' && obj.visible && opt.enabled !== false &&
            (guided ? obj === tgt : this.markerMode === 'all' || !opt.markerIf || opt.markerIf());
          marker.visible = on;
          if (!on) return;
          anchor(obj, marker.position);
          if (opt.markerOffset) marker.position.add(new THREE.Vector3(...opt.markerOffset));
          const s = (guided ? 0.24 : 0.16) + 0.06 * Math.sin(t * 4 + i);
          marker.scale.set(s, s, 1);
        });
      });
    }

    /* 注册可操作部件 Register an operable part
       opt: { hint: [中文, English], onClick, onDrag(dx, dy, e, viewer), onDragStart, onDragEnd, markerOffset, markerIf } */
    addControl(obj, opt) {
      obj.userData.control = opt;
      const marker = new THREE.Sprite(new THREE.SpriteMaterial({ map: G._dotTex(), color: 0xffd166, depthTest: false, transparent: true }));
      marker.renderOrder = 1000;
      marker.userData.control = opt;
      marker.userData.ctlObj = obj;
      this.scene.add(marker);
      this.ctls.push({ obj, marker, opt });
      if (!this._toggle) {
        const b = (this._toggle = document.createElement('button'));
        b.className = 'viewer-toggle';
        const label = { guide: ['🟡 提示点：当前步骤', '🟡 Hotspots: current step'], all: ['🟡 提示点：全部', '🟡 Hotspots: all'], off: ['⚪ 提示点：关', '⚪ Hotspots: off'] };
        const draw = () => (b.innerHTML = G.T(...label[this.markerMode]));
        draw();
        G.onLang(draw);
        this._drawToggle = draw;
        b.onclick = () => { this.markerMode = { guide: 'all', all: 'off', off: 'guide' }[this.markerMode]; draw(); };
        this.el.appendChild(b);
      }
      return obj;
    }

    // 在 3D 画面上方显示一句提示 Short message over the 3D view
    say(zh, en) {
      if (!this._say) {
        this._say = document.createElement('div');
        this._say.className = 'viewer-say';
        this.el.appendChild(this._say);
      }
      this._say.innerHTML = en === undefined ? zh : G.T(zh, en); // 只传一个参数时当作现成的 HTML one argument = ready HTML
      this._say.classList.add('show');
      clearTimeout(this._sayT);
      this._sayT = setTimeout(() => this._say.classList.remove('show'), 2200);
    }

    setMarkerMode(m) {
      this.markerMode = m;
      if (this._drawToggle) this._drawToggle();
    }

    // 当前鼠标射线与平面的交点 Pointer ray ∩ plane
    rayOnPlane(point, normal) {
      const pl = new THREE.Plane().setFromNormalAndCoplanarPoint(new THREE.Vector3(...normal), new THREE.Vector3(...point));
      const out = new THREE.Vector3();
      return this.ray.ray.intersectPlane(pl, out) ? out : null;
    }

    resetView() {
      this.camera.position.copy(this.home.cam);
      this.controls.target.copy(this.home.target);
    }
  }
  G.Viewer = Viewer;

  /* ---------- 建模工具 Modelling helpers ---------- */
  G.mat = (color, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.5, metalness: 0.1 }, o));
  G.glassMat = (color = 0xcfe8ff, opacity = 0.35) =>
    new THREE.MeshPhongMaterial({ color, transparent: true, opacity, shininess: 120, specular: 0xffffff, depthWrite: false, side: THREE.DoubleSide });
  G.mesh = (geo, m, pos, rot) => {
    const x = new THREE.Mesh(geo, m);
    if (pos) x.position.set(pos[0], pos[1], pos[2]);
    if (rot) x.rotation.set(rot[0], rot[1], rot[2]);
    x.castShadow = true;
    x.receiveShadow = true;
    return x;
  };
  G.box = (w, h, d, m, pos, rot) => G.mesh(new THREE.BoxGeometry(w, h, d), m, pos, rot);
  G.cyl = (rt, rb, h, m, pos, rot, seg = 40) => G.mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m, pos, rot);
  G.sph = (r, m, pos) => G.mesh(new THREE.SphereGeometry(r, 32, 16), m, pos);
  G.torus = (r, t, m, pos, rot) => G.mesh(new THREE.TorusGeometry(r, t, 12, 48), m, pos, rot);
  // 圆角盒子 Rounded box (rounded in X–Y, depth along Z)
  G.rbox = (w, h, d, rad, m, pos, rot) => {
    const s = new THREE.Shape();
    const x = -w / 2, y = -h / 2;
    s.moveTo(x + rad, y);
    s.lineTo(x + w - rad, y); s.quadraticCurveTo(x + w, y, x + w, y + rad);
    s.lineTo(x + w, y + h - rad); s.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
    s.lineTo(x + rad, y + h); s.quadraticCurveTo(x, y + h, x, y + h - rad);
    s.lineTo(x, y + rad); s.quadraticCurveTo(x, y, x + rad, y);
    const bev = Math.min(rad * 0.5, 0.04);
    const geo = new THREE.ExtrudeGeometry(s, { depth: d - bev * 2, bevelEnabled: true, bevelSize: bev, bevelThickness: bev, bevelSegments: 2, curveSegments: 8 });
    geo.translate(0, 0, -(d - bev * 2) / 2);
    return G.mesh(geo, m, pos, rot);
  };
  G.group = (...children) => {
    const g = new THREE.Group();
    children.forEach((c) => c && g.add(c));
    return g;
  };
  // 两点间的圆柱（光束、杆）Cylinder between two points
  G.rod = (a, b, r, m) => {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
    const len = A.distanceTo(B);
    const x = G.cyl(r, r, len, m, null, null, 16);
    x.position.copy(A).add(B).multiplyScalar(0.5);
    x.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
    return x;
  };
  // 滚花旋钮 Knurled knob
  G.knob = (r, h, m, pos, rot) => {
    const g = new THREE.Group();
    g.add(G.cyl(r, r, h, m, [0, 0, 0], null, 24));
    const rib = G.mat(0x111111, { roughness: 0.8 });
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      g.add(G.box(r * 0.12, h * 0.95, r * 0.12, rib, [Math.cos(a) * r, 0, Math.sin(a) * r], [0, -a, 0]));
    }
    if (pos) g.position.set(...pos);
    if (rot) g.rotation.set(...rot);
    return g;
  };

  // 刻面宝石 Faceted gem (round brilliant) or cabochon
  G.makeGem = function (gem, size = 1) {
    const g = new THREE.Group();
    let mesh;
    if (gem.cut === 'cab') {
      const geo = new THREE.SphereGeometry(0.5, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2);
      const m = new THREE.MeshPhongMaterial({ color: gem.color, shininess: 90, specular: 0x557766, transparent: true, opacity: 0.94 });
      mesh = new THREE.Mesh(geo, m);
      mesh.scale.set(1, 0.6, 0.75);
      const base = new THREE.Mesh(new THREE.CircleGeometry(0.5, 40), m);
      base.rotation.x = Math.PI / 2;
      base.scale.set(1, 0.75, 1);
      g.add(base);
      g.userData.bottom = 0;
    } else {
      const m = new THREE.MeshPhongMaterial({
        color: gem.color, specular: 0xffffff, shininess: 200, flatShading: true, transparent: true,
        opacity: gem.id === 'diamond' ? 0.9 : 0.86, side: THREE.DoubleSide,
        envMap: G.gemEnv(), combine: THREE.MixOperation, reflectivity: gem.id === 'diamond' ? 0.55 : 0.28,
      });
      mesh = new THREE.Mesh(G.brilliantGeometry(), m);
      g.userData.bottom = -0.43;
    }
    mesh.castShadow = true;
    g.add(mesh);
    g.userData.mesh = mesh;
    g.scale.setScalar(size);
    return g;
  };

  /* 标准圆钻型（57 个刻面）Standard round brilliant (57 facets)
     直径 1：台面 57%，冠高 16%，腰厚 2%，亭深 42%；腰棱在 y = 0
     Diameter 1: table 57%, crown 16%, girdle 2%, pavilion 42%; girdle at y = 0 */
  let brilliantGeo = null;
  G.brilliantGeometry = function () {
    if (brilliantGeo) return brilliantGeo;
    const R = 0.5, g2 = 0.01, crownH = 0.16, pavD = 0.42;
    const yT = g2 + crownH, rT = 0.57 / 2 / Math.cos(Math.PI / 8); // 台面八边形顶点半径 table octagon vertex radius
    const P = (r, a, y) => new THREE.Vector3(r * Math.cos(a), y, r * Math.sin(a));
    const A = (k) => (k * Math.PI) / 4, H = (k) => ((k + 0.5) * Math.PI) / 4, Q = (j) => (j * Math.PI) / 8;
    const crownY = (r) => g2 + ((R - r) / (R - rT * Math.cos(Math.PI / 8))) * crownH;
    const rS = rT * Math.cos(Math.PI / 8) + 0.5 * (R - rT * Math.cos(Math.PI / 8)); // 星刻面尖 star points
    const rL = R * 0.22; // 下腰小面尖（下腰面长 78%）lower-girdle points (78% length)
    const pavY = (r) => -g2 - ((R - r) / R) * pavD;
    const T = [], S = [], Gt = [], Gb = [], L = [];
    for (let k = 0; k < 8; k++) {
      T.push(P(rT, A(k), yT));
      S.push(P(rS, H(k), Math.min(yT, crownY(rS))));
      L.push(P(rL, H(k), pavY(rL)));
    }
    for (let j = 0; j < 16; j++) { Gt.push(P(R, Q(j), g2)); Gb.push(P(R, Q(j), -g2)); }
    const C = new THREE.Vector3(0, -g2 - pavD, 0), top = new THREE.Vector3(0, yT, 0);
    const tri = [];
    const t3 = (a, b, c) => tri.push(a, b, c);
    const q4 = (a, b, c, d) => { t3(a, b, c); t3(a, c, d); };
    const n = (i, len) => (i + len) % len;
    for (let k = 0; k < 8; k++) {
      t3(top, T[n(k + 1, 8)], T[k]);                                   // 台面 table
      t3(T[k], T[n(k + 1, 8)], S[k]);                                  // 星刻面 star
      q4(T[k], S[k], Gt[2 * k], S[n(k - 1, 8)]);                       // 风筝面 bezel (kite)
      t3(S[k], Gt[n(2 * k + 1, 16)], Gt[2 * k]);                       // 上腰面 upper girdle
      t3(S[k], Gt[n(2 * k + 2, 16)], Gt[n(2 * k + 1, 16)]);
      q4(C, L[n(k - 1, 8)], Gb[2 * k], L[k]);                          // 亭部主刻面 pavilion main
      t3(L[k], Gb[2 * k], Gb[n(2 * k + 1, 16)]);                       // 下腰面 lower girdle
      t3(L[k], Gb[n(2 * k + 1, 16)], Gb[n(2 * k + 2, 16)]);
    }
    for (let j = 0; j < 16; j++) q4(Gt[j], Gt[n(j + 1, 16)], Gb[n(j + 1, 16)], Gb[j]); // 腰棱 girdle
    const pos = new Float32Array(tri.length * 3);
    tri.forEach((v, i) => v.toArray(pos, i * 3));
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.computeVertexNormals();
    return (brilliantGeo = geo);
  };

  // 宝石反光用的简单环境贴图 Simple environment map for facet sparkle
  let gemEnvTex = null;
  G.gemEnv = function () {
    if (gemEnvTex) return gemEnvTex;
    const faces = [];
    for (let f = 0; f < 6; f++) {
      const c = document.createElement('canvas');
      c.width = c.height = 128;
      const x = c.getContext('2d');
      const gr = x.createLinearGradient(0, 0, 0, 128);
      gr.addColorStop(0, f === 2 ? '#ffffff' : '#dfe8f2');
      gr.addColorStop(1, f === 3 ? '#1a2230' : '#55606e');
      x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
      // 几块亮窗，让刻面闪光 a few bright windows so facets flash
      x.fillStyle = '#ffffff';
      const rnd = G.rng ? G.rng('env' + f) : Math.random;
      for (let i = 0; i < 5; i++) x.fillRect(rnd() * 100, rnd() * 100, 10 + rnd() * 26, 6 + rnd() * 18);
      faces.push(c);
    }
    gemEnvTex = new THREE.CubeTexture(faces);
    gemEnvTex.needsUpdate = true;
    return gemEnvTex;
  };

  G.setGemColor = (gemGroup, color) => {
    gemGroup.traverse((o) => o.material && o.material.color && o.material.color.set(color));
  };
  G.setGemEmissive = (gemGroup, color, k) => {
    gemGroup.traverse((o) => {
      if (o.material && o.material.emissive) {
        o.material.emissive.set(color || 0x000000);
        o.material.emissiveIntensity = k || 0;
      }
    });
  };

  // 光晕贴图 Glow sprite
  let glowTex = null;
  G.makeGlow = function (color, size) {
    if (!glowTex) {
      const c = document.createElement('canvas');
      c.width = c.height = 128;
      const x = c.getContext('2d');
      const gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
      gr.addColorStop(0, 'rgba(255,255,255,1)');
      gr.addColorStop(0.25, 'rgba(255,255,255,.5)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = gr;
      x.fillRect(0, 0, 128, 128);
      glowTex = new THREE.CanvasTexture(c);
    }
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    s.scale.set(size, size, 1);
    return s;
  };

  // 操作提示点贴图 Hotspot dot texture
  let dotTex = null;
  G._dotTex = function () {
    if (dotTex) return dotTex;
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const x = c.getContext('2d');
    x.fillStyle = 'rgba(255,209,102,.35)';
    x.beginPath(); x.arc(32, 32, 30, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#ffd166';
    x.beginPath(); x.arc(32, 32, 16, 0, Math.PI * 2); x.fill();
    x.strokeStyle = '#fff'; x.lineWidth = 4;
    x.beginPath(); x.arc(32, 32, 16, 0, Math.PI * 2); x.stroke();
    return (dotTex = new THREE.CanvasTexture(c));
  };

  // 画布贴图（显示屏、标签）Canvas texture for screens / labels
  G.canvasTexture = function (w, h, draw) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    const api = {
      tex, canvas: c,
      redraw: (...args) => { draw(c.getContext('2d'), w, h, ...args); tex.needsUpdate = true; },
    };
    api.redraw();
    return api;
  };

  // 平滑插值动画 Smooth move towards a target
  G.approach = (cur, target, k, dt) => cur + (target - cur) * (1 - Math.exp(-k * dt));

  /* ---------- 擦宝石（所有仪器共用）Wipe the stone (shared by every instrument) ----------
     按住擦布拖到宝石上来回擦。故意做得难一点：
     · 只有擦布在宝石上移动才算；
     · 越接近干净擦得越慢；
     · 必须来回擦够 NEED_STROKES 次，进度才能到 100%。
     Hold the cloth and rub it over the stone. Deliberately hard: only rubbing on the stone counts,
     progress slows as it gets cleaner, and it needs NEED_STROKES back-and-forth strokes. */
  G.smudgeTex = function (seed, w, h, round) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d'), rnd = G.rng(seed);
    if (round) { x.beginPath(); x.arc(w / 2, h / 2, w / 2, 0, Math.PI * 2); x.clip(); }
    for (let i = 0; i < 16; i++) {
      const cx = rnd() * w, cy = rnd() * h, r = 6 + rnd() * w * 0.14;
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, 'rgba(120,110,90,.6)'); g.addColorStop(1, 'rgba(120,110,90,0)');
      x.fillStyle = g; x.fillRect(0, 0, w, h);
    }
    x.strokeStyle = 'rgba(90,85,75,.5)'; x.lineWidth = 1.4;
    const fx = w * (0.3 + rnd() * 0.4), fy = h * (0.3 + rnd() * 0.4);
    for (let k = 1; k < 9; k++) { x.beginPath(); x.ellipse(fx, fy, k * w * 0.02, k * h * 0.03, 0.4, 0.3, Math.PI * 1.7); x.stroke(); }
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    return t;
  };

  let dirtTex = null;
  G.dirtOverlay = function (gemGroup) {
    const src = gemGroup && gemGroup.userData.mesh;
    if (!src) return null;
    if (!dirtTex) {
      // 明显一点的油污：一层灰膜 + 深色油斑 + 指纹 A clearly visible film: grey haze, dark grease spots, fingerprints
      const c = document.createElement('canvas');
      c.width = c.height = 256;
      const x = c.getContext('2d'), rnd = G.rng('dirt');
      x.fillStyle = 'rgba(150,140,120,.35)'; x.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 26; i++) {
        const cx = rnd() * 256, cy = rnd() * 256, r = 10 + rnd() * 34;
        const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, 'rgba(85,75,55,.85)'); g.addColorStop(1, 'rgba(85,75,55,0)');
        x.fillStyle = g; x.fillRect(0, 0, 256, 256);
      }
      x.strokeStyle = 'rgba(70,62,50,.75)'; x.lineWidth = 2.6;
      [[0.38, 0.42], [0.66, 0.6]].forEach(([u, w]) => {
        for (let k = 1; k < 10; k++) { x.beginPath(); x.ellipse(256 * u, 256 * w, k * 5, k * 7.5, 0.5, 0.2, Math.PI * 1.75); x.stroke(); }
      });
      dirtTex = new THREE.CanvasTexture(c);
      dirtTex.encoding = THREE.sRGBEncoding;
    }
    const geo = src.geometry.clone();
    const pos = geo.attributes.position, uv = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) { uv[i * 2] = pos.getX(i) + 0.5; uv[i * 2 + 1] = pos.getZ(i) + 0.5; }
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      map: dirtTex, transparent: true, depthWrite: false, side: THREE.FrontSide,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    }));
    m.scale.setScalar(1.003);
    m.renderOrder = 3;
    m.castShadow = m.receiveShadow = false;
    m.userData.noPick = true;
    src.add(m); // 跟着宝石一起转 turns with the stone
    return m;
  };

  G.addWipe = function (v, { getGem, getGems, home, ndc = [-0.6, -0.6], needStrokes = 16, needPx = 3200 }) {
    // getGems：好几颗宝石时，每一颗都是脏的，擦哪一颗都算 several stones: every one is dirty, rubbing any of them counts
    const allGems = () => (getGems ? getGems() : [getGem()]).filter(Boolean);
    // 擦布放在画面左下方那块表面上（桌面或底座顶面）Put the cloth on whatever surface sits at the lower-left of the view
    let HOME = home ? new THREE.Vector3(...home) : null;
    if (!HOME) {
      v.scene.updateMatrixWorld();
      const rc = new THREE.Raycaster();
      rc.setFromCamera(new THREE.Vector2(ndc[0], ndc[1]), v.camera);
      const hit = rc.intersectObjects(v.scene.children, true).find((h) => h.object.isMesh && h.face && h.object.material && h.object.material.visible !== false && !h.object.material.transparent &&
        h.face.normal.clone().transformDirection(h.object.matrixWorld).y > 0.7);
      HOME = hit ? hit.point.clone().add(new THREE.Vector3(0, 0.005, 0)) : rc.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), new THREE.Vector3()) || new THREE.Vector3(-1.5, 0, 1.5);
    }
    const cloth = G.group(
      G.rbox(0.62, 0.05, 0.46, 0.08, G.mat(0x8fc9e8, { roughness: 1 }), [0, 0.025, 0], [-Math.PI / 2, 0, 0]),
      G.rbox(0.5, 0.04, 0.36, 0.07, G.mat(0x7dbbe0, { roughness: 1 }), [0.04, 0.07, -0.02], [-Math.PI / 2, 0, 0.2])
    );
    cloth.position.copy(HOME);
    v.add(cloth);
    v.addPart(cloth, { zh: '擦布（超细纤维）', en: 'Cleaning cloth (microfibre)', dzh: '观察或测试前先把宝石擦干净：油污和指纹会让内含物、读数和颜色都看不准。', den: 'Wipe the stone before any test: grease and fingerprints spoil inclusions, readings and colour.' });

    const dirts = new Map(); // 每颗宝石上的污渍 smudges on each stone

    const hud = document.createElement('div');
    hud.className = 'clean-hud hidden';
    v.el.appendChild(hud);

    const st = { k: 0, strokes: 0, px: 0, dragging: false, dir: 0, run: 0, lastXY: null };
    const done = () => st.k >= 1;
    const bar = (k) => `<span class="pbar"><i style="width:${Math.round(k * 100)}%"></i></span>`;
    function drawHud() {
      hud.classList.toggle('hidden', done() || (!st.dragging && st.k === 0));
      hud.innerHTML = '🧻 ' + G.T('擦宝石', 'Wiping the stone') + ` ${bar(st.k)} ${Math.round(st.k * 100)}%` +
        ' · ' + G.T('来回', 'Strokes', 'จำนวนครั้ง') + ` ${Math.min(st.strokes, needStrokes)}/${needStrokes}`;
    }

    // 宝石在屏幕上的中心和半径 Stone centre and radius on screen
    const box = new THREE.Box3(), sph = new THREE.Sphere(), c3 = new THREE.Vector3(), e3 = new THREE.Vector3();
    // 鼠标附近的那颗宝石 The stone nearest the pointer
    function gemScreen(e) {
      let best = null;
      allGems().forEach((g) => {
        const s = screenOf(g);
        const d = e ? Math.hypot(e.clientX - s.cx, e.clientY - s.cy) / s.rp : 0;
        if (!best || d < best.d) best = Object.assign(s, { d });
      });
      return best;
    }
    function screenOf(g) {
      box.setFromObject(g).getBoundingSphere(sph);
      const r = v.renderer.domElement.getBoundingClientRect();
      c3.copy(sph.center).project(v.camera);
      e3.setFromMatrixColumn(v.camera.matrixWorld, 0).multiplyScalar(sph.radius).add(sph.center).project(v.camera);
      const cx = r.left + ((c3.x + 1) / 2) * r.width, cy = r.top + ((1 - c3.y) / 2) * r.height;
      const ex = r.left + ((e3.x + 1) / 2) * r.width;
      return { cx, cy, rp: Math.max(14, Math.abs(ex - cx)), center: sph.center.clone(), radius: sph.radius };
    }

    v.tick((dt) => {
      // 每颗宝石都贴上污渍；换掉的宝石把污渍收走 Every stone gets smudges; stones that are gone lose theirs
      const list = allGems();
      list.forEach((g) => { if (!dirts.has(g)) dirts.set(g, G.dirtOverlay(g)); });
      dirts.forEach((d, g) => {
        if (!list.includes(g)) { if (d && d.parent) d.parent.remove(d); dirts.delete(g); return; }
        if (d) { d.visible = !done(); d.material.opacity = 1 - st.k; }
      });
      if (!st.dragging) cloth.position.lerp(HOME, 1 - Math.exp(-6 * dt));
    });

    v.addControl(cloth, {
      get hint() { return done() ? ['宝石已经擦干净了', 'The stone is already clean'] : ['按住拖到宝石上，来回用力擦', 'Hold and drag onto the stone, then rub back and forth']; },
      markerIf: () => !done(),
      onClick: () => v.say(...(done() ? ['宝石已经擦干净了', 'The stone is already clean'] : ['按住擦布不放，拖到宝石上来回擦', 'Hold the cloth and rub it back and forth over the stone'])),
      onDragStart: () => { st.dragging = true; st.lastXY = null; st.dir = 0; st.run = 0; drawHud(); },
      onDrag: (dx, dy, e) => {
        const s = gemScreen(e);
        if (!s) return;
        const over = s.d < 1.5;
        // 擦布跟着鼠标：在宝石上就盖在宝石前面 The cloth follows the pointer, in front of the stone when over it
        if (over) {
          const toCam = v.camera.position.clone().sub(s.center).normalize();
          const p = v.rayOnPlane(s.center.clone().addScaledVector(toCam, s.radius * 1.2).toArray(), toCam.toArray());
          if (p) cloth.position.copy(p);
        } else {
          const p = v.rayOnPlane([0, s.center.y, 0], [0, 1, 0]);
          if (p && p.distanceTo(v.camera.position) < 40) cloth.position.copy(p);
        }
        if (!over || done()) return;
        // 来回次数：主要移动方向反转一次算一下 A stroke = the main direction reverses after a decent run
        const main = Math.abs(dx) >= Math.abs(dy) ? dx : dy;
        const sg = Math.sign(main);
        if (sg && st.dir && sg !== st.dir && st.run > 18) { st.strokes++; st.run = 0; }
        if (sg) { if (sg !== st.dir) st.run = 0; st.dir = sg; }
        const len = Math.min(Math.hypot(dx, dy), 60);
        st.run += len;
        st.px += len;
        // 越干净越难擦；进度不能超过来回次数允许的上限 Slower near the end; capped by the strokes done
        const gain = (len / needPx) * (1.4 - 0.9 * st.k);
        st.k = Math.min(1, st.k + gain, st.strokes / needStrokes);
        drawHud();
        if (done()) { st.dragging = false; drawHud(); v.say('✨ 宝石擦干净了！', '✨ The stone is clean!'); }
      },
      onDragEnd: () => {
        st.dragging = false;
        drawHud();
        const n = Math.min(st.strokes, needStrokes) + '/' + needStrokes;
        if (!done() && st.px > 0) v.say(st.strokes < needStrokes ? G.T('还要多来回擦几下（' + n + '）', 'More strokes needed (' + n + ')', 'ต้องถูไปมาอีก (' + n + ')') : G.T('还没擦干净，继续擦', 'Not clean yet: keep rubbing'));
      },
    });

    const api = {
      cloth, done,
      reset: () => { Object.assign(st, { k: 0, strokes: 0, px: 0, dragging: false, dir: 0, run: 0 }); drawHud(); },
      finish: () => { st.k = 1; st.strokes = needStrokes; drawHud(); },
      // 指引里的第一步 First guide step
      step: () => ({
        t: ['先把宝石擦干净', 'First wipe the stone clean'],
        how: ['按住擦布，拖到宝石上来回用力擦，直到上方进度条到 100%（要来回擦很多下）', 'Hold the cloth, drag it onto the stone and rub back and forth until the bar above reaches 100% (it takes many strokes)'],
        target: cloth, done, act: () => api.finish(),
      }),
    };
    drawHud();
    return api;
  };

  /* ---------- 自由模式的“破坏”沙盒 Free-mode sandbox: things can break ----------
     drop(obj)：把零件从原来的位置拆下，按重力掉落、弹跳、停在表面上
     repair：一键恢复所有掉下来的零件，并调用各页面自己的修复函数
     drop(obj): detach a part and let it fall, bounce and settle; repair puts everything back */
  G.sandbox = function (v, { surfaces } = {}) {
    const falling = [], saved = new Map(), fixers = [];
    const rc = new THREE.Raycaster();
    const down = new THREE.Vector3(0, -1, 0);
    let broken = false;

    const btn = document.createElement('button');
    btn.className = 'repair-btn hidden';
    btn.type = 'button';
    const drawBtn = () => (btn.innerHTML = '🔧 ' + G.T('一键修复', 'Repair everything'));
    drawBtn();
    G.onLang(drawBtn);
    v.el.appendChild(btn);
    const showBtn = () => btn.classList.toggle('hidden', !(broken && G.isFree()));

    const api = {
      get broken() { return broken; },
      setBroken() { broken = true; showBtn(); },
      fixed() { broken = false; showBtn(); },
      dropped: () => saved.size,
      // 让零件掉下来；pickup 时可以从地上捡起来装回去 Let a part fall off; with pickup it can be picked up and refitted
      drop(obj, { vel = [0, 0.6, 0], spin = [2, 1, 3], pickup } = {}) {
        if (!saved.has(obj)) saved.set(obj, { parent: obj.parent, pos: obj.position.clone(), quat: obj.quaternion.clone(), scale: obj.scale.clone() });
        v.scene.attach(obj); // 保持世界位置 keep the world pose
        const bb = new THREE.Box3().setFromObject(obj);
        falling.push({ obj, vel: new THREE.Vector3(...vel), spin: new THREE.Vector3(...spin), half: Math.max(0.03, (bb.max.y - bb.min.y) / 2), rest: false });
        if (pickup) makePickable(obj, pickup);
        api.setBroken();
      },
      onRepair(fn) { fixers.push(fn); },
      // 零件被替换掉了（比如换了宝石），修复时不再放回 The part was replaced (e.g. new stone): do not put it back
      forget(obj) { saved.delete(obj); const i = falling.findIndex((f) => f.obj === obj); if (i >= 0) falling.splice(i, 1); },
      repair() {
        falling.length = 0;
        saved.forEach((s, obj) => {
          s.parent.add(obj); obj.position.copy(s.pos); obj.quaternion.copy(s.quat); obj.scale.copy(s.scale);
          if (obj.userData.pickOpt) { delete obj.userData.control; obj.userData.pickOpt.enabled = false; }
        });
        saved.clear();
        fixers.forEach((fn) => fn());
        broken = false;
        showBtn();
        v.say('🔧 ' + G.T('全部修好了', 'All repaired'));
      },
    };
    btn.onclick = () => api.repair();

    // 捡起来：按住拖回原来的位置附近松手就装回去，否则又掉下去
    // Pick up: drag it back near where it belongs and let go to refit it; anywhere else it falls again
    const homeOf = (obj) => { const s = saved.get(obj); return s ? s.parent.localToWorld(s.pos.clone()) : null; };
    function makePickable(obj, { hint, fitR = 0.6, onFit, onLand }) {
      if (!obj.userData.pickOpt) {
        const opt = {
          hint: hint || ['按住捡起来，拖回原来的位置装上', 'Pick it up and drag it back into place'],
          spin: false,
          onDragStart: () => { const i = falling.findIndex((f) => f.obj === obj); if (i >= 0) falling.splice(i, 1); },
          onDrag: () => {
            const n = new THREE.Vector3();
            v.camera.getWorldDirection(n);
            const p = v.rayOnPlane(obj.position.toArray(), n.toArray());
            if (p) obj.position.copy(p);
          },
          onDragEnd: () => {
            const home = homeOf(obj);
            if (home && obj.position.distanceTo(home) < fitR) {
              const s = saved.get(obj);
              s.parent.add(obj); obj.position.copy(s.pos); obj.quaternion.copy(s.quat); obj.scale.copy(s.scale);
              saved.delete(obj);
              delete obj.userData.control; // 装好后恢复原来的操作 back to its normal control once fitted
              opt.enabled = false;
              if (opt.onFit) opt.onFit(obj);
            } else {
              const bb = new THREE.Box3().setFromObject(obj);
              falling.push({ obj, vel: new THREE.Vector3(), spin: new THREE.Vector3(1, 0.5, 1), half: Math.max(0.03, (bb.max.y - bb.min.y) / 2), rest: false, y0: obj.position.y, onLand: opt.onLand });
            }
          },
          onFit, onLand,
        };
        obj.userData.pickOpt = opt;
        v.addControl(obj, opt);
      }
      const opt = obj.userData.pickOpt;
      opt.enabled = true;
      opt.onFit = onFit || opt.onFit;
      obj.userData.control = opt;
    }
    // 回到指引模式时自动修好 Switching back to guided mode repairs everything
    G.onMode(() => { if (!G.isFree() && broken) api.repair(); showBtn(); });

    // 简单的重力与弹跳 Simple gravity and bouncing
    v.tick((dt) => {
      falling.forEach((f) => {
        if (f.rest) return;
        f.vel.y -= 9.8 * dt * 0.6;
        f.obj.position.addScaledVector(f.vel, dt);
        f.obj.rotation.x += f.spin.x * dt; f.obj.rotation.y += f.spin.y * dt; f.obj.rotation.z += f.spin.z * dt;
        const list = (surfaces ? surfaces() : []).filter((s) => s && s !== f.obj);
        rc.set(f.obj.position.clone().add(new THREE.Vector3(0, 0.5, 0)), down);
        const hit = list.length ? rc.intersectObjects(list, true).find((h) => { for (let o = h.object; o; o = o.parent) if (o === f.obj) return false; return true; }) : null;
        const ground = hit ? hit.point.y : 0;
        if (f.obj.position.y - f.half <= ground && f.vel.y < 0) {
          if (f.onLand && !f.landed) { f.landed = true; if (f.onLand(f.y0 - ground - f.half) === 'gone') { f.rest = true; return; } }
          f.obj.position.y = ground + f.half;
          f.vel.y = -f.vel.y * 0.35;
          f.vel.x *= 0.6; f.vel.z *= 0.6;
          f.spin.multiplyScalar(0.5);
          if (Math.abs(f.vel.y) < 0.25) { f.rest = true; f.obj.rotation.x = Math.round(f.obj.rotation.x / (Math.PI / 2)) * (Math.PI / 2); f.obj.rotation.z = Math.round(f.obj.rotation.z / (Math.PI / 2)) * (Math.PI / 2); }
        }
      });
    });
    return api;
  };

  // 画面震一下（撞击）Shake the view (impact)
  G.shake = function (v, power = 0.08, time = 0.4) {
    let t = 0;
    const base = v.camera.position.clone();
    v.tick((dt) => {
      if (t >= time) return;
      t += dt;
      const k = power * (1 - t / time);
      v.camera.position.set(base.x + (Math.random() - 0.5) * k, base.y + (Math.random() - 0.5) * k, base.z + (Math.random() - 0.5) * k);
      if (t >= time) v.camera.position.copy(base);
    });
  };

  /* ---------- 宝石摔碎：碎片四溅 + 金币损失 + 换一颗新的 ----------
     A stone shatters: shards fly, a coin pop-up shows the loss, then a new stone appears */
  G.loss = (() => { try { return +localStorage.getItem('gemlab-loss') || 0; } catch (e) { return 0; } })();
  G.shatterGem = function (v, obj, gem, onDone) {
    if (!obj) return;
    const sph = new THREE.Box3().setFromObject(obj).getBoundingSphere(new THREE.Sphere());
    const at = sph.center.clone(), floorY = at.y - sph.radius;
    obj.visible = false;
    // 碎片 Shards
    const mat = new THREE.MeshPhongMaterial({ color: gem.color || 0xffffff, flatShading: true, shininess: 160, specular: 0xffffff, transparent: true, opacity: 0.92 });
    const bits = [];
    for (let i = 0; i < 16; i++) {
      const m = new THREE.Mesh(new THREE.TetrahedronGeometry(sph.radius * (0.18 + Math.random() * 0.25)), mat);
      m.position.copy(at);
      v.add(m);
      const a = Math.random() * Math.PI * 2;
      bits.push({ m, vel: new THREE.Vector3(Math.cos(a) * (0.6 + Math.random()), 1 + Math.random() * 1.5, Math.sin(a) * (0.6 + Math.random())), spin: Math.random() * 10 });
    }
    const flash = G.makeGlow(0xffffff, sph.radius * 6);
    flash.position.copy(at);
    v.add(flash);
    G.shake(v, 0.05, 0.25);
    let t = 0;
    v.tick((dt) => {
      if (t > 3) return;
      t += dt;
      flash.material.opacity = Math.max(0, 1 - t * 4);
      bits.forEach((b) => {
        b.vel.y -= 6 * dt;
        b.m.position.addScaledVector(b.vel, dt);
        if (b.m.position.y < floorY) { b.m.position.y = floorY; b.vel.multiplyScalar(0.3); b.vel.y = Math.abs(b.vel.y) * 0.3; }
        b.m.rotation.x += b.spin * dt; b.m.rotation.y += b.spin * dt;
      });
      if (t > 2) mat.opacity = Math.max(0, 0.92 * (3 - t));
      if (t > 3) { bits.forEach((b) => v.scene.remove(b.m)); v.scene.remove(flash); }
    });
    // 金币损失 Coin loss pop-up
    const price = gem.price || 0;
    G.loss += price;
    try { localStorage.setItem('gemlab-loss', String(G.loss)); } catch (e) { /* 忽略 ignore */ }
    const r = v.renderer.domElement.getBoundingClientRect(), wr = v.el.getBoundingClientRect();
    const q = at.clone().project(v.camera);
    const pop = document.createElement('div');
    pop.className = 'coin-pop';
    pop.innerHTML = `<div class="cp-coin">🪙 -${price.toLocaleString()}</div><div class="cp-name">${G.T(gem.zh + ' 摔碎了！', gem.en + ' shattered!', G.th(gem.en) + ' แตกแล้ว!')}</div>`;
    pop.style.left = ((q.x + 1) / 2) * r.width + (r.left - wr.left) + 'px';
    pop.style.top = ((1 - q.y) / 2) * r.height + (r.top - wr.top) + 'px';
    v.el.appendChild(pop);
    setTimeout(() => pop.remove(), 2600);
    G.drawLoss(v);
    v.say('💔 ' + G.T('没拿稳，宝石掉下去摔碎了！', 'You dropped it: the stone shattered!'));
    // 稍后换一颗新的 A new stone appears shortly
    setTimeout(() => { if (onDone) onDone(); }, 1100);
  };
  // 累计损失 Running total of losses
  G.drawLoss = function (v) {
    let b = v.el.querySelector('.loss-badge');
    if (!b) { b = document.createElement('div'); b.className = 'loss-badge'; v.el.appendChild(b); G.onLang(() => G.drawLoss(v)); }
    b.classList.toggle('hidden', !G.loss);
    b.innerHTML = '💸 ' + G.T('累计损失', 'Total lost') + ' 🪙 -' + G.loss.toLocaleString();
  };
  // 新宝石“弹”出来 A new stone pops in
  G.popIn = function (v, obj) {
    if (!obj) return;
    const s0 = obj.scale.clone();
    obj.scale.setScalar(0.001);
    const glow = G.makeGlow(0xfff6c0, 1.2);
    glow.position.copy(obj.position);
    (obj.parent || v.scene).add(glow);
    let t = 0;
    v.tick((dt) => {
      if (t > 0.6) return;
      t += dt;
      const k = Math.min(1, t / 0.45), e = 1 + 2.2 * Math.pow(k - 1, 3) + 1.2 * Math.pow(k - 1, 2); // 回弹 overshoot
      obj.scale.copy(s0).multiplyScalar(Math.max(0.001, e));
      glow.material.opacity = Math.max(0, 1 - t / 0.6);
      if (t > 0.6) { obj.scale.copy(s0); glow.parent && glow.parent.remove(glow); }
    });
    v.say('✨ ' + G.T('换上了一颗新的宝石', 'Here is a new stone'));
  };
})();
