/** Sprites der ersten 16 Monster, Teil 2. */
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
  type SpriteDef,
} from '../model.ts';

const nesselnatter: SpriteDef = {
  palette: {
    body: '#7b3fa2',
    belly: '#cbd874:3',
    mark: ['#2a1c3c'],
    spine: '#9ae04a:3',
    tongue: ['#a02040', '#e04a6a'],
    eye: ['#f2e040'],
  },
  parts: [
    // Gewundener Leib am Boden
    part(curve([30, 54, 44, 60, 60, 54, 52, 46], 5.5, 3), 'body', 1, {
      backZ: 1,
      anim: { sway: 2, pivot: [40, 56] },
    }),
    part(oval(36, 54.5, 15, 5.5), 'body', 2, { id: 'coil' }),
    part(oval(33, 57, 11, 2.2), 'belly', 2.1, { clip: 'coil', view: 'front' }),
    // Aufgerichteter Hals
    part(curve([34, 52, 42, 40, 28, 33, 29, 22], 5.2, 4.4), 'body', 3, { id: 'neck' }),
    part(curve([33, 50, 39, 41, 26, 34, 26.5, 24], 2.2, 1.8), 'belly', 3.1, {
      clip: 'neck',
      view: 'front',
    }),
    // Nesselstacheln am Schild
    part(spike(36, 14, 41, 8, 3), 'spine', 3.5, { anim: { sway: 4, pivot: [36, 14] } }),
    part(spike(38, 20, 45, 17, 3), 'spine', 3.5, {
      anim: { sway: 4, pivot: [38, 20], phase: 0.3 },
    }),
    part(spike(37, 26, 44, 27, 3), 'spine', 3.5, {
      anim: { sway: 4, pivot: [37, 26], phase: 0.6 },
    }),
    part(spike(30, 11, 31, 4, 3), 'spine', 3.5, { anim: { sway: 4, pivot: [30, 11], phase: 0.2 } }),
    // Nackenschild mit Augenflecken
    part(oval(31, 20, 8.5, 10.5, 8), 'body', 4, { id: 'hood' }),
    part(oval(34, 17, 2.6, 3.2), 'mark', 4.1, { clip: 'hood' }),
    part(oval(34, 24, 2.2, 2.6), 'mark', 4.1, { clip: 'hood' }),
    part(oval(34, 17, 1.1, 1.4), 'spine', 4.2, { clip: 'hood', shading: 'glow' }),
    // Kopf
    part(oval(24, 18, 6.2, 5), 'body', 5),
    part(oval(18.5, 20, 4.5, 3.2), 'body', 5.1),
    part(oval(19, 21.5, 3.6, 1.4), 'belly', 5.2, { clip: 'body', view: 'front' }),
    part(limb(15, 21.5, 9, 23, 0.6), 'tongue', 4.9, { view: 'front', anim: { bob: 0.6 } }),
    part(limb(9.5, 23, 7, 21.5, 0.45), 'tongue', 4.9, { view: 'front', anim: { bob: 0.6 } }),
    part(limb(9.5, 23, 7, 24.8, 0.45), 'tongue', 4.9, { view: 'front', anim: { bob: 0.6 } }),
    ...eye(21, 17, 1.8, 1.9, { style: 'slit', lid: 0.4, lidTilt: 14, look: [-0.4, 0.2] }),
  ],
};

