/** Sprites der Erweiterung (Phase 3), Teil 5: Gift, Schatten, Astral, Schwarm, Kristall, Spuk, Wind. */
import {
  curve,
  eye,
  flame,
  horn,
  limb,
  oval,
  part,
  poly,
  spike,
  star,
  wing,
  type Part,
  type SpriteDef,
} from '../model.ts';

const EEL = { sway: 4, pivot: [16, 32] as const };

const voltaal: SpriteDef = {
  palette: {
    body: '#1f5a6a',
    belly: '#a8d8c8:3',
    spark: '#ffe24a:3',
  },
  outline: '#0c1c24',
  float: 2,
  parts: [
    // Flossensaum entlang des Rückens
    part(curve([20, 22, 34, 6, 40, 44, 60, 32], 3, 0.6), 'spark', 1, {
      alpha: 0.85,
      shading: 'glow',
      anim: EEL,
    }),
    // Wellenförmiger Aalkörper
    part(curve([14, 32, 32, 12, 38, 52, 60, 38], 6.5, 2), 'body', 2, { id: 'eel', anim: EEL }),
    part(curve([14, 36, 31, 17, 36, 56, 58, 42], 2.4, 0.8), 'belly', 2.1, {
      clip: 'eel',
      anim: EEL,
    }),
    ...[
      [23, 23],
      [30, 22],
      [34, 32],
      [39, 41],
      [48, 42],
      [55, 39],
    ].map(([x = 0, y = 0]) =>
      part(oval(x, y, 1.3), 'spark', 2.2, { clip: 'eel', shading: 'glow', anim: EEL }),
    ),
    // Kopf
    part(oval(13, 33, 8.5, 6.4, -15), 'body', 3),
    part(oval(6.5, 36.5, 4.6, 3, -10), 'body', 3.1),
    part(curve([3, 37, 7, 39.5, 12, 38], 0.55), 'ink', 3.5, { view: 'front', lines: false }),
    part(poly([17, 38, 22, 44, 15, 41], 0.6), 'spark', 2.9, { shading: 'glow' }),
    ...eye(11, 31.5, 1.7, 1.7, { style: 'glow', iris: 'spark' }),
    // Lichtbögen
    part(poly([44, 52, 48, 56, 46, 57, 51, 62, 45, 58, 47, 57], 0.3), 'spark', 4, {
      shading: 'glow',
      anim: { bob: 1, phase: 0.4 },
    }),
    part(poly([6, 14, 9, 17, 7, 18, 11, 22, 5, 19, 7, 18], 0.3), 'spark', 4, {
      shading: 'glow',
      anim: { bob: 1, phase: 0.9 },
    }),
  ],
};

