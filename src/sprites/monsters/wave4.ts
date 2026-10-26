/** Sprites der Erweiterung (Phase 3), Teil 3: Funke, Kristall, Frost. */
import {
  curve,
  eye,
  flame,
  limb,
  oval,
  part,
  poly,
  spike,
  star,
  type SpriteDef,
} from '../model.ts';

const spulwerk: SpriteDef = {
  palette: {
    body: '#b8904a',
    steel: '#8a9ab0:3',
    copper: '#d07040:3',
    spark: '#ffe24a:3',
  },
  outline: '#2a1e14',
  breathe: 0.02,
  parts: [
    // Aufziehschlüssel auf dem Rücken
    part(limb(44, 36, 53, 34, 1.6), 'steel', 0.5, { group: 'key' }),
    part(oval(56.5, 33, 4.2, 5), 'steel', 0.6, {
      group: 'key',
      cut: [oval(56.5, 33, 1.8, 2.4)],
      anim: { sway: 25, pivot: [53, 34] },
    }),
    // Spulen-Fühler mit Funken
    part(curve([28, 24, 25, 18, 29, 14, 25, 8], 1.2), 'copper', 1, {
      anim: { sway: 5, pivot: [28, 24] },
    }),
    part(curve([37, 24, 40, 18, 36, 14, 40, 9], 1.2), 'copper', 1, {
      anim: { sway: 5, pivot: [37, 24], phase: 0.5 },
    }),
    part(star(25, 7, 3), 'spark', 1.2, { shading: 'glow', anim: { sway: 5, pivot: [28, 24] } }),
    part(star(40, 8, 3), 'spark', 1.2, {
      shading: 'glow',
      anim: { sway: 5, pivot: [37, 24], phase: 0.5 },
    }),
    // Beine
    part(limb(26, 48, 24, 57, 2.4), 'steel', 1.5, { group: 'leg-a' }),
    part(oval(23, 58.5, 4, 2), 'steel', 1.6, { group: 'leg-a' }),
    part(limb(39, 48, 41, 57, 2.4), 'steel', 1.4, { tone: -1, group: 'leg-b' }),
    part(oval(42, 58.5, 4, 2), 'steel', 1.45, { tone: -1, group: 'leg-b' }),
    // Zahnradkörper
    part(star(33, 38, 16.5, 12, 0.84), 'body', 2, { tone: -1, group: 'gear' }),
    part(oval(33, 38, 14, 14), 'body', 3, { gloss: true }),
    part(oval(30, 36.5, 8.5, 8.5), 'steel', 3.5, { id: 'face', gloss: true }),
    part(oval(28.5, 35.5, 4.2, 4.2), 'spark', 3.7, { view: 'front', shading: 'glow' }),
    part(oval(27.5, 34.5, 1.2), 'white', 3.8, { view: 'front', shading: 'flat' }),
    part(limb(34, 40, 36, 42, 0.6), 'ink', 3.6, { clip: 'face', lines: false }),
    part(oval(42, 30, 1.2), 'copper', 3.6, { clip: 'body' }),
    part(oval(43, 46, 1.2), 'copper', 3.6, { clip: 'body' }),
    // Kolbenarm
    part(limb(21, 41, 13, 45, 2), 'copper', 4, { group: 'arm' }),
    part(oval(11.5, 46, 3, 3), 'steel', 4.1, { group: 'arm' }),
  ],
};

const BOLT_WING = { sway: 5, pivot: [36, 28] as const };