const grabbler: SpriteDef = {
  palette: {
    body: '#8a5a34',
    belly: '#e2c69a:3',
    claw: '#e8e0cc:3',
    dirt: '#5a4030:2',
    nose: ['#c04a6a', '#f07a9a'],
  },
  breathe: 0.025,
  parts: [
    // Erdklumpen
    part(oval(52, 58, 6, 2.5), 'dirt', 0.5),
    part(oval(58, 55, 2.5, 2), 'dirt', 0.5),
    // Ferner Arm und Hinterbein
    part(limb(30, 46, 30, 56, 4, 3.4), 'body', 1, { tone: -1, group: 'arm-far' }),
    part(spike(28, 56, 25, 61, 2.4), 'claw', 1.1, { tone: -1 }),
    part(spike(31, 57, 30, 62, 2.4), 'claw', 1.1, { tone: -1 }),
    part(limb(48, 50, 50, 58, 4, 3.4), 'body', 1, { tone: -1, group: 'leg-far' }),
    // Schwanz
    part(limb(51, 44, 57, 41, 2.6, 1.5), 'body', 1.5, {
      backZ: 9,
      anim: { sway: 8, pivot: [51, 44] },
    }),
    // Körper mit Buckel
    part(oval(38, 46, 16.5, 11), 'body', 3, { id: 'torso' }),
    part(oval(36, 52, 11, 4.5), 'belly', 3.5, { clip: 'torso', backMat: 'body' }),
    part(oval(42, 37.5, 2.6, 1.6), 'dirt', 3.6, { clip: 'torso' }),
    part(oval(48, 41, 1.8, 1.2), 'dirt', 3.6, { clip: 'torso' }),
    part(limb(46, 50, 46, 58, 4.5, 3.8), 'body', 4, { group: 'leg' }),
    // Kopf mit Dachsstreifen
    part(oval(19, 44, 9.5, 8.5), 'body', 5, { id: 'head' }),
    part(oval(11, 48, 5.5, 4), 'body', 5.1),
    part(oval(10, 49.5, 4.5, 2.3), 'belly', 5.2, { clip: 'body', view: 'front' }),
    part(curve([8, 44, 16, 38, 27, 38], 1.8, 2.4), 'belly', 5.3, { clip: 'head' }),
    part(oval(6.4, 47.2, 2.2, 1.8), 'nose', 6),
    part(curve([8, 51, 10.5, 52.5, 13, 51.2], 0.5), 'ink', 6, { view: 'front', lines: false }),
    ...eye(17, 42.5, 1.4, 1.3, { style: 'button' }),
    // Große Grabschaufel vorn
    part(limb(24, 47, 20, 55, 4.6, 4), 'body', 7, {
      group: 'arm',
      anim: { attackRot: 20, pivot: [24, 47] },
    }),
    part(horn(19, 55, 14, 56, 9, 61, 2.1), 'claw', 7.1, {
      group: 'claws',
      anim: { attackRot: 20, pivot: [24, 47] },
    }),
    part(horn(21, 57, 17, 59, 14, 63, 2.1), 'claw', 7.1, {
      group: 'claws',
      anim: { attackRot: 20, pivot: [24, 47] },
    }),
    part(horn(23, 57, 21, 60, 20, 63, 2), 'claw', 7.1, {
      group: 'claws',
      anim: { attackRot: 20, pivot: [24, 47] },
    }),
  ],
};

const RIBBON = { sway: 10, pivot: [30, 15] as const };

const boeenreiter: SpriteDef = {
  palette: {
    body: '#e9eef6',
    feather: '#4f8fd6:3',
    band: '#d23a3a:3',
    beak: '#f0bf3a:3',
  },
  outline: '#1e2a44',
  parts: [
    // Stirnband-Bänder im Wind
    part(curve([31, 15, 40, 11, 50, 14], 1.3, 0.6), 'band', 1, { backZ: 12, anim: RIBBON }),
    part(curve([31, 16, 39, 17, 47, 21], 1.3, 0.6), 'band', 1, {
      backZ: 12,
      anim: { ...RIBBON, phase: 0.3 },
    }),
    // Ferner Flügel nach oben-hinten
    part(poly([36, 27, 47, 12, 55, 13, 52, 19, 56, 22, 48, 28, 42, 33], 2), 'feather', 2, {
      tone: -1,
      anim: { sway: 6, pivot: [36, 28] },
    }),
    // Schwanzfedern
    part(poly([36, 42, 50, 50, 44, 52, 47, 56, 34, 47], 1.5), 'feather', 2.5, { backZ: 11 }),
    // Standbein und angezogenes Bein (Kranich-Stellung)
    part(limb(33, 45, 34, 58, 1.5), 'beak', 3, { group: 'leg-a' }),
    part(poly([29, 59, 38, 59, 36, 57], 0.6), 'beak', 3.1, { group: 'leg-a' }),
    part(limb(29, 44, 23, 48, 1.6), 'beak', 3, { group: 'leg-b' }),
    part(limb(23, 48, 27, 52, 1.4), 'beak', 3, { group: 'leg-b' }),
    // Körper
    part(oval(32, 35, 8.5, 11.5, 12), 'body', 4, { id: 'torso' }),
    part(oval(29, 37, 4.5, 8, 12), 'feather', 4.1, {
      clip: 'torso',
      shading: 'flat',
      backMat: 'body',
    }),
    // Kopf mit Schnabel und Stirnband
    part(oval(27, 18, 6.2, 5.6), 'body', 5),
    part(poly([23, 13, 27, 7, 30, 12], 1), 'feather', 4.9),
    part(poly([21, 16.5, 9, 19, 21, 21], 0.8), 'beak', 6),
    part(curve([21.5, 14, 27, 12.6, 33, 14.4], 1.6), 'band', 6.2),
    ...eye(24.5, 17.5, 1.7, 1.8, { lid: 0.35, lidTilt: 14, look: [-0.5, 0.2] }),
    // Naher Flügel als Schlagarm nach vorn
    part(
      poly([29, 27, 18, 27, 8, 31, 12, 33, 6, 36, 14, 37, 10, 41, 22, 38, 31, 34], 1.8),
      'feather',
      7,
      {
        anim: { sway: -4, pivot: [30, 29], attackRot: -10 },
      },
    ),
  ],
};