const moormolch: SpriteDef = {
  palette: {
    body: '#4a3a5c',
    belly: '#a8c870:3',
    gill: '#e07ab8:3',
    spot: '#9af04a:3',
  },
  parts: [
    // Schwanz mit Saum
    part(curve([44, 48, 54, 50, 58, 42, 62, 36], 3.6, 1), 'body', 1, {
      id: 'tail',
      anim: { sway: 7, pivot: [44, 48] },
    }),
    part(curve([46, 45, 55, 46, 59, 39, 62, 34], 1.4, 0.4), 'gill', 1.1, {
      anim: { sway: 7, pivot: [44, 48] },
    }),
    // Ferne Beine
    part(limb(24, 50, 18, 55, 1.8, 1.4), 'body', 1.5, { tone: -1, group: 'legs-far' }),
    part(limb(42, 50, 48, 56, 1.8, 1.4), 'body', 1.5, { tone: -1, group: 'legs-far' }),
    // Körper mit Giftflecken
    part(oval(33, 47, 14, 6.5), 'body', 2, { id: 'torso' }),
    part(oval(31, 51, 11, 2.6), 'belly', 2.1, { clip: 'body', backMat: 'body' }),
    part(oval(30, 43, 1.8, 1.4), 'spot', 2.2, { clip: 'torso', shading: 'glow' }),
    part(oval(38, 44, 1.6, 1.2), 'spot', 2.2, { clip: 'torso', shading: 'glow' }),
    part(oval(44, 47, 1.4, 1), 'spot', 2.2, { clip: 'torso', shading: 'glow' }),
    // Kiemenfedern
    part(spike(22, 40, 25, 31, 2.4, 0.6), 'gill', 2.5, { anim: { sway: 6, pivot: [22, 40] } }),
    part(spike(23, 42, 29, 36, 2.4, 0.6), 'gill', 2.5, {
      anim: { sway: 6, pivot: [23, 42], phase: 0.3 },
    }),
    part(spike(23, 44, 30, 42, 2.4, 0.6), 'gill', 2.5, {
      anim: { sway: 6, pivot: [23, 44], phase: 0.6 },
    }),
    // Kopf
    part(oval(16, 45, 8, 5.6), 'body', 3),
    part(oval(14, 48.5, 6, 2), 'belly', 3.1, { clip: 'body', view: 'front' }),
    part(curve([8, 47, 13, 49.5, 19, 48], 0.5), 'ink', 3.5, { view: 'front', lines: false }),
    ...eye(14, 42.5, 1.6, 1.6, { look: [-0.5, 0], style: 'button' }),
    // Nahe Beine
    part(limb(23, 50, 20, 57, 2, 1.6), 'body', 4, { group: 'leg-a' }),
    part(oval(19, 58, 2.6, 1.2), 'body', 4.1, { group: 'leg-a' }),
    part(limb(41, 51, 44, 57, 2, 1.6), 'body', 4, { group: 'leg-b' }),
    part(oval(45, 58, 2.6, 1.2), 'body', 4.1, { group: 'leg-b' }),
  ],
};

const stachelwespe: SpriteDef = {
  palette: {
    body: '#3a2a4a',
    stripe: '#f0c030:3',
    wing: '#d8e8f0:2',
    venom: '#b06ae0:3',
  },
  outline: '#140c1c',
  float: 2,
  parts: [
    // Flügel
    part(oval(36, 16, 4, 11, 30), 'wing', 1, { alpha: 0.6, anim: { sway: 16, pivot: [32, 26] } }),
    part(oval(40, 20, 3, 8, 55), 'wing', 1, {
      alpha: 0.6,
      anim: { sway: 16, pivot: [32, 26], phase: 0.2 },
    }),
    // Hinterleib mit Stachel
    part(spike(49, 50, 54, 59, 3.4, 0.5), 'venom', 1.5, {
      shading: 'glow',
      anim: { sway: 4, pivot: [36, 34] },
    }),
    part(oval(43, 42, 8, 11, -35), 'stripe', 2, {
      id: 'abdomen',
      anim: { sway: 4, pivot: [36, 34] },
    }),
    part(limb(36, 42, 46, 35, 1.8), 'body', 2.1, {
      clip: 'abdomen',
      anim: { sway: 4, pivot: [36, 34] },
    }),
    part(limb(39, 47, 50, 40, 1.8), 'body', 2.1, {
      clip: 'abdomen',
      anim: { sway: 4, pivot: [36, 34] },
    }),
    part(limb(43, 51, 52, 46, 1.6), 'body', 2.1, {
      clip: 'abdomen',
      anim: { sway: 4, pivot: [36, 34] },
    }),
    // Beine
    part(limb(28, 34, 24, 42, 0.9), 'body', 2.5, { group: 'legs' }),
    part(limb(31, 35, 30, 44, 0.9), 'body', 2.5, { group: 'legs' }),
    part(limb(34, 35, 36, 43, 0.9), 'body', 2.5, { group: 'legs' }),
    // Brust und Kopf mit Krone
    part(oval(31, 30, 6.5, 5.5), 'body', 3, { gloss: true }),
    part(oval(21, 24, 6, 5.5), 'stripe', 4),
    part(oval(19.5, 22.5, 2.6, 3.2), 'body', 4.2, { gloss: true }),
    part(spike(19, 19, 17, 13, 2.2, 0.4), 'venom', 4.3),
    part(spike(22, 18.5, 22, 12, 2.2, 0.4), 'venom', 4.3),
    part(spike(25, 19.5, 27, 13.5, 2.2, 0.4), 'venom', 4.3),
    part(horn(17, 28, 13, 29, 14, 32, 1.1), 'body', 4.4, { view: 'front' }),
    part(oval(18.8, 21.8, 0.8), 'white', 4.5, { view: 'front', shading: 'flat' }),
  ],
};

