/* 3D 查看器与建模工具（基于 Three.js r147，全局 THREE）
   3D viewer and modelling helpers (Three.js r147, global THREE) */
(function () {
  const G = (window.GemLab = window.GemLab || {});

  class Viewer {
    constructor(el, opt = {}) {
      this.el = el;
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

      this.hemi = new THREE.HemisphereLight(0xe2ebff, 0x2a3242, 0.8);
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
          new THREE.MeshStandardMaterial({ color: 0x1f2a3c, roughness: 0.95, metalness: 0 })
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

    _initPick() {
      const ray = new THREE.Raycaster();
      const v = new THREE.Vector2();
      let down = null;
      const dom = this.renderer.domElement;
      dom.addEventListener('pointerdown', (e) => (down = [e.clientX, e.clientY]));
      dom.addEventListener('pointerup', (e) => {
        if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return;
        const rect = dom.getBoundingClientRect();
        v.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
        ray.setFromCamera(v, this.camera);
        const hits = ray.intersectObjects(this.scene.children, true);
        for (const h of hits) {
          let o = h.object;
          if (!o.visible) continue;
          while (o && !o.userData.part) o = o.parent;
          if (o) {
            this.highlight(o);
            (this.onPick || G.showPartCard)(o.userData.part, o);
            return;
          }
        }
        this.highlight(null);
        G.showPartCard(null);
      });
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
      const pts = [
        new THREE.Vector2(0.001, -0.43), new THREE.Vector2(0.5, -0.02), new THREE.Vector2(0.5, 0.03),
        new THREE.Vector2(0.34, 0.17), new THREE.Vector2(0.001, 0.17),
      ];
      const geo = new THREE.LatheGeometry(pts, 16);
      const m = new THREE.MeshPhongMaterial({
        color: gem.color, specular: 0xffffff, shininess: 160, flatShading: true, transparent: true,
        opacity: gem.id === 'diamond' ? 0.92 : 0.86, side: THREE.DoubleSide,
      });
      mesh = new THREE.Mesh(geo, m);
      g.userData.bottom = -0.43;
    }
    mesh.castShadow = true;
    g.add(mesh);
    g.userData.mesh = mesh;
    g.scale.setScalar(size);
    return g;
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
})();