const fulgurax: SpriteDef = {
  palette: {
    body: '#2c3a6a',
    wing: '#5c6cd0:3',
    bolt: '#ffe24a:3',
    belly: '#a8b8e0:3',
    eye: ['#fffbe0'],
  },
  breathe: 0.02,
  parts: [
    // Schwanz mit Blitzspitze
    part(curve([40, 50, 54, 56, 60, 44], 4.4, 1.6), 'body', 1, {
      anim: { sway: 4, pivot: [40, 50] },
    }),
    part(poly([58, 46, 62, 36, 59, 38, 62, 30, 56, 40, 59, 40], 0.6), 'bolt', 1.1, {
      shading: 'glow',
      anim: { sway: 5, pivot: [40, 50] },
    }),
    // Ferner Flügel
    part(
      poly([38, 28, 50, 6, 52, 13, 58, 9, 56, 18, 63, 17, 56, 26, 60, 30, 48, 34], 2),
      'wing',
      2,
      {
        tone: -1,
        anim: BOLT_WING,
      },
    ),
    // Beine
    part(limb(40, 48, 44, 58, 4.6, 3.6), 'body', 2.5, { tone: -1, group: 'leg-far' }),
    // Körper
    part(oval(34, 40, 10.5, 14), 'body', 3),
    part(oval(31, 43, 6, 10), 'belly', 3.1, { clip: 'body', backMat: 'body' }),
    part(poly([37, 30, 41, 36, 37, 37, 42, 45, 35, 38, 38, 37], 0.4), 'bolt', 3.2, {
      clip: 'body',
      shading: 'glow',
    }),
    // Hals und Kopf mit Blitzhörnern
    part(curve([30, 30, 24, 22, 22, 14], 5, 4), 'body', 4),
    part(poly([25, 8, 29, 1, 28, 6, 33, 2, 30, 10], 0.6), 'bolt', 4.4, { shading: 'glow' }),
    part(oval(20, 12, 7, 5.6, -10), 'body', 4.5),
    part(oval(13, 15, 5, 3.2, 10), 'body', 4.6),
    part(curve([9, 16.5, 12, 18, 16, 17], 0.5), 'ink', 5, { view: 'front', lines: false }),
    part(poly([18, 7, 21, -1, 21, 5, 25, 1, 23, 9], 0.6), 'bolt', 4.7, { shading: 'glow' }),
    ...eye(17.5, 11, 1.8, 1.5, { style: 'glow', lid: 0.35, lidTilt: 15 }),
    // Arme
    part(limb(28, 36, 21, 42, 2.4, 2), 'body', 5, { group: 'arm' }),
    part(spike(21, 42, 17, 44, 1.6, 0.2), 'white', 5.1),
    part(limb(29, 49, 26, 58, 5, 3.8), 'body', 5, { group: 'leg' }),
    part(oval(24.5, 59, 5, 2), 'body', 5.1, { group: 'leg' }),
    // Naher Flügel
    part(
      poly([34, 30, 34, 4, 38, 10, 42, 3, 43, 13, 50, 10, 47, 20, 54, 22, 44, 32], 2),
      'wing',
      6,
      {
        backZ: 7,
        anim: BOLT_WING,
      },
    ),
    part(poly([37, 26, 39, 16, 38, 18, 42, 12, 40, 20, 41, 20], 0.4), 'bolt', 6.1, {
      shading: 'glow',
      anim: BOLT_WING,
    }),
  ],
};

/** Quarzstacheln im Fächer um den Rücken. */
function quills(
  cx: number,
  cy: number,
  inner: number,
  outer: number,
  from: number,
  to: number,
  count: number,
) {
  const out: ReturnType<typeof part>[] = [];
  for (let i = 0; i < count; i++) {
    const a = ((from + ((to - from) * i) / (count - 1)) * Math.PI) / 180;
    const bx = cx + Math.cos(a) * inner;
    const by = cy + Math.sin(a) * inner;
    const tx = cx + Math.cos(a) * (outer + (i % 2) * 3);
    const ty = cy + Math.sin(a) * (outer + (i % 2) * 3);
    out.push(
      part(spike(bx, by, tx, ty, 4.4, 1.2), 'body', 1 + (i % 2) * 0.1, {
        gloss: true,
        group: `quill${i % 2}`,
      }),
    );
  }
  return out;
}

const quarzigel: SpriteDef = {
  palette: {
    body: '#b8a8ec',
    face: '#e8c898:3',
    spark: '#ffe24a:3',
    nose: ['#3a2430'],
  },
  outline: '#2a2048',
  breathe: 0.035,
  parts: [
    ...quills(36, 46, 8, 18, 175, 345, 9),
    // Körper
    part(oval(36, 47, 13.5, 10), 'face', 2, { tone: -1 }),
    part(oval(36, 44, 12.5, 8.5), 'body', 2.5),
    // Gesicht
    part(oval(21, 49, 7, 6), 'face', 3),
    part(oval(14.5, 51, 3, 2.4), 'face', 3.1),
    part(oval(12.3, 50.5, 1.5, 1.3), 'nose', 3.5, { view: 'front' }),
    ...eye(20, 47.5, 1.6, 1.8, { style: 'button', z: 3.4 }),
    part(oval(22, 52, 1.6, 1), 'spark', 3.4, { view: 'front', shading: 'flat', tone: -1 }),
    // Füße
    part(oval(27, 57.5, 3, 1.8), 'face', 1.9, { tone: -1 }),
    part(oval(43, 57.5, 3, 1.8), 'face', 1.9, { tone: -1 }),
    // Funken zwischen den Stacheln
    part(star(30, 24, 2.6), 'spark', 4, { shading: 'glow', anim: { bob: 1.2, phase: 0.1 } }),
    part(star(56, 34, 2.2), 'spark', 4, { shading: 'glow', anim: { bob: 1.2, phase: 0.6 } }),
  ],
};