const duenenskorpion: SpriteDef = {
  palette: {
    body: '#c8a060',
    venom: '#b06ae0:3',
    dark: '#6a4a30:3',
  },
  parts: [
    // Ferne Beine
    ...[30, 36, 42, 48].map((x, i) =>
      part(limb(x, 50, x + 3 + i, 57, 1.2, 0.7), 'dark', 1, { group: 'legs-far' }),
    ),
    // Ferne Schere
    part(limb(26, 44, 16, 40, 2, 1.8), 'body', 1.5, { tone: -1, group: 'arm-far' }),
    part(oval(12, 38, 4.6, 3, -10), 'body', 1.6, { tone: -1, group: 'arm-far' }),
    // Körper
    part(oval(36, 48, 13.5, 6.5), 'body', 2, { id: 'torso' }),
    part(limb(30, 43, 31, 53, 0.5), 'dark', 2.1, { clip: 'torso', lines: false }),
    part(limb(36, 42, 37, 54, 0.5), 'dark', 2.1, { clip: 'torso', lines: false }),
    part(limb(42, 43, 43, 53, 0.5), 'dark', 2.1, { clip: 'torso', lines: false }),
    // Gebogener Schwanz mit Giftstachel
    ...[
      [48, 45, 4],
      [54, 41, 3.8],
      [57, 34, 3.6],
      [56, 27, 3.4],
      [52, 21, 3.2],
    ].map(([x = 0, y = 0, r = 3], i) =>
      part(oval(x, y, r, r), 'body', 2.5 + i * 0.01, {
        group: `seg${i}`,
        anim: { sway: 3, pivot: [46, 46] },
      }),
    ),
    part(horn(49, 19, 44, 17, 42, 22, 2.6), 'venom', 2.6, {
      shading: 'glow',
      anim: { sway: 3, pivot: [46, 46] },
    }),
    // Kopf
    part(oval(24, 48, 6, 4.5), 'body', 3),
    ...eye(21.5, 46.5, 1.2, 1.2, { style: 'glow', iris: 'venom' }),
    ...eye(24.5, 45.8, 1, 1, { style: 'glow', iris: 'venom' }),
    // Nahe Beine
    ...[28, 34, 40, 46].map((x, i) =>
      part(limb(x, 51, x - 4 + i, 59, 1.3, 0.8), 'dark', 4, { group: `leg${i}` }),
    ),
    // Nahe Schere
    part(limb(24, 50, 14, 50, 2.4, 2), 'body', 5, { group: 'arm', anim: { attackShift: [-3, 0] } }),
    part(oval(9, 49, 5.4, 3.6), 'body', 5.1, {
      group: 'claw',
      gloss: true,
      anim: { attackShift: [-3, 0] },
    }),
    part(horn(6, 47, 2, 44, 3, 41, 1.6), 'body', 5.05, {
      group: 'claw',
      anim: { attackShift: [-3, 0] },
    }),
  ],
};