const psylumen: SpriteDef = {
  palette: {
    body: '#c6a4f2',
    moon: '#fff0b0:3',
    star: '#ffe080:3',
    psi: ['#e0508e', '#ff8ac8'],
  },
  outline: '#2a2050',
  float: 3,
  breathe: 0.04,
  parts: [
    // Kometenschweif aus Sternenstaub
    part(curve([36, 34, 46, 44, 40, 54, 50, 60], 4.5, 0.6), 'body', 1, {
      alpha: 0.75,
      anim: { sway: 8, pivot: [36, 34] },
    }),
    part(star(44, 50, 1.6), 'star', 1.1, { shading: 'glow', anim: { sway: 8, pivot: [36, 34] } }),
    part(star(48, 58, 1.3), 'star', 1.1, { shading: 'glow', anim: { sway: 8, pivot: [36, 34] } }),
    // Mondsichel als Kapuze
    part(oval(32, 24, 15, 15), 'moon', 2, { cut: [oval(36, 26, 12.5, 12.5)], shading: 'glow' }),
    // Leuchtender Körper
    part(oval(35, 27, 10.5, 10), 'body', 3, { id: 'core' }),
    part(oval(35, 31, 4, 2.5), 'psi', 3.2, { clip: 'core', shading: 'glow', alpha: 0.7 }),
    // Kleine schwebende Hände
    part(oval(22, 38, 2.6, 2.2), 'body', 4, { anim: { bob: 1.2, phase: 0.3 } }),
    part(oval(46, 37, 2.6, 2.2), 'body', 2.5, { tone: -1, anim: { bob: 1.2, phase: 0.8 } }),
    // Schlafende Augen und Lächeln
    part(curve([28, 25, 30.5, 27, 33, 25], 0.6), 'ink', 4, { view: 'front', lines: false }),
    part(curve([37, 25, 39.5, 27, 42, 25], 0.6), 'ink', 4, { view: 'front', lines: false }),
    part(curve([33.5, 30, 35.5, 31.5, 37.5, 30], 0.5), 'ink', 4, { view: 'front', lines: false }),
    // Sternenkrone und Funkeln
    part(star(26, 9, 4, 5, 0.45, -15), 'star', 4.5, { shading: 'glow', anim: { bob: 0.8 } }),
    part(star(10, 20, 2.6), 'star', 5, { shading: 'glow', anim: { bob: 1.5, phase: 0.2 } }),
    part(star(54, 14, 2.2), 'star', 5, { shading: 'glow', anim: { bob: 1.5, phase: 0.7 } }),
  ],
};

