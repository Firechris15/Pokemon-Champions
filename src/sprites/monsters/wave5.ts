/** Sprites der Erweiterung (Phase 3), Teil 4: Psi, Faust, Metall. */
import { curve, eye, horn, limb, oval, part, poly, spike, star, type SpriteDef } from '../model.ts';

const mantira: SpriteDef = {
  palette: {
    body: '#7ab858',
    psi: '#e85a9b:3',
    wing: '#c8b8f0:3',
  },
  parts: [
    // Flügel und Hinterleib
    part(oval(45, 37, 4.5, 14, 28), 'wing', 1, { alpha: 0.75, anim: { sway: 4, pivot: [38, 30] } }),
    part(oval(42, 45, 6.5, 11, 32), 'body', 2, { id: 'abdomen' }),
    part(limb(37, 40, 47, 49, 0.6), 'body', 2.1, { clip: 'abdomen', tone: -1, lines: false }),
    // Beine
    part(limb(37, 47, 32, 58, 1.1, 0.8), 'body', 1.5, { tone: -1, group: 'legs' }),
    part(limb(43, 52, 49, 59, 1.1, 0.8), 'body', 1.5, { tone: -1, group: 'legs' }),
    part(limb(35, 49, 38, 59, 1.2, 0.8), 'body', 2.5, { group: 'legs-near' }),
    // Ferner Fangarm
    part(limb(30, 28, 22, 31, 1.7, 1.4), 'body', 2.6, { tone: -1, group: 'arm-far' }),
    part(horn(22, 31, 18, 26, 21, 19, 1.7), 'body', 2.7, { tone: -1, group: 'arm-far' }),
    // Brust und Kopf
    part(limb(35, 40, 29, 22, 3.2, 2.4), 'body', 3),
    part(poly([19, 13, 31, 11, 27, 22], 2.5), 'body', 4),
    part(oval(21, 14, 2.6, 3), 'psi', 4.2, { shading: 'glow' }),
    part(oval(29.5, 12.5, 2.2, 2.6), 'psi', 4.1, { shading: 'glow', tone: -1 }),
    part(oval(25.5, 15.5, 0.9), 'psi', 4.3, { view: 'front', shading: 'glow' }),
    part(curve([22, 12, 18, 4, 12, 3], 0.5), 'body', 3.8, { anim: { sway: 5, pivot: [22, 12] } }),
    part(curve([28, 11, 28, 4, 34, 1], 0.5), 'body', 3.8, {
      anim: { sway: 5, pivot: [28, 11], phase: 0.4 },
    }),
    // Naher Fangarm (Sense)
    part(limb(30, 29, 20, 35, 2, 1.6), 'body', 5, {
      group: 'arm',
      anim: { attackRot: -20, pivot: [30, 29] },
    }),
    part(horn(20, 35, 13, 30, 15, 20, 2.1), 'body', 5.1, {
      group: 'arm',
      anim: { attackRot: -20, pivot: [30, 29] },
    }),
    part(spike(15.5, 27, 18, 27.5, 1, 0.2), 'wing', 5.2, {
      anim: { attackRot: -20, pivot: [30, 29] },
    }),
    part(spike(14.6, 31, 17.2, 31.4, 1, 0.2), 'wing', 5.2, {
      anim: { attackRot: -20, pivot: [30, 29] },
    }),
  ],
};

