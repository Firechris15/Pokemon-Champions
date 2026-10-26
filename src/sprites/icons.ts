/**
 * Prozedurale Symbole: Essenzen (Typen), Statusprobleme und Items – mit demselben Formen-System
 * wie die Monster, gerastert auf kleine Größen (16–32 px).
 */
import {
  curve,
  flame,
  horn,
  limb,
  oval,
  part,
  poly,
  spike,
  star,
  type Part,
  type SpriteDef,
} from './model.ts';

const GLYPH = { shading: 'flat', lines: false } as const;
const ICON_OUTLINE = '#17141f';

/** Rundes Abzeichen in `color` mit hellem Symbol. */
function badge(color: string, glyph: readonly Part[]): SpriteDef {
  return {
    palette: { body: color, glyph: ['#fffaf0'] },
    outline: ICON_OUTLINE,
    breathe: 0,
    parts: [part(oval(32, 32, 30, 30), 'body', 0, { lines: false }), ...glyph],
  };
}

const g = (shape: Part['shape'], options: Partial<Part> = {}): Part =>
  part(shape, 'glyph', 1, { ...GLYPH, ...options });
/** Ausgeschnittene Linie in der Grundfarbe (Blattader, Fingerlinie …). */
const cutLine = (shape: Part['shape']): Part => part(shape, 'body', 2, { ...GLYPH, tone: -1 });

const FLAME = [
  g(flame(32, 54, 13, 44, 4)),
  g(flame(21, 54, 7, 24, -6)),
  g(flame(43, 54, 7, 22, 6)),
  part(flame(32, 54, 5, 16, 1), 'body', 2, { ...GLYPH, tone: 1 }),
];
const BOLT = [g(poly([37, 8, 18, 36, 30, 36, 25, 56, 46, 25, 34, 25, 41, 8], 0))];
const DROP = [g(oval(32, 40, 12, 12)), g(poly([22, 35, 32, 10, 42, 35], 0))];
const FLAKE = [
  g(limb(32, 10, 32, 54, 3)),
  g(limb(13, 21, 51, 43, 3)),
  g(limb(13, 43, 51, 21, 3)),
  g(limb(32, 17, 26, 12, 2)),
  g(limb(32, 17, 38, 12, 2)),
  g(limb(32, 47, 26, 52, 2)),
  g(limb(32, 47, 38, 52, 2)),
];

