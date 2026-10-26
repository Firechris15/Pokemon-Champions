/** Sprites der Erweiterung (Phase 3), Teil 1: Glut, Flut. */
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

const aschwolf: SpriteDef = {
  palette: {
    body: '#3c3644',
    belly: '#6c6274:3',
    ember: '#ff8a2a:3',
    eye: ['#ffd23a'],
  },
  parts: [
    // Schwanz mit Glutspitze
    part(curve([45, 40, 55, 37, 59, 27], 3.6, 2.2), 'body', 1, {
      backZ: 12,
      anim: { sway: 7, pivot: [45, 40] },
    }),
    part(flame(59, 29, 2.8, 9, 1), 'ember', 1.2, {
      shading: 'glow',
      backZ: 12.2,
      anim: { sway: 9, pivot: [45, 40] },
    }),
    // Ferne Beine
    part(limb(23, 44, 21, 58, 2.6, 2.2), 'body', 2, { tone: -1, group: 'legs-far' }),
    part(limb(45, 45, 49, 51, 3.4, 2.6), 'body', 2, { tone: -1, group: 'legs-far' }),
    part(limb(49, 51, 47, 58, 2.4, 2), 'body', 2, { tone: -1, group: 'legs-far' }),
    // Glutmähne
    part(flame(31, 36, 3.6, 12, 8), 'ember', 3, {
      shading: 'glow',
      anim: { sway: 5, pivot: [31, 36] },
    }),
    part(flame(26, 34, 3.6, 13, 6), 'ember', 3, {
      shading: 'glow',
      anim: { sway: 5, pivot: [26, 34], phase: 0.3 },
    }),
    part(flame(21, 31, 3, 10, 4), 'ember', 3, {
      shading: 'glow',
      anim: { sway: 5, pivot: [21, 31], phase: 0.6 },
    }),
    // Körper
    part(oval(36, 42, 13, 7.5, -4), 'body', 4),
    part(oval(33, 46, 9, 3), 'belly', 4.2, { clip: 'body', backMat: 'body' }),
    part(oval(24, 39, 7, 7.5), 'body', 4.5),
    // Kopf
    part(spike(23, 26, 27, 16, 5), 'body', 5, { tone: -1 }),
    part(oval(17, 30, 6.8, 5.6), 'body', 5.5),
    part(limb(14, 32.5, 6, 34.5, 3.3, 2.1), 'body', 5.6),
    part(limb(13, 34.5, 7, 35.8, 1.6, 1), 'belly', 5.7, { clip: 'body', view: 'front' }),
    part(spike(19, 26, 20, 16, 5), 'body', 5.8),
    part(oval(5.6, 33.8, 1.5, 1.2), 'ink', 6, { view: 'front', lines: false }),
    part(spike(9, 36, 9.6, 38.5, 1.4, 0.2), 'white', 6, { view: 'front' }),
    ...eye(15, 29.5, 1.8, 1.6, { style: 'slit', lid: 0.35, lidTilt: 16, look: [-0.4, 0.2] }),
    // Nahe Beine
    part(limb(26, 45, 24, 58, 3.2, 2.5), 'body', 7, { group: 'leg-a' }),
    part(oval(22.6, 58.6, 3.4, 1.8), 'body', 7.1, { group: 'leg-a' }),
    part(limb(43, 45, 46, 52, 4.2, 3), 'body', 7, { group: 'leg-b' }),
    part(limb(46, 52, 43, 58, 2.6, 2.2), 'body', 7, { group: 'leg-b' }),
    part(oval(42, 58.6, 3.4, 1.8), 'body', 7.1, { group: 'leg-b' }),
  ],
};