const firnmammut: SpriteDef = {
  palette: {
    body: '#b4c4d6',
    tusk: '#f0e8d0:3',
    snow: '#f6faff:2',
    skin: '#5a6a7c:3',
  },
  breathe: 0.015,
  parts: [
    // Ferne Beine und ferner Stoßzahn
    part(limb(47, 46, 48, 58, 5, 4.6), 'body', 1, { tone: -1, group: 'legs-far' }),
    part(limb(27, 46, 26, 58, 4.6, 4.2), 'body', 1, { tone: -1, group: 'legs-far' }),
    part(curve([20, 41, 15, 50, 8, 47], 2, 0.8), 'tusk', 1.2, { tone: -1 }),
    // Zotteliger Körper
    part(oval(39, 37, 20, 15), 'body', 2, { id: 'coat' }),
    part(oval(42, 24.5, 12, 4.5, 4), 'snow', 2.2, { clip: 'coat', shading: 'flat' }),
    part(oval(36, 23, 5, 2.2), 'snow', 1.8),
    part(limb(30, 30, 33, 40, 0.6), 'skin', 2.3, { clip: 'coat', lines: false }),
    part(limb(42, 31, 44, 41, 0.6), 'skin', 2.3, { clip: 'coat', lines: false }),
    part(limb(50, 30, 53, 39, 0.6), 'skin', 2.3, { clip: 'coat', lines: false }),
    // Zotteln am Bauch
    part(spike(26, 45, 25, 52, 4.5, 1), 'body', 5.5, { group: 'fringe', tone: -1 }),
    part(spike(35, 48, 35.5, 53, 4.5, 1), 'body', 5.5, { group: 'fringe', tone: -1 }),
    part(spike(50, 46, 52, 52, 4.5, 1), 'body', 5.5, { group: 'fringe', tone: -1 }),
    // Kopf mit Rüssel
    part(oval(26, 30, 4.5, 7), 'body', 2.6, { tone: -1 }),
    part(oval(19, 31, 10, 10), 'body', 3),
    part(curve([13, 36, 8, 46, 11, 54, 6, 57], 3.6, 2), 'body', 3.2, {
      anim: { sway: 5, pivot: [13, 36] },
    }),
    ...eye(15, 29.5, 1.5, 1.5, { lid: 0.35, look: [-0.4, 0.2] }),
    // Naher Stoßzahn
    part(curve([16, 40, 10, 50, 2, 45], 2.4, 0.9), 'tusk', 4),
    // Nahe Beine
    part(limb(44, 48, 44, 58, 5.6, 5.2), 'body', 5, { group: 'leg-a' }),
    part(oval(44, 59, 5.6, 2), 'skin', 5.1, { group: 'leg-a' }),
    part(limb(29, 47, 29, 58, 5.4, 5), 'body', 5, { group: 'leg-b' }),
    part(oval(29, 59, 5.4, 2), 'skin', 5.1, { group: 'leg-b' }),
  ],
};