const TYPE_GLYPHS: Readonly<Record<string, readonly Part[]>> = {
  wild: [
    g(oval(32, 41, 11, 9)),
    g(oval(18, 27, 5, 6.5, -20)),
    g(oval(27, 19, 5, 6.5, -8)),
    g(oval(37, 19, 5, 6.5, 8)),
    g(oval(46, 27, 5, 6.5, 20)),
  ],
  ember: FLAME,
  tide: DROP,
  flora: [g(oval(32, 32, 10, 21, 40)), cutLine(limb(22, 43, 42, 21, 1.6))],
  spark: BOLT,
  frost: FLAKE,
  brawl: [
    g(poly([16, 24, 46, 24, 48, 48, 18, 48], 4)),
    g(oval(17, 36, 6, 9)),
    cutLine(limb(25, 25, 25, 34, 1.4)),
    cutLine(limb(33, 25, 33, 34, 1.4)),
    cutLine(limb(41, 25, 41, 34, 1.4)),
  ],
  venom: [g(oval(27, 39, 11, 11)), g(oval(42, 24, 7, 7)), g(oval(44, 45, 4.5, 4.5))],
  earth: [g(poly([8, 50, 25, 18, 34, 32, 41, 22, 56, 50], 0))],
  gale: [
    g(curve([10, 25, 30, 16, 48, 24, 44, 34, 36, 30], 3)),
    g(curve([12, 40, 30, 35, 52, 40], 3)),
    g(curve([18, 51, 30, 48, 42, 53], 2.6)),
  ],
  psi: [g(oval(32, 32, 21, 12)), part(oval(32, 32, 6.5, 6.5), 'body', 2, { ...GLYPH, tone: -2 })],
  swarm: [
    g(oval(32, 38, 9, 12)),
    g(oval(32, 20, 6, 5.5)),
    g(limb(24, 32, 12, 26, 1.8)),
    g(limb(40, 32, 52, 26, 1.8)),
    g(limb(24, 40, 12, 42, 1.8)),
    g(limb(40, 40, 52, 42, 1.8)),
    g(limb(25, 47, 15, 54, 1.8)),
    g(limb(39, 47, 49, 54, 1.8)),
    g(limb(29, 16, 24, 8, 1.4)),
    g(limb(35, 16, 40, 8, 1.4)),
  ],
  crystal: [
    g(poly([32, 8, 48, 24, 41, 54, 23, 54, 16, 24], 0)),
    cutLine(limb(16, 24, 48, 24, 1.2)),
    cutLine(limb(32, 24, 32, 54, 1.2)),
  ],
  haunt: [
    g(oval(32, 28, 15, 15)),
    g(poly([17, 28, 47, 28, 47, 54, 40, 48, 32, 55, 24, 48, 17, 54], 0)),
    part(oval(26, 27, 3, 4.5), 'body', 2, { ...GLYPH, tone: -2 }),
    part(oval(38, 27, 3, 4.5), 'body', 2, { ...GLYPH, tone: -2 }),
  ],
  wyrm: [
    g(horn(16, 54, 22, 32, 26, 10, 4.4)),
    g(horn(28, 56, 34, 34, 38, 12, 4.4)),
    g(horn(40, 56, 46, 36, 50, 16, 4.4)),
  ],
  shadow: [g(oval(30, 32, 20, 20), { cut: [oval(40, 25, 16, 16)] })],
  metal: [g(star(32, 32, 22, 8, 0.74), { cut: [oval(32, 32, 7, 7)] })],
  astral: [g(star(31, 34, 22, 4, 0.3)), g(star(48, 15, 7, 4, 0.35))],
};

/** Farben der Essenzen (identisch mit `TYPE_COLORS` in den Daten, hier ohne Datenabhängigkeit). */
export const ICON_TYPE_COLORS: Readonly<Record<string, string>> = {
  wild: '#b8a57a',
  ember: '#e8643a',
  tide: '#3a8ee8',
  flora: '#4fb04a',
  spark: '#f2c230',
  frost: '#7fd8f0',
  brawl: '#c4473a',
  venom: '#9b4fc4',
  earth: '#c9934a',
  gale: '#8fb3e8',
  psi: '#e85a9b',
  swarm: '#a3b83a',
  crystal: '#5fc9b8',
  haunt: '#6a5aa8',
  wyrm: '#5a4fe0',
  shadow: '#4a3f4f',
  metal: '#9aa8b8',
  astral: '#f0a8e0',
};

export const TYPE_ICONS: Readonly<Record<string, SpriteDef>> = Object.fromEntries(
  Object.entries(TYPE_GLYPHS).map(([id, glyph]) => [
    id,
    badge(ICON_TYPE_COLORS[id] ?? '#808080', glyph),
  ]),
);

export const STATUS_COLORS: Readonly<Record<string, string>> = {
  brn: '#d8502a',
  par: '#e0b020',
  psn: '#9b4fc4',
  tox: '#6a2a8a',
  slp: '#7a88b0',
  frz: '#5ab8e0',
};

