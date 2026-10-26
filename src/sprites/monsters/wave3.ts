/** Sprites der Erweiterung (Phase 3), Teil 2: Flora, Erde, Funke. */
import { curve, eye, limb, oval, part, poly, spike, star, type SpriteDef } from '../model.ts';

const teichling: SpriteDef = {
  palette: {
    body: '#46a4a6',
    belly: '#e8f0c8:3',
    leaf: '#5aa83a:3',
    flower: ['#d06a9a', '#ffc4de'],
  },
  breathe: 0.04,
  parts: [
    // Hinterbeine
    part(oval(45, 53, 6.5, 5.5), 'body', 1, { tone: -1, group: 'leg-far' }),
    part(oval(20, 54, 6, 5), 'body', 2, { group: 'leg-near' }),
    // Körper und Kopf
    part(oval(32, 48, 13.5, 10.5), 'body', 3),
    part(oval(30, 52, 8.5, 5.5), 'belly', 3.1, { clip: 'body', backMat: 'body' }),
    part(oval(31, 38, 12.5, 8.5), 'body', 3.2),
    part(oval(24, 31, 4.6, 4.4), 'body', 3.3),
    part(oval(38, 31, 4.4, 4.2), 'body', 3.15, { tone: -1 }),
    ...eye(23.6, 30.8, 2.8, 2.9, { look: [-0.5, 0.2], z: 3.5 }),
    ...eye(37.6, 30.8, 2.4, 2.6, { look: [-0.5, 0.2], z: 3.4 }),
    part(curve([20, 40, 28, 44.5, 37, 41], 0.6), 'ink', 3.6, { view: 'front', lines: false }),
    part(oval(21, 43, 1.8, 1), 'flower', 3.6, { view: 'front', shading: 'flat' }),
    // Vorderbeine
    part(limb(25, 52, 22, 59, 2.3, 2), 'body', 4, { group: 'arm' }),
    part(oval(21, 59.5, 3.2, 1.4), 'body', 4.1, { group: 'arm' }),
    // Seerosenblatt als Hut mit Blüte
    part(oval(33, 24, 16, 4.5, -8), 'leaf', 5, {
      cut: [poly([33, 24, 50, 18, 50, 24], 0)],
      anim: { sway: 3, pivot: [32, 26] },
    }),
    part(star(29, 19.5, 4.5, 5, 0.5), 'flower', 5.5, { anim: { sway: 3, pivot: [32, 26] } }),
    part(oval(29, 19.5, 1.4), 'belly', 5.6, {
      shading: 'flat',
      anim: { sway: 3, pivot: [32, 26] },
    }),
  ],
};