const firnhase: SpriteDef = {
  palette: {
    body: '#eef2f8',
    ice: '#7ad0ee:3',
    nose: ['#d06a8a', '#ffb0c8'],
  },
  outline: '#26304a',
  parts: [
    // Ferne Ohren
    part(oval(29, 15, 3, 10.5, 25), 'body', 1, {
      tone: -1,
      id: 'ear-far',
      anim: { sway: 6, pivot: [27, 25] },
    }),
    part(oval(32.5, 8, 2.5, 3.5, 25), 'ice', 1.1, {
      clip: 'ear-far',
      tone: -1,
      anim: { sway: 6, pivot: [27, 25] },
    }),
    // Ferne Beine
    part(limb(22, 44, 16, 48, 2, 1.6), 'body', 1.5, { tone: -1, group: 'legs-far' }),
    part(oval(50, 55, 7, 2.6, -5), 'body', 1.5, { tone: -1, group: 'legs-far' }),
    // Körper im Sprung
    part(oval(36, 42, 12.5, 8.5, -12), 'body', 2),
    part(oval(49.5, 36, 3.6, 3.2), 'body', 1.9),
    part(oval(42, 48, 7, 6), 'body', 2.2, { group: 'thigh' }),
    part(oval(44, 56, 8, 2.6, -5), 'body', 2.3, { group: 'thigh' }),
    // Kopf
    part(oval(22, 32, 7.5, 6.5), 'body', 3),
    part(oval(15.5, 34.5, 3.4, 2.6), 'body', 3.1),
    part(oval(12.8, 33.6, 1.4, 1.1), 'nose', 3.5, { view: 'front' }),
    ...eye(19.5, 30.5, 2, 2.2, { iris: 'ice', look: [-0.6, 0] }),
    // Nahes Ohr mit Eisspitze
    part(oval(25, 16, 3.2, 11, 8), 'body', 4, {
      id: 'ear',
      anim: { sway: 6, pivot: [24, 26], phase: 0.15 },
    }),
    part(oval(26.5, 7, 2.6, 3.8, 8), 'ice', 4.1, {
      clip: 'ear',
      anim: { sway: 6, pivot: [24, 26], phase: 0.15 },
    }),
    part(oval(25, 17, 1.2, 6.5, 8), 'nose', 4.1, {
      clip: 'ear',
      view: 'front',
      tone: -1,
      anim: { sway: 6, pivot: [24, 26], phase: 0.15 },
    }),
    // Vorderbein
    part(limb(28, 46, 21, 51, 2.4, 1.9), 'body', 5, { group: 'arm' }),
    // Frostkristalle
    part(star(8, 46, 2.6, 6, 0.4), 'ice', 6, { shading: 'glow', anim: { bob: 1.5, phase: 0.3 } }),
    part(star(57, 22, 2.2, 6, 0.4), 'ice', 6, { shading: 'glow', anim: { bob: 1.5, phase: 0.8 } }),
  ],
};

const raureifel: SpriteDef = {
  palette: {
    body: '#e8f4ff:3',
    ice: '#7cc8ee',
    astral: '#f0a8e0:3',
  },
  outline: '#223050',
  float: 3,
  parts: [
    // Frostflügel
    part(oval(22, 22, 6, 10, -35), 'astral', 0.5, {
      alpha: 0.7,
      mirror: true,
      anim: { sway: 12, pivot: [28, 30] },
    }),
    // Schneeflocke als Körper
    part(star(32, 31, 21, 6, 0.28), 'ice', 1, { shading: 'bevel', gloss: true, id: 'flake' }),
    ...[0, 60, 120, 180, 240, 300].map((deg) => {
      const a = ((deg - 90) * Math.PI) / 180;
      const bx = 32 + Math.cos(a) * 13;
      const by = 31 + Math.sin(a) * 13;
      return part(star(bx, by, 4.2, 6, 0.35, deg), 'ice', 1.5, {
        shading: 'bevel',
        group: 'branches',
      });
    }),
    // Gesicht in der Mitte
    part(oval(32, 31, 8, 7.5), 'body', 2),
    ...eye(29, 30.5, 1.8, 2.2, { mirror: true, look: [0, 0.2], iris: 'ice' }),
    part(oval(26.5, 34, 1.5, 0.9), 'astral', 3, { mirror: true, view: 'front', shading: 'flat' }),
    part(curve([30.5, 34.5, 32, 35.6, 33.5, 34.5], 0.45), 'ink', 3, {
      view: 'front',
      lines: false,
    }),
    // Sternkrone
    part(star(32, 20, 2.8, 5), 'astral', 3, { shading: 'glow' }),
    // Glitzer
    part(star(8, 52, 2.2), 'astral', 4, { shading: 'glow', anim: { bob: 2, phase: 0.2 } }),
    part(star(56, 48, 2), 'astral', 4, { shading: 'glow', anim: { bob: 2, phase: 0.7 } }),
  ],
};