export const STATUS_ICONS: Readonly<Record<string, SpriteDef>> = {
  brn: badge(STATUS_COLORS.brn ?? '', FLAME),
  par: badge(STATUS_COLORS.par ?? '', BOLT),
  psn: badge(STATUS_COLORS.psn ?? '', DROP),
  tox: badge(STATUS_COLORS.tox ?? '', [
    g(oval(32, 28, 15, 14)),
    g(poly([22, 34, 42, 34, 40, 50, 24, 50], 2)),
    part(oval(26, 28, 4, 4.5), 'body', 2, { ...GLYPH, tone: -2 }),
    part(oval(38, 28, 4, 4.5), 'body', 2, { ...GLYPH, tone: -2 }),
    cutLine(limb(29, 44, 29, 50, 1.2)),
    cutLine(limb(35, 44, 35, 50, 1.2)),
  ]),
  slp: badge(STATUS_COLORS.slp ?? '', [
    g(poly([12, 28, 32, 28, 32, 32, 19, 46, 32, 46, 32, 51, 12, 51, 12, 47, 25, 33, 12, 33], 0)),
    g(poly([36, 12, 52, 12, 52, 15, 41, 26, 52, 26, 52, 30, 36, 30, 36, 27, 47, 16, 36, 16], 0)),
  ]),
  frz: badge(STATUS_COLORS.frz ?? '', FLAKE),
};

/** Attacken-Kategorien: physisch (Stoß), speziell (Ringe), Status (drei Punkte). */
export const CATEGORY_COLORS: Readonly<Record<string, string>> = {
  physical: '#d8582a',
  special: '#4a6ad8',
  status: '#8a8a9a',
};

export const CATEGORY_ICONS: Readonly<Record<string, SpriteDef>> = {
  physical: badge(CATEGORY_COLORS.physical ?? '', [g(star(32, 32, 22, 8, 0.45, 0.2))]),
  special: badge(CATEGORY_COLORS.special ?? '', [
    g(oval(32, 32, 18, 18)),
    part(oval(32, 32, 11, 11), 'body', 2, { ...GLYPH, tone: -1 }),
    g(oval(32, 32, 5, 5), { z: 3 }),
  ]),
  status: badge(CATEGORY_COLORS.status ?? '', [
    g(oval(32, 20, 7, 7)),
    g(oval(20, 41, 7, 7)),
    g(oval(44, 41, 7, 7)),
  ]),
};

// ───────────────────────────── Items ─────────────────────────────

function itemDef(palette: SpriteDef['palette'], parts: readonly Part[]): SpriteDef {
  return { palette, outline: ICON_OUTLINE, breathe: 0, parts };
}

function berry(color: string): SpriteDef {
  return itemDef({ body: color, leaf: '#4fb04a:3' }, [
    part(oval(32, 38, 17, 16), 'body', 1, { gloss: true }),
    part(oval(24, 32, 3, 4, -30), 'white', 1.1, { shading: 'flat', lines: false, alpha: 0.8 }),
    part(limb(32, 22, 34, 12, 1.6), 'leaf', 2),
    part(oval(42, 16, 9, 4.5, -25), 'leaf', 2.1),
  ]);
}

function gem(color: string, glow = false): SpriteDef {
  return itemDef({ body: color, glow: ['#fff8d0'] }, [
    part(poly([32, 8, 50, 24, 42, 56, 22, 56, 14, 24], 3, [0.3, 0.2]), 'body', 1, {
      shading: 'bevel',
      gloss: true,
    }),
    part(poly([32, 8, 50, 24, 32, 30, 14, 24], 2, [-0.4, -0.7]), 'body', 1.1, { shading: 'bevel' }),
    part(poly([14, 24, 32, 30, 22, 56], 1.5, [-0.8, 0.1]), 'body', 1.1, { shading: 'bevel' }),
    ...(glow ? [part(star(26, 34, 5), 'glow', 1.2, { shading: 'flat', lines: false })] : []),
  ]);
}

function band(color: string, knot: string): SpriteDef {
  return itemDef({ body: color, knot: `${knot}:3` }, [
    part(curve([8, 34, 32, 22, 56, 34], 6), 'body', 1),
    part(curve([40, 30, 48, 44, 44, 56], 3.4, 2), 'body', 0.9, { tone: -1 }),
    part(curve([44, 30, 56, 40, 58, 52], 3.4, 2), 'body', 0.9),
    part(oval(42, 30, 6, 5.5), 'knot', 1.2, { gloss: true }),
  ]);
}

