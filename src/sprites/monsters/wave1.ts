/** Sprites der ersten 16 Monster (Phase 1/2). */
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
  wing,
  type SpriteDef,
} from '../model.ts';

const pyrrax: SpriteDef = {
  palette: {
    body: '#b8352a',
    belly: '#f2a85a:3',
    horn: '#4a3440:3',
    flame: '#ffb02e:3',
    eye: ['#ffd23a'],
  },
  parts: [
    // Schwanz mit Flammenspitze
    part(curve([42, 46, 56, 50, 58, 36], 4.2, 1.6), 'body', 2, {
      backZ: 12,
      anim: { sway: 4, pivot: [42, 46], phase: 0.2 },
    }),
    part(flame(58, 38, 3.4, 12, -1), 'flame', 3, {
      shading: 'glow',
      backZ: 13,
      anim: { sway: 7, pivot: [42, 46], phase: 0.2 },
    }),
    // Ferner Flügel und ferne Beine
    ...wing([37, 31], [47, 9, 54, 14, 58, 23], [46, 35], 'belly', 'body', 1, {
      tone: -1,
      anim: { sway: 5, pivot: [37, 31] },
    }),
    part(limb(43, 49, 45, 58, 4, 3), 'body', 3, { tone: -1, group: 'legs-far' }),
    part(limb(26, 47, 25, 58, 3.2, 2.8), 'body', 3, { tone: -1, group: 'legs-far' }),
    // Naher Flügel
    ...wing([34, 32], [38, 5, 47, 8, 54, 17, 55, 27], [44, 37], 'belly', 'body', 4, {
      backZ: 14,
      anim: { sway: 6, pivot: [34, 32] },
    }),
    // Körper, Hals, Kopf
    part(oval(36, 45, 12.5, 9, -8), 'body', 5, { id: 'torso' }),
    part(oval(31, 50, 9, 4.5, -6), 'belly', 6, { clip: 'body', backMat: 'body' }),
    part(curve([28, 40, 22, 32, 20, 24], 5.5, 4.2), 'body', 6),
    part(horn(22, 15, 27, 9, 31, 7, 1.8), 'horn', 7),
    part(horn(18, 14, 19, 7, 23, 3, 1.8), 'horn', 7.5),
    part(oval(19, 20, 8, 6.5, -5), 'body', 8),
    part(oval(12, 23.5, 5.8, 4, 6), 'body', 8.5),
    part(oval(12, 26, 4.5, 2, 6), 'belly', 8.6, { clip: 'body', view: 'front' }),
    part(limb(7, 25.8, 14, 26.4, 0.5), 'ink', 9, { view: 'front', lines: false }),
    part(oval(8, 22.5, 0.7, 0.6), 'ink', 9, { view: 'front', lines: false }),
    ...eye(16, 19.5, 2.4, 2.4, { style: 'slit', lid: 0.35, lidTilt: 10, look: [-0.5, 0.2] }),
    // Glutrisse auf dem Rücken
    part(limb(34, 38, 40, 37, 0.9), 'flame', 7, { clip: 'torso', shading: 'glow' }),
    part(limb(41, 40, 46, 41, 0.9), 'flame', 7, { clip: 'torso', shading: 'glow' }),
    // Nahe Beine
    part(limb(40, 48, 37, 57, 5, 3.5), 'body', 9, { group: 'leg-near-back' }),
    part(oval(35, 58.5, 4.5, 2.2), 'body', 9.1, { group: 'leg-near-back' }),
    part(limb(25, 46, 21, 56, 3.6, 3), 'body', 9, { group: 'leg-near-front' }),
    part(oval(19.5, 57.8, 3.8, 2), 'body', 9.1, { group: 'leg-near-front' }),
  ],
};