const dornfaust: SpriteDef = {
  palette: {
    body: '#4c9a48',
    thorn: '#f0e8c8:2',
    sash: '#d8402a:3',
    flower: ['#c83a5a', '#ff8aa8'],
  },
  parts: [
    // Ferne Faust (Deckung oben)
    part(limb(42, 30, 48, 22, 3.6, 3.2), 'body', 1, { tone: -1, group: 'arm-far' }),
    part(oval(49.5, 19, 5, 4.6), 'body', 1.1, { tone: -1, group: 'arm-far' }),
    part(spike(52, 15.5, 54, 12, 1.4, 0.2), 'thorn', 1.2, { tone: -1 }),
    // Beine
    part(limb(27, 49, 25, 58, 4.4, 4), 'body', 2, { group: 'leg-a' }),
    part(limb(38, 49, 41, 58, 4.2, 3.8), 'body', 1.9, { tone: -1, group: 'leg-b' }),
    // Kakteenkörper mit Rippen
    part(oval(32, 36, 12.5, 15.5), 'body', 3, { id: 'trunk' }),
    part(oval(32, 18, 9, 8), 'body', 3.1),
    part(limb(28, 22, 27, 50, 0.7), 'body', 3.2, { clip: 'body', tone: -1, lines: false }),
    part(limb(36, 22, 37, 50, 0.7), 'body', 3.2, { clip: 'body', tone: -1, lines: false }),
    part(spike(21, 30, 18, 29, 1.2, 0.2), 'thorn', 2.9),
    part(spike(43, 38, 46, 37, 1.2, 0.2), 'thorn', 2.9),
    part(spike(24, 14, 22, 11, 1.2, 0.2), 'thorn', 2.9),
    // Blüte auf dem Kopf
    part(star(34, 10, 4.5, 5, 0.5), 'flower', 3.5, { anim: { sway: 4, pivot: [33, 12] } }),
    part(oval(34, 10, 1.4), 'thorn', 3.6, { shading: 'flat', anim: { sway: 4, pivot: [33, 12] } }),
    // Gesicht
    ...eye(28, 18, 1.8, 2, { lid: 0.4, lidTilt: 16, look: [-0.4, 0.2] }),
    ...eye(35, 18, 1.6, 1.9, { lid: 0.4, lidTilt: -16, look: [-0.4, 0.2] }),
    part(limb(28.5, 23, 33, 23.5, 0.5), 'ink', 3.7, { view: 'front', lines: false }),
    // Kampfgürtel
    part(limb(20, 41, 44, 41, 2), 'sash', 4, { clip: 'trunk' }),
    part(curve([39, 42, 43, 47, 41, 51], 1.3, 0.8), 'sash', 4.1, {
      anim: { sway: 6, pivot: [39, 42] },
    }),
    // Nahe Schlagfaust
    part(limb(23, 30, 13, 33, 4, 3.6), 'body', 6, {
      group: 'arm',
      anim: { attackRot: -8, attackShift: [-3, 0], pivot: [23, 30] },
    }),
    part(oval(10, 33, 5.8, 5.2), 'body', 6.1, { group: 'arm', anim: { attackShift: [-3, 0] } }),
    part(spike(6, 29.5, 4, 27, 1.4, 0.2), 'thorn', 6.2, { anim: { attackShift: [-3, 0] } }),
    part(spike(5.5, 34, 2.5, 34, 1.4, 0.2), 'thorn', 6.2, { anim: { attackShift: [-3, 0] } }),
    part(spike(8, 37.5, 6, 40, 1.4, 0.2), 'thorn', 6.2, { anim: { attackShift: [-3, 0] } }),
  ],
};

const SPORE = (phase: number) => ({ bob: 3, phase });

const pilzling: SpriteDef = {
  palette: {
    body: '#8a48b0',
    stem: '#efe2c4:3',
    spot: '#c8f060:3',
    gill: '#4a2a5a:2',
  },
  breathe: 0.035,
  parts: [
    // Wurzelfüße
    part(limb(27, 54, 22, 59, 2.4, 1.6), 'stem', 1, { group: 'roots', tone: -1 }),
    part(limb(37, 54, 42, 59, 2.4, 1.6), 'stem', 1, { group: 'roots', tone: -1 }),
    // Stiel mit Gesicht
    part(oval(32, 47, 10, 10.5), 'stem', 2),
    part(curve([25, 46, 27.5, 48, 30, 46], 0.55), 'ink', 2.5, { view: 'front', lines: false }),
    part(curve([34, 46, 36.5, 48, 39, 46], 0.55), 'ink', 2.5, { view: 'front', lines: false }),
    part(oval(32, 51, 1.6, 1.1), 'ink', 2.5, { view: 'front', lines: false }),
    part(oval(24, 50, 1.8, 1), 'body', 2.4, { view: 'front', shading: 'flat', mirror: true }),
    part(oval(21, 50, 2.4, 2), 'stem', 1.9, { mirror: true }),
    // Lamellen und Hut mit Leuchtflecken
    part(oval(32, 36.5, 17, 3.6), 'gill', 3),
    part(oval(32, 28, 21, 13.5), 'body', 4, { id: 'cap', cut: [oval(32, 41, 24, 7.5)] }),
    part(oval(24, 22, 3.4, 2.6), 'spot', 4.1, { clip: 'cap', shading: 'glow' }),
    part(oval(37, 18, 2.8, 2.2), 'spot', 4.1, { clip: 'cap', shading: 'glow' }),
    part(oval(44, 27, 3, 2.4), 'spot', 4.1, { clip: 'cap', shading: 'glow' }),
    part(oval(16, 30, 2.4, 2), 'spot', 4.1, { clip: 'cap', shading: 'glow' }),
    part(oval(31, 29, 2.2, 1.8), 'spot', 4.1, { clip: 'cap', shading: 'glow' }),
    // Sporen
    part(oval(10, 14, 1.2), 'spot', 5, { shading: 'glow', alpha: 0.85, anim: SPORE(0.1) }),
    part(oval(53, 12, 1), 'spot', 5, { shading: 'glow', alpha: 0.85, anim: SPORE(0.5) }),
    part(oval(56, 40, 1.1), 'spot', 5, { shading: 'glow', alpha: 0.85, anim: SPORE(0.8) }),
  ],
};