const klosteraffe: SpriteDef = {
  palette: {
    body: '#7a6a5a',
    robe: '#e0782a:3',
    face: '#e8c8a0:3',
    psi: ['#c04a8a', '#ff8ac8'],
  },
  float: 2,
  breathe: 0.03,
  parts: [
    // Psi-Aura
    part(oval(32, 30, 20, 22), 'psi', 0, {
      alpha: 0.35,
      shading: 'flat',
      cut: [oval(32, 30, 18, 20)],
    }),
    // Eingerollter Schwanz
    part(curve([42, 50, 56, 50, 56, 36, 48, 34], 1.8, 1.4), 'body', 1, {
      anim: { sway: 5, pivot: [42, 50] },
    }),
    // Gekreuzte Beine im Schneidersitz
    part(oval(32, 50, 15, 5.5), 'robe', 2, { group: 'legs' }),
    part(oval(22, 52, 3.4, 2.2), 'face', 2.1, { mirror: true }),
    // Robe mit Gebetskette
    part(oval(32, 38, 10.5, 11), 'robe', 3, { id: 'robe' }),
    part(poly([27, 28, 32, 36, 37, 28, 36, 26, 32, 31, 28, 26], 0.5), 'body', 3.1, {
      clip: 'robe',
    }),
    ...[0, 1, 2, 3, 4].map((i) =>
      part(oval(25 + i * 3.5, 30 + Math.abs(i - 2) * -0.9 + 2, 1), 'psi', 3.2, { shading: 'glow' }),
    ),
    // Kopf
    part(oval(23.5, 18, 3, 3.4), 'body', 3.6, { mirror: true }),
    part(oval(23.5, 18, 1.6, 2), 'face', 3.65, { mirror: true }),
    part(oval(32, 17, 8, 7.5), 'body', 4),
    part(oval(32, 19.5, 5.6, 4.8), 'face', 4.1, { clip: 'body', view: 'front' }),
    part(curve([27.5, 17.5, 29.5, 19, 31.5, 17.5], 0.5), 'ink', 4.2, {
      view: 'front',
      lines: false,
    }),
    part(curve([32.5, 17.5, 34.5, 19, 36.5, 17.5], 0.5), 'ink', 4.2, {
      view: 'front',
      lines: false,
    }),
    part(curve([30.5, 22, 32, 23, 33.5, 22], 0.45), 'ink', 4.2, { view: 'front', lines: false }),
    part(oval(32, 12, 1.2), 'psi', 4.3, { view: 'front', shading: 'glow' }),
    // Hände zum Gebet
    part(limb(24, 31, 30, 36, 2.2, 1.8), 'body', 5, { group: 'arm-l' }),
    part(limb(40, 31, 34, 36, 2.2, 1.8), 'body', 5, { group: 'arm-r' }),
    part(oval(32, 34, 2, 3.4), 'face', 5.2),
  ],
};

const speculix: SpriteDef = {
  palette: {
    body: '#a8b0c4',
    glass: '#bcd8f0:3',
    psi: '#ff6ab0:3',
    gold: '#e0b860:3',
  },
  outline: '#262838',
  float: 3,
  breathe: 0.01,
  parts: [
    // Zierflügel am Rahmen
    part(spike(18, 22, 6, 14, 6, 1.5), 'gold', 1, {
      mirror: true,
      anim: { sway: 6, pivot: [18, 22] },
    }),
    part(spike(17, 32, 7, 36, 5, 1.5), 'gold', 1, {
      mirror: true,
      anim: { sway: 6, pivot: [17, 32], phase: 0.3 },
    }),
    // Griff
    part(limb(32, 42, 32, 56, 3, 2.2), 'body', 2, { gloss: true }),
    part(oval(32, 58, 3.4, 2.6), 'gold', 2.1, { gloss: true }),
    // Rahmen mit Krone
    part(star(32, 7, 4.5, 3, 0.45), 'gold', 2.5),
    part(oval(32, 26, 16.5, 18.5), 'body', 3, { gloss: true }),
    part(oval(32, 26, 13, 15), 'glass', 4, { id: 'glass', gloss: true }),
    part(limb(23, 30, 30, 15, 1.4), 'white', 4.2, { clip: 'glass', alpha: 0.6 }),
    part(limb(26, 35, 35, 17, 0.8), 'white', 4.2, { clip: 'glass', alpha: 0.5 }),
    // Augen im Spiegel
    part(oval(28, 27, 2, 3), 'psi', 4.4, { view: 'front', shading: 'glow' }),
    part(oval(36, 27, 2, 3), 'psi', 4.4, { view: 'front', shading: 'glow' }),
    part(oval(32, 6.6, 1.4), 'psi', 2.6, { shading: 'glow' }),
    part(oval(32, 45, 2, 1.6), 'psi', 3.1, { shading: 'glow' }),
  ],
};