const gischtel: SpriteDef = {
  palette: {
    body: '#2c6aa6',
    belly: '#f0e0bc:3',
    fin: '#62d2e4:3',
    water: '#3f9de0:3',
  },
  breathe: 0.02,
  parts: [
    // Welle mit Schaumkrone
    part(oval(34, 58.5, 27, 4), 'water', 1, { id: 'sea' }),
    part(curve([42, 58, 58, 58, 63, 46, 54, 41], 5.5, 2), 'water', 2, {
      group: 'sea',
      anim: { sway: 3, pivot: [50, 58] },
    }),
    part(oval(55, 41.5, 3.5, 2, -10), 'belly', 2.2, {
      clip: 'sea',
      shading: 'flat',
      anim: { sway: 3, pivot: [50, 58] },
    }),
    part(oval(14, 56, 6, 1.3), 'belly', 2.2, { clip: 'sea', shading: 'flat' }),
    part(oval(30, 55.5, 4, 1.1), 'belly', 2.2, { clip: 'sea', shading: 'flat' }),
    // Paddelschwanz taucht in die Welle
    part(curve([40, 46, 48, 50, 50, 57], 3.6, 2.4), 'body', 3, {
      backZ: 12,
      anim: { sway: 5, pivot: [40, 46] },
    }),
    // Ferne Pfote
    part(limb(24, 34, 16, 37, 2.3, 1.7), 'body', 4, { tone: -1, group: 'paw-far' }),
    // Körper im Sprung, schräg nach oben
    part(oval(33, 40, 12.5, 7.5, -38), 'body', 5, { id: 'torso' }),
    part(oval(24, 31, 6.5, 6, -38), 'body', 5.1, { group: 'body' }),
    part(oval(29, 39, 8.5, 3.6, -38), 'belly', 6, { clip: 'body', backMat: 'body' }),
    part(limb(40, 47, 42, 53, 3, 2.2), 'body', 4.5, { tone: -1, group: 'legs' }),
    // Kopf mit geschwungenem Flossenkamm
    part(poly([15, 18, 19, 10, 27, 6, 35, 9, 29, 12, 26, 18, 21, 21], 2), 'fin', 6.5, {
      backZ: 9,
      anim: { sway: 4, pivot: [21, 19] },
    }),
    part(oval(19, 23, 7.2, 6.3), 'body', 7),
    part(oval(12, 25.5, 4.6, 3.3), 'body', 7.2),
    part(oval(12.5, 27, 4, 1.9), 'belly', 7.3, { clip: 'body', view: 'front' }),
    part(oval(8.4, 24.2, 1.4, 1.1), 'ink', 8, { view: 'front', lines: false }),
    part(curve([10, 27.5, 12, 29, 14, 27.6], 0.5), 'ink', 8, { view: 'front', lines: false }),
    part(limb(10, 26, 4, 25, 0.35), 'belly', 8, { view: 'front', lines: false }),
    part(limb(10, 27, 4.5, 28.5, 0.35), 'belly', 8, { view: 'front', lines: false }),
    ...eye(17, 22, 2.2, 2.4, { look: [-0.7, 0] }),
    // Nahe Pfote
    part(limb(23, 35, 14, 39, 2.8, 2), 'body', 8.5, { group: 'paw-near' }),
    // Gischttropfen
    part(oval(7, 38, 1.6, 2.2), 'fin', 9, { shading: 'glow', anim: { bob: 1.5, phase: 0.3 } }),
    part(oval(4, 45, 1.1, 1.5), 'fin', 9, { shading: 'glow', anim: { bob: 1.2, phase: 0.6 } }),
  ],
};