const kolonix: SpriteDef = {
  palette: {
    body: '#4fb8a8',
    beetle: '#a3b83a:3',
    dark: '#26343a:2',
    glow: ['#d0f060', '#f6ffb0'],
  },
  breathe: 0.02,
  parts: [
    // Viele kleine Beine
    part(limb(18, 50, 14, 58, 1.4, 0.8), 'dark', 1, { mirror: false }),
    part(limb(26, 53, 24, 60, 1.4, 0.8), 'dark', 1),
    part(limb(36, 54, 37, 61, 1.4, 0.8), 'dark', 1),
    part(limb(45, 53, 49, 60, 1.4, 0.8), 'dark', 1),
    part(limb(52, 49, 58, 56, 1.4, 0.8), 'dark', 1),
    // Kristalltürme
    part(spike(26, 34, 21, 15, 7, 2), 'body', 2, { gloss: true }),
    part(spike(35, 31, 37, 9, 8, 2), 'body', 2, { gloss: true }),
    part(spike(44, 34, 51, 18, 6.5, 2), 'body', 2, { gloss: true }),
    // Kristallkuppel aus Facetten
    part(oval(34, 44, 22, 14.5), 'body', 3, { id: 'dome', gloss: true }),
    part(poly([20, 36, 30, 32, 32, 42, 22, 46], 1, [-0.6, -0.5]), 'body', 3.2, {
      clip: 'dome',
      shading: 'bevel',
    }),
    part(poly([34, 31, 46, 34, 44, 44, 34, 42], 1, [0.4, -0.6]), 'body', 3.2, {
      clip: 'dome',
      shading: 'bevel',
    }),
    part(poly([24, 48, 34, 44, 40, 52, 28, 56], 1, [0.2, 0.5]), 'body', 3.2, {
      clip: 'dome',
      shading: 'bevel',
    }),
    part(poly([46, 36, 55, 42, 52, 52, 44, 46], 1, [0.7, 0.2]), 'body', 3.2, {
      clip: 'dome',
      shading: 'bevel',
    }),
    // Höhlenöffnung mit Augen der Königin
    part(oval(17, 49, 6.5, 5), 'dark', 4, { clip: 'dome', view: 'front' }),
    part(oval(15, 48.5, 1.3, 1.6), 'glow', 4.2, { view: 'front', shading: 'glow' }),
    part(oval(19.5, 48.5, 1.3, 1.6), 'glow', 4.2, { view: 'front', shading: 'glow' }),
    // Krabbelnde Kristallkäfer
    part(oval(28, 38, 2.6, 2), 'beetle', 5, { gloss: true, anim: { bob: 0.8 } }),
    part(oval(45, 47, 2.6, 2), 'beetle', 5, { gloss: true, anim: { bob: 0.8, phase: 0.5 } }),
    part(oval(37, 52, 2.4, 1.8), 'beetle', 5, { gloss: true, anim: { bob: 0.8, phase: 0.25 } }),
    part(oval(52, 39, 2.2, 1.8), 'beetle', 5, { gloss: true, anim: { bob: 0.8, phase: 0.75 } }),
  ],
};

const geodax: SpriteDef = {
  palette: {
    body: '#8a7c6c',
    dark: '#352640:2',
    gem: '#a564e6',
    eye: ['#e8b0ff'],
  },
  breathe: 0.015,
  parts: [
    // Stummelbeine
    part(limb(44, 52, 45, 59, 4.6, 4.2), 'body', 1, { tone: -1, group: 'legs-far' }),
    part(limb(24, 52, 23, 59, 4.2, 4), 'body', 1, { tone: -1, group: 'legs-far' }),
    // Felskörper mit Bruchkante
    part(oval(36, 42, 20, 15.5), 'body', 2, { id: 'rock' }),
    part(oval(36, 31, 12.5, 6.5), 'dark', 2.5, { clip: 'rock' }),
    part(oval(44, 46, 2.5, 1.6), 'dark', 2.6, { clip: 'rock' }),
    part(oval(28, 50, 1.8, 1.2), 'dark', 2.6, { clip: 'rock' }),
    // Amethyst-Druse
    part(spike(30, 33, 26, 18, 6, 1.5), 'gem', 3, { gloss: true, group: 'gem-a' }),
    part(spike(37, 33, 38, 12, 7.5, 1.8), 'gem', 3.2, { gloss: true, group: 'gem-b' }),
    part(spike(44, 33, 49, 20, 6, 1.5), 'gem', 3.1, { gloss: true, group: 'gem-c' }),
    part(spike(34, 34, 32, 25, 4, 1), 'gem', 3.3, { gloss: true, group: 'gem-d' }),
    part(spike(41, 34, 43, 26, 4, 1), 'gem', 3.3, { gloss: true, group: 'gem-e' }),
    // Kopf vorn
    part(oval(18, 46, 8.5, 7.5), 'body', 4),
    part(spike(15, 40, 11, 35, 3), 'gem', 3.9, { gloss: true }),
    ...eye(14.5, 45.5, 1.5, 1.6, { style: 'glow' }),
    part(curve([10, 50, 12.5, 51.5, 15, 50.5], 0.5), 'ink', 5, { view: 'front', lines: false }),
    // Nahe Beine
    part(limb(42, 54, 41, 60, 4.8, 4.4), 'body', 5, { group: 'leg-a' }),
    part(limb(26, 54, 26, 60, 4.6, 4.2), 'body', 5, { group: 'leg-b' }),
  ],
};

