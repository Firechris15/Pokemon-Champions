/** Typeffektivität (reine Funktionen). Die Tabelle selbst ist Datenbestand (`src/data/typechart.ts`). */
import type { TypeChart } from '../data/typechart.ts';
import type { TypeId } from './model.ts';

/** Faktor einer Essenz gegen eine einzelne Essenz. */
export function typeFactor(chart: TypeChart, attack: TypeId, defend: TypeId): number {
  return chart[attack][defend] ?? 1;
}

/** Gesamtfaktor gegen ein Monster – Doppeltypen multiplizieren (0, 0.25, 0.5, 1, 2, 4). */
export function effectiveness(
  chart: TypeChart,
  attack: TypeId,
  defenders: readonly TypeId[],
): number {
  let factor = 1;
  for (const defend of defenders) factor *= typeFactor(chart, attack, defend);
  return factor;
}