const moosbock: SpriteDef = {
  palette: {
    body: '#6e4f35',
    moss: '#5f9e3c',
    horn: '#d9c9a0:3',
    flower: ['#c0507a', '#f3a6c4'],
  },
  breathe: 0.02,
  parts: [
    // Ferne Beine
    part(limb(46, 46, 47, 58, 4.4, 3.8), 'body', 1, { tone: -1, group: 'legs-far' }),
    part(limb(23, 46, 22, 58, 4, 3.6), 'body', 1, { tone: -1, group: 'legs-far' }),
    part(oval(47, 59, 4, 1.8), 'horn', 1.1, { tone: -1, group: 'legs-far' }),
    part(oval(22, 59, 3.8, 1.8), 'horn', 1.1, { tone: -1, group: 'legs-far' }),
    // Körper
    part(oval(37, 43, 19, 11.5), 'body', 3, { id: 'torso' }),
    // Moos-Hang mit Farnen und Blüten
    part(spike(45, 30, 52, 14, 5, 1.5), 'moss', 3.5, { anim: { sway: 4, pivot: [45, 30] } }),
    part(spike(36, 28, 34, 12, 5, 1.5), 'moss', 3.5, {
      anim: { sway: 3, pivot: [36, 28], phase: 0.4 },
    }),
    part(spike(52, 33, 60, 22, 4, 1.5), 'moss', 3.5, {
      anim: { sway: 4, pivot: [52, 33], phase: 0.7 },
    }),
    part(oval(40, 34, 17, 9.5), 'moss', 4, { id: 'moss' }),
    part(oval(30, 30, 6, 4.5), 'moss', 4.1, { group: 'moss' }),
    part(oval(49, 31, 7, 5), 'moss', 4.1, { group: 'moss' }),
    part(oval(33, 31, 1.8), 'flower', 5, { shading: 'flat' }),
    part(oval(45, 27.5, 1.8), 'flower', 5, { shading: 'flat' }),
    part(oval(52, 34, 1.5), 'flower', 5, { shading: 'flat' }),
    part(oval(40, 30, 1.2), 'horn', 5, { shading: 'flat' }),
    // Kopf mit gedrehten Hörnern
    part(curve([22, 34, 30, 24, 36, 34, 28, 40], 3.2, 1.4), 'horn', 5.5, { tone: -1 }),
    part(oval(17, 40, 8.5, 8), 'body', 6),
    part(oval(10, 45.5, 5.5, 4.4), 'horn', 6.2),
    part(oval(7.5, 45, 1, 0.8), 'ink', 7, { view: 'front', lines: false }),
    part(limb(8, 48.5, 12, 48.5, 0.45), 'ink', 7, { view: 'front', lines: false }),
    part(poly([14, 48, 19, 48, 16, 55], 1), 'body', 6.1, { tone: -1 }),
    ...eye(15, 38.5, 1.9, 1.9, { lid: 0.35, look: [-0.5, 0.3] }),
    part(curve([19, 33, 28, 22, 34, 31, 27, 38], 3.4, 1.5), 'horn', 7.5),
    // Nahe Beine
    part(limb(44, 49, 44, 58, 5, 4.2), 'body', 8, { group: 'leg-a' }),
    part(oval(44, 59, 4.6, 2), 'horn', 8.1, { tone: -1, group: 'leg-a' }),
    part(limb(26, 49, 26, 58, 4.8, 4.2), 'body', 8, { group: 'leg-b' }),
    part(oval(26, 59, 4.4, 2), 'horn', 8.1, { tone: -1, group: 'leg-b' }),
  ],
};

const voltrabe: SpriteDef = {
  palette: {
    body: '#2b3152',
    feather: '#4c5ea0:3',
    beak: '#e0a830:3',
    spark: '#ffe24a:3',
    eye: ['#ffd23a'],
  },
  parts: [
    // Blitz-Schwanzfedern
    part(poly([42, 46, 56, 47, 51, 51, 62, 58, 48, 54, 51, 51, 40, 51], 1), 'spark', 1, {
      shading: 'glow',
      backZ: 12,
      anim: { sway: 4, pivot: [42, 48] },
    }),
    // Ferner Flügel (angehoben)
    part(poly([36, 30, 52, 16, 58, 22, 54, 30, 46, 38], 2), 'feather', 2, {
      tone: -1,
      anim: { sway: 6, pivot: [36, 30] },
    }),
    // Beine
    part(limb(30, 50, 28, 58, 1.4), 'beak', 3, { group: 'legs' }),
    part(limb(37, 50, 37, 58, 1.4), 'beak', 3, { group: 'legs', tone: -1 }),
    part(poly([24, 59, 32, 59, 30, 57], 0.5), 'beak', 3.1, { group: 'legs' }),
    part(poly([34, 59, 41, 59, 39, 57], 0.5), 'beak', 3.1, { group: 'legs', tone: -1 }),
    // Körper und Brust
    part(oval(33, 40, 11, 12.5, 18), 'body', 4, { id: 'torso' }),
    part(oval(28, 42, 6, 8, 18), 'feather', 4.5, { clip: 'torso', shading: 'flat' }),
    // Kopf, Schnabel, Blitz-Kamm
    part(poly([26, 19, 29, 7, 30, 13, 36, 5, 34, 14, 39, 12, 33, 21], 1), 'spark', 5, {
      shading: 'glow',
      anim: { sway: 5, pivot: [30, 19] },
    }),
    part(oval(24, 25, 8, 7.5), 'body', 6),
    part(poly([18, 22, 7, 26.5, 18, 29.5], 1), 'beak', 7),
    part(limb(9, 26.6, 17, 26.2, 0.4), 'ink', 7.1, { view: 'front', lines: false }),
    ...eye(21, 23.5, 2.2, 2.2, { lid: 0.3, lidTilt: 12, look: [-0.6, 0.1] }),
    // Naher Flügel mit Federstufen
    part(
      poly([30, 30, 44, 26, 56, 36, 52, 41, 48, 40, 50, 46, 44, 45, 42, 50, 34, 46], 2),
      'feather',
      8,
      {
        backZ: 13,
        anim: { sway: 3, pivot: [32, 30] },
      },
    ),
    part(limb(34, 33, 50, 38, 0.8), 'spark', 8.2, {
      clip: 'feather',
      shading: 'glow',
      anim: { sway: 3, pivot: [32, 30] },
    }),
  ],
};