const laternix: SpriteDef = {
  palette: {
    body: '#3f3a56',
    glass: '#ff9a3a:3',
    flame: '#fff0a0:3',
    ghost: '#9a7ae0:3',
  },
  float: 2,
  parts: [
    // Geisterschweif
    part(curve([32, 40, 26, 48, 36, 54, 29, 62], 4.5, 0.6), 'ghost', 1, {
      alpha: 0.7,
      anim: { sway: 8, pivot: [32, 40] },
    }),
    part(oval(18, 32, 3, 2.2, 30), 'ghost', 1, {
      alpha: 0.7,
      mirror: true,
      anim: { sway: 12, pivot: [24, 30] },
    }),
    // Griff und Deckel
    part(oval(32, 8.5, 4.2, 4), 'body', 2, { cut: [oval(32, 8.5, 2.2, 2)] }),
    part(poly([26, 12, 38, 12, 42, 17, 22, 17], 1), 'body', 3, { gloss: true }),
    // Glaskörper mit Flamme
    part(poly([23, 17, 41, 17, 43, 34, 21, 34], 1.5), 'glass', 3, { id: 'glass', shading: 'glow' }),
    part(flame(32, 33, 5.5, 15, -1), 'flame', 3.5, {
      clip: 'glass',
      shading: 'glow',
      anim: { sway: 4, pivot: [32, 33] },
    }),
    part(oval(29, 27, 1.3, 1.8), 'ink', 3.7, { view: 'front', lines: false }),
    part(oval(35, 27, 1.3, 1.8), 'ink', 3.7, { view: 'front', lines: false }),
    // Rahmen
    part(limb(23, 17, 21.5, 34, 1.1), 'body', 4, { group: 'frame' }),
    part(limb(41, 17, 42.5, 34, 1.1), 'body', 4, { group: 'frame' }),
    part(limb(32, 17, 32, 21, 0.9), 'body', 4, { group: 'frame' }),
    part(poly([21, 34, 43, 34, 39, 39, 25, 39], 1), 'body', 4, { group: 'frame', gloss: true }),
  ],
};

const ferrox: SpriteDef = {
  palette: {
    body: '#566072',
    metal: '#a9b6c8',
    muzzle: '#c8a070:3',
    forge: ['#d0602a', '#ffb050'],
  },
  breathe: 0.02,
  parts: [
    // Ferner Arm und Bein
    part(limb(45, 30, 51, 44, 5, 4.4), 'body', 1, { tone: -1, group: 'arm-far' }),
    part(oval(51.5, 46.5, 4.6, 4), 'body', 1.1, { tone: -1, group: 'arm-far' }),
    part(limb(40, 50, 42, 59, 5.6, 5), 'body', 1, { tone: -1, group: 'leg-far' }),
    // Eisenspan-Fell auf dem Rücken
    part(spike(42, 22, 50, 14, 5), 'metal', 1.5, { gloss: true }),
    part(spike(46, 28, 55, 23, 5), 'metal', 1.5, { gloss: true }),
    part(spike(47, 35, 56, 33, 4.5), 'metal', 1.5, { gloss: true }),
    // Körper
    part(oval(35, 40, 14.5, 16), 'body', 2, { id: 'torso' }),
    part(poly([26, 30, 41, 30, 39, 45, 28, 45], 2.5), 'metal', 3, { id: 'plate', gloss: true }),
    part(oval(33.5, 37.5, 3, 3), 'forge', 3.2, { clip: 'plate', shading: 'glow' }),
    part(oval(28.5, 33, 0.9), 'body', 3.3, { clip: 'plate' }),
    part(oval(38.5, 33, 0.9), 'body', 3.3, { clip: 'plate' }),
    part(oval(43, 25, 7, 5.5, 20), 'metal', 3.5, { gloss: true }),
    // Kopf
    part(oval(23, 10.5, 3, 3), 'body', 4, { group: 'head' }),
    part(oval(34, 10, 3, 3), 'body', 4, { group: 'head' }),
    part(oval(28.5, 17.5, 9, 8), 'body', 4.1, { group: 'head' }),
    part(oval(21, 21, 5, 4), 'muzzle', 4.5),
    part(oval(17.6, 19.6, 1.6, 1.2), 'ink', 5, { view: 'front', lines: false }),
    part(curve([17.5, 23, 20, 24.5, 23, 23.4], 0.5), 'ink', 5, { view: 'front', lines: false }),
    ...eye(25, 15.5, 1.6, 1.6, { lid: 0.4, lidTilt: 12, look: [-0.4, 0.2] }),
    // Beine
    part(limb(29, 50, 27, 59, 6, 5.4), 'body', 5, { group: 'leg' }),
    part(oval(25.5, 60, 6, 2.2), 'body', 5.1, { group: 'leg' }),
    // Naher Arm mit Pranke
    part(limb(24, 30, 16, 44, 5.4, 4.8), 'body', 6, {
      group: 'arm',
      anim: { attackRot: 25, pivot: [24, 30] },
    }),
    part(oval(15, 47, 5.4, 4.6), 'body', 6.1, {
      group: 'arm',
      anim: { attackRot: 25, pivot: [24, 30] },
    }),
    part(spike(11, 49, 7, 52, 2.2), 'white', 6.2, { anim: { attackRot: 25, pivot: [24, 30] } }),
    part(spike(14, 51, 11, 55, 2.2), 'white', 6.2, { anim: { attackRot: 25, pivot: [24, 30] } }),
    part(spike(18, 51, 17, 55.5, 2.2), 'white', 6.2, { anim: { attackRot: 25, pivot: [24, 30] } }),
  ],
};

