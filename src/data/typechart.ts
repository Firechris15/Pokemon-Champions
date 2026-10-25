/**
 * Die 18 Essenzen (Typen) und ihre Wirkungstabelle.
 * Namen stehen in den i18n-Dateien (`types.<id>`), Hintergründe in LORE.md.
 * Einträge fehlen = neutral (1×). Werte: 2 = sehr effektiv, 0.5 = nicht sehr effektiv, 0 = wirkungslos.
 */

export const TYPE_IDS = [
  'wild',
  'ember',
  'tide',
  'flora',
  'spark',
  'frost',
  'brawl',
  'venom',
  'earth',
  'gale',
  'psi',
  'swarm',
  'crystal',
  'haunt',
  'wyrm',
  'shadow',
  'metal',
  'astral',
] as const;

export type TypeId = (typeof TYPE_IDS)[number];

export type Effectiveness = 0 | 0.5 | 2;

/** Angreifende Essenz → verteidigende Essenz → Faktor. */
export type TypeChart = Readonly<Record<TypeId, Readonly<Partial<Record<TypeId, Effectiveness>>>>>;

function row(
  strong: TypeId[],
  weak: TypeId[],
  none: TypeId[] = [],
): Partial<Record<TypeId, Effectiveness>> {
  const result: Partial<Record<TypeId, Effectiveness>> = {};
  for (const t of strong) result[t] = 2;
  for (const t of weak) result[t] = 0.5;
  for (const t of none) result[t] = 0;
  return result;
}

export const TYPE_CHART: TypeChart = {
  wild: row(['psi', 'swarm'], ['crystal', 'metal'], ['haunt']),
  ember: row(['flora', 'frost', 'swarm', 'metal'], ['ember', 'tide', 'crystal', 'wyrm']),
  tide: row(['ember', 'earth', 'crystal'], ['tide', 'flora', 'wyrm', 'frost']),
  flora: row(['tide', 'earth', 'crystal'], ['ember', 'flora', 'venom', 'gale', 'metal']),
  spark: row(['tide', 'gale', 'metal'], ['spark', 'flora', 'wyrm'], ['earth', 'crystal']),
  frost: row(['flora', 'earth', 'gale', 'wyrm'], ['ember', 'tide', 'frost', 'metal']),
  brawl: row(
    ['wild', 'frost', 'crystal', 'shadow', 'metal'],
    ['venom', 'gale', 'psi', 'swarm', 'astral'],
    ['haunt'],
  ),
  venom: row(['flora', 'wild', 'astral'], ['venom', 'earth', 'crystal', 'haunt'], ['metal']),
  earth: row(['ember', 'spark', 'venom', 'crystal', 'metal'], ['flora', 'swarm'], ['gale']),
  gale: row(['flora', 'brawl', 'swarm', 'venom'], ['spark', 'crystal', 'metal', 'frost']),
  psi: row(['brawl', 'venom', 'wyrm'], ['psi'], ['shadow']),
  swarm: row(['flora', 'psi', 'shadow'], ['ember', 'gale', 'haunt']),
  crystal: row(['ember', 'frost', 'gale', 'haunt'], ['brawl', 'earth', 'metal']),
  haunt: row(['haunt', 'astral'], ['shadow'], ['wild']),
  wyrm: row(['wyrm'], [], ['astral']),
  shadow: row(['psi', 'haunt', 'astral'], ['brawl', 'shadow']),
  metal: row(['frost', 'crystal', 'astral'], ['ember', 'tide', 'spark', 'metal']),
  astral: row(['brawl', 'wyrm', 'shadow', 'haunt'], ['ember', 'venom', 'metal']),
};

/** Darstellung pro Essenz (Farbe für Buttons/Badges; Symbole folgen mit den prozeduralen Icons). */
export const TYPE_COLORS: Readonly<Record<TypeId, string>> = {
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