function glasses(color: string): SpriteDef {
  return itemDef({ body: color, glass: '#bfe6ff:3' }, [
    part(oval(19, 34, 13, 11), 'body', 1),
    part(oval(45, 34, 13, 11), 'body', 1),
    part(oval(19, 34, 9.5, 7.5), 'glass', 1.1, { gloss: true }),
    part(oval(45, 34, 9.5, 7.5), 'glass', 1.1, { gloss: true }),
    part(limb(28, 30, 36, 30, 2), 'body', 0.9),
  ]);
}

function scarf(color: string, stripe: string): SpriteDef {
  return itemDef({ body: color, stripe: `${stripe}:3` }, [
    part(curve([8, 20, 30, 30, 54, 16], 7), 'body', 1, { id: 'scarf' }),
    part(curve([34, 26, 32, 44, 38, 58], 6, 5), 'body', 1.1),
    part(limb(30, 46, 40, 44, 1.6), 'stripe', 1.2, { clip: 'body' }),
    part(limb(18, 20, 22, 32, 1.6), 'stripe', 1.2, { clip: 'body' }),
    part(limb(42, 18, 44, 30, 1.6), 'stripe', 1.2, { clip: 'body' }),
  ]);
}

function heart(color: string, spot: string): SpriteDef {
  return itemDef({ body: color, spot: `${spot}:3` }, [
    part(oval(23, 26, 12, 12), 'body', 1),
    part(oval(41, 26, 12, 12), 'body', 1),
    part(poly([12, 30, 52, 30, 32, 56], 4), 'body', 1),
    part(oval(26, 36, 4, 3), 'spot', 1.2, { clip: 'body' }),
    part(oval(40, 26, 3, 2.4), 'spot', 1.2, { clip: 'body' }),
  ]);
}

function orb(color: string, glow: string): SpriteDef {
  return itemDef({ body: color, glow: `${glow}:3` }, [
    part(oval(32, 34, 20, 20), 'body', 1, { gloss: true }),
    part(oval(32, 34, 9, 9), 'glow', 1.1, { shading: 'glow', clip: 'body' }),
  ]);
}