const schmelzkroete: SpriteDef = {
  palette: {
    body: '#4c3c3a',
    lava: '#ff7a1a:3',
    belly: '#c8784a:3',
    eye: ['#ffe060'],
  },
  breathe: 0.03,
  parts: [
    // Ferne Beine
    part(limb(18, 52, 11, 58, 3.2, 2.6), 'body', 1, { tone: -1, group: 'legs-far' }),
    part(oval(9, 59, 4, 1.8), 'body', 1.1, { tone: -1, group: 'legs-far' }),
    // Lavablasen auf dem Rücken
    part(oval(40, 31.5, 4.5, 4), 'lava', 2, { shading: 'glow', anim: { bob: 0.8, phase: 0.2 } }),
    part(oval(50, 35.5, 3.4, 3), 'lava', 2, { shading: 'glow', anim: { bob: 0.8, phase: 0.6 } }),
    part(oval(31, 33, 2.8, 2.6), 'lava', 2, { shading: 'glow', anim: { bob: 0.8, phase: 0.9 } }),
    part(oval(44, 22, 1.4), 'lava', 2, { shading: 'glow', anim: { bob: 2.5, phase: 0.1 } }),
    // Körper aus Basaltkruste
    part(oval(37, 46, 20, 12.5), 'body', 3, { id: 'crust' }),
    part(oval(26, 54, 11, 4.5), 'belly', 3.1, { clip: 'body', backMat: 'body' }),
    part(curve([30, 40, 35, 43, 38, 41, 43, 46], 0.9), 'lava', 3.2, {
      clip: 'crust',
      shading: 'glow',
    }),
    part(curve([46, 38, 50, 43, 54, 42], 0.9), 'lava', 3.2, { clip: 'crust', shading: 'glow' }),
    part(curve([36, 52, 40, 50, 44, 53], 0.9), 'lava', 3.2, { clip: 'crust', shading: 'glow' }),
    // Kopf mit Augenhöckern und breitem Maul
    part(oval(19, 45, 11, 8.5), 'body', 4),
    part(oval(16, 37, 4.4, 4), 'body', 4.1),
    part(oval(27, 37.5, 3.6, 3.4), 'body', 3.9, { tone: -1 }),
    ...eye(15.5, 36.5, 2.4, 2.4, { style: 'slit', lid: 0.45, look: [-0.5, 0.3] }),
    part(oval(26.5, 37, 1.3, 1.6), 'eye', 4.2, { view: 'front', shading: 'flat' }),
    part(curve([8, 47, 15, 51, 27, 48], 0.6), 'ink', 4.5, { view: 'front', lines: false }),
    part(oval(8, 43.5, 0.7), 'ink', 4.5, { view: 'front', lines: false }),
    // Nahe Beine
    part(oval(50, 52, 7.5, 6.5), 'body', 5, { group: 'thigh' }),
    part(oval(50, 58.6, 6.5, 2.2), 'body', 5.1, { group: 'thigh' }),
    part(limb(22, 52, 16, 58, 3.6, 2.8), 'body', 6, { group: 'arm' }),
    part(oval(14, 59, 4.6, 2), 'body', 6.1, { group: 'arm' }),
  ],
};

const WING_FLAP = { sway: 9, pivot: [31, 31] as const };