const moorflatterer: SpriteDef = {
  palette: {
    body: '#3c2c50',
    wing: '#6a4a8a:3',
    ear: '#c87aa8:3',
    eye: ['#ffd23a'],
  },
  outline: '#140c20',
  float: 3,
  parts: [
    // Flughäute
    ...wing([27, 28], [16, 8, 6, 12, 2, 24, 6, 36], [25, 38], 'wing', 'body', 1, {
      mirror: true,
      anim: { sway: 10, pivot: [27, 28] },
    }),
    // Körper
    part(oval(32, 33, 6.5, 9), 'body', 2),
    part(oval(32, 35, 3.4, 5.5), 'ear', 2.1, { clip: 'body', view: 'front', tone: -1 }),
    // Füße
    part(horn(29, 41, 28, 45, 30, 46, 1), 'body', 1.9),
    part(horn(35, 41, 36, 45, 34, 46, 1), 'body', 1.9),
    // Kopf mit großen Ohren
    part(spike(27, 17, 21, 3, 7, 2), 'body', 2.8, { mirror: true }),
    part(spike(27, 16, 22.5, 6, 3.4, 1), 'ear', 2.9, { mirror: true, view: 'front' }),
    part(oval(32, 20, 7, 6), 'body', 3),
    ...eye(29, 19.5, 1.7, 1.7, { style: 'glow', mirror: true }),
    part(spike(30.5, 23.5, 30.5, 26, 1.2, 0.2), 'white', 3.5, { view: 'front', mirror: true }),
    // Schattenschwaden
    part(oval(14, 52, 4, 1.6), 'wing', 4, { alpha: 0.5, anim: { bob: 1.5, phase: 0.2 } }),
    part(oval(50, 50, 3.4, 1.4), 'wing', 4, { alpha: 0.5, anim: { bob: 1.5, phase: 0.7 } }),
  ],
};

const FOX_TAIL = (phase: number) => ({ sway: 6, pivot: [42, 50] as const, phase });

const mondfuchs: SpriteDef = {
  palette: {
    body: '#e6defa',
    fur: '#a890e0:3',
    moon: '#fff0b0:3',
  },
  outline: '#2a2048',
  parts: [
    // Drei Schweife mit Mondlichtern
    part(curve([42, 50, 54, 50, 58, 38, 54, 28], 4, 2.4), 'body', 1, { anim: FOX_TAIL(0) }),
    part(oval(53, 26, 3, 3.6), 'moon', 1.1, { shading: 'glow', anim: FOX_TAIL(0) }),
    part(curve([42, 50, 50, 44, 50, 30, 44, 20], 4, 2.4), 'body', 0.8, {
      tone: -1,
      anim: FOX_TAIL(0.3),
    }),
    part(oval(43, 18.5, 3, 3.6), 'moon', 0.9, { shading: 'glow', anim: FOX_TAIL(0.3) }),
    part(curve([42, 52, 56, 56, 62, 50, 62, 42], 3.8, 2.2), 'body', 1.2, { anim: FOX_TAIL(0.6) }),
    part(oval(61.5, 40.5, 2.6, 3.2), 'moon', 1.3, { shading: 'glow', anim: FOX_TAIL(0.6) }),
    // Körper (sitzend) mit Brust
    part(oval(38, 48, 9, 9.5), 'body', 2),
    part(oval(31, 40, 6.5, 9, 15), 'body', 2.05),
    part(oval(40, 54.5, 7, 4), 'body', 2.1, { group: 'haunch' }),
    part(oval(30, 46, 5, 9, 10), 'fur', 2.2, { clip: 'body', backMat: 'body', tone: 1 }),
    // Kopf
    part(spike(31, 22, 36, 11, 5.5), 'body', 2.8, { tone: -1 }),
    part(oval(27, 30, 7.4, 6.6), 'body', 3),
    part(limb(24, 33, 16, 35, 3.2, 1.6), 'body', 3.1),
    part(oval(15.4, 34.8, 1.2, 1), 'ink', 3.5, { view: 'front', lines: false }),
    part(spike(26, 24, 26, 12, 5.5), 'body', 3.3),
    part(spike(26, 23, 26, 15, 2.6, 0.8), 'fur', 3.4, { view: 'front' }),
    part(oval(28, 26.5, 2, 1.4), 'moon', 3.5, { shading: 'glow', cut: [oval(29, 26, 1.6, 1.2)] }),
    ...eye(24, 30, 1.7, 1.6, { iris: 'fur', look: [-0.5, 0] }),
    // Vorderbeine
    part(limb(31, 50, 30, 58, 2.2, 1.9), 'body', 4, { group: 'leg-a' }),
    part(limb(35, 51, 35, 58, 2.2, 1.9), 'body', 3.9, { tone: -1, group: 'leg-b' }),
  ],
};