export const ITEM_ICONS: Readonly<Record<string, SpriteDef>> = {
  lebenskristall: orb('#c84a8a', '#ff9ac8'),
  fixband: band('#d83a3a', '#f0c040'),
  fixbrille: glasses('#3a3a5a'),
  fixschal: scarf('#3a8ee8', '#f0f0f0'),
  schaerflinse: itemDef({ body: '#c8a050', glass: '#bfe6ff:3' }, [
    part(oval(26, 26, 17, 17), 'body', 1, { cut: [oval(26, 26, 12, 12)] }),
    part(oval(26, 26, 12, 12), 'glass', 0.9, { gloss: true }),
    part(limb(38, 38, 54, 54, 4.5, 3.6), 'body', 1.1),
  ]),
  glutkern: orb('#a83a1a', '#ffb040'),
  tiefenperle: itemDef({ body: '#e8f2ff', shell: '#3a8ee8:3' }, [
    part(oval(32, 46, 22, 10), 'shell', 0.9),
    part(oval(32, 30, 15, 15), 'body', 1, { gloss: true }),
  ]),
  blitzspule: itemDef({ body: '#d07040', spark: '#ffe24a:3' }, [
    ...[18, 26, 34, 42].map((y) =>
      part(oval(32, y + 4, 14, 4), 'body', 1 + y / 100, { gloss: true }),
    ),
    part(poly([34, 6, 26, 20, 32, 20, 28, 30, 40, 16, 34, 16, 38, 6], 0), 'spark', 2, {
      shading: 'glow',
    }),
  ]),
  frostsplitter: gem('#7fd8f0'),
  ankerband: itemDef({ body: '#8a9ab0', rope: '#d8b070:3' }, [
    part(limb(32, 14, 32, 50, 3.4), 'body', 1, { gloss: true }),
    part(curve([12, 38, 16, 54, 32, 54, 48, 54, 52, 38], 3), 'body', 1),
    part(limb(20, 22, 44, 22, 3), 'body', 1),
    part(oval(32, 10, 6, 6), 'rope', 1.2, { cut: [oval(32, 10, 3, 3)] }),
  ]),
  kampfweste: itemDef({ body: '#4a7a3a', trim: '#e0b040:3' }, [
    part(poly([14, 14, 26, 10, 32, 22, 38, 10, 50, 14, 52, 54, 12, 54], 4), 'body', 1),
    part(limb(32, 22, 32, 54, 1.6), 'trim', 1.1, { clip: 'body' }),
    part(oval(26, 34, 1.8), 'trim', 1.2),
    part(oval(26, 44, 1.8), 'trim', 1.2),
  ]),
  dornenhelm: itemDef({ body: '#7a8494', spike: '#d8e0ec:3' }, [
    part(spike(20, 22, 12, 8, 6), 'spike', 0.8),
    part(spike(32, 16, 32, 2, 6), 'spike', 0.8),
    part(spike(44, 22, 52, 8, 6), 'spike', 0.8),
    part(oval(32, 36, 22, 20), 'body', 1, { gloss: true, cut: [oval(32, 58, 26, 10)] }),
    part(limb(18, 40, 46, 40, 2.4), 'ink', 1.1, { clip: 'body', lines: false }),
  ]),
  sturmbrille: itemDef({ body: '#6a4a30', glass: '#9fe0d0:3' }, [
    part(curve([4, 34, 32, 26, 60, 34], 3), 'body', 0.8, { tone: -1 }),
    part(oval(20, 34, 11, 10), 'body', 1),
    part(oval(44, 34, 11, 10), 'body', 1),
    part(oval(20, 34, 7.5, 6.5), 'glass', 1.1, { gloss: true }),
    part(oval(44, 34, 7.5, 6.5), 'glass', 1.1, { gloss: true }),
  ]),
  klaerkraut: itemDef({ body: '#4fb04a', stem: '#7a5a3a:3' }, [
    part(limb(32, 58, 32, 20, 2), 'stem', 0.9),
    part(oval(22, 30, 9, 5, 30), 'body', 1),
    part(oval(42, 26, 9, 5, -30), 'body', 1),
    part(oval(32, 14, 6, 9), 'body', 1),
    part(oval(24, 44, 8, 4.5, 25), 'body', 1),
  ]),
  moosherz: heart('#4f9a3a', '#a8e070'),
  faulherz: heart('#6a3a7a', '#b0e04a'),
  rotbeere: berry('#d83a3a'),
  klarbeere: berry('#7ad0f0'),
  kuehlbeere: berry('#5ab8e0'),
  duerrbeere: berry('#d8a040'),
  borkenbeere: berry('#8a5a3a'),
  erdungsbeere: berry('#a8a060'),
  gluehbeere: berry('#ff8a3a'),
  wurzelbeere: berry('#b07a50'),
  polsterbeere: berry('#e07aa0'),
  lichtbeere: berry('#f0e080'),
  glutstein: gem('#e8643a', true),
  regenstein: gem('#3a8ee8', true),
  staubstein: gem('#c9934a', true),
  froststein: gem('#9fe8ff', true),
  feldkristall: itemDef({ body: '#9a7ae0' }, [
    part(poly([20, 54, 22, 20, 32, 8, 42, 20, 44, 54], 3, [-0.3, -0.2]), 'body', 1, {
      gloss: true,
    }),
    part(poly([32, 8, 42, 20, 32, 26, 22, 20], 1.5, [0, -0.8]), 'body', 1.1, { shading: 'bevel' }),
    part(star(50, 12, 6), 'white', 1.2, { shading: 'flat' }),
  ]),
};
