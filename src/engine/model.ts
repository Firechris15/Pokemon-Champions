/** Grundlegende Bezeichner und Datentypen der Kampf-Engine. */

export type { TypeId } from '../data/typechart.ts';

export const STAT_IDS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const;
/** LP, Angriff, Verteidigung, Fokus (Sp.-Angriff), Wille (Sp.-Verteidigung), Initiative. */
export type StatId = (typeof STAT_IDS)[number];
export type StatTable = Record<StatId, number>;

export const BOOST_IDS = ['atk', 'def', 'spa', 'spd', 'spe', 'accuracy', 'evasion'] as const;
export type BoostId = (typeof BOOST_IDS)[number];
export type BoostTable = Record<BoostId, number>;

export type SideIndex = 0 | 1;

/** Dauerhafte Statusprobleme: Brandmal, Starre, Toxin, Fäulnis, Schlummer, Frostbann. */
export const STATUS_IDS = ['brn', 'par', 'psn', 'tox', 'slp', 'frz'] as const;
export type StatusId = (typeof STATUS_IDS)[number];

/** Ein Monster als Team-Eintrag (Ergebnis des Teambuilders bzw. Zufallsgenerators). */
export interface MonsterSet {
  species: string;
  nickname?: string;
  /** Fehlt: Standard-Level des Formats. */
  level?: number;
  ability: string;
  item?: string;
  moves: readonly string[];
  nature: string;
  evs: Partial<StatTable>;
  ivs: Partial<StatTable>;
  gender?: 'm' | 'f';
  shiny?: boolean;
}

/** Feste Position auf dem Feld (Seite + Platz 0/1 im Doppel). */
export interface PositionRef {
  side: SideIndex;
  position: number;
}

/** Ein Monster im Kampfteam einer Seite (Index nach der Team-Vorschau). */
export interface MonRef {
  side: SideIndex;
  index: number;
}

export const MAX_EV_PER_STAT = 252;
export const MAX_EV_TOTAL = 510;
export const MAX_IV = 31;
export const MAX_BOOST = 6;

export function otherSide(side: SideIndex): SideIndex {
  return side === 0 ? 1 : 0;
}

export function emptyBoosts(): BoostTable {
  return { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, accuracy: 0, evasion: 0 };
}