const steppenboxer: SpriteDef = {
  palette: {
    body: '#c8925a',
    belly: '#f0dcb8:3',
    wrap: '#d83a3a:3',
  },
  parts: [
    // Kräftiger Schwanz
    part(curve([40, 46, 52, 52, 60, 58], 4.2, 2), 'body', 1, {
      anim: { sway: 3, pivot: [40, 46] },
    }),
    // Ferner Fuß und ferne Faust (Deckung)
    part(oval(42, 58, 7.5, 2.4), 'body', 1.5, { tone: -1, group: 'foot-far' }),
    part(limb(37, 27, 31, 22, 2.6, 2.2), 'body', 2, { tone: -1, group: 'arm-far' }),
    part(oval(28.5, 20, 4.4, 4.4), 'wrap', 2.1, { tone: -1, group: 'fist-far' }),
    // Körper
    part(oval(36, 36, 9.5, 12.5, 10), 'body', 3),
    part(oval(33, 39, 5.5, 9, 10), 'belly', 3.1, { clip: 'body', backMat: 'body' }),
    part(oval(40, 48, 6.5, 8), 'body', 3.2, { group: 'thigh' }),
    part(oval(34, 58.5, 9, 2.4), 'body', 3.3, { group: 'thigh' }),
    // Kopf mit langen Ohren
    part(oval(34, 9, 2.4, 6.5, 15), 'body', 3.5, { tone: -1 }),
    part(oval(30, 9, 2.6, 7, 5), 'body', 4.4),
    part(oval(29, 18, 6.2, 5.6), 'body', 4.5),
    part(oval(23, 20.5, 3.6, 2.8), 'belly', 4.6),
    part(oval(20.5, 19.7, 1.1, 0.9), 'ink', 5, { view: 'front', lines: false }),
    ...eye(27, 16.5, 1.6, 1.7, { lid: 0.35, lidTilt: 14, look: [-0.5, 0.2] }),
    // Nahe Schlagfaust
    part(limb(32, 29, 21, 32, 2.8, 2.4), 'body', 6, {
      group: 'arm',
      anim: { attackShift: [-3, 0] },
    }),
    part(oval(17, 31.5, 5.2, 5), 'wrap', 6.1, {
      gloss: true,
      anim: { attackShift: [-3, 0], bob: 0.6 },
    }),
  ],
};

const nachtkralle: SpriteDef = {
  palette: {
    body: '#33283e',
    scarf: '#8a2a4a:3',
    claw: '#e8e0f0:2',
    eye: ['#ffd23a'],
  },
  outline: '#120c18',
  parts: [
    // Wehender Schal
    part(curve([30, 20, 42, 18, 50, 24, 60, 20], 2, 1), 'scarf', 0.5, {
      anim: { sway: 7, pivot: [30, 20] },
    }),
    part(curve([30, 21, 40, 24, 46, 30, 54, 30], 1.6, 0.8), 'scarf', 0.5, {
      anim: { sway: 7, pivot: [30, 21], phase: 0.3 },
    }),
    // Schwanz
    part(curve([40, 44, 52, 46, 56, 38], 2, 1.2), 'body', 1, {
      anim: { sway: 6, pivot: [40, 44] },
    }),
    // Ferne Gliedmaßen
    part(limb(38, 46, 44, 52, 3, 2.4), 'body', 1.5, { tone: -1, group: 'leg-far' }),
    part(limb(44, 52, 42, 58, 2.2, 1.8), 'body', 1.5, { tone: -1, group: 'leg-far' }),
    part(limb(34, 28, 40, 36, 2.2, 1.8), 'body', 1.6, { tone: -1, group: 'arm-far' }),
    // Geduckter Körper
    part(oval(33, 37, 8, 10.5, 25), 'body', 2),
    part(limb(31, 46, 24, 52, 3.4, 2.6), 'body', 2.5, { group: 'leg' }),
    part(limb(24, 52, 29, 58, 2.4, 2), 'body', 2.5, { group: 'leg' }),
    // Kopf mit Pinselohren und Maske
    part(spike(31, 15, 34, 4, 4.5), 'body', 3, { tone: -1 }),
    part(oval(26, 21, 6.6, 6), 'body', 4),
    part(spike(24, 16, 23, 5, 4.5), 'body', 4.1),
    part(limb(19, 25, 31, 25.5, 2.6), 'scarf', 4.3, { clip: 'body', view: 'front' }),
    part(spike(23, 4.8, 23, 2, 1, 0.2), 'body', 4.15),
    ...eye(22.5, 20.4, 1.9, 1.3, { style: 'glow', lid: 0.25, lidTilt: 16 }),
    // Arm mit Krallen
    part(limb(28, 30, 18, 38, 2.4, 2), 'body', 5, {
      group: 'arm',
      anim: { attackShift: [-4, -2] },
    }),
    part(spike(17, 38, 11, 36, 1.4, 0.2), 'claw', 5.1, { anim: { attackShift: [-4, -2] } }),
    part(spike(17.5, 39, 12, 40, 1.4, 0.2), 'claw', 5.1, { anim: { attackShift: [-4, -2] } }),
    part(spike(18, 40, 14, 43, 1.4, 0.2), 'claw', 5.1, { anim: { attackShift: [-4, -2] } }),
  ],
};

