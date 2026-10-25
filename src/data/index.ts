/**
 * Spieldaten: Monster, Attacken, Fähigkeiten, Items, Typen, Wesen und Formate.
 * `STANDARD_DEX` ist der Datenbestand, mit dem Spiel, KI und Simulator arbeiten.
 */
import { Dex } from '../engine/dex.ts';
import { ABILITIES } from './abilities.ts';
import { FORMATS } from './formats.ts';
import { ITEMS } from './items.ts';
import { MOVES } from './moves.ts';
import { NATURES } from './natures.ts';
import { SPECIES } from './species.ts';
import { TYPE_CHART } from './typechart.ts';

export { ABILITIES } from './abilities.ts';
export { FORMATS } from './formats.ts';
export { ITEMS } from './items.ts';
export { MOVES } from './moves.ts';
export { NATURES } from './natures.ts';
export { SPECIES } from './species.ts';
export { TYPE_CHART, TYPE_COLORS, TYPE_IDS } from './typechart.ts';
export type { TypeId } from './typechart.ts';

export const STANDARD_DEX = new Dex({
  species: SPECIES,
  moves: MOVES,
  abilities: ABILITIES,
  items: ITEMS,
  natures: NATURES,
  formats: FORMATS,
  typeChart: TYPE_CHART,
});