const funkenfalter: SpriteDef = {
  palette: {
    body: '#c8462a',
    fur: '#f0d8a0:3',
    glow: '#ffd040:3',
    eye: ['#3a1018'],
  },
  float: 2.5,
  parts: [
    // Flügel (oben, unten) mit Augenflecken
    part(poly([29, 30, 13, 12, 4, 15, 3, 26, 8, 34, 22, 38], 2.5), 'body', 1, {
      mirror: true,
      id: 'wing-up',
      anim: WING_FLAP,
    }),
    part(oval(12, 22, 4, 4), 'glow', 1.1, {
      mirror: true,
      clip: 'wing-up',
      shading: 'glow',
      anim: WING_FLAP,
    }),
    part(oval(12, 22, 1.8, 1.8), 'body', 1.2, {
      mirror: true,
      clip: 'wing-up',
      tone: -2,
      anim: WING_FLAP,
    }),
    part(poly([29, 37, 16, 39, 11, 49, 16, 55, 24, 52, 30, 43], 2.5), 'body', 0.8, {
      mirror: true,
      tone: -1,
      anim: { ...WING_FLAP, phase: 0.1 },
    }),
    part(oval(17, 47, 2.4), 'glow', 0.9, {
      mirror: true,
      shading: 'glow',
      anim: { ...WING_FLAP, phase: 0.1 },
    }),
    // Fühler
    part(curve([30, 18, 27, 9, 21, 6], 0.8, 0.5), 'fur', 2, {
      mirror: true,
      anim: { sway: 4, pivot: [30, 18] },
    }),
    part(oval(22.5, 6.6, 2.2, 1.2, -20), 'fur', 2.1, {
      mirror: true,
      anim: { sway: 4, pivot: [30, 18] },
    }),
    // Pelziger Körper
    part(oval(32, 38, 4.6, 12), 'fur', 3, { id: 'thorax' }),
    part(limb(28, 41, 36, 41, 0.6), 'ink', 3.1, { clip: 'thorax', lines: false }),
    part(limb(28.5, 45, 35.5, 45, 0.6), 'ink', 3.1, { clip: 'thorax', lines: false }),
    part(oval(32, 27, 5.5, 4), 'fur', 3.2, { group: 'fur' }),
    part(oval(32, 21, 5, 4.6), 'fur', 4),
    part(oval(29.3, 21, 2, 2.4), 'eye', 4.5, { mirror: true, view: 'front', gloss: true }),
    // Funken, die von den Flügeln rieseln
    part(oval(12, 44, 0.9), 'glow', 5, { shading: 'glow', anim: { bob: 3, phase: 0.2 } }),
    part(oval(50, 50, 0.9), 'glow', 5, { shading: 'glow', anim: { bob: 3, phase: 0.7 } }),
    part(oval(41, 58, 0.8), 'glow', 5, { shading: 'glow', anim: { bob: 3, phase: 0.45 } }),
  ],
};

const solarix: SpriteDef = {
  lean: 3,
  palette: {
    body: '#e4542a',
    plume: '#ffc040:3',
    halo: '#fff0a0:3',
    astral: ['#c068b0', '#f6b8ec'],
  },
  float: 2,
  breathe: 0.02,
  parts: [
    // Sonnenring
    part(oval(32, 17, 13, 13), 'halo', 0, { shading: 'glow', cut: [oval(32, 17, 10.5, 10.5)] }),
    // Schwanzfedern mit Flammenspitzen
    part(curve([29, 44, 24, 54, 27, 63], 2.6, 1), 'plume', 1, {
      mirror: true,
      anim: { sway: 5, pivot: [30, 44] },
    }),
    part(curve([32, 45, 32, 54, 32, 62], 2.6, 1), 'plume', 1),
    part(flame(24.5, 60, 2, 6, -2), 'halo', 1.1, {
      mirror: true,
      shading: 'glow',
      anim: { sway: 5, pivot: [30, 44] },
    }),
    // Weit gespreizte Schwingen
    part(
      poly(
        [28, 30, 14, 20, 5, 9, 2, 17, 6, 22, 1, 27, 6, 31, 2, 36, 9, 38, 6, 43, 16, 42, 27, 39],
        2,
      ),
      'body',
      2,
      { mirror: true, id: 'wing', anim: { sway: 6, pivot: [28, 32] } },
    ),
    part(poly([26, 33, 14, 26, 8, 32, 12, 36, 10, 40, 20, 40], 1.5), 'plume', 2.1, {
      mirror: true,
      clip: 'wing',
      anim: { sway: 6, pivot: [28, 32] },
    }),
    // Körper und Kopf
    part(oval(32, 36, 7, 11), 'body', 3),
    part(oval(32, 39, 4, 7), 'plume', 3.1, { clip: 'body', backMat: 'body' }),
    part(flame(32, 15, 2.6, 11, 0), 'halo', 3.5, {
      shading: 'glow',
      anim: { sway: 5, pivot: [32, 16] },
    }),
    part(flame(29, 16, 2, 8, -4), 'plume', 3.4, {
      shading: 'glow',
      mirror: true,
      anim: { sway: 5, pivot: [30, 16] },
    }),
    part(oval(32, 21, 5.2, 5), 'body', 4),
    part(spike(32, 23, 32, 29, 3.4, 0.6), 'plume', 4.5, { view: 'front' }),
    ...eye(29.6, 20.5, 1.4, 1.5, { style: 'glow', iris: 'halo', mirror: true }),
    // Sternenfunken
    part(star(10, 50, 3), 'astral', 5, { shading: 'glow', anim: { bob: 1.5, phase: 0.3 } }),
    part(star(55, 52, 2.5), 'astral', 5, { shading: 'glow', anim: { bob: 1.5, phase: 0.8 } }),
  ],
};