const BLADE_WING = { sway: 5, pivot: [36, 26] as const };

const klingenfalke: SpriteDef = {
  palette: {
    body: '#6e7a8c',
    blade: '#d0dae8:3',
    chest: '#e8e0d0:3',
    beak: '#f0c040:3',
  },
  outline: '#1a1e28',
  parts: [
    // Ferner Klingenflügel
    part(spike(38, 26, 54, 6, 5, 1), 'blade', 1, { gloss: true, tone: -1, anim: BLADE_WING }),
    part(spike(40, 28, 59, 14, 5, 1), 'blade', 1, { gloss: true, tone: -1, anim: BLADE_WING }),
    // Schwanzklingen
    part(spike(40, 44, 50, 58, 4.4, 1), 'blade', 1.5, { gloss: true }),
    part(spike(42, 43, 55, 54, 4.4, 1), 'blade', 1.5, { gloss: true }),
    // Fänge
    part(limb(31, 47, 29, 56, 1.4), 'beak', 2, { group: 'leg-a' }),
    part(limb(36, 47, 37, 56, 1.4), 'beak', 1.9, { tone: -1, group: 'leg-b' }),
    part(horn(27, 57, 24, 57, 23, 59, 1), 'blade', 2.1),
    part(horn(35, 57, 32, 57, 31, 59, 1), 'blade', 2.0, { tone: -1 }),
    // Körper
    part(oval(34, 36, 9.5, 12.5, 15), 'body', 3),
    part(oval(30.5, 38, 5, 9, 15), 'chest', 3.1, { clip: 'body', backMat: 'body' }),
    part(limb(28, 34, 32, 34.5, 0.5), 'body', 3.2, { clip: 'chest', lines: false }),
    part(limb(27.5, 38, 31.5, 38.5, 0.5), 'body', 3.2, { clip: 'chest', lines: false }),
    // Kopf mit Hakenschnabel
    part(oval(27, 20, 6.6, 6), 'body', 4),
    part(oval(23, 23, 3.4, 2.4), 'chest', 4.1, { clip: 'body', view: 'front' }),
    part(horn(21.5, 18.5, 15, 18, 16, 24, 2.4), 'beak', 4.5),
    part(spike(31, 16, 38, 13, 3.6), 'body', 3.9),
    ...eye(24.5, 18.6, 1.8, 1.7, { lid: 0.45, lidTilt: 16, look: [-0.5, 0.3] }),
    // Naher Klingenflügel
    part(spike(35, 27, 46, 4, 5.5, 1), 'blade', 6, { gloss: true, anim: BLADE_WING }),
    part(spike(36, 29, 53, 11, 5.5, 1), 'blade', 6, { gloss: true, anim: BLADE_WING }),
    part(spike(37, 31, 56, 21, 5.5, 1), 'blade', 6, { gloss: true, anim: BLADE_WING }),
    part(oval(36, 30, 5, 4), 'body', 6.2, { anim: BLADE_WING }),
  ],
};

