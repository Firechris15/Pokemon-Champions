/**
 * Team-Validierung nach Format (SPEC 6.3): Werte-Grenzen, legale Attacken/Fähigkeiten,
 * Spezies-/Item-Klausel, Legenden-Sperre. Liefert Fehler als Codes + Parameter,
 * damit die UI sie über i18n verständlich anzeigen kann.
 */
import type { Dex, FormatData } from '../engine/dex.ts';
import { MAX_EV_PER_STAT, MAX_EV_TOTAL, MAX_IV, STAT_IDS } from '../engine/model.ts';
import type { MonsterSet } from '../engine/model.ts';

export type ValidationCode =
  | 'teamTooSmall'
  | 'teamTooLarge'
  | 'unknownSpecies'
  | 'unknownAbility'
  | 'illegalAbility'
  | 'unknownItem'
  | 'unknownNature'
  | 'unknownMove'
  | 'illegalMove'
  | 'noMoves'
  | 'tooManyMoves'
  | 'duplicateMove'
  | 'evOutOfRange'
  | 'evTotalTooHigh'
  | 'ivOutOfRange'
  | 'levelOutOfRange'
  | 'speciesClause'
  | 'itemClause'
  | 'legendaryBanned';

export interface ValidationProblem {
  code: ValidationCode;
  /** Team-Index des betroffenen Monsters (fehlt bei Problemen des ganzen Teams). */
  slot?: number;
  params: Record<string, string | number>;
}

export const MAX_MOVES = 4;

export function validateSet(dex: Dex, set: MonsterSet, slot?: number): ValidationProblem[] {
  const problems: ValidationProblem[] = [];
  const add = (code: ValidationCode, params: Record<string, string | number> = {}): void => {
    problems.push(slot === undefined ? { code, params } : { code, slot, params });
  };
  if (!dex.hasSpecies(set.species)) {
    add('unknownSpecies', { species: set.species });
    return problems;
  }
  const species = dex.species(set.species);

  if (!dex.hasAbility(set.ability)) add('unknownAbility', { ability: set.ability });
  else if (!species.abilities.includes(set.ability)) {
    add('illegalAbility', { ability: set.ability, species: species.id });
  }
  if (set.item !== undefined && !dex.hasItem(set.item)) add('unknownItem', { item: set.item });
  if (!dex.hasNature(set.nature)) add('unknownNature', { nature: set.nature });

  if (set.moves.length === 0) add('noMoves');
  if (set.moves.length > MAX_MOVES) add('tooManyMoves', { count: set.moves.length });
  const seen = new Set<string>();
  for (const move of set.moves) {
    if (seen.has(move)) add('duplicateMove', { move });
    seen.add(move);
    if (!dex.hasMove(move)) add('unknownMove', { move });
    else if (!species.learnset.includes(move)) add('illegalMove', { move, species: species.id });
  }

  let evTotal = 0;
  for (const stat of STAT_IDS) {
    const ev = set.evs[stat] ?? 0;
    const iv = set.ivs[stat] ?? MAX_IV;
    evTotal += ev;
    if (!Number.isInteger(ev) || ev < 0 || ev > MAX_EV_PER_STAT)
      add('evOutOfRange', { stat, value: ev });
    if (!Number.isInteger(iv) || iv < 0 || iv > MAX_IV) add('ivOutOfRange', { stat, value: iv });
  }
  if (evTotal > MAX_EV_TOTAL) add('evTotalTooHigh', { total: evTotal });
  if (
    set.level !== undefined &&
    (!Number.isInteger(set.level) || set.level < 1 || set.level > 100)
  ) {
    add('levelOutOfRange', { level: set.level });
  }
  return problems;
}

export function validateTeam(
  dex: Dex,
  format: FormatData,
  team: readonly MonsterSet[],
): ValidationProblem[] {
  const problems: ValidationProblem[] = [];
  if (team.length < format.minTeamSize) {
    problems.push({
      code: 'teamTooSmall',
      params: { count: team.length, min: format.minTeamSize },
    });
  }
  if (team.length > format.maxTeamSize) {
    problems.push({
      code: 'teamTooLarge',
      params: { count: team.length, max: format.maxTeamSize },
    });
  }
  const species = new Set<string>();
  const items = new Set<string>();
  team.forEach((set, slot) => {
    problems.push(...validateSet(dex, set, slot));
    if (format.rules.speciesClause && species.has(set.species)) {
      problems.push({ code: 'speciesClause', slot, params: { species: set.species } });
    }
    species.add(set.species);
    if (set.item !== undefined) {
      if (format.rules.itemClause && items.has(set.item)) {
        problems.push({ code: 'itemClause', slot, params: { item: set.item } });
      }
      items.add(set.item);
    }
    if (
      format.rules.noLegendary &&
      dex.hasSpecies(set.species) &&
      dex.species(set.species).legendary
    ) {
      problems.push({ code: 'legendaryBanned', slot, params: { species: set.species } });
    }
  });
  return problems;
}
