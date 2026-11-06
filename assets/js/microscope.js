/* 宝石显微镜 Gem microscope */
(function () {
  const G = GemLab, T = G.T;
  G.buildHeader('microscope');
  G.initTabs();

  /* ================= 3D 模型 Model ================= */
  const v = (G.viewer = new G.Viewer(G.$('#viewer'), { cam: [-4.6, 4.3, 7.4], target: [0, 2.15, 0], minD: 3, maxD: 18 }));
  // 参照常见宝石显微镜（白色机身 + 黑色载物盘）建模 Modelled on a typical white gem microscope
  const white = G.mat(0xeeeeea, { roughness: 0.38, metalness: 0.05 });
  const black = G.mat(0x16171a, { roughness: 0.45, metalness: 0.15 });
  const blackGloss = G.mat(0x0e0f11, { roughness: 0.25, metalness: 0.2 });
  const chrome = G.mat(0xc9ced6, { roughness: 0.22, metalness: 0.9 });
  const brass = G.mat(0xc9a14a, { roughness: 0.3, metalness: 0.9 });
  const rubber = G.mat(0x0c0d0f, { roughness: 0.95 });
  const dark = black;

  /* ---------- 底座：白色机身，前下沿斜切 Base: white body with a chamfered lower front ---------- */
  const base = new THREE.Group();
  const prof = new THREE.Shape();
  [[1.5, 0], [1.3, 0.32], [1.3, 0.84], [1.24, 0.9], [-1.42, 0.9], [-1.48, 0.84], [-1.48, 0]].forEach(([z, y], i) => (i ? prof.lineTo(z, y) : prof.moveTo(z, y)));
  const hGeo = new THREE.ExtrudeGeometry(prof, { depth: 3.0, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 3 });
  hGeo.translate(0, 0, -1.5);
  base.add(G.mesh(hGeo, white, [0, 0, 0], [0, -Math.PI / 2, 0]));
  [[-1.4, 1.3], [1.4, 1.3], [-1.4, -1.3], [1.4, -1.3]].forEach(([x, z]) => base.add(G.cyl(0.1, 0.12, 0.04, rubber, [x, -0.01, z])));
  // 斜面上的型号铭牌 Model label on the chamfer
  const label = G.canvasTexture(512, 96, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#6b6f76';
    ctx.font = '600 30px Helvetica, Arial, sans-serif';
    ctx.fillText('Gem Microscope', 12, 40);
    ctx.font = '26px Helvetica, Arial, sans-serif';
    ctx.fillText('Model GM-3D', 12, 78);
  });
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.19), new THREE.MeshBasicMaterial({ map: label.tex, transparent: true }));
  plate.position.set(-0.85, 0.16 + 0.555 * 0.03, 1.4 + 0.832 * 0.03);
  plate.rotation.x = -0.588;
  base.add(plate);
  // 左侧电源插座与电线 Power socket and cord on the left side
  base.add(G.box(0.04, 0.16, 0.22, black, [-1.64, 0.5, 0.9]));
  base.add(G.mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.66, 0.5, 0.9), new THREE.Vector3(-1.95, 0.45, 0.95), new THREE.Vector3(-2.2, 0.06, 1.2), new THREE.Vector3(-2.6, 0.04, 2.0),
  ]), 30, 0.035, 8), rubber));
  v.add(base);
  v.addPart(base, { zh: '底座与光源', en: 'Base & light source', dzh: '白色机身内装卤素灯，从下方照亮宝石；正面有电源开关、调光旋钮，斜面是型号铭牌。', den: 'The white body holds a halogen lamp that lights the stone from below; the front carries the power switch and dimmer, the chamfer the model label.' });

  // 正面：船形电源开关 Front: rocker power switch
  const powerSw = new THREE.Group();
  powerSw.add(G.box(0.42, 0.24, 0.05, black, [0, 0, 0]));
  const rocker = G.box(0.32, 0.15, 0.06, G.mat(0x222326, { roughness: 0.5 }), [0, 0, 0.03]);
  powerSw.add(rocker);
  const ledMat = new THREE.MeshStandardMaterial({ color: 0x441111, emissive: 0xff3b30, emissiveIntensity: 0 });
  powerSw.add(G.box(0.04, 0.08, 0.02, ledMat, [-0.09, 0, 0.065]));
  powerSw.position.set(-0.85, 0.6, 1.33);
  v.add(powerSw);
  v.addPart(powerSw, { zh: '电源开关', en: 'Power switch', dzh: '船形开关：I = 开，O = 关。打开后开关上的红灯亮起。', den: 'Rocker switch: I = on, O = off. The red mark lights when it is on.' });

  // 正面：调光旋钮 Front: dimmer knob
  const dimmer = G.knob(0.13, 0.2, blackGloss, [-0.25, 0.6, 1.4], [Math.PI / 2, 0, 0]);
  dimmer.add(G.cyl(0.05, 0.05, 0.02, chrome, [0, 0.11, 0]));
  dimmer.rotation.order = 'XZY'; // 先绕自身轴转，再朝前 spin about its own axis first, then face forward
  v.add(dimmer);
  v.addPart(dimmer, { zh: '调光旋钮', en: 'Dimmer knob', dzh: '调节底部光源的亮度。', den: 'Sets the brightness of the lamp under the stage.' });

  // 前上沿：黄铜推拉钮（暗域 / 亮域）Brass push-pull knob (dark / bright field)
  const dfLever = G.group(G.cyl(0.03, 0.03, 0.2, brass, [0, 0, 0], [Math.PI / 2, 0, 0]), G.cyl(0.07, 0.07, 0.1, brass, [0, 0, 0.12], [Math.PI / 2, 0, 0]));
  dfLever.position.set(0.95, 0.72, 1.3);
  v.add(dfLever);
  v.addPart(dfLever, { zh: '暗域 / 亮域推拉钮', en: 'Dark / bright-field knob', dzh: '推进 = 暗域（中心挡光片挡住直射光，光从反射罩斜射进宝石）；拉出 = 亮域。', den: 'Pushed in = darkfield (a central stop blocks direct light; the reflector sends it in from the sides); pulled out = brightfield.' });

  /* ---------- 黑色载物盘与光井 Black stage disc & light well ---------- */
  const stageDisc = G.cyl(1.0, 1.0, 0.05, blackGloss, [0.05, 0.925, 0.25], null, 64);
  v.add(stageDisc);

  const IN = 0.36; // 光井内径 inner radius of the well
  const well = new THREE.Group();
  well.position.set(0, 1.07, 0.3);
  const ringWall = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.5, 0.12, 48, 1, true), black);
  ringWall.position.y = -0.06;
  ringWall.castShadow = true;
  well.add(ringWall);
  const cap = new THREE.Mesh(new THREE.RingGeometry(IN + 0.02, 0.48, 48), black);
  cap.rotation.x = -Math.PI / 2;
  well.add(cap);
  well.add(G.torus(IN + 0.02, 0.018, black, [0, 0.005, 0], [Math.PI / 2, 0, 0]));
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(IN, IN, 0.12, 40, 1, true), G.mat(0x08090a, { side: THREE.BackSide, roughness: 1 }));
  inner.position.y = -0.06;
  well.add(inner);
  // 暗域反射罩 darkfield reflector
  const reflMat = G.mat(0xd8dde4, { roughness: 0.15, metalness: 1, side: THREE.DoubleSide, emissive: 0xfff1cc, emissiveIntensity: 0 });
  const reflector = new THREE.Mesh(new THREE.CylinderGeometry(IN - 0.01, 0.16, 0.09, 40, 1, true), reflMat);
  reflector.position.y = -0.07;
  well.add(reflector);
  // 灯上方的散射玻璃 diffuser over the lamp
  const lightMat = new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0xfff1cc, emissiveIntensity: 0 });
  well.add(G.cyl(0.16, 0.16, 0.01, lightMat, [0, -0.115, 0]));
  // 中心挡光片（暗域时出现）central darkfield stop on a glass disc
  const stop = G.group(G.cyl(0.13, 0.13, 0.01, black, [0, -0.03, 0]), G.cyl(IN, IN, 0.006, G.glassMat(0xffffff, 0.12), [0, -0.035, 0]));
  well.add(stop);
  // 虹膜光阑 iris diaphragm
  const leafMat = G.mat(0x1c1e22, { roughness: 0.5, metalness: 0.5 });
  const irisRing = new THREE.Mesh(new THREE.RingGeometry(0.2, IN, 48, 1), leafMat);
  irisRing.material.side = THREE.DoubleSide;
  irisRing.rotation.x = -Math.PI / 2;
  irisRing.position.y = -0.012;
  well.add(irisRing);
  const seams = new THREE.Group();
  seams.position.y = -0.008;
  well.add(seams);
  let irisR = -1;
  function setIris(r) {
    if (Math.abs(r - irisR) < 0.002) return;
    irisR = r;
    irisRing.geometry.dispose();
    irisRing.geometry = new THREE.RingGeometry(r, IN, 48, 1);
    seams.clear();
    const segMat = G.mat(0x3a3e45, { metalness: 0.6, roughness: 0.4 });
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      // 叶片接缝 leaf seams from the aperture edge to the rim
      seams.add(G.rod([Math.cos(a) * r, 0, Math.sin(a) * r], [Math.cos(a + 0.9) * (IN - 0.01), 0, Math.sin(a + 0.9) * (IN - 0.01)], 0.005, segMat));
    }
  }
  const irisLever = G.group(G.box(0.16, 0.03, 0.04, black, [0.08, 0, 0]), G.sph(0.04, black, [0.17, 0, 0]));
  irisLever.position.y = -0.02;
  well.add(irisLever);
  v.add(well);
  v.addPart(well, { zh: '光井：反射罩与光阑', en: 'Light well: reflector & iris', dzh: '黑色载物盘中央凸起的圆环。里面是暗域反射罩和中心挡光片；一圈叶片是虹膜光阑，侧面的小杆可改变通光孔大小。', den: 'The raised ring in the black stage. Inside are the darkfield reflector and central stop; the leaves form the iris, set by the small side lever.' });

  // 光束 Light beams
  const beamMat = new THREE.MeshBasicMaterial({ color: 0xfff3d0, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const beamBright = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 0.36, 32, 1, true), beamMat);
  beamBright.position.set(0, 1.25, 0.3);
  const beamDark = new THREE.Mesh(new THREE.CylinderGeometry(0.06, IN, 0.36, 32, 1, true), beamMat.clone());
  beamDark.position.copy(beamBright.position);
  const wellLight = new THREE.PointLight(0xfff1cc, 0, 2.5);
  wellLight.position.set(0, 1.15, 0.3);
  v.add(beamBright, beamDark, wellLight);

  /* ---------- 宝石夹：载物盘侧面立柱 + 水平弹簧镊子 Stone holder: side post + horizontal tweezers ---------- */
  const STONE = new THREE.Vector3(0, 1.45, 0.3); // 宝石中心（腰棱高度）stone centre at girdle height
  const holder = new THREE.Group();
  holder.add(G.cyl(0.09, 0.11, 0.06, black, [0.78, 0.98, 0.3]));          // 底座 foot on the stage
  holder.add(G.cyl(0.035, 0.035, 0.5, chrome, [0.78, 1.22, 0.3]));        // 立柱 post
  holder.add(G.box(0.12, 0.12, 0.12, black, [0.78, 1.45, 0.3]));          // 夹座 clamp block
  holder.add(G.knob(0.055, 0.07, black, [0.78, 1.45, 0.4], [Math.PI / 2, 0, 0])); // 锁紧旋钮 lock knob
  holder.add(G.cyl(0.03, 0.03, 0.16, chrome, [0.66, 1.45, 0.3], [0, 0, Math.PI / 2])); // 转轴 spindle
  // 镊子：绕自身长轴（x 轴）转动，宝石跟着翻转 Tweezers turn about their long (x) axis; the stone rolls with them
  const tweezers = new THREE.Group();
  tweezers.position.copy(STONE);
  holder.add(tweezers);
  const GR = 0.21; // 腰棱半径 girdle radius (0.5 × 0.42)
  tweezers.add(G.cyl(0.035, 0.035, 0.1, black, [0.56, 0, 0], [0, 0, Math.PI / 2]));       // 手柄端 handle end
  [-1, 1].forEach((sgn) => {
    const pts = [[0.56, 0, 0], [0.32, 0, sgn * 0.12], [0.1, 0, sgn * (GR + 0.05)], [0.02, 0, sgn * (GR + 0.012)]];
    tweezers.add(G.rod(pts[0], pts[1], 0.018, chrome));
    tweezers.add(G.rod(pts[1], pts[2], 0.016, chrome));
    tweezers.add(G.rod(pts[2], pts[3], 0.013, chrome));
    tweezers.add(G.box(0.05, 0.035, 0.012, chrome, [0.0, 0, sgn * (GR + 0.008)]));        // 夹嘴贴着腰棱 jaw on the girdle
  });
  tweezers.add(G.torus(0.035, 0.008, black, [0.44, 0, 0], [0, Math.PI / 2, 0]));        // 滑动锁环 sliding lock ring
  // 整个宝石夹绕宝石中心的竖直轴转动（只在水平面内）Whole holder turns about a vertical axis through the stone (horizontal plane only)
  const holderPivot = new THREE.Group();
  holderPivot.position.set(STONE.x, 0, STONE.z);
  holder.position.set(-STONE.x, 0, -STONE.z);
  holderPivot.add(holder);
  v.add(holderPivot);
  v.addPart(holder, { zh: '宝石夹', en: 'Stone holder (tweezers)', dzh: '立在载物盘侧面，水平的弹簧镊子从前后两侧夹住宝石腰棱；左右拖动可以让宝石在水平面内转动，从不同方向观察。', den: 'Stands at the side of the stage; horizontal spring tweezers grip the girdle from front and back. Drag sideways to turn the stone in the horizontal plane and view it from other sides.' });

  /* ---------- 白色立柱与调焦旋钮 White column & focus knobs ---------- */
  const pillar = new THREE.Group();
  pillar.add(G.rbox(0.72, 2.5, 0.62, 0.18, white, [0, 2.1, -1.1]));
  pillar.add(G.box(0.08, 2.2, 0.03, G.mat(0xd8d8d3), [0, 2.1, -0.78])); // 正面导轨 front slide
  v.add(pillar);
  v.addPart(pillar, { zh: '立柱', en: 'Column', dzh: '白色立柱支撑镜臂；镜臂通过内部齿轮齿条沿立柱升降调焦。', den: 'The white column carries the arm, which moves up and down on an internal rack to focus.' });

  // 黑边白心的大调焦旋钮 Large focus knobs: black rim, white cap
  const knobs = new THREE.Group();
  [-1, 1].forEach((sgn) => {
    const k = new THREE.Group();
    k.add(G.knob(0.36, 0.16, blackGloss, [0, 0, 0]));
    k.add(G.cyl(0.27, 0.27, 0.03, white, [0, 0.09, 0]));
    k.position.set(sgn * 0.47, 2.2, -1.05);
    k.rotation.z = sgn * -Math.PI / 2;
    knobs.add(k);
  });
  v.add(knobs);
  const shafts = []; // { mesh, mat, sgn, group }
  function makeShaft(sgn, x0, x1, y, z, r, group, parent) {
    const mat = G.mat(0xb9bec6, { roughness: 0.3, metalness: 0.85, emissive: 0xffc400, emissiveIntensity: 0 });
    const sh = new THREE.Group();
    const len = Math.abs(x1 - x0), cx = (x0 + x1) / 2;
    sh.add(G.cyl(r, r, len, mat, [0, 0, 0], [0, 0, Math.PI / 2], 20));
    // 一圈圈螺纹 thread ridges
    for (let t = -len / 2 + 0.02; t < len / 2 - 0.01; t += 0.028) sh.add(G.torus(r, r * 0.16, mat, [t, 0, 0], [0, Math.PI / 2, 0]));
    sh.position.set(cx, y, z);
    parent.add(sh);
    shafts.push({ mesh: sh, mat, sgn, group });
    return sh;
  }
  [-1, 1].forEach((sgn) => makeShaft(sgn, sgn * 0.34, sgn * 0.56, 2.2, -1.05, 0.055, knobs, v.scene));
  v.addPart(knobs, { zh: '调焦旋钮', en: 'Focus knobs', dzh: '立柱两侧的大旋钮，转动使镜臂升降，让不同深度的内含物依次清晰。', den: 'The big knobs on both sides of the column raise and lower the arm so features at different depths come into focus.' });

  /* ---------- 镜臂与双目头（随调焦升降）Arm & binocular head (moves with focus) ---------- */
  const head = new THREE.Group();
  v.add(head);
  head.add(G.rbox(0.9, 0.42, 1.75, 0.12, white, [0, 3.15, -0.35]));
  // 黑色大物镜 Large black objective
  const zoomBody = G.cyl(0.48, 0.5, 0.36, blackGloss, [0, 2.76, 0.3], null, 48);
  head.add(zoomBody);
  const objective = G.group(G.cyl(0.38, 0.38, 0.08, black, [0, 2.54, 0.3]), G.cyl(0.24, 0.24, 0.01, G.glassMat(0x88aaff, 0.6), [0, 2.495, 0.3]));
  head.add(objective);
  v.addPart(objective, { zh: '物镜', en: 'Objective lens', dzh: '镜臂下方的黑色大镜头，最靠近宝石，形成第一次放大的像。', den: 'The large black lens under the arm, nearest the stone; it forms the first magnified image.' });

  // 白色双目镜体 White binocular body
  const binoc = new THREE.Group();
  binoc.add(G.rbox(0.95, 0.55, 0.75, 0.15, white, [0, 0, 0]));
  binoc.add(G.cyl(0.32, 0.36, 0.3, white, [0, -0.35, 0]));
  binoc.position.set(0, 3.62, 0.3);
  binoc.rotation.x = 0.25;
  head.add(binoc);

  // 变倍旋钮（镜体两侧黑色旋钮）Zoom knobs on the sides of the head
  const zoomKnob = new THREE.Group();
  [-1, 1].forEach((sgn) => {
    const k = G.knob(0.22, 0.1, blackGloss, [sgn * 0.53, 3.55, 0.3], [0, 0, Math.PI / 2]);
    zoomKnob.add(k);
  });
  head.add(zoomKnob);
  [-1, 1].forEach((sgn) => makeShaft(sgn, sgn * 0.43, sgn * 0.6, 3.55, 0.3, 0.04, zoomKnob, head));
  v.addPart(zoomKnob, { zh: '变倍旋钮', en: 'Zoom knobs', dzh: '镜体两侧的黑色旋钮，连续改变放大倍数（常见 10–60 倍）。', den: 'Black knobs on both sides of the head; change magnification continuously (typically 10–60×).' });

  // 黑色大目镜 Large black eyepieces
  const eyepieces = new THREE.Group();
  [-0.26, 0.26].forEach((x) => {
    const tube = G.group(
      G.cyl(0.13, 0.13, 0.5, white, [0, 0.25, 0]),
      G.cyl(0.19, 0.19, 0.55, blackGloss, [0, 0.72, 0]),
      G.cyl(0.2, 0.2, 0.06, black, [0, 1.0, 0]),
      G.cyl(0.13, 0.13, 0.01, G.glassMat(0x6688cc, 0.7), [0, 1.03, 0])
    );
    tube.position.set(x, 3.75, 0.45);
    tube.rotation.set(0.62, 0, x > 0 ? -0.06 : 0.06);
    eyepieces.add(tube);
  });
  head.add(eyepieces);
  v.addPart(eyepieces, { zh: '目镜（双目）', en: 'Eyepieces (binocular)', dzh: '两个黑色大目镜，通常为 10 倍；双目观察有立体感，可调瞳距和视度。', den: 'Two large black eyepieces, usually 10×; binocular viewing gives depth. Adjust eye spacing and focus.' });

  /* ---------- 镜臂下的黑色小顶光灯 + 弹簧电线 Small black overhead lamp + coiled cord ---------- */
  const lamp = new THREE.Group();
  const lampHeadMat = new THREE.MeshStandardMaterial({ color: 0x333333, emissive: 0xfff6e0, emissiveIntensity: 0 });
  const lampHead = new THREE.Group();
  lampHead.add(G.cyl(0.16, 0.18, 0.42, blackGloss, [0, 0, 0]));
  lampHead.add(G.cyl(0.14, 0.14, 0.01, lampHeadMat, [0, -0.215, 0]));
  lampHead.position.set(-0.6, 2.7, -0.15);
  lampHead.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), new THREE.Vector3(0.6, -1.25, 0.45).normalize());
  lamp.add(lampHead);
  lamp.add(G.box(0.12, 0.25, 0.12, white, [-0.5, 2.92, -0.2]));
  // 螺旋弹簧线：从灯一直盘到底座 coiled cord from the lamp down to the base
  const A = new THREE.Vector3(-0.72, 2.6, -0.25), B = new THREE.Vector3(-0.95, 0.95, 0.15);
  const coil = new THREE.Curve();
  coil.getPoint = (t) => {
    const p = A.clone().lerp(B, t), a = t * Math.PI * 2 * 16, r = t < 0.06 || t > 0.94 ? 0.02 : 0.075;
    return p.add(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
  };
  lamp.add(G.mesh(new THREE.TubeGeometry(coil, 500, 0.018, 6), rubber));
  head.add(lamp);
  v.addPart(lamp, { zh: '顶光灯（反射光）', en: 'Overhead lamp (reflected light)', dzh: '装在镜臂下方的小黑灯，弹簧线接到底座。从上方照射宝石表面，用来观察抛光、刻面棱和表面特征。', den: 'A small black lamp under the arm with a coiled cord to the base. It lights the surface from above to check polish, facet edges and surface features.' });

  /* ---------- 外部白灯（独立台灯，日光色 LED）External white lamp (stand-alone daylight LED) ---------- */
  const extLamp = new THREE.Group();
  const lampWhite = G.mat(0xf2f2ef, { roughness: 0.35 });
  extLamp.add(G.cyl(0.36, 0.4, 0.1, G.mat(0x3a3e45, { metalness: 0.5, roughness: 0.4 }), [2.4, 0.05, 1.0], null, 40));
  const extBtn = G.cyl(0.07, 0.07, 0.05, G.mat(0xdddddd), [2.4, 0.12, 1.25]);
  extLamp.add(extBtn);
  const P0 = [2.4, 0.1, 1.0], P1 = [2.45, 1.55, 0.55], P2 = [1.55, 2.15, 0.75];
  extLamp.add(G.rod(P0, P1, 0.045, lampWhite), G.rod(P1, P2, 0.04, lampWhite));
  extLamp.add(G.sph(0.07, G.mat(0x9aa0a8, { metalness: 0.7, roughness: 0.3 }), P1), G.sph(0.06, G.mat(0x9aa0a8, { metalness: 0.7, roughness: 0.3 }), P2));
  const extHead = new THREE.Group();
  extHead.add(G.cyl(0.26, 0.3, 0.14, lampWhite, [0, 0, 0], null, 40));
  const extFaceMat = new THREE.MeshStandardMaterial({ color: 0xbbbbbb, emissive: 0xffffff, emissiveIntensity: 0 });
  extHead.add(G.cyl(0.25, 0.25, 0.01, extFaceMat, [0, -0.075, 0], null, 40));
  const extGlow = G.makeGlow(0xffffff, 0.9);
  extGlow.position.y = -0.12;
  extGlow.visible = false;
  extHead.add(extGlow);
  extHead.position.set(1.42, 2.08, 0.72);
  const GEM_AT = new THREE.Vector3(0, 1.45, 0.3);
  extHead.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), GEM_AT.clone().sub(extHead.position).normalize());
  extLamp.add(extHead);
  extLamp.add(G.mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(2.4, 0.06, 0.62), new THREE.Vector3(2.5, 0.03, 0.0), new THREE.Vector3(3.0, 0.03, -0.8),
  ]), 20, 0.03, 8), G.mat(0xeeeeee, { roughness: 0.9 })));
  v.add(extLamp);
  const extSpot = new THREE.SpotLight(0xffffff, 0, 6, 0.45, 0.5);
  extSpot.position.copy(extHead.position);
  extSpot.target.position.copy(GEM_AT);
  v.add(extSpot, extSpot.target);
  v.addPart(extLamp, { zh: '外部白灯（日光色 LED）', en: 'External white lamp (daylight LED)', dzh: '放在显微镜旁边的独立台灯，接近日光的白光（约 6500K）从侧上方照亮宝石，用来观察宝石的颜色、光泽和表面反光。有自己的开关，与显微镜电源无关。', den: 'A separate desk lamp next to the microscope. Its daylight-white light (about 6500 K) lights the stone from the side to judge colour, lustre and surface reflections. It has its own switch.' });

  let gemObj = null;
  // 自由模式的破坏与一键修复 Free-mode breakage and repair
  const sb = G.sandbox(v, { surfaces: () => [base, stageDisc, v.floor] });
  function setGem3D(gem) {
    if (gemObj) { if (gemObj.parent) gemObj.parent.remove(gemObj); sb.forget(gemObj); }
    st.gemGone = false; // 换上的新宝石夹在镊子上 the new stone sits in the tweezers
    gemObj = G.makeGem(gem, 0.42);
    gemObj.position.copy(STONE);
    v.add(gemObj);
    v.addPart(gemObj, { zh: '宝石：' + gem.zh, en: 'Stone: ' + gem.en, th: 'อัญมณี: ' + G.th(gem.en), dzh: gem.incNote.zh, den: gem.incNote.en });
    v.parts = v.parts.filter((p) => p.obj === gemObj || !p.info.zh.startsWith('宝石：'));
    G.renderParts(G.$('#parts-list'), v);
  }

  /* ================= 状态 State ================= */
  const st = { gem: null, light: 'off', mode: 'bright', zoom: 15, focus: 50, turn: 0, turnTotal: 0, iris: 0.8, dim: 0.8, ext: false,
    loose: 0, zoomLoose: 0, burnt: false, gemGone: false }; // 自由模式的破坏状态 free-mode damage

  function update3D() {
    const on = st.light === 'on' && !st.burnt;
    const under = on && st.mode !== 'top';
    lightMat.emissiveIntensity = under ? 1.4 * st.dim : 0;
    reflMat.emissiveIntensity = on && st.mode === 'dark' ? 0.25 : 0;
    wellLight.intensity = under ? (0.5 + st.iris * 0.5) * st.dim : 0;
    stop.visible = st.mode === 'dark';
    beamBright.visible = on && st.mode === 'bright';
    beamDark.visible = on && st.mode === 'dark';
    beamBright.material.opacity = beamDark.material.opacity = 0.06 + 0.14 * st.iris;
    lampHeadMat.emissiveIntensity = on && st.mode === 'top' ? 1.4 : 0;
    ledMat.emissiveIntensity = on ? 1.6 : 0;
    extFaceMat.emissiveIntensity = st.ext ? 1.6 : 0;
    extSpot.intensity = st.ext ? 1.3 : 0;
    extGlow.visible = st.ext;
    extBtn.position.y = st.ext ? 0.105 : 0.12;
    rocker.rotation.x = on ? -0.25 : 0.25; // 船形开关压向 I 或 O rocker towards I or O
    dfLever.position.z = st.mode === 'dark' ? 1.3 : 1.45; // 推进 = 暗域，拉出 = 亮域 in = darkfield, out = brightfield
    dimmer.rotation.y = st.dim * 4;
    // 光阑叶片：孔径随 st.iris 变化 iris leaves follow the aperture
    setIris(0.08 + st.iris * (IN - 0.1));
    const la = -0.6 + st.iris * 1.2;
    irisLever.position.set(Math.cos(la) * 0.49, -0.02, Math.sin(la) * 0.49);
    irisLever.rotation.y = -la;
  }
  v.tick((dt) => {
    head.position.y = G.approach(head.position.y, (50 - st.focus) * 0.004, 8, dt);
    const yaw = (-st.turn * Math.PI) / 180; // 水平面内转动 turn in the horizontal plane
    holderPivot.rotation.y = yaw;
    if (gemObj) gemObj.rotation.y = yaw;
    const kz = (st.zoom - 10) * 0.06;
    zoomKnob.children.forEach((k) => (k.rotation.x = G.approach(k.rotation.x, kz, 8, dt)));
    knobs.children.forEach((k) => {
      k.rotation.x = G.approach(k.rotation.x, st.focus * 0.05, 8, dt);
      // 越拧越松：往外退，还会晃 Looser and looser: backs out and wobbles
      if (k.userData.x0 === undefined) k.userData.x0 = k.position.x;
      const L = k.userData.loose || 0, sgn = Math.sign(k.userData.x0);
      k.position.x = k.userData.x0 + sgn * L * 0.006;
      k.rotation.y = L > 5 ? Math.sin(performance.now() / 60) * L * 0.002 : 0;
    });
    // 旋钮不在：螺丝杆闪黄光，告诉你装回哪里 Knob missing: the shaft pulses yellow to show where it goes
    const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 180);
    shafts.forEach((sh) => {
      const has = sh.group.children.some((k) => Math.sign(k.userData.x0 !== undefined ? k.userData.x0 : k.position.x) === sh.sgn);
      sh.mat.emissiveIntensity = has ? 0 : 0.35 + 0.65 * pulse;
    });
    zoomKnob.children.forEach((k) => {
      if (k.userData.x0 === undefined) k.userData.x0 = k.position.x;
      k.position.x = k.userData.x0 + Math.sign(k.userData.x0) * (k.userData.loose || 0) * 0.005;
    });
  });

  /* ================= 目镜画面：真实显微照片 Eyepiece view: real photomicrograph ================= */
  const INCL = 62; // 内含物所在的焦深 focus depth of the inclusions
  const img = G.$('#real-img'), offMsg = G.$('#eye-off');
  function render() {
    const on = st.light === 'on' && !st.burnt;
    const lit = (on || st.ext) && !st.gemGone;
    offMsg.classList.toggle('hidden', lit);
    offMsg.innerHTML = st.gemGone ? G.T('宝石被压碎了，镜下什么也没有', 'The stone was crushed: nothing under the lens')
      : st.burnt && st.light === 'on' ? G.T('灯泡烧了', 'The bulb has burnt out') : G.T('光源已关闭', 'Light is off');
    img.style.visibility = lit ? '' : 'hidden';
    if (!lit) return;
    // 倍数 → 放大照片；焦点离内含物越远越模糊 Zoom scales the photo; blur grows away from the inclusion depth
    const scale = 1 + ((st.zoom - 10) / 50) * 1.5;
    const blur = Math.min(8, Math.abs(st.focus - INCL) * 0.12 * (st.zoom / 20 + 0.5));
    let bright = on ? (st.mode === 'top' ? 0.75 : (0.45 + 0.6 * st.iris) * (0.55 + 0.5 * st.dim) * (st.dim > 1 ? 1 + (st.dim - 1) * 4 : 1)) : 0.7;
    if (st.ext) bright += 0.12;
    img.style.transform = `rotate(${st.turn}deg) scale(${scale.toFixed(3)})`;
    img.style.filter = `blur(${blur.toFixed(2)}px) brightness(${bright.toFixed(2)})`;
  }

  /* ================= 界面 UI ================= */
  const modeText = {
    dark: ['暗域照明：黑背景上内含物发亮，最容易发现内含物。', 'Darkfield: inclusions glow against a black background, so they are easy to find.'],
    bright: ['亮域照明：内含物呈暗色轮廓，适合观察色带、弧形生长纹和气泡。', 'Brightfield: inclusions show as dark outlines. Best for colour zoning, curved striae and bubbles.'],
    top: ['顶光（反射光）：主要看表面——刻面棱、抛光痕；内部特征几乎看不到。', 'Overhead light: mainly shows the surface, such as facet edges and polish. Internal features are faint.'],
  };
  function updateUI() {
    const zm = Math.round(st.zoom);
    G.$('#zoom-val').textContent = zm + '×';
    G.$('#zoom').value = zm;
    G.$('#focus').value = Math.round(st.focus);
    const depth = st.focus < 25 ? T('表面', 'surface') : st.focus < 80 ? T('宝石内部', 'inside') : T('底部', 'bottom');
    G.$('#focus-val').innerHTML = depth;
    G.$('#obs-mode').innerHTML = `${zm}× · ` + { dark: T('暗域', 'Darkfield'), bright: T('亮域', 'Brightfield'), top: T('顶光', 'Overhead') }[st.mode] + (st.ext ? ' · 💡' + T('白灯', 'White lamp') : '');
    G.$('#badge').innerHTML = T(st.gem.zh, st.gem.en) + ' · ' + zm + '×';
    const m = modeText[st.mode];
    G.$('#result').innerHTML = `<b>${T('观察要点', 'What to look for')}：</b>${T(st.gem.incNote.zh, st.gem.incNote.en)}<div class="note" style="margin-top:6px">${T(m[0], m[1])}</div>`;
    update3D();
    render();
  }

  /* ---------- 真实显微照片 Real photomicrograph ---------- */
  const photoSrc = (gem) => `assets/img/inclusions/${gem.id}.jpg`;
  function updatePhoto() {
    const gem = st.gem, img = G.$('#real-img');
    img.src = photoSrc(gem);
    img.alt = G.tx(gem.zh, gem.en);
    G.$('#real-cap').innerHTML = `<b>${T(gem.zh, gem.en)}</b> · ${T('真实显微照片', 'Real photomicrograph')} · ${T('点击放大', 'Click to enlarge')}`;
  }
  G.$('#real-btn').addEventListener('click', () => {
    const gem = st.gem;
    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = `<img src="${photoSrc(gem)}" alt=""><div class="lb-cap"><b>${T(gem.zh, gem.en)}</b>：${T(gem.incNote.zh, gem.incNote.en)}<div class="note" style="margin-top:6px">${T('点击任意处关闭', 'Click anywhere to close')}</div></div>`;
    lb.addEventListener('click', () => lb.remove());
    document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { lb.remove(); document.removeEventListener('keydown', esc); } });
    document.body.appendChild(lb);
  });

  G.gemPicker(G.$('#gem-picker'), G.gems, (gem) => { st.gem = gem; setGem3D(gem); updatePhoto(); updateUI(); }, 'ruby');
  const segPower = G.seg(G.$('#power'), [{ v: 'on', zh: '开', en: 'On' }, { v: 'off', zh: '关', en: 'Off' }], (x) => { st.light = x; updateUI(); }, 'off');
  const segExt = G.seg(G.$('#ext'), [{ v: 'off', zh: '关', en: 'Off' }, { v: 'on', zh: '开', en: 'On' }], (x) => { st.ext = x === 'on'; updateUI(); }, 'off');
  const segIllum = G.seg(G.$('#illum'), [
    { v: 'dark', zh: '暗域', en: 'Darkfield' }, { v: 'bright', zh: '亮域', en: 'Brightfield' }, { v: 'top', zh: '顶光', en: 'Overhead' },
  ], (x) => { st.mode = x; updateUI(); }, 'bright');
  G.$('#zoom').addEventListener('input', (e) => { st.zoom = +e.target.value; updateUI(); });
  G.$('#focus').addEventListener('input', (e) => { st.focus = +e.target.value; updateUI(); });
  window.addEventListener('resize', render);
  G.onLang(() => { updatePhoto(); updateUI(); });

  /* ================= 在 3D 模型上直接操作 Operate the 3D model ================= */
  /* 自由模式：没有限位，可以把东西弄坏 Free mode: no end stops, things can break */
  const attached = (group) => group.children.filter((k) => k.parent === group);
  const nearSide = (group) => attached(group).sort((a, b) =>
    a.getWorldPosition(new THREE.Vector3()).distanceTo(v.camera.position) - b.getWorldPosition(new THREE.Vector3()).distanceTo(v.camera.position))[0];
  const looseOne = (group) => attached(group).find((k) => (k.userData.loose || 0) > 0);
  // 全都装好、拧紧、灯没坏、宝石在：修复按钮消失 All fitted, tight, bulb fine, stone in place: hide the repair button
  function checkFixed() {
    const tight = [knobs, zoomKnob].every((g) => attached(g).length === 2 && !looseOne(g));
    if (tight && !st.burnt && !st.gemGone && !sb.dropped() && sb.broken) { sb.fixed(); v.say('✅ ' + G.T('全部装好了，显微镜恢复正常', 'Everything is back on: the microscope works again')); }
  }
  // 拧回去：往紧的方向转，先把松掉的旋钮拧紧 Screwing back: turning the tight way first tightens a loose knob
  function tighten(group, amount, msg) {
    const k = looseOne(group);
    if (!k) return amount;
    const use = Math.min(k.userData.loose, amount);
    k.userData.loose -= use;
    if (k.userData.loose <= 0) { k.userData.loose = 0; v.say('🔧 ' + G.T(...msg)); checkFixed(); }
    return amount - use;
  }
  const knobPickup = (onFitMsg) => ({
    hint: ['掉在地上：按住捡起来，拖到闪黄光的螺丝杆上装好', 'On the floor: pick it up and drag it onto the glowing threaded shaft'],
    fitR: 0.7,
    onFit: (k) => { k.userData.loose = k.userData.dropLoose; v.say('🔩 ' + G.T(...onFitMsg)); },
  });
  function turnFocus(d) {
    if (!G.isFree()) { st.focus = G.clamp(st.focus + d, 0, 100); return; }
    if (d > 0) d = tighten(knobs, d, ['调焦旋钮拧紧了', 'Focus knob tightened']);
    const f = st.focus + d;
    if (f < 0) {
      // 往松的方向拧过头：旋钮越来越松，最后掉下来 Past the stop: the knob loosens and finally falls off
      st.focus = 0;
      const k = looseOne(knobs) || nearSide(knobs);
      if (!k) return;
      k.userData.loose = (k.userData.loose || 0) - f;
      sb.setBroken();
      if (k.userData.loose > 45) {
        const out = Math.sign(k.getWorldPosition(new THREE.Vector3()).x) || 1;
        k.userData.dropLoose = 45; k.userData.loose = 0;
        sb.drop(k, { vel: [out * 1.2, 0.8, 0.6], spin: [6, 2, 4], pickup: knobPickup(['装上了！再往回拧几圈把它拧紧', 'It is on! Now turn it back to screw it tight']) });
        v.say('🔩 ' + G.T('调焦旋钮被拧下来了！看，露出了螺丝杆', 'You unscrewed the focus knob! See the bare threaded shaft'));
      } else if (k.userData.loose > 15) v.say('⚠️ ' + G.T('旋钮越来越松了……', 'The knob is getting loose…'));
    } else if (f > 100) {
      // 往下压过头：物镜直接把宝石压碎 Too far down: the objective crushes the stone
      st.focus = Math.min(f, 118);
      if (st.focus > 112 && !st.gemGone && gemObj) {
        st.gemGone = true;
        const old = gemObj;
        G.shatterGem(v, old, st.gem, () => {
          if (old.parent) old.parent.remove(old);
          st.focus = 95; // 镜头先抬起来一点，再换上新宝石 lift the lens a little, then fit a new stone
          setGem3D(st.gem); G.popIn(v, gemObj); updateUI(); checkFixed();
        });
        G.shake(v, 0.12, 0.45);
        v.say('💥 ' + G.T('物镜压下去，把宝石压碎了！', 'Crunch! The objective crushed the stone!'));
      } else if (st.focus > 104 && !st.gemGone) v.say('⚠️ ' + G.T('物镜快压到宝石了……', 'The objective is about to hit the stone…'));
    } else st.focus = f;
  }
  v.addControl(knobs, { hint: ['上下拖动调焦旋钮', 'Drag the focus knob up/down'],
    onDrag: (dx, dy) => { turnFocus((dx - dy) * 0.35); updateUI(); } });
  v.addControl(zoomKnob, { hint: ['拖动变倍旋钮', 'Drag the zoom knob'],
    onDrag: (dx, dy) => {
      let d = (dx - dy) * 0.12;
      if (G.isFree() && d < 0) d = -tighten(zoomKnob, -d, ['变倍旋钮拧紧了', 'Zoom knob tightened']);
      const z = st.zoom + d;
      if (G.isFree() && z > 60 && attached(zoomKnob).length) {
        const k = looseOne(zoomKnob) || nearSide(zoomKnob);
        k.userData.loose = (k.userData.loose || 0) + (z - 60);
        sb.setBroken();
        if (k.userData.loose > 18) {
          k.userData.dropLoose = 18; k.userData.loose = 0;
          sb.drop(k, { vel: [Math.sign(k.getWorldPosition(new THREE.Vector3()).x) * 1.4, 0.6, 0.5], spin: [3, 7, 2], pickup: knobPickup(['装上了！把变倍旋钮往回拧紧', 'It is on! Turn the zoom knob back to tighten it']) });
          v.say('🔩 ' + G.T('变倍旋钮掉下来了！', 'The zoom knob fell off!'));
        }
      }
      st.zoom = G.clamp(z, 10, 60); updateUI();
    } });
  v.addControl(dimmer, { hint: ['左右拖动：调节亮度', 'Drag sideways to set the brightness'],
    onDrag: (dx, dy) => {
      st.dim = G.clamp(st.dim + (dx - dy) * 0.006, 0.2, G.isFree() ? 1.5 : 1);
      if (st.dim > 1.42 && !st.burnt) {
        // 亮度拧过头：灯泡烧了 Too bright: the bulb burns out
        st.burnt = true; st.dim = 1; sb.setBroken(); G.shake(v, 0.03, 0.25); igniteBulb();
        v.say('💥 ' + G.T('亮度开太大，灯泡烧了！', 'Too bright: the bulb burnt out!'));
      } else if (st.dim > 1.1 && !st.burnt) v.say('🔥 ' + G.T('太亮了，灯泡在发烫……', 'Too bright: the bulb is overheating…'));
      updateUI();
    } });
  /* ---------- 灯泡烧坏：火星、火苗、黑烟 Burnt bulb: sparks, flames and smoke ---------- */
  const FIRE_AT = new THREE.Vector3(0, 0.98, 0.3); // 光井里的灯 the lamp inside the light well
  const fx = [];
  let flameT = 0;
  const fireLight = new THREE.PointLight(0xff7a1a, 0, 3);
  fireLight.position.copy(FIRE_AT).add(new THREE.Vector3(0, 0.3, 0));
  v.add(fireLight);
  function puff(kind) {
    const s2 = G.makeGlow(kind === 'smoke' ? 0x3a3a3a : kind === 'spark' ? 0xfff0a0 : (Math.random() < 0.5 ? 0xff7a1a : 0xffc23a), kind === 'smoke' ? 0.25 : kind === 'spark' ? 0.08 : 0.22);
    if (kind === 'smoke') { s2.material.blending = THREE.NormalBlending; s2.material.opacity = 0.55; }
    // 外焰用普通混合的橙红色，浅色背景上也看得清 Outer flame in normal-blended orange-red so it shows on a light background
    if (kind === 'flame' && Math.random() < 0.6) { s2.material.blending = THREE.NormalBlending; s2.material.color.set(Math.random() < 0.5 ? 0xff4a10 : 0xff8a00); s2.userData.big = true; }
    s2.position.copy(FIRE_AT).add(new THREE.Vector3((Math.random() - 0.5) * 0.18, 0.05, (Math.random() - 0.5) * 0.18));
    v.add(s2);
    const vel = kind === 'spark' ? new THREE.Vector3((Math.random() - 0.5) * 3, 1.5 + Math.random() * 2.5, (Math.random() - 0.5) * 3)
      : new THREE.Vector3((Math.random() - 0.5) * 0.2, kind === 'smoke' ? 0.45 + Math.random() * 0.3 : 1.1 + Math.random() * 0.8, (Math.random() - 0.5) * 0.2);
    fx.push({ s: s2, vel, kind, life: kind === 'smoke' ? 2.4 : kind === 'spark' ? 0.6 : 0.55, age: 0 });
  }
  function igniteBulb() {
    for (let i = 0; i < 28; i++) puff('spark');
    flameT = 4; // 烧几秒，然后一直冒烟，直到修好 flames for a few seconds, then smoke until fixed
    v.say('🔥 ' + G.T('灯泡炸了，冒火了！', 'The bulb blew and caught fire!'));
  }
  let emit = 0;
  v.tick((dt) => {
    if (st.burnt) {
      emit += dt;
      if (flameT > 0) {
        flameT -= dt;
        while (emit > 0.03) { emit -= 0.03; puff('flame'); if (Math.random() < 0.3) puff('smoke'); if (Math.random() < 0.08) puff('spark'); }
        fireLight.intensity = 1.2 + Math.random() * 1.2;
        if (flameT <= 0) v.say('💨 ' + G.T('火灭了，还在冒烟：用扳手把灯泡换掉', 'The fire is out but still smoking: change the bulb with the wrench'));
      } else {
        while (emit > 0.25) { emit -= 0.25; puff('smoke'); }
        fireLight.intensity = 0;
      }
    } else fireLight.intensity = 0;
    for (let i = fx.length - 1; i >= 0; i--) {
      const f = fx[i];
      f.age += dt;
      if (f.kind === 'spark') f.vel.y -= 9 * dt;
      f.s.position.addScaledVector(f.vel, dt);
      const k = f.age / f.life;
      if (f.kind === 'smoke') { const sc = 0.25 + k * 0.9; f.s.scale.set(sc, sc, 1); f.s.material.opacity = 0.55 * (1 - k); }
      else if (f.kind === 'flame') { const sc = (f.s.userData.big ? 0.5 : 0.32) * (1 - k * 0.6); f.s.scale.set(sc, sc * 1.6, 1); f.s.material.opacity = (f.s.userData.big ? 0.85 : 1) * (1 - k); }
      else f.s.material.opacity = 1 - k;
      if (k >= 1) { v.scene.remove(f.s); fx.splice(i, 1); }
    }
  });

  /* ---------- 扳手：放到灯座上，来回拧几下换灯泡 Wrench: put it on the lamp socket and turn it to change the bulb ---------- */
  const WRENCH_HOME = new THREE.Vector3(1.05, 0.93, 1.05);
  const steel = G.mat(0xb7bec7, { roughness: 0.25, metalness: 0.9 });
  const wrench = new THREE.Group();
  wrench.add(G.box(0.9, 0.035, 0.11, steel, [0.45, 0, 0]));                    // 手柄 handle
  wrench.add(G.box(0.5, 0.04, 0.14, G.mat(0xc0392b, { roughness: 0.6 }), [0.62, 0.002, 0])); // 红色握把 red grip
  wrench.add(G.box(0.1, 0.035, 0.32, steel, [-0.02, 0, 0]));                   // 开口扳头 open jaw
  wrench.add(G.box(0.16, 0.035, 0.07, steel, [-0.1, 0, 0.125]));
  wrench.add(G.box(0.16, 0.035, 0.07, steel, [-0.1, 0, -0.125]));
  wrench.position.copy(WRENCH_HOME);
  wrench.rotation.y = 0.6;
  wrench.visible = false;
  v.add(wrench);
  v.addPart(wrench, { zh: '扳手', en: 'Wrench', dzh: '灯泡烧坏后，用它拧下旧灯泡、换上新灯泡。', den: 'When the bulb burns out, use it to unscrew the old bulb and fit a new one.' });
  const fixHud = document.createElement('div');
  fixHud.className = 'clean-hud hidden';
  v.el.appendChild(fixHud);
  const fix = { seated: false, k: 0, dragging: false };
  const bar = (k) => `<span class="pbar"><i style="width:${Math.round(k * 100)}%"></i></span>`;
  const drawFix = () => {
    fixHud.classList.toggle('hidden', !fix.seated || !st.burnt);
    fixHud.innerHTML = '🔧 ' + G.T('换灯泡', 'Changing the bulb') + ` ${bar(fix.k)} ${Math.round(fix.k * 100)}%`;
  };
  v.addControl(wrench, {
    get hint() { return fix.seated ? ['左右拖动：拧下旧灯泡，换上新灯泡', 'Drag sideways: unscrew the old bulb and fit a new one'] : ['按住扳手，拖到冒烟的灯座上', 'Hold the wrench and drag it onto the smoking lamp socket']; },
    markerIf: () => st.burnt,
    spin: () => fix.seated, // 卡上灯座后可以无极地拧 endless turning once seated
    onDragStart: () => { fix.dragging = true; },
    onDrag: (dx, dy) => {
      if (fix.seated) {
        fix.k = Math.min(1, fix.k + Math.abs(dx - dy) / 1400);
        wrench.rotation.y += (dx - dy) * 0.01;
        drawFix();
        if (fix.k >= 1) {
          st.burnt = false; flameT = 0; fix.seated = false; fix.k = 0; fix.dragging = false;
          drawFix();
          v.say('💡 ' + G.T('换好新灯泡了！', 'New bulb fitted!'));
          updateUI(); checkFixed();
        }
        return;
      }
      const n = new THREE.Vector3();
      v.camera.getWorldDirection(n);
      const pt = v.rayOnPlane(wrench.position.toArray(), n.toArray());
      if (pt) wrench.position.copy(pt);
    },
    onDragEnd: () => {
      fix.dragging = false;
      if (!fix.seated && st.burnt && wrench.position.distanceTo(FIRE_AT) < 0.7) {
        fix.seated = true;
        wrench.position.set(FIRE_AT.x, 1.12, FIRE_AT.z);
        v.say('🔧 ' + G.T('扳手卡住灯座了，左右拧几圈换灯泡', 'The wrench is on the socket: turn it a few times to change the bulb'));
        drawFix();
      } else if (!fix.seated && st.burnt) v.say(G.T('要放到冒烟的灯座上（载物台中间）', 'Put it on the smoking lamp socket (the middle of the stage)'));
    },
  });
  v.tick((dt) => {
    wrench.visible = G.isFree() && st.burnt;
    if (!fix.seated && !fix.dragging) wrench.position.lerp(WRENCH_HOME, 1 - Math.exp(-5 * dt));
  });

  sb.onRepair(() => { fix.seated = false; fix.k = 0; flameT = 0; drawFix(); });
  sb.onRepair(() => { [knobs, zoomKnob].forEach((g) => g.children.forEach((k) => (k.userData.loose = 0))); st.burnt = false; st.gemGone = false; st.dim = Math.min(st.dim, 1); st.focus = G.clamp(st.focus, 0, 100); updateUI(); });
  v.addControl(dfLever, { hint: ['点击：推进 = 暗域，拉出 = 亮域', 'Click: in = darkfield, out = brightfield'],
    onClick: () => segIllum.set(st.mode === 'dark' ? 'bright' : 'dark') });
  v.addControl(lamp, { hint: ['点击：开/关顶光', 'Click: overhead light on/off'],
    onClick: () => segIllum.set(st.mode === 'top' ? 'dark' : 'top') });
  v.addControl(powerSw, { hint: ['点击：电源开/关', 'Click: power on/off'],
    onClick: () => segPower.set(st.light === 'on' ? 'off' : 'on') });
  v.addControl(holder, { hint: ['左右拖动：转动宝石', 'Drag sideways to turn the stone'],
    onDrag: (dx) => { st.turn = (st.turn + dx * 0.6) % 360; st.turnTotal += Math.abs(dx * 0.6); updateUI(); } });
  v.addControl(irisLever, { hint: ['左右拖动光阑杆：调节通光孔大小', 'Drag the iris lever to open or close the aperture'],
    onDrag: (dx, dy) => { st.iris = G.clamp(st.iris + (dx - dy) * 0.006, 0, 1); updateUI(); } });
  v.addControl(extLamp, { hint: ['点击：开 / 关外部白灯', 'Click: external white lamp on / off'],
    onClick: () => segExt.set(st.ext ? 'off' : 'on') });
  v.addControl(eyepieces, { hint: ['点击：从目镜里看', 'Click: look through the eyepieces'],
    onClick: () => G.lookAt('.obs') });

  /* ================= 分步指引 Step guide ================= */
  const set = (k, val) => { st[k] = val; updateUI(); };
  /* 观察题：内含物名称 Observation question: inclusion names */
  const INC_NAMES = {
    silk: ['绢丝状金红石针', 'Silk (fine rutile needles)'], needles2: ['长针状晶体', 'Long needle-like crystals'],
    fingerprint: ['指纹状包体（愈合裂隙）', 'Fingerprints (healed fractures)'], curved: ['弧形生长纹', 'Curved growth striae'],
    bubbles: ['气泡', 'Gas bubbles'], zoning: ['平直色带', 'Straight colour zoning'], threephase: ['三相包体', 'Three-phase inclusions'],
    jardin: ['苔藓状“花园”', 'Jardin (moss-like “garden”)'], crystal: ['矿物晶体包体', 'Mineral crystal inclusions'], feather: ['羽状纹', 'Feathers'],
    octahedra: ['八面体小晶体', 'Tiny octahedral crystals'], lilypad: ['睡莲叶状包体', 'Lily-pad inclusions'], doubling: ['刻面棱重影', 'Doubled facet edges'],
    tiger: ['虎纹状色带', 'Tiger-stripe colour zoning'], granular: ['粒状结构', 'Granular texture'], swirl: ['漩涡纹', 'Swirl marks'], cleavage: ['解理纹', 'Cleavage cracks'],
  };
  const incOptions = (gem) => {
    const rnd = G.rng('inc' + gem.id);
    const others = Object.keys(INC_NAMES).filter((k) => !gem.inc.includes(k)).sort(() => rnd() - 0.5).slice(0, 3);
    return [INC_NAMES[gem.inc[0]], ...others.map((k) => INC_NAMES[k])];
  };

  // 第一步：擦宝石 Step one: wipe the stone

  const wipe = G.addWipe(v, { getGem: () => gemObj });


  G.guide({
    viewer: v,
    reset: () => { wipe.reset(); segPower.set('off'); segIllum.set('bright'); segExt.set('off'); st.zoom = 15; st.focus = 50; st.turn = 0; st.turnTotal = 0; updateUI(); },
    steps: [
      wipe.step(),
      { t: ['打开电源', 'Switch on the power'], how: ['点击底座正面的船形电源开关', 'Click the rocker switch on the front of the base'],
        target: powerSw, done: () => st.light === 'on', act: () => segPower.set('on') },
      { t: ['选择暗域照明', 'Choose darkfield lighting'], how: ['点击底座正面右侧的黄铜推拉钮，把它推进去', 'Click the brass knob on the front to push it in'],
        target: dfLever, done: () => st.mode === 'dark', act: () => segIllum.set('dark') },
      { t: ['低倍下把宝石表面调清楚', 'At low power, focus on the surface'], how: ['上下拖动调焦旋钮，直到右侧画面里台面的刻面棱变清晰', 'Drag the focus knob until the facet edges in the eyepiece view are sharp'],
        target: knobs, done: () => Math.abs(st.focus - 12) <= 8 && st.zoom <= 20, act: () => { st.zoom = Math.min(st.zoom, 15); set('focus', 12); } },
      { t: ['慢慢往下调焦，找到内含物', 'Focus slowly down to find the inclusions'], how: ['继续拖动调焦旋钮，焦点进入宝石内部，内含物会变清楚', 'Keep turning the focus knob until the inclusions come into focus'],
        target: knobs, done: () => Math.abs(st.focus - 62) <= 8, act: () => set('focus', 62),
        ask: { sig: () => st.gem.id, q: ['你在这颗宝石里看到的主要特征是？', 'What key feature do you see inside this stone?'],
          o: () => incOptions(st.gem), a: 0, e: () => [st.gem.incNote.zh, st.gem.incNote.en] } },
      { t: ['提高倍数细看内含物', 'Zoom in on the inclusions'], how: ['拖动镜体侧面的变倍旋钮，放大到 30 倍以上', 'Drag a zoom knob on the side of the head to 30× or more'],
        target: zoomKnob, done: () => st.zoom >= 30, act: () => set('zoom', 35) },
      { t: ['转动宝石，从不同角度观察', 'Turn the stone to view it from other angles'], how: ['左右拖动宝石夹，把宝石转动至少 90°', 'Drag the stone holder sideways to turn it at least 90°'],
        target: holder, done: () => st.turnTotal >= 90, act: () => { st.turn += 90; set('turnTotal', 90); } },
      { t: ['换亮域照明，观察色带和生长纹', 'Switch to brightfield for zoning and growth lines'], how: ['再点击黄铜推拉钮，把它拉出来', 'Click the brass knob again to pull it out'],
        target: dfLever, done: () => st.mode === 'bright', act: () => segIllum.set('bright'),
        ask: { q: ['亮域照明下，内含物看起来是什么样？', 'Under brightfield, how do the inclusions look?'],
          o: [['暗色轮廓，背景明亮', 'Dark outlines on a bright background'], ['在黑背景上发亮', 'Bright on a black background'], ['完全看不见', 'Not visible at all']], a: 0,
          e: ['亮域下光直接穿过宝石，内含物挡光，所以是暗的。', 'Light passes straight through the stone, so inclusions block it and look dark.'] } },
      { t: ['用顶光观察宝石表面', 'Use the overhead lamp to check the surface'], how: ['点击镜臂下方的黑色小灯', 'Click the small black lamp under the arm'],
        target: lamp, done: () => st.mode === 'top', act: () => segIllum.set('top'),
        ask: { q: ['顶光下主要能看清什么？', 'What does the overhead light show best?'],
          o: [['表面：刻面棱、抛光痕、坑点', 'The surface: facet edges, polish marks, pits'], ['宝石内部深处的包体', 'Inclusions deep inside'], ['双折射率', 'The birefringence']], a: 0,
          e: ['反射光只照亮表面，内部特征几乎看不到。', 'Reflected light lights up only the surface; internal features are faint.'] } },
      { t: ['打开外部白灯，在白光下看宝石的颜色和光泽', 'Switch on the external white lamp to judge colour and lustre'], how: ['点击显微镜右边的白色台灯', 'Click the white desk lamp to the right of the microscope'],
        target: extLamp, done: () => st.ext, act: () => segExt.set('on'),
        ask: { q: ['外部白灯最适合用来判断什么？', 'What is the external white lamp best for?'],
          o: [['宝石的真实颜色和光泽', 'The true colour and lustre'], ['折射率', 'The refractive index'], ['荧光', 'Fluorescence']], a: 0,
          e: ['日光色白灯接近自然光，颜色和光泽最真实。', 'Daylight-white light is close to natural daylight, so colour and lustre look true.'] } },
      { t: ['观察结束，关闭电源和白灯', 'Finish: switch off the power and the white lamp'], how: ['点击船形电源开关，再点击白色台灯', 'Click the rocker switch, then the white lamp'],
        get target() { return st.light === 'on' ? powerSw : extLamp; }, // 哪个灯还亮就指向哪个 point at whichever light is still on
        done: () => st.light === 'off' && !st.ext, act: () => { segPower.set('off'); segExt.set('off'); } },
    ],
  });

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