const schlingwurz: SpriteDef = {
  palette: {
    body: '#8c7a5c',
    leaf: '#3a7a3a:3',
    ghost: '#a088e0:3',
    eye: ['#c8ff70'],
  },
  outline: '#20182a',
  breathe: 0.035,
  parts: [
    // Geisterschleier
    part(curve([32, 52, 44, 56, 50, 50, 58, 54], 3, 0.6), 'ghost', 0.5, {
      alpha: 0.6,
      anim: { sway: 6, pivot: [32, 52] },
    }),
    // Ferner Rankenarm
    part(curve([40, 34, 49, 36, 53, 46, 51, 54], 1.6, 0.7), 'leaf', 1, {
      tone: -1,
      anim: { sway: 5, pivot: [40, 34] },
    }),
    // Blätterkrone
    part(spike(28, 26, 20, 8, 6, 2), 'leaf', 2, { anim: { sway: 4, pivot: [28, 26] } }),
    part(spike(32, 25, 33, 5, 6.5, 2), 'leaf', 2, {
      anim: { sway: 4, pivot: [32, 25], phase: 0.3 },
    }),
    part(spike(36, 26, 45, 10, 6, 2), 'leaf', 2, {
      anim: { sway: 4, pivot: [36, 26], phase: 0.6 },
    }),
    // Wurzelbeine
    part(limb(28, 50, 24, 59, 2.6, 1.2), 'body', 2.5, { group: 'roots' }),
    part(limb(35, 50, 38, 59, 2.6, 1.2), 'body', 2.5, { group: 'roots', tone: -1 }),
    part(limb(31, 52, 31, 60, 2, 1), 'body', 2.4, { group: 'roots' }),
    // Knollenkörper mit Geistergesicht
    part(oval(32, 39, 10.5, 14), 'body', 3, { id: 'tuber' }),
    part(oval(27.5, 34, 2.6, 3.2), 'ink', 3.5, { view: 'front', lines: false }),
    part(oval(36, 34, 2.4, 3), 'ink', 3.5, { view: 'front', lines: false }),
    part(oval(27.5, 34.5, 1, 1.2), 'eye', 3.6, { view: 'front', shading: 'glow' }),
    part(oval(36, 34.5, 0.9, 1.1), 'eye', 3.6, { view: 'front', shading: 'glow' }),
    part(oval(31.5, 42, 2.4, 3.4), 'ink', 3.5, { view: 'front', lines: false }),
    part(limb(26, 47, 30, 49, 0.5), 'body', 3.4, { clip: 'tuber', tone: -1, lines: false }),
    // Naher Rankenarm greift nach vorn
    part(curve([24, 34, 14, 33, 9, 42, 12, 52], 1.8, 0.8), 'leaf', 4, {
      anim: { sway: -6, pivot: [24, 34] },
    }),
    part(oval(12.5, 52, 2, 1.4, 30), 'leaf', 4.1, { anim: { sway: -6, pivot: [24, 34] } }),
  ],
};

const bluetenschwirr: SpriteDef = {
  palette: {
    body: '#38ae6e',
    petal: '#f08ab8:3',
    throat: ['#b82a4a', '#ff5a7a'],
    beak: ['#2a2430', '#5a4a5a'],
  },
  float: 2.5,
  parts: [
    // Ferner Flügel (verwischt)
    part(oval(40, 18, 3.6, 11, 28), 'petal', 1, {
      alpha: 0.6,
      tone: -1,
      anim: { sway: 18, pivot: [37, 28] },
    }),
    // Blütenblatt-Schwanz
    part(oval(47, 42, 2.8, 7, -35), 'petal', 1.5, { anim: { sway: 5, pivot: [42, 36] } }),
    part(oval(43, 45, 2.8, 7, -15), 'petal', 1.5, { anim: { sway: 5, pivot: [42, 36] } }),
    part(oval(50, 37, 2.6, 6, -60), 'petal', 1.5, { anim: { sway: 5, pivot: [42, 36] } }),
    // Körper und Kopf
    part(oval(35, 32, 9.5, 6.5, -28), 'body', 2, { gloss: true }),
    part(oval(26, 25, 6, 5.5), 'body', 3, { gloss: true }),
    part(oval(26, 30, 4, 2.4, -15), 'throat', 3.1, {
      clip: 'body',
      view: 'front',
      shading: 'glow',
    }),
    part(limb(21, 26, 6, 30, 0.9, 0.45), 'beak', 3.2),
    ...eye(24.5, 24, 1.9, 2, { look: [-0.5, 0] }),
    part(spike(29, 20.5, 33, 15, 2.6, 0.5), 'petal', 2.9),
    // Naher Flügel (schwirrend)
    part(oval(38, 18, 4, 12, 22), 'petal', 4, { alpha: 0.85, anim: { sway: 20, pivot: [36, 28] } }),
    part(oval(39, 16, 1.6, 6, 22), 'white', 4.1, {
      alpha: 0.5,
      anim: { sway: 20, pivot: [36, 28] },
    }),
    // Füßchen
    part(limb(35, 37, 35, 41, 0.7), 'beak', 1.8),
  ],
};