const riffhai: SpriteDef = {
  palette: {
    body: '#3c5878',
    belly: '#dce6ee:3',
    stripe: '#1e2a40:2',
  },
  float: 1.5,
  breathe: 0.015,
  parts: [
    // Schwanzflosse
    part(poly([47, 35, 60, 20, 58, 33, 62, 48, 49, 40], 2), 'body', 1, {
      backZ: 10,
      anim: { sway: 7, pivot: [48, 37] },
    }),
    // Ferne Brustflosse
    part(poly([30, 42, 30, 52, 36, 48, 35, 42], 1.5), 'body', 1.5, { tone: -1 }),
    // Rückenflosse
    part(poly([30, 30, 38, 11, 43, 13, 42, 31], 2), 'body', 2),
    // Körper
    part(oval(33, 36, 18, 8.5, -6), 'body', 3, { id: 'hull' }),
    part(oval(15, 37.5, 9, 6.5, -4), 'body', 3.1, { id: 'head' }),
    part(oval(26, 41, 16, 4, -6), 'belly', 3.2, { clip: 'body', backMat: 'body' }),
    part(limb(36, 28, 38, 36, 1.2), 'stripe', 3.3, { clip: 'hull' }),
    part(limb(42, 29, 44, 36, 1.1), 'stripe', 3.3, { clip: 'hull' }),
    part(limb(30, 28.5, 31.5, 35, 1.2), 'stripe', 3.3, { clip: 'hull' }),
    // Kiemen
    part(limb(21, 35, 21.5, 40, 0.45), 'ink', 3.5, { view: 'front', lines: false }),
    part(limb(23, 35, 23.5, 40, 0.45), 'ink', 3.5, { view: 'front', lines: false }),
    // Maul mit Zähnen
    part(curve([6, 39, 12, 42.5, 20, 41], 1.3), 'stripe', 4, { view: 'front' }),
    part(spike(9, 39.8, 9.5, 42.5, 1.6, 0.2), 'white', 4.1, { view: 'front' }),
    part(spike(12.5, 41.3, 13, 43.8, 1.6, 0.2), 'white', 4.1, { view: 'front' }),
    part(spike(16, 41.7, 16, 44, 1.6, 0.2), 'white', 4.1, { view: 'front' }),
    ...eye(13, 34.5, 1.6, 1.5, { lid: 0.4, lidTilt: 18, look: [-0.4, 0.2] }),
    // Nahe Brustflosse
    part(poly([22, 42, 16, 55, 24, 53, 29, 44], 1.5), 'body', 5, {
      anim: { sway: 5, pivot: [24, 43] },
    }),
  ],
};

