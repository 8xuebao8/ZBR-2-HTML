/* 宝石数据（入门教学用的典型值）
   Gem data — typical textbook values for beginners.
   ri: 单折射 {n}；一轴 {o: ω, e: ε}；二轴 {a: α, b: β, g: γ}；otl = 超出折射仪量程
   spec: 吸收线/带 {nm, w 宽度 nm, s 强度 0–1, em: true 表示亮线(发射)}
   uv: [强度 0–1, 颜色] */
(function () {
  const G = (window.GemLab = window.GemLab || {});
  const VIOLET = { nm: 410, w: 25, s: 0.6 }; // 紫区普遍吸收 general violet absorption

  G.gems = [
    {
      id: 'ruby', zh: '红宝石', en: 'Ruby', species: ['刚玉', 'Corundum'], css: '#c8102e', color: 0xc8102e,
      optic: 'DR', char: 'U-', ri: { o: 1.770, e: 1.762 }, dr: 0.008, sg: 4.00, h: 9,
      polar: { zh: '双折射：转动一周四明四暗', en: 'DR: four light / four dark positions per turn' },
      chelsea: { css: '#ff2438', zh: '鲜红色（强反应）', en: 'Bright red (strong)' },
      spec: [{ nm: 694, w: 1.2, s: 0.9 }, { nm: 692.8, w: 1, s: 0.85 }, { nm: 668, w: 1.5, s: 0.45 }, { nm: 659, w: 1.5, s: 0.45 },
        { nm: 555, w: 100, s: 0.88 }, { nm: 476.5, w: 1.2, s: 0.55 }, { nm: 475, w: 1.2, s: 0.55 }, { nm: 468.5, w: 1.2, s: 0.5 }, VIOLET],
      specNote: { zh: '铬谱：红区 694/692.8nm 双线，黄绿区宽吸收带，蓝区 476、475、468nm 细线', en: 'Chromium: 694/692.8 nm doublet, broad yellow-green band, blue lines at 476, 475, 468 nm' },
      uv: { lw: [0.9, '#ff2a40'], sw: [0.5, '#ff3a4a'] },
      uvNote: { zh: '长波强红色，短波中等红色（含铁多的泰国红宝石荧光弱）', en: 'LW strong red, SW moderate red (iron-rich Thai rubies are weaker)' },
      inc: ['silk', 'fingerprint'],
      incNote: { zh: '金红石针（丝状物），三组以 60° 相交；愈合裂隙（指纹状包体）', en: 'Rutile needles (“silk”) crossing at 60°; healed fractures (fingerprints)' },
    },
    {
      id: 'synruby', zh: '合成红宝石', en: 'Synthetic Ruby', species: ['焰熔法合成刚玉', 'Flame-fusion corundum'], css: '#e01845', color: 0xe01845,
      optic: 'DR', char: 'U-', ri: { o: 1.770, e: 1.762 }, dr: 0.008, sg: 4.00, h: 9,
      chelsea: { css: '#ff2038', zh: '鲜红色（强反应）', en: 'Bright red (strong)' },
      spec: [{ nm: 694, w: 1.2, s: 0.9 }, { nm: 692.8, w: 1, s: 0.85 }, { nm: 668, w: 1.5, s: 0.45 }, { nm: 659, w: 1.5, s: 0.45 },
        { nm: 555, w: 100, s: 0.88 }, { nm: 476.5, w: 1.2, s: 0.55 }, { nm: 475, w: 1.2, s: 0.55 }, { nm: 468.5, w: 1.2, s: 0.5 }, VIOLET],
      specNote: { zh: '与天然红宝石一样是铬谱，分光镜无法区分天然与合成', en: 'Same chromium spectrum as natural ruby: the spectroscope cannot separate them' },
      uv: { lw: [1.0, '#ff2040'], sw: [0.85, '#ff5a6a'] },
      uvNote: { zh: '长波很强红色；短波也较强，常带白垩感', en: 'LW very strong red; SW also strong, often chalky' },
      inc: ['curved', 'bubbles'],
      incNote: { zh: '弧形生长纹、气泡 —— 焰熔法合成的典型证据', en: 'Curved growth striae and gas bubbles: classic flame-fusion signs' },
    },
    {
      id: 'sapphire', zh: '蓝宝石', en: 'Blue Sapphire', species: ['刚玉', 'Corundum'], css: '#1f4fbf', color: 0x1f4fbf,
      optic: 'DR', char: 'U-', ri: { o: 1.770, e: 1.762 }, dr: 0.008, sg: 4.00, h: 9,
      chelsea: { css: '#2a3a36', zh: '暗绿至黑色（无红色反应）', en: 'Dark green to blackish (no red)' },
      spec: [{ nm: 450, w: 6, s: 0.85 }, { nm: 460, w: 3, s: 0.5 }, { nm: 471, w: 3, s: 0.45 }],
      specNote: { zh: '铁谱：蓝区 450nm 吸收带，460、470nm 弱线', en: 'Iron: 450 nm band, weaker lines at 460 and 470 nm' },
      uv: { lw: [0, '#000'], sw: [0.05, '#6a8cff'] },
      uvNote: { zh: '含铁，通常长、短波均惰性', en: 'Iron-bearing, usually inert under both LW and SW' },
      inc: ['silk', 'zoning'],
      incNote: { zh: '平直的六边形色带、金红石丝状物', en: 'Straight hexagonal colour zoning and rutile silk' },
    },
    {
      id: 'emerald', zh: '祖母绿', en: 'Emerald', species: ['绿柱石', 'Beryl'], css: '#139a5a', color: 0x139a5a,
      optic: 'DR', char: 'U-', ri: { o: 1.583, e: 1.577 }, dr: 0.006, sg: 2.72, h: 7.5,
      chelsea: { css: '#d0203a', zh: '粉红至红色（铬致色）', en: 'Pink to red (chromium)' },
      spec: [{ nm: 683, w: 1.2, s: 0.8 }, { nm: 680, w: 1.2, s: 0.75 }, { nm: 662, w: 1.2, s: 0.35 }, { nm: 646, w: 1.2, s: 0.35 },
        { nm: 605, w: 55, s: 0.35 }, { nm: 477, w: 1.2, s: 0.3 }, VIOLET],
      specNote: { zh: '铬谱：红区 683/680nm 双线，橙黄区弱吸收带，紫区吸收', en: 'Chromium: 683/680 nm doublet, weak orange-yellow band, violet absorbed' },
      uv: { lw: [0.15, '#ff4a5a'], sw: [0.05, '#ff4a5a'] },
      uvNote: { zh: '多为惰性或弱红色；注油的祖母绿可能有黄绿色荧光', en: 'Inert to weak red; oiled stones may glow yellow-green' },
      inc: ['threephase', 'jardin'],
      incNote: { zh: '三相包体（液体+气泡+石盐晶体，哥伦比亚产典型）；“花园”状裂隙', en: 'Three-phase inclusions (liquid + gas + halite, typical of Colombia); “jardin” fissures' },
    },
    {
      id: 'diamond', zh: '钻石', en: 'Diamond', species: ['金刚石', 'Diamond'], css: '#dfe8f0', color: 0xe8eef5,
      optic: 'SR', char: 'SR', ri: { n: 2.417 }, otl: true, dr: 0, sg: 3.52, h: 10,
      polar: { zh: '单折射：常见轻微异常消光（应力）', en: 'SR: often weak anomalous extinction (strain)' }, adr: 0.18,
      chelsea: { css: '#d8dde2', zh: '无变化', en: 'No change' },
      spec: [{ nm: 415.5, w: 2, s: 0.85 }, { nm: 478, w: 2, s: 0.3 }, { nm: 453, w: 1.5, s: 0.2 }],
      specNote: { zh: '开普系列（微黄）钻石：415.5nm 吸收线', en: 'Cape-series (yellowish) diamond: 415.5 nm line' },
      uv: { lw: [0.7, '#4f8cff'], sw: [0.3, '#6c9cff'] },
      uvNote: { zh: '长波常见蓝色荧光，强弱不一，短波较弱；也可能惰性', en: 'LW often blue (variable), SW weaker; can also be inert' },
      inc: ['crystal', 'feather'],
      incNote: { zh: '矿物晶体包体（黑点）、羽状裂隙', en: 'Included crystals (black spots) and feathers' },
    },
    {
      id: 'spinel', zh: '红色尖晶石', en: 'Red Spinel', species: ['尖晶石', 'Spinel'], css: '#d21f5a', color: 0xd21f5a,
      optic: 'SR', char: 'SR', ri: { n: 1.718 }, dr: 0, sg: 3.60, h: 8,
      chelsea: { css: '#ff3050', zh: '红色', en: 'Red' },
      spec: [{ nm: 686, w: 1, s: 0.8, em: true }, { nm: 684, w: 1, s: 0.7, em: true }, { nm: 675, w: 1, s: 0.5, em: true },
        { nm: 656, w: 1.5, s: 0.3 }, { nm: 540, w: 70, s: 0.7 }, VIOLET],
      specNote: { zh: '铬谱：红区一组“管风琴”状亮线，绿区宽吸收带', en: 'Chromium: “organ-pipe” bright lines in the red, broad green band' },
      uv: { lw: [0.8, '#ff2a45'], sw: [0.3, '#ff3a50'] },
      uvNote: { zh: '长波强红色，短波弱红色', en: 'LW strong red, SW weak red' },
      inc: ['octahedra'],
      incNote: { zh: '小八面体晶体（负晶）成排分布', en: 'Rows of tiny octahedral crystals (negative crystals)' },
    },
    {
      id: 'almandine', zh: '铁铝榴石', en: 'Almandine Garnet', species: ['石榴石', 'Garnet'], css: '#7a1426', color: 0x7a1426,
      optic: 'SR', char: 'SR', ri: { n: 1.790 }, dr: 0, sg: 4.05, h: 7.5,
      polar: { zh: '单折射：可见异常消光', en: 'SR: may show anomalous extinction' }, adr: 0.12,
      chelsea: { css: '#4a1a22', zh: '暗红，反应不明显', en: 'Dark, little reaction' },
      spec: [{ nm: 505, w: 7, s: 0.8 }, { nm: 527, w: 9, s: 0.75 }, { nm: 576, w: 12, s: 0.7 }, { nm: 617, w: 4, s: 0.3 }, { nm: 462, w: 4, s: 0.3 }],
      specNote: { zh: '铁铝榴石谱：505、527、576nm 三条吸收带（“三明治”）', en: 'Almandine: three bands at 505, 527 and 576 nm' },
      uv: { lw: [0, '#000'], sw: [0, '#000'] },
      uvNote: { zh: '含铁，惰性', en: 'Iron-rich, inert' },
      inc: ['needles2', 'crystal'],
      incNote: { zh: '两组以约 70°/110° 相交的金红石针、晶体包体', en: 'Rutile needles in two directions (~70°/110°), crystals' },
    },
    {
      id: 'amethyst', zh: '紫晶', en: 'Amethyst', species: ['石英', 'Quartz'], css: '#8a4fc8', color: 0x8a4fc8,
      optic: 'DR', char: 'U+', ri: { o: 1.544, e: 1.553 }, dr: 0.009, sg: 2.65, h: 7,
      conoNote: { zh: '石英特有“牛眼”干涉图（中心无黑十字）', en: 'Quartz shows a “bull’s-eye” figure (no cross in the centre)' }, bullseye: true,
      chelsea: { css: '#6a5a7a', zh: '灰紫色，基本不变', en: 'Greyish purple, little change' },
      spec: [],
      specNote: { zh: '无特征吸收谱', en: 'No diagnostic spectrum' },
      uv: { lw: [0, '#000'], sw: [0, '#000'] },
      uvNote: { zh: '通常惰性', en: 'Usually inert' },
      inc: ['tiger', 'fingerprint'],
      incNote: { zh: '“虎纹”状色带、两相指纹状包体', en: '“Tiger-stripe” colour zoning, two-phase fingerprints' },
    },
    {
      id: 'peridot', zh: '橄榄石', en: 'Peridot', species: ['橄榄石', 'Olivine'], css: '#8fbf1f', color: 0x8fbf1f,
      optic: 'DR', char: 'B+', ri: { a: 1.654, b: 1.669, g: 1.690 }, dr: 0.036, sg: 3.34, h: 6.5,
      chelsea: { css: '#4f6a2a', zh: '绿色，无红色反应', en: 'Green, no red' },
      spec: [{ nm: 453, w: 3, s: 0.7 }, { nm: 473, w: 3, s: 0.6 }, { nm: 493, w: 4, s: 0.6 }],
      specNote: { zh: '铁谱：蓝绿区 453、473、493nm 三条带', en: 'Iron: three bands at 453, 473 and 493 nm' },
      uv: { lw: [0, '#000'], sw: [0, '#000'] },
      uvNote: { zh: '惰性', en: 'Inert' },
      inc: ['lilypad', 'doubling'],
      incNote: { zh: '“睡莲叶”状包体；双折射大，可见明显后刻面棱重影', en: '“Lily-pad” inclusions; strong doubling of back facet edges' },
    },
    {
      id: 'jadeite', zh: '翡翠', en: 'Jadeite', species: ['硬玉', 'Jadeite jade'], css: '#2fa86a', color: 0x2fa86a, cut: 'cab',
      optic: 'AGG', char: 'AGG', ri: { n: 1.66 }, spot: true, dr: 0, sg: 3.33, h: 7,
      polar: { zh: '集合体：转动时始终明亮', en: 'Aggregate: stays light all the way round' },
      chelsea: { css: '#2f8a58', zh: '天然绿色翡翠：不变（仍为绿色）；染色翡翠可能变红', en: 'Natural green: stays green; dyed jade may turn red' },
      spec: [{ nm: 437, w: 1.5, s: 0.85 }, { nm: 630, w: 2, s: 0.4 }, { nm: 655, w: 2, s: 0.45 }, { nm: 690, w: 2, s: 0.5 }],
      specNote: { zh: '437nm 特征吸收线；铬致色的绿色可见红区 630/655/690nm 阶梯状线', en: 'Diagnostic 437 nm line; chromium green shows step-like lines at 630/655/690 nm' },
      uv: { lw: [0.03, '#9fffcf'], sw: [0, '#000'] },
      uvNote: { zh: '天然翡翠多为惰性；充胶处理（B 货）常有蓝白色荧光', en: 'Natural jadeite is mostly inert; polymer-impregnated (B jade) often fluoresces bluish white' },
      inc: ['granular'],
      incNote: { zh: '纤维交织/粒状结构，可见“翠性”（苍蝇翅闪光）', en: 'Interlocking granular texture with flashing cleavage planes (“fly-wing”)' },
    },
    {
      id: 'glass', zh: '绿色玻璃（仿制品）', en: 'Green Glass (imitation)', species: ['人造玻璃', 'Man-made glass'], css: '#2bb673', color: 0x2bb673,
      optic: 'SR', char: 'SR', ri: { n: 1.52 }, dr: 0, sg: 2.50, h: 5.5,
      polar: { zh: '单折射：常见“蛇形”异常消光', en: 'SR: often “snake-like” strain patterns' }, strain: true,
      chelsea: { css: '#2a9a5a', zh: '绿色，无变化（可区分祖母绿）', en: 'Stays green (helps separate from emerald)' },
      spec: [],
      specNote: { zh: '一般无特征谱（钴玻璃有三条宽带）', en: 'Usually nothing diagnostic (cobalt glass shows three broad bands)' },
      uv: { lw: [0.05, '#bfffd0'], sw: [0.3, '#cfe8ff'] },
      uvNote: { zh: '长波弱或惰性，短波常有白垩状荧光', en: 'LW weak or inert, SW often chalky' },
      inc: ['bubbles', 'swirl'],
      incNote: { zh: '圆形/拉长气泡、旋涡状流动纹', en: 'Round or elongated gas bubbles, swirl marks' },
    },
    {
      id: 'fluorite', zh: '萤石', en: 'Fluorite', species: ['萤石', 'Fluorite'], css: '#9a6ad8', color: 0x9a6ad8,
      optic: 'SR', char: 'SR', ri: { n: 1.434 }, dr: 0, sg: 3.18, h: 4,
      chelsea: { css: '#6a5878', zh: '灰紫色，基本不变', en: 'Greyish purple, little change' },
      spec: [],
      specNote: { zh: '紫色萤石一般无特征谱', en: 'Purple fluorite: usually nothing diagnostic' },
      uv: { lw: [0.95, '#6f5bff'], sw: [0.5, '#7f6bff'] },
      uvNote: { zh: '长波强蓝紫色 —— “荧光 fluorescence” 一词正源自萤石 fluorite', en: 'LW strong violet-blue: the word “fluorescence” comes from fluorite' },
      inc: ['cleavage', 'fingerprint'],
      incNote: { zh: '八面体解理形成的三角形裂纹、两相包体', en: 'Triangular cracks along octahedral cleavage, two-phase inclusions' },
    },
  ];

  G.gemById = (id) => G.gems.find((g) => g.id === id);

  // 光性文字 Optic character text
  G.opticText = function (g) {
    const m = {
      SR: ['单折射（均质体）', 'Singly refractive (isotropic)'],
      AGG: ['集合体', 'Aggregate'],
      'U+': ['一轴晶 正光性 (+)', 'Uniaxial positive (+)'],
      'U-': ['一轴晶 负光性 (−)', 'Uniaxial negative (−)'],
      'B+': ['二轴晶 正光性 (+)', 'Biaxial positive (+)'],
      'B-': ['二轴晶 负光性 (−)', 'Biaxial negative (−)'],
    }[g.char];
    return G.T(m[0], m[1]);
  };
  G.riText = function (g) {
    const r = g.ri;
    if (g.otl) return `${r.n}（${G.T('超出量程 OTL', 'over the limit')}）`;
    if (r.n) return (g.spot ? '≈' : '') + r.n.toFixed(g.spot ? 2 : 3);
    if (r.o) return `${Math.min(r.o, r.e).toFixed(3)} – ${Math.max(r.o, r.e).toFixed(3)}`;
    return `${r.a.toFixed(3)} – ${r.g.toFixed(3)}`;
  };
})();