const duenenwurm: SpriteDef = {
  palette: {
    body: '#c08a4a',
    sand: '#e0c080:3',
    maw: '#5a2a2a:2',
    plate: '#8a5a3a:3',
  },
  breathe: 0.02,
  parts: [
    // Panzerplatten am Rücken
    part(spike(46, 44, 54, 40, 6, 1.5), 'plate', 1),
    part(spike(42, 33, 50, 27, 6, 1.5), 'plate', 1),
    part(spike(33, 25, 39, 17, 6, 1.5), 'plate', 1),
    // Segmentierter Leib
    part(curve([40, 58, 46, 40, 30, 32, 21, 20], 8.5, 6.5), 'body', 2, { id: 'worm' }),
    part(limb(36, 52, 50, 50, 0.8), 'plate', 2.2, { clip: 'worm', lines: false }),
    part(limb(34, 44, 46, 38, 0.8), 'plate', 2.2, { clip: 'worm', lines: false }),
    part(limb(28, 37, 37, 29, 0.8), 'plate', 2.2, { clip: 'worm', lines: false }),
    part(limb(20, 30, 28, 23, 0.8), 'plate', 2.2, { clip: 'worm', lines: false }),
    // Kopf mit Rundmaul
    part(oval(19, 17, 9, 8.5, -35), 'body', 3, { id: 'head' }),
    part(oval(13.5, 12, 6, 5.5, -35), 'maw', 3.2, { clip: 'head', view: 'front' }),
    part(spike(10, 9, 13, 12, 1.8, 0.2), 'white', 3.3, { view: 'front' }),
    part(spike(17, 8, 15, 11.5, 1.8, 0.2), 'white', 3.3, { view: 'front' }),
    part(spike(9.5, 15, 12.5, 13.5, 1.8, 0.2), 'white', 3.3, { view: 'front' }),
    part(spike(18.5, 14, 15.5, 13, 1.8, 0.2), 'white', 3.3, { view: 'front' }),
    ...eye(23, 18, 1.4, 1.3, { style: 'glow', lid: 0.3 }),
    // Sanddüne
    part(oval(33, 60, 29, 5), 'sand', 5, { id: 'dune' }),
    part(oval(20, 61, 3, 1), 'plate', 5.1, { clip: 'dune', shading: 'flat' }),
    part(oval(50, 62, 3, 0.9), 'plate', 5.1, { clip: 'dune', shading: 'flat' }),
  ],
};