const frostkauz: SpriteDef = {
  palette: {
    body: '#9ccbea:3',
    face: '#eaf6ff:2',
    wing: '#5a86c4:3',
    ice: '#86e2f8:3',
    psi: ['#c43a86', '#ff6ab0'],
    beak: ['#d8b060'],
  },
  outline: '#1d2440',
  float: 0,
  parts: [
    // Schwebende Eistafel der Gletscherbibliothek
    part(poly([47, 17, 57, 15, 59, 30, 49, 32], 1.5, [-0.2, -0.3]), 'ice', 1, {
      gloss: true,
      backZ: 1,
      anim: { bob: 1.5, phase: 0.5 },
    }),
    part(limb(50.5, 21, 55.5, 20, 0.6), 'psi', 1.2, {
      shading: 'glow',
      anim: { bob: 1.5, phase: 0.5 },
    }),
    part(limb(51, 24.5, 56, 23.5, 0.6), 'psi', 1.2, {
      shading: 'glow',
      anim: { bob: 1.5, phase: 0.5 },
    }),
    part(limb(51.5, 28, 55, 27.4, 0.6), 'psi', 1.2, {
      shading: 'glow',
      anim: { bob: 1.5, phase: 0.5 },
    }),
    // Eis-Federohren
    part(spike(25, 21, 18, 7, 6, 1.5), 'ice', 2, { mirror: true, gloss: true }),
    // Körper
    part(oval(32, 41, 15, 16), 'body', 3, { id: 'torso' }),
    part(poly([27, 44, 32, 48, 37, 44, 37, 46, 32, 50, 27, 46], 0), 'wing', 3.5, {
      clip: 'torso',
      shading: 'flat',
    }),
    part(poly([27, 51, 32, 55, 37, 51, 37, 53, 32, 57, 27, 53], 0), 'wing', 3.5, {
      clip: 'torso',
      shading: 'flat',
    }),
    // Flügel an den Seiten
    part(oval(18.5, 43, 5, 11.5, 12), 'wing', 4, {
      mirror: true,
      anim: { sway: 3, pivot: [20, 34] },
    }),
    // Gesichtsschleier
    part(oval(27, 30, 7, 7.5), 'face', 5, { mirror: true, view: 'front', id: 'face' }),
    ...eye(27, 30, 3.7, 3.7, { iris: 'psi', mirror: true, look: [0, 0.2] }),
    part(poly([30.5, 33, 33.5, 33, 32, 37.5], 0.8), 'beak', 7, { view: 'front' }),
    part(oval(32, 22.5, 1.8, 2.2), 'psi', 7, { shading: 'glow', view: 'front' }),
    // Füße
    part(oval(27, 57.5, 3, 1.8), 'beak', 2.5, { mirror: true }),
  ],
};

const CLAW_ANIM = { attackRot: -10, pivot: [23, 40] as const, bob: 0.6 };