const ringOf = (rx: number, ry: number, rot: number, z: number, extra: Partial<Part> = {}) =>
  part(oval(32, 30, rx, ry, rot), 'body', z, {
    cut: [oval(32, 30, rx - 2.6, ry - 2.6, rot)],
    gloss: true,
    ...extra,
  });

const astrolabix: SpriteDef = {
  palette: {
    body: '#c09a50',
    astral: '#f6b8ec:3',
    steel: '#9aa8c0:3',
  },
  outline: '#2a1e14',
  float: 2.5,
  breathe: 0.01,
  parts: [
    // Hintere Ringhälften
    ringOf(21, 21, 0, 1, { group: 'ring-a' }),
    ringOf(21, 9, 28, 1.1, { group: 'ring-b', anim: { sway: 8, pivot: [32, 30] } }),
    // Sternenkern mit Gesicht
    part(oval(32, 30, 8.5, 8.5), 'astral', 2, { shading: 'glow' }),
    part(star(32, 30, 11, 8, 0.45), 'astral', 1.9, { shading: 'glow', alpha: 0.6 }),
    part(oval(29.5, 29.5, 1.2, 1.8), 'ink', 2.2, { view: 'front', lines: false }),
    part(oval(34.5, 29.5, 1.2, 1.8), 'ink', 2.2, { view: 'front', lines: false }),
    // Vorderer, gekippter Ring
    part(oval(32, 30, 21, 9, -35), 'steel', 3, {
      cut: [oval(32, 30, 18.4, 6.6, -35), oval(32, 20, 30, 10)],
      gloss: true,
      anim: { sway: 8, pivot: [32, 30], phase: 0.5 },
    }),
    // Zeiger und Fuß
    part(spike(32, 8, 32, 1, 3, 0.6), 'body', 3.5),
    part(star(32, 2, 2.4), 'astral', 3.6, { shading: 'glow' }),
    part(limb(32, 51, 32, 56, 1.6), 'body', 0.5),
    part(oval(32, 58, 6, 2.2), 'body', 0.6),
  ],
};

const huegelbauer: SpriteDef = {
  palette: {
    body: '#a8744a',
    dark: '#3a2418:2',
    ant: '#e0d0a0:3',
  },
  breathe: 0.015,
  parts: [
    // Viele Beine darunter
    ...[18, 26, 34, 42, 50].map((x) => part(limb(x, 56, x + 2, 61, 1.2, 0.7), 'dark', 0.5)),
    // Termitenhügel mit Türmen
    part(
      poly(
        [12, 60, 15, 44, 20, 34, 24, 20, 29, 10, 33, 22, 37, 8, 42, 22, 47, 30, 52, 44, 56, 60],
        3,
      ),
      'body',
      1,
      {
        id: 'mound',
      },
    ),
    part(oval(27, 30, 2, 2.6), 'dark', 1.2, { clip: 'mound' }),
    part(oval(38, 22, 1.6, 2.2), 'dark', 1.2, { clip: 'mound' }),
    part(oval(42, 40, 2.2, 2.8), 'dark', 1.2, { clip: 'mound' }),
    part(oval(32, 44, 1.8, 2.2), 'dark', 1.2, { clip: 'mound' }),
    part(oval(47, 52, 1.8, 2), 'dark', 1.2, { clip: 'mound' }),
    part(curve([20, 50, 26, 46, 30, 52], 0.6), 'dark', 1.2, { clip: 'mound' }),
    // Kleine Termiten auf dem Bau
    part(oval(33, 32, 1.6, 1), 'ant', 2, { anim: { bob: 0.8, phase: 0.2 } }),
    part(oval(45, 46, 1.6, 1), 'ant', 2, { anim: { bob: 0.8, phase: 0.6 } }),
    part(oval(26, 40, 1.4, 0.9), 'ant', 2, { anim: { bob: 0.8, phase: 0.9 } }),
    // Soldatenkopf vorn mit Mandibeln
    part(oval(14, 50, 6.5, 5.4), 'ant', 3, { gloss: true }),
    part(horn(10, 52, 5, 54, 4, 50, 1.4), 'dark', 3.1),
    part(horn(11, 54, 7, 58, 4, 56, 1.4), 'dark', 3.1),
    part(curve([12, 45, 9, 40, 5, 39], 0.5), 'dark', 2.9, { anim: { sway: 6, pivot: [12, 45] } }),
    ...eye(12.5, 48.5, 1.2, 1.2, { style: 'button' }),
  ],
};