const tonhueter: SpriteDef = {
  palette: {
    body: '#c06a4a',
    rune: '#ff6ab0:3',
    stone: '#7a5a4a:3',
  },
  breathe: 0.015,
  parts: [
    // Ferner Arm
    part(limb(43, 25, 50, 40, 4.4, 4), 'body', 1, { tone: -1, group: 'arm-far' }),
    part(poly([46, 40, 54, 40, 54, 47, 46, 47], 1.5), 'stone', 1.1, { tone: -1, group: 'arm-far' }),
    // Beine
    part(poly([24, 44, 31, 44, 31, 59, 23, 59], 1.5), 'stone', 2, { group: 'leg-a' }),
    part(poly([34, 44, 41, 44, 42, 59, 34, 59], 1.5), 'stone', 1.9, { tone: -1, group: 'leg-b' }),
    // Rumpf mit Runen
    part(poly([19, 21, 45, 21, 42, 47, 22, 47], 3), 'body', 3, { id: 'torso' }),
    part(oval(32, 32, 5, 5), 'rune', 3.2, {
      clip: 'torso',
      shading: 'glow',
      cut: [oval(32, 32, 3, 3)],
    }),
    part(limb(32, 25, 32, 39, 0.8), 'rune', 3.3, { clip: 'torso', shading: 'glow' }),
    part(limb(26, 40, 38, 40, 0.7), 'rune', 3.3, { clip: 'torso', shading: 'glow' }),
    part(curve([39, 24, 41, 30, 38, 34], 0.5), 'stone', 3.3, { clip: 'torso', lines: false }),
    // Kopf mit Sehschlitz
    part(poly([24, 7, 40, 7, 41, 20, 23, 20], 2.5), 'body', 4, { id: 'head' }),
    part(limb(26, 13.5, 38, 13.5, 1.4), 'rune', 4.2, {
      clip: 'head',
      shading: 'glow',
      view: 'front',
    }),
    part(poly([27, 5, 37, 5, 36, 8, 28, 8], 1), 'stone', 3.9),
    // Naher Arm mit Steinfaust
    part(limb(21, 25, 13, 40, 4.6, 4.2), 'body', 6, {
      group: 'arm',
      anim: { attackRot: 20, pivot: [21, 25] },
    }),
    part(poly([7, 39, 18, 39, 18, 48, 7, 48], 2), 'stone', 6.1, {
      group: 'arm',
      anim: { attackRot: 20, pivot: [21, 25] },
    }),
  ],
};

const blitzmarder: SpriteDef = {
  palette: {
    body: '#e8a030',
    belly: '#fff0c8:3',
    bolt: '#5ad0ff:3',
  },
  outline: '#3a1e12',
  parts: [
    // Blitz-Schwanz
    part(poly([44, 42, 52, 32, 48, 31, 58, 18, 55, 28, 60, 28, 50, 44], 1.2), 'bolt', 1, {
      shading: 'glow',
      backZ: 12,
      anim: { sway: 5, pivot: [46, 42] },
    }),
    // Ferne Beine
    part(limb(22, 44, 14, 49, 2.2, 1.8), 'body', 2, { tone: -1, group: 'legs-far' }),
    part(limb(44, 46, 52, 54, 2.8, 2), 'body', 2, { tone: -1, group: 'legs-far' }),
    // Gestreckter Körper im Sprung
    part(oval(34, 42, 13.5, 6, -8), 'body', 3, { id: 'torso' }),
    part(oval(31, 45.5, 10, 2.6, -8), 'belly', 3.1, { clip: 'body', backMat: 'body' }),
    part(poly([33, 36, 37, 36, 34, 41, 38, 41, 33, 47, 35, 42, 31, 42], 0.5), 'bolt', 3.2, {
      clip: 'torso',
      shading: 'glow',
    }),
    // Kopf
    part(spike(20, 29, 23, 20, 4.5), 'body', 3.8, { tone: -1 }),
    part(oval(18, 34, 6.6, 5.4), 'body', 4),
    part(limb(15, 36, 7, 37.5, 3, 1.8), 'body', 4.1),
    part(limb(14, 38, 8, 38.8, 1.4, 0.8), 'belly', 4.2, { clip: 'body', view: 'front' }),
    part(spike(16, 29.5, 15, 20, 4.5), 'body', 4.3),
    part(oval(6.8, 36.8, 1.3, 1.1), 'ink', 5, { view: 'front', lines: false }),
    ...eye(16, 33, 1.8, 1.8, { lid: 0.25, lidTilt: 10, look: [-0.5, 0] }),
    // Nahe Beine (gestreckt)
    part(limb(25, 45, 15, 51, 2.6, 2), 'body', 6, { group: 'leg-a' }),
    part(limb(42, 46, 49, 57, 3.2, 2.2), 'body', 6, { group: 'leg-b' }),
    // Funken
    part(star(10, 24, 2.4), 'bolt', 7, { shading: 'glow', anim: { bob: 1.4, phase: 0.2 } }),
    part(star(30, 56, 2), 'bolt', 7, { shading: 'glow', anim: { bob: 1.4, phase: 0.7 } }),
  ],
};

export const WAVE_3: Readonly<Record<string, SpriteDef>> = {
  teichling,
  dornfaust,
  pilzling,
  schlingwurz,
  bluetenschwirr,
  duenenwurm,
  tonhueter,
  blitzmarder,
};