const ruestgeist: SpriteDef = {
  palette: {
    body: '#6a7488',
    ghost: '#8a7ae0:3',
    plume: '#a03050:3',
    rust: '#8a5a3a:2',
  },
  outline: '#16141e',
  breathe: 0.015,
  parts: [
    // Zerrissener Umhang
    part(poly([24, 18, 42, 18, 50, 52, 44, 48, 40, 56, 34, 50, 30, 54], 2), 'plume', 0.5, {
      tone: -1,
      anim: { sway: 3, pivot: [32, 18] },
    }),
    // Helmbusch
    part(curve([33, 6, 40, 2, 48, 6, 52, 14], 2.6, 1), 'plume', 1, {
      anim: { sway: 6, pivot: [33, 6] },
    }),
    // Beine
    part(poly([24, 42, 31, 42, 30, 58, 22, 58], 1.5), 'body', 2, { gloss: true, group: 'leg-a' }),
    part(poly([34, 42, 41, 42, 42, 58, 34, 58], 1.5), 'body', 1.9, {
      gloss: true,
      tone: -1,
      group: 'leg-b',
    }),
    // Brustpanzer
    part(poly([21, 22, 43, 22, 40, 44, 24, 44], 3), 'body', 3, { id: 'cuirass', gloss: true }),
    part(oval(32, 33, 3, 3), 'ghost', 3.2, { clip: 'cuirass', shading: 'glow' }),
    part(oval(38, 40, 2, 1.4), 'rust', 3.2, { clip: 'cuirass' }),
    // Helm mit Visier
    part(poly([24, 6, 38, 6, 39, 20, 23, 20], 3.5), 'body', 4, { id: 'helm', gloss: true }),
    part(limb(26, 12.5, 36, 12.5, 1.3), 'ink', 4.2, { clip: 'helm', lines: false }),
    part(limb(31, 12, 31, 18, 1), 'ink', 4.2, { clip: 'helm', lines: false }),
    part(oval(28, 12.5, 1.3, 0.9), 'ghost', 4.3, { view: 'front', shading: 'glow' }),
    part(oval(34, 12.5, 1.3, 0.9), 'ghost', 4.3, { view: 'front', shading: 'glow' }),
    // Schulterstücke
    part(oval(43, 24, 5.5, 4.5), 'body', 3.5, { gloss: true, tone: -1 }),
    part(oval(21, 24, 6, 5), 'body', 5, { gloss: true }),
    // Arm mit Schwert
    part(limb(20, 27, 15, 40, 3, 2.6), 'body', 5.1, { group: 'arm' }),
    part(limb(9, 41, 21, 41, 1.2), 'rust', 5.3, { group: 'guard' }),
    part(limb(15, 41, 15, 61, 1.8, 0.8), 'body', 5.2, {
      gloss: true,
      group: 'blade',
      anim: { attackRot: -40, pivot: [15, 41] },
    }),
    part(oval(15, 40, 2.6, 2.4), 'body', 5.4, { group: 'arm' }),
  ],
};

/** Gegliedertes Käferbein: Hüfte → Knie → Fuß. */
function beetleLeg(
  hx: number,
  hy: number,
  kx: number,
  ky: number,
  fx: number,
  fy: number,
  z: number,
  far: boolean,
) {
  const options = { group: `leg@${hx}${far ? 'f' : ''}`, ...(far ? { tone: -1 } : {}) };
  return [
    part(limb(hx, hy, kx, ky, 1.5, 1.2), 'body', z, options),
    part(limb(kx, ky, fx, fy, 1.1, 0.6), 'body', z, options),
  ];
}

const schmiedekaefer: SpriteDef = {
  palette: {
    body: '#5a6a82',
    horn: '#c0c8d4:3',
    hot: '#ff8a2a:3',
  },
  outline: '#141820',
  parts: [
    // Ferne Beine
    ...beetleLeg(28, 45, 24, 49, 21, 57, 1, true),
    ...beetleLeg(38, 46, 41, 51, 39, 58, 1, true),
    ...beetleLeg(47, 44, 54, 48, 56, 56, 1, true),
    // Panzer
    part(oval(37, 38, 17, 11.5, -6), 'body', 2, { id: 'shell', gloss: true }),
    part(curve([24, 30, 38, 28, 54, 36], 0.6), 'ink', 2.2, { clip: 'shell', lines: false }),
    part(oval(41, 33, 2, 1.4), 'hot', 2.2, { clip: 'shell', shading: 'glow' }),
    // Kopf mit geschmiedetem Horn (gegabelt)
    part(oval(21, 42, 7, 6), 'body', 3, { gloss: true }),
    part(curve([19, 40, 12, 36, 10, 26, 13, 18], 3.6, 1.6), 'horn', 3.5, { gloss: true }),
    part(spike(13, 19, 9, 13, 2.6, 0.5), 'horn', 3.55),
    part(spike(13, 19, 17, 13, 2.6, 0.5), 'horn', 3.55),
    part(oval(13, 19.5, 2, 2.4), 'hot', 3.6, { shading: 'glow', anim: { bob: 0.4 } }),
    ...eye(17.5, 43, 1.4, 1.4, { style: 'glow', iris: 'hot' }),
    // Nahe Beine
    ...beetleLeg(26, 47, 20, 51, 16, 58, 4, false),
    ...beetleLeg(35, 48, 36, 53, 32, 59, 4, false),
    ...beetleLeg(44, 47, 50, 51, 50, 59, 4, false),
  ],
};

export const WAVE_5: Readonly<Record<string, SpriteDef>> = {
  mantira,
  klosteraffe,
  speculix,
  steppenboxer,
  nachtkralle,
  klingenfalke,
  ruestgeist,
  schmiedekaefer,
};