const bruxor: SpriteDef = {
  palette: {
    body: '#c4543a',
    metal: '#7f8ea2',
    wrap: '#efe4cc:2',
    ore: '#5a3a30:2',
  },
  parts: [
    // Ferne Beine und ferne Schere (Deckung)
    part(limb(42, 44, 50, 57, 2.4, 1), 'body', 1, { tone: -1, group: 'legs-far' }),
    part(limb(46, 41, 56, 52, 2.2, 1), 'body', 1, { tone: -1, group: 'legs-far' }),
    part(limb(40, 38, 47, 31, 3, 2.4), 'body', 1.5, { tone: -1, group: 'arm-far' }),
    part(oval(50, 27, 5, 4.5, 20), 'metal', 1.6, { tone: -1, group: 'claw-far', gloss: true }),
    part(horn(53, 24, 55, 18, 51, 16, 2), 'metal', 1.55, { tone: -1, group: 'claw-far' }),
    // Stielaugen
    part(limb(33, 33, 34, 23, 1.3), 'body', 2, { tone: -1, group: 'stalk-far' }),
    part(oval(34, 22, 2.3, 2.5), 'body', 2.1, { tone: -1, group: 'stalk-far' }),
    part(oval(33.5, 21.8, 1.4, 1.6), 'ink', 2.2, { view: 'front', lines: false }),
    part(limb(28, 33, 26, 22, 1.4), 'body', 3, { group: 'stalk' }),
    part(oval(26, 21, 2.6, 2.8), 'body', 3.1, { group: 'stalk' }),
    ...eye(25.6, 20.8, 1.9, 2.1, { look: [-0.4, 0], z: 3.2 }),
    // Panzer
    part(oval(34, 41, 15.5, 10.5), 'body', 4, { id: 'shell', gloss: true }),
    part(spike(26, 32, 23, 27, 3), 'body', 3.9, { group: 'shell' }),
    part(spike(34, 30.5, 34, 25, 3), 'body', 3.9, { group: 'shell' }),
    part(spike(42, 32, 46, 27, 3), 'body', 3.9, { group: 'shell' }),
    part(oval(40, 38, 2, 1.5), 'ore', 4.2, { clip: 'shell' }),
    part(oval(45, 44, 1.5, 1.2), 'ore', 4.2, { clip: 'shell' }),
    part(curve([23, 45, 27, 47, 31, 45.5], 0.5), 'ink', 4.6, { view: 'front', lines: false }),
    // Nahe Beine
    part(limb(28, 47, 21, 58, 2.6, 1), 'body', 5, { group: 'leg1' }),
    part(limb(35, 49, 33, 59, 2.6, 1), 'body', 5, { group: 'leg2' }),
    part(limb(42, 48, 46, 58, 2.6, 1), 'body', 5, { group: 'leg3' }),
    // Große Schlagschere (erhoben) mit Bandage
    part(limb(23, 40, 15, 34, 3.8, 3.4), 'body', 6, { group: 'arm', anim: CLAW_ANIM }),
    part(limb(21.5, 38.7, 19.5, 37.2, 4), 'wrap', 6.1, { clip: 'arm', anim: CLAW_ANIM }),
    part(limb(18, 36.3, 17, 35.5, 4), 'wrap', 6.1, { clip: 'arm', anim: CLAW_ANIM }),
    part(horn(7, 24, 4, 17, 10, 13, 2.8), 'metal', 6.8, { group: 'finger', anim: CLAW_ANIM }),
    part(oval(11, 29, 8, 6.8, -25), 'metal', 7, { id: 'claw', gloss: true, anim: CLAW_ANIM }),
    part(oval(8, 32, 1.8, 1.4), 'ore', 7.1, { clip: 'claw', anim: CLAW_ANIM }),
    part(oval(14, 26, 1.5, 1.2), 'ore', 7.1, { clip: 'claw', anim: CLAW_ANIM }),
    part(curve([4, 26, 9, 24, 13, 25], 0.6), 'ink', 7.2, { lines: false, anim: CLAW_ANIM }),
  ],
};

export const WAVE_1: Readonly<Record<string, SpriteDef>> = {
  pyrrax,
  gischtel,
  moosbock,
  voltrabe,
  frostkauz,
  bruxor,
};