const terrax: SpriteDef = {
  palette: {
    body: '#7a8a5a',
    crystal: '#7ad8e0:3',
    leaf: '#4aa040:3',
    bark: ['#4a3020', '#7a5236'],
  },
  breathe: 0.012,
  parts: [
    // Ferne Beine
    part(limb(48, 48, 50, 58, 5.4, 5), 'body', 1, { tone: -1, group: 'legs-far' }),
    part(limb(24, 48, 22, 58, 5, 4.6), 'body', 1, { tone: -1, group: 'legs-far' }),
    // Baum auf dem Gipfel
    part(limb(40, 20, 41, 9, 1.4, 1), 'bark', 1.5),
    part(oval(41, 7, 7, 4.5), 'leaf', 1.6, { anim: { sway: 2, pivot: [41, 12] } }),
    part(oval(36, 9, 4, 3), 'leaf', 1.6, { anim: { sway: 2, pivot: [41, 12] } }),
    part(oval(46, 9.5, 4, 3), 'leaf', 1.6, { anim: { sway: 2, pivot: [41, 12] } }),
    // Kristallgipfel auf dem Panzer
    part(spike(30, 32, 28, 15, 9, 2), 'crystal', 2, { gloss: true }),
    part(spike(40, 30, 41, 16, 10, 2), 'crystal', 2.05, { gloss: true }),
    part(spike(50, 33, 54, 20, 8, 2), 'crystal', 2.1, { gloss: true }),
    // Panzer
    part(oval(38, 40, 21, 13), 'body', 3, { id: 'shell', cut: [oval(38, 58, 26, 9)] }),
    part(oval(30, 34, 6, 4), 'leaf', 3.1, { clip: 'shell', tone: -1 }),
    part(oval(46, 36, 5, 3.5), 'leaf', 3.1, { clip: 'shell', tone: -1 }),
    part(limb(18, 47, 58, 47, 1.2), 'bark', 3.2, { clip: 'shell' }),
    // Kopf mit Moosbart
    part(limb(20, 46, 12, 44, 4.6, 4), 'body', 3.5, { group: 'neck' }),
    part(oval(9, 43, 7, 5.8), 'body', 4),
    part(poly([5, 47, 13, 47, 9, 54], 1.5), 'leaf', 4.1, { tone: -1 }),
    part(curve([3, 45, 6, 46.5, 9, 46], 0.5), 'ink', 4.2, { view: 'front', lines: false }),
    ...eye(7, 41.5, 1.5, 1.4, { lid: 0.5, look: [-0.5, 0.3] }),
    // Nahe Beine
    part(limb(46, 50, 46, 59, 5.8, 5.4), 'body', 5, { group: 'leg-a' }),
    part(limb(28, 50, 28, 59, 5.6, 5.2), 'body', 5, { group: 'leg-b' }),
  ],
};