const packeiswal: SpriteDef = {
  palette: {
    body: '#3a6a9a',
    belly: '#d8e8f0:3',
    ice: '#bfeaff:3',
    water: '#3a8ee8:3',
  },
  breathe: 0.015,
  parts: [
    // Schwanzflosse
    part(curve([50, 46, 56, 40, 58, 30], 4, 2.6), 'body', 1, {
      anim: { sway: 5, pivot: [50, 46] },
    }),
    part(poly([58, 31, 51, 22, 56, 25, 60, 28, 64, 22, 62, 30], 1.5), 'body', 1.1, {
      anim: { sway: 5, pivot: [50, 46] },
    }),
    // Eisscholle auf dem Rücken
    part(
      poly([18, 35, 21, 27, 27, 25, 29, 19, 37, 18, 41, 24, 45, 25, 47, 35], 1.2, [-0.3, -0.6]),
      'ice',
      2,
      {
        gloss: true,
        id: 'floe',
      },
    ),
    part(poly([29, 19, 37, 18, 36, 25, 30, 25], 0.8, [0.6, -0.3]), 'ice', 2.1, {
      clip: 'floe',
      shading: 'bevel',
    }),
    part(poly([21, 27, 27, 25, 27, 31, 22, 31], 0.8, [-0.6, 0.3]), 'ice', 2.1, {
      clip: 'floe',
      shading: 'bevel',
    }),
    // Walkörper
    part(oval(32, 45, 24, 11.5, -4), 'body', 3),
    part(oval(26, 51, 18, 5.5, -4), 'belly', 3.1, { clip: 'body', backMat: 'body' }),
    part(limb(14, 50, 30, 54, 0.5), 'body', 3.2, { clip: 'belly', tone: -1, lines: false }),
    part(limb(16, 52.5, 30, 56, 0.5), 'body', 3.2, { clip: 'belly', tone: -1, lines: false }),
    part(curve([9, 47, 15, 50, 22, 48], 0.6), 'ink', 3.3, { view: 'front', lines: false }),
    ...eye(17, 43, 1.6, 1.6, { look: [-0.4, 0.2] }),
    // Brustflosse
    part(poly([26, 50, 20, 59, 30, 56, 32, 50], 1.5), 'body', 4, {
      anim: { sway: 5, pivot: [28, 51] },
    }),
    // Wasser
    part(oval(32, 60, 31, 4), 'water', 5, { id: 'sea', alpha: 0.9 }),
    part(oval(12, 57.5, 4, 1), 'white', 5.1, { clip: 'sea', shading: 'flat' }),
    part(oval(50, 58, 3.5, 0.9), 'white', 5.1, { clip: 'sea', shading: 'flat' }),
  ],
};

const firnseele: SpriteDef = {
  palette: {
    body: '#c8e0f0',
    void: '#1e2440:2',
    wisp: '#7ff0ff:3',
    scarf: '#8a70d0:3',
  },
  outline: '#1e2a44',
  float: 3,
  parts: [
    // Wehender Schal
    part(curve([36, 22, 46, 20, 52, 26, 58, 22], 1.8, 0.8), 'scarf', 0.5, {
      anim: { sway: 8, pivot: [36, 22] },
    }),
    // Mantel mit zerfranstem Saum
    part(
      poly(
        [
          31, 6, 40, 14, 44, 30, 47, 44, 42, 52, 38, 48, 34, 58, 30, 50, 25, 56, 22, 46, 18, 40, 22,
          18,
        ],
        3,
      ),
      'body',
      1,
      { id: 'cloak', alpha: 0.92, anim: { sway: 2, pivot: [32, 10] } },
    ),
    part(curve([24, 24, 32, 27, 40, 24], 2.2), 'scarf', 1.5, { clip: 'cloak' }),
    // Kapuzenöffnung mit Augen
    part(oval(29, 18, 5.6, 6.4), 'void', 2, { clip: 'cloak' }),
    part(oval(27, 18, 1.1, 1.6), 'wisp', 2.2, { view: 'front', shading: 'glow' }),
    part(oval(31.5, 18, 1, 1.5), 'wisp', 2.2, { view: 'front', shading: 'glow' }),
    // Arm mit Irrlicht
    part(limb(25, 30, 15, 37, 2.8, 2.2), 'body', 3, { alpha: 0.92, anim: { bob: 0.6 } }),
    part(flame(12, 44, 3.6, 9, 1), 'wisp', 3.5, {
      shading: 'glow',
      anim: { bob: 1.2, phase: 0.3 },
    }),
    // Schneeflocken
    part(star(52, 44, 2.2, 6, 0.4), 'body', 4, { shading: 'glow', anim: { bob: 2, phase: 0.2 } }),
    part(star(8, 16, 2, 6, 0.4), 'body', 4, { shading: 'glow', anim: { bob: 2, phase: 0.7 } }),
  ],
};

export const WAVE_4: Readonly<Record<string, SpriteDef>> = {
  spulwerk,
  fulgurax,
  quarzigel,
  firnmammut,
  firnhase,
  raureifel,
  packeiswal,
  firnseele,
};