const perlenhueter: SpriteDef = {
  palette: {
    body: '#5fb8c8',
    mantle: '#f2a8b8:3',
    pearl: '#eef6ff:3',
  },
  breathe: 0.015,
  parts: [
    // Oberschale (geöffnet) mit Rippen
    part(poly([56, 44, 46, 14, 34, 9, 21, 12, 11, 20, 8, 31, 14, 34, 54, 48], 2.5), 'body', 1, {
      id: 'lid',
      gloss: true,
      anim: { sway: 2, pivot: [54, 46] },
    }),
    part(limb(54, 44, 22, 13, 0.7), 'body', 1.1, {
      clip: 'lid',
      tone: -1,
      anim: { sway: 2, pivot: [54, 46] },
    }),
    part(limb(54, 44, 34, 10, 0.7), 'body', 1.1, {
      clip: 'lid',
      tone: -1,
      anim: { sway: 2, pivot: [54, 46] },
    }),
    part(limb(54, 44, 12, 23, 0.7), 'body', 1.1, {
      clip: 'lid',
      tone: -1,
      anim: { sway: 2, pivot: [54, 46] },
    }),
    part(limb(54, 44, 45, 15, 0.7), 'body', 1.1, {
      clip: 'lid',
      tone: -1,
      anim: { sway: 2, pivot: [54, 46] },
    }),
    // Weicher Mantel mit Augen
    part(oval(31, 45, 19, 6.5), 'mantle', 2, { id: 'mantle' }),
    ...eye(19, 45, 1.8, 2, { look: [-0.4, 0], z: 2.5 }),
    ...eye(43, 45, 1.8, 2, { look: [-0.4, 0], z: 2.5 }),
    // Leuchtende Perle
    part(oval(31, 38, 8, 8), 'pearl', 3, { gloss: true }),
    // Unterschale
    part(oval(31, 51, 23, 9), 'body', 4, { id: 'bowl', gloss: true, cut: [oval(31, 41, 26, 7)] }),
    part(limb(31, 59, 18, 49, 0.7), 'body', 4.1, { clip: 'bowl', tone: -1 }),
    part(limb(31, 59, 44, 49, 0.7), 'body', 4.1, { clip: 'bowl', tone: -1 }),
    part(limb(31, 60, 31, 49, 0.7), 'body', 4.1, { clip: 'bowl', tone: -1 }),
  ],
};

const abyssax: SpriteDef = {
  palette: {
    body: '#1f4f7a',
    belly: '#9fd0d8:3',
    fin: '#4ad8c8:3',
    water: '#3a8ee8:3',
    eye: ['#e0fff8'],
  },
  breathe: 0.02,
  parts: [
    // Ferne Windung taucht aus dem Wasser
    part(curve([44, 60, 48, 44, 58, 44, 61, 60], 4.6, 3.6), 'body', 1, { tone: -1, group: 'coil' }),
    part(spike(52, 44, 55, 36, 4), 'fin', 0.9, { tone: -1 }),
    // Rückenkamm
    part(spike(33, 46, 41, 41, 5), 'fin', 2, { anim: { sway: 4, pivot: [33, 46] } }),
    part(spike(32, 37, 39, 31, 5), 'fin', 2, { anim: { sway: 4, pivot: [32, 37], phase: 0.3 } }),
    part(spike(27, 29, 33, 22, 5), 'fin', 2, { anim: { sway: 4, pivot: [27, 29], phase: 0.6 } }),
    // Langer Hals
    part(curve([28, 60, 35, 44, 22, 36, 21, 20], 6.2, 4.6), 'body', 3, { id: 'neck' }),
    part(curve([26, 60, 31, 46, 18, 38, 17, 24], 2.4, 1.8), 'belly', 3.1, {
      clip: 'neck',
      view: 'front',
    }),
    part(oval(30, 46, 1), 'fin', 3.2, { clip: 'neck', shading: 'glow' }),
    part(oval(26, 38, 1), 'fin', 3.2, { clip: 'neck', shading: 'glow' }),
    // Kopf mit Flossenohren und Barteln
    part(poly([23, 13, 35, 6, 31, 15], 1.5), 'fin', 3.5, { anim: { sway: 5, pivot: [24, 14] } }),
    part(oval(18, 18, 8, 6, -10), 'body', 4),
    part(oval(10.5, 21, 5.6, 3.3, 8), 'body', 4.1),
    part(oval(11, 22.5, 4.4, 1.4, 8), 'belly', 4.2, { clip: 'body', view: 'front' }),
    part(curve([7, 22, 3, 28, 6, 33], 0.6, 0.35), 'fin', 4.3, {
      anim: { sway: 8, pivot: [7, 22] },
    }),
    part(curve([12, 23, 10, 30, 13, 34], 0.6, 0.35), 'fin', 4.3, {
      anim: { sway: 8, pivot: [12, 23], phase: 0.4 },
    }),
    ...eye(16, 16.5, 2, 1.6, { style: 'glow', lid: 0.3, lidTilt: 12 }),
    // Wasseroberfläche
    part(oval(32, 60, 31, 4.2), 'water', 6, { id: 'sea', alpha: 0.9 }),
    part(oval(20, 57.4, 4, 1.1), 'white', 6.1, { clip: 'sea', shading: 'flat' }),
    part(oval(44, 58, 3.5, 1), 'white', 6.1, { clip: 'sea', shading: 'flat' }),
  ],
};