const granitringer: SpriteDef = {
  palette: {
    body: '#8a8a98',
    crystal: '#6ae0d0:3',
    belt: '#e0b040:3',
  },
  outline: '#1c1c24',
  breathe: 0.02,
  parts: [
    // Schulterkristalle
    part(spike(19, 22, 13, 9, 6, 1.5), 'crystal', 1, { gloss: true }),
    part(spike(23, 20, 21, 6, 5, 1.5), 'crystal', 1, { gloss: true }),
    part(spike(45, 22, 51, 9, 6, 1.5), 'crystal', 1, { gloss: true, tone: -1 }),
    part(spike(41, 20, 44, 7, 5, 1.5), 'crystal', 1, { gloss: true, tone: -1 }),
    // Beine
    part(limb(26, 46, 25, 58, 5, 4.6), 'body', 1.5, { group: 'leg-a' }),
    part(limb(38, 46, 40, 58, 5, 4.6), 'body', 1.4, { tone: -1, group: 'leg-b' }),
    // Massiger Rumpf
    part(oval(32, 34, 15.5, 13.5), 'body', 2, { id: 'torso' }),
    part(limb(22, 30, 26, 36, 0.6), 'ink', 2.1, { clip: 'torso', lines: false }),
    part(limb(40, 27, 43, 33, 0.6), 'ink', 2.1, { clip: 'torso', lines: false }),
    // Ringergürtel
    part(limb(17, 44, 47, 44, 3), 'belt', 2.5, { clip: 'torso', gloss: true }),
    part(oval(30, 44, 4.5, 3.6), 'belt', 2.6, { gloss: true }),
    part(oval(30, 44, 2, 1.6), 'crystal', 2.7, { gloss: true }),
    // Kleiner Kopf zwischen den Schultern
    part(oval(30, 18, 6.2, 5.6), 'body', 3),
    ...eye(27.5, 17.5, 1.3, 1.2, { lid: 0.45, lidTilt: 16, look: [-0.3, 0.2] }),
    ...eye(32.5, 17.5, 1.2, 1.1, { lid: 0.45, lidTilt: -16, look: [-0.3, 0.2] }),
    part(limb(27.5, 21.5, 32, 21.5, 0.45), 'ink', 3.5, { view: 'front', lines: false }),
    // Arme mit Fäusten
    part(limb(45, 28, 51, 42, 5, 4.4), 'body', 1.8, { tone: -1, group: 'arm-far' }),
    part(oval(51, 45, 5, 4.6), 'body', 1.9, { tone: -1, group: 'arm-far' }),
    part(limb(19, 28, 13, 42, 5.2, 4.6), 'body', 4, {
      group: 'arm',
      anim: { attackShift: [-3, -2] },
    }),
    part(oval(12, 45, 5.4, 5), 'body', 4.1, { group: 'arm', anim: { attackShift: [-4, -2] } }),
  ],
};