const astrahirsch: SpriteDef = {
  palette: {
    body: '#6a64b8',
    belly: '#d8d0f2:3',
    antler: '#e6dac0:3',
    blossom: ['#d8609e', '#ffc4e2'],
  },
  parts: [
    // Ferne Beine
    part(limb(44, 42, 46, 59, 2.2, 1.6), 'body', 1, { tone: -1, group: 'legs-far' }),
    part(limb(28, 42, 26, 59, 2.2, 1.6), 'body', 1, { tone: -1, group: 'legs-far' }),
    // Fernes Geweih
    part(curve([24, 12, 30, 6, 38, 4], 1.2, 0.6), 'antler', 1.5, { tone: -1 }),
    part(limb(31, 6, 33, 0.5, 0.9, 0.5), 'antler', 1.5, { tone: -1 }),
    part(oval(38.5, 4, 2), 'blossom', 1.6, { tone: -1, shading: 'flat' }),
    // Schwanz
    part(oval(50, 32, 2.2, 3, 30), 'belly', 2, { backZ: 9 }),
    // Körper
    part(oval(37, 37, 13.5, 8), 'body', 3, { id: 'torso' }),
    part(oval(35, 42, 10, 3), 'belly', 3.1, { clip: 'torso', backMat: 'body' }),
    part(oval(40, 33, 0.9), 'white', 3.2, { clip: 'torso' }),
    part(oval(45, 35, 0.8), 'white', 3.2, { clip: 'torso' }),
    part(oval(35, 32, 0.8), 'white', 3.2, { clip: 'torso' }),
    // Hals und Kopf
    part(limb(28, 34, 22, 22, 4.4, 3.4), 'body', 4),
    part(oval(26, 16, 3.2, 1.5, -25), 'body', 4.4),
    part(oval(19.5, 19, 5.5, 4.6), 'body', 5),
    part(oval(13.5, 21, 3.6, 2.6, 10), 'body', 5.1),
    part(oval(13.5, 22, 3, 1.4), 'belly', 5.2, { clip: 'body', view: 'front' }),
    part(oval(10.6, 20.3, 1, 0.8), 'ink', 6, { view: 'front', lines: false }),
    ...eye(18, 18.2, 1.6, 1.8, { look: [-0.5, 0.1] }),
    // Nahes Blütengeweih
    part(curve([20, 14, 22, 5, 30, 1], 1.4, 0.7), 'antler', 6.5, { group: 'antler' }),
    part(limb(21.5, 8, 15, 3, 1, 0.5), 'antler', 6.5, { group: 'antler' }),
    part(limb(24, 4.5, 26, -1, 0.9, 0.5), 'antler', 6.5, { group: 'antler' }),
    part(oval(30.5, 1.5, 2.2), 'blossom', 7, { shading: 'flat', anim: { bob: 0.5 } }),
    part(oval(14.5, 3, 2), 'blossom', 7, { shading: 'flat', anim: { bob: 0.5, phase: 0.3 } }),
    part(oval(22.5, 9.5, 1.8), 'blossom', 7, { shading: 'flat', anim: { bob: 0.5, phase: 0.6 } }),
    part(oval(30.5, 1.5, 0.7), 'white', 7.1, { shading: 'flat', anim: { bob: 0.5 } }),
    // Nahe Beine
    part(limb(42, 42, 41, 59, 2.4, 1.7), 'body', 8, { group: 'leg-a' }),
    part(limb(30, 42, 30, 59, 2.4, 1.7), 'body', 8, { group: 'leg-b' }),
    part(oval(41, 59.5, 2, 1.2), 'ink', 8.1, { lines: false }),
    part(oval(30, 59.5, 2, 1.2), 'ink', 8.1, { lines: false }),
  ],
};