const TENTACLE = (phase: number) => ({ sway: 9, pivot: [32, 28] as const, phase });

const nebelqualle: SpriteDef = {
  palette: {
    body: '#8ab8e8',
    ghost: '#a088e0:3',
    glow: '#e0f8ff:2',
  },
  outline: '#262448',
  float: 3,
  breathe: 0.05,
  parts: [
    // Tentakel
    part(curve([24, 28, 18, 40, 27, 48, 20, 60], 1.8, 0.5), 'ghost', 1, {
      alpha: 0.7,
      anim: TENTACLE(0),
    }),
    part(curve([40, 28, 46, 40, 37, 48, 44, 60], 1.8, 0.5), 'ghost', 1, {
      alpha: 0.7,
      anim: TENTACLE(0.5),
    }),
    part(curve([28, 29, 26, 42, 32, 52, 28, 62], 1.5, 0.5), 'ghost', 1, {
      alpha: 0.7,
      anim: TENTACLE(0.25),
    }),
    part(curve([36, 29, 38, 42, 33, 50, 37, 58], 1.5, 0.5), 'ghost', 1, {
      alpha: 0.7,
      anim: TENTACLE(0.75),
    }),
    // Mundarme (Rüschen)
    part(curve([30, 28, 29, 36, 32, 42], 2.4, 1), 'glow', 1.5, { alpha: 0.8, anim: TENTACLE(0.1) }),
    // Glocke mit Rüschenrand
    part(oval(32, 24, 15, 13), 'body', 2, { id: 'bell', alpha: 0.9, cut: [oval(32, 38, 18, 9)] }),
    part(oval(32, 18, 7, 4.5), 'glow', 2.2, { clip: 'bell', shading: 'glow', alpha: 0.9 }),
    part(oval(19.5, 29, 3, 2.2), 'body', 1.9, { alpha: 0.9, mirror: true }),
    part(oval(26, 30.5, 3, 2.2), 'body', 1.9, { alpha: 0.9, mirror: true }),
    // Geistergesicht
    part(oval(27, 23, 2, 2.8), 'ink', 3, { view: 'front', mirror: true, lines: false }),
    part(oval(26.4, 22, 0.7, 0.9), 'white', 3.1, { view: 'front', mirror: true, lines: false }),
    part(oval(32, 27.5, 1.4, 1.8), 'ink', 3, { view: 'front', lines: false }),
  ],
};

export const WAVE_2: Readonly<Record<string, SpriteDef>> = {
  aschwolf,
  schmelzkroete,
  funkenfalter,
  solarix,
  riffhai,
  perlenhueter,
  abyssax,
  nebelqualle,
};