const gruftkatze: SpriteDef = {
  palette: {
    body: '#3a3a4a',
    ghost: '#6af0c8:3',
    gold: '#e0b850:2',
  },
  outline: '#121218',
  parts: [
    // Zwei Geisterschweife mit Flammen
    part(curve([40, 54, 50, 52, 54, 40, 50, 30], 2, 1.2), 'body', 1, {
      anim: { sway: 7, pivot: [40, 54] },
    }),
    part(flame(50, 31, 2.8, 9, -2), 'ghost', 1.1, {
      shading: 'glow',
      alpha: 0.85,
      anim: { sway: 9, pivot: [40, 54] },
    }),
    part(curve([40, 55, 54, 58, 60, 50, 60, 40], 1.8, 1), 'body', 0.8, {
      tone: -1,
      anim: { sway: 7, pivot: [40, 55], phase: 0.4 },
    }),
    part(flame(60, 41, 2.4, 8, 1), 'ghost', 0.9, {
      shading: 'glow',
      alpha: 0.85,
      anim: { sway: 9, pivot: [40, 55], phase: 0.4 },
    }),
    // Sitzender Körper
    part(oval(36, 48, 8.5, 10), 'body', 2),
    part(oval(38, 55.5, 7, 4), 'body', 2.1, { group: 'haunch' }),
    // Kopf mit großen Ohren
    part(spike(33, 25, 37, 14, 5.5), 'body', 2.8, { tone: -1 }),
    part(oval(29, 31, 7.6, 6.6), 'body', 3),
    part(spike(26, 26, 23, 14, 5.5), 'body', 3.2),
    part(spike(25.8, 24.5, 24, 17.5, 2.4, 0.6), 'ghost', 3.3, { view: 'front', tone: -1 }),
    ...eye(25.5, 30.5, 1.9, 2, { style: 'glow', iris: 'ghost', lid: 0.2 }),
    ...eye(31.5, 30.5, 1.7, 1.9, { style: 'glow', iris: 'ghost', lid: 0.2 }),
    part(oval(28, 34.5, 0.9, 0.7), 'ink', 3.5, { view: 'front', lines: false }),
    // Halsband mit Gruftschlüssel
    part(limb(23, 38, 34, 38.5, 1), 'gold', 3.6, { view: 'front' }),
    part(oval(28.5, 41, 1.6, 1.6), 'gold', 3.7, { view: 'front', cut: [oval(28.5, 41, 0.6, 0.6)] }),
    // Vorderbeine
    part(limb(31, 50, 30, 58, 2, 1.8), 'body', 4, { group: 'leg-a' }),
    part(limb(35, 51, 35, 58, 2, 1.8), 'body', 3.9, { tone: -1, group: 'leg-b' }),
  ],
};

const wolkenschaf: SpriteDef = {
  palette: {
    body: ['#7a86ac', '#a8b6d6', '#dce6f6', '#ffffff'],
    face: '#4a4a6a:3',
    horn: '#e0c080:3',
    astral: ['#c068b0', '#f6b8ec'],
  },
  outline: '#2a3048',
  float: 3,
  parts: [
    // Beinchen
    ...[24, 30, 38, 44].map((x, i) =>
      part(limb(x, 44, x, 51, 1.4, 1.2), 'face', 1, {
        group: `leg${i}`,
        ...(i % 2 ? { tone: -1 } : {}),
      }),
    ),
    // Wolkenwolle
    part(oval(36, 36, 15, 10), 'body', 2),
    part(oval(26, 31, 8, 7), 'body', 2.1),
    part(oval(36, 26, 9, 7.5), 'body', 2.1),
    part(oval(46, 30, 7.5, 6.5), 'body', 2.1),
    part(oval(50, 39, 6, 5.5), 'body', 2.1),
    // Gesicht mit Lockenhörnern
    part(oval(18, 36, 5.6, 6.2), 'face', 3),
    part(curve([20, 31, 25, 28, 26, 34, 22, 35], 1.6, 1), 'horn', 3.5),
    part(oval(12.5, 38, 1, 0.8), 'ink', 3.6, { view: 'front', lines: false }),
    part(curve([14, 33.5, 16, 35, 18, 33.5], 0.5), 'body', 3.6, { view: 'front', lines: false }),
    part(oval(21, 30, 3, 2.4), 'body', 3.4),
    // Sterne in der Wolle
    part(star(40, 33, 2.4), 'astral', 4, { shading: 'glow' }),
    part(star(8, 22, 2.4), 'astral', 4, { shading: 'glow', anim: { bob: 2, phase: 0.3 } }),
    part(star(58, 24, 2), 'astral', 4, { shading: 'glow', anim: { bob: 2, phase: 0.8 } }),
  ],
};

export const WAVE_6: Readonly<Record<string, SpriteDef>> = {
  voltaal,
  moormolch,
  stachelwespe,
  duenenskorpion,
  moorflatterer,
  mondfuchs,
  astrolabix,
  huegelbauer,
  terrax,
  granitringer,
  gruftkatze,
  wolkenschaf,
};
