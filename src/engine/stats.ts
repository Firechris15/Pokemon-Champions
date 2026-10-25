/** Werteformel, Wesen und Stat-Stufen (reine Funktionen). */
import type { NatureData, SpeciesData } from './dex.ts';
import { MAX_BOOST, MAX_IV, STAT_IDS } from './model.ts';
import type { MonsterSet, StatId, StatTable } from './model.ts';

/** Faktor des Wesens für einen Wert in Prozent (90, 100 oder 110). */
export function natureFactor(nature: NatureData, stat: StatId): number {
  if (stat === 'hp') return 100;
  if (nature.plus === stat) return 110;
  if (nature.minus === stat) return 90;
  return 100;
}

/**
 * Klassische Werteformel. LP: ⌊(2·B + IV + ⌊EV/4⌋)·L/100⌋ + L + 10,
 * andere Werte: ⌊(⌊(2·B + IV + ⌊EV/4⌋)·L/100⌋ + 5) · Wesen⌋.
 */
export function calcStat(
  stat: StatId,
  base: number,
  iv: number,
  ev: number,
  level: number,
  natureFactorPercent = 100,
): number {
  const core = Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100);
  if (stat === 'hp') return core + level + 10;
  return Math.floor(((core + 5) * natureFactorPercent) / 100);
}

export function calcStats(
  species: SpeciesData,
  set: Pick<MonsterSet, 'evs' | 'ivs'>,
  nature: NatureData,
  level: number,
): StatTable {
  const result = {} as StatTable;
  for (const stat of STAT_IDS) {
    result[stat] = calcStat(
      stat,
      species.baseStats[stat],
      set.ivs[stat] ?? MAX_IV,
      set.evs[stat] ?? 0,
      level,
      natureFactor(nature, stat),
    );
  }
  return result;
}

export function clampBoost(stage: number): number {
  return Math.max(-MAX_BOOST, Math.min(MAX_BOOST, stage));
}

/** Stat-Stufe → Bruch: +1 = 3/2, +6 = 8/2, −1 = 2/3, −6 = 2/8. */
export function boostFraction(stage: number): readonly [number, number] {
  const s = clampBoost(stage);
  return s >= 0 ? [2 + s, 2] : [2, 2 - s];
}

export function applyBoost(value: number, stage: number): number {
  const [num, den] = boostFraction(stage);
  return Math.floor((value * num) / den);
}

/** Genauigkeits-/Ausweich-Stufe → Bruch (eigene Tabelle): +1 = 4/3, −1 = 3/4 … ±6 = 9/3 bzw. 3/9. */
export function accuracyFraction(stage: number): readonly [number, number] {
  const s = clampBoost(stage);
  return s >= 0 ? [3 + s, 3] : [3, 3 - s];
}