const umbrax: SpriteDef = {
  palette: {
    body: '#2e2648',
    mane: '#8a78d8:3',
    star: '#fff2b0:2',
    horn: '#c4bcdc:3',
    eye: ['#ff5a5a'],
  },
  float: 2,
  parts: [
    // Schwanz mit Sternenschleier
    part(curve([44, 36, 58, 44, 50, 58, 36, 56], 5, 1), 'body', 1, {
      id: 'tail',
      anim: { sway: 5, pivot: [44, 40] },
    }),
    part(oval(52, 52, 1), 'star', 1.1, { clip: 'tail', shading: 'glow' }),
    part(oval(47, 56, 0.8), 'star', 1.1, { clip: 'tail', shading: 'glow' }),
    // Mähne entlang des Rückens
    part(spike(30, 12, 36, 6, 4), 'mane', 1.5, { anim: { sway: 6, pivot: [30, 12] } }),
    part(spike(36, 16, 44, 12, 4), 'mane', 1.5, { anim: { sway: 6, pivot: [36, 16], phase: 0.3 } }),
    part(spike(42, 24, 51, 22, 4), 'mane', 1.5, { anim: { sway: 6, pivot: [42, 24], phase: 0.6 } }),
    part(spike(46, 32, 55, 33, 4), 'mane', 1.5, { anim: { sway: 6, pivot: [46, 32], phase: 0.9 } }),
    // Schlangenleib in S-Form
    part(curve([20, 22, 36, 8, 48, 26, 40, 40], 5.5, 5), 'body', 2, { id: 'coil' }),
    part(oval(32, 15, 0.9), 'star', 2.1, { clip: 'coil', shading: 'glow' }),
    part(oval(43, 22, 1), 'star', 2.1, { clip: 'coil', shading: 'glow' }),
    part(oval(42, 34, 0.8), 'star', 2.1, { clip: 'coil', shading: 'glow' }),
    // Kleine Arme
    part(limb(41, 34, 36, 42, 1.6, 1.3), 'body', 3, { group: 'arm' }),
    part(limb(36, 42, 33, 41, 1.2, 0.6), 'horn', 3.1, { group: 'claw' }),
    // Kopf mit Hörnern
    part(horn(20, 16, 24, 9, 31, 7, 1.6), 'horn', 3.5),
    part(oval(17, 21, 7, 5.6, -10), 'body', 4),
    part(oval(10, 24, 4.6, 3, 10), 'body', 4.1),
    part(curve([7, 25.5, 10, 27, 14, 25.8], 0.5), 'ink', 5, { view: 'front', lines: false }),
    part(spike(10, 26.5, 9, 29.5, 1.4, 0.3), 'white', 5, { view: 'front' }),
    part(curve([16, 27, 12, 33, 6, 36], 0.9, 0.3), 'mane', 4.2, {
      anim: { sway: 8, pivot: [16, 27] },
    }),
    ...eye(15, 19.5, 2, 1.6, { style: 'glow', lid: 0.3, lidTilt: 14 }),
  ],
};

export const WAVE_1B: Readonly<Record<string, SpriteDef>> = {
  nesselnatter,
  grabbler,
  boeenreiter,
  psylumen,
  kolonix,
  geodax,
  laternix,
  ferrox,
  astrahirsch,
  umbrax,
};
