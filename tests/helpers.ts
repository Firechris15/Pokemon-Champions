/** Hilfen für Engine-Tests: kleine kontrollierte Daten und kompakte Kampf-Steuerung. */
import {
  ABILITIES,
  FORMATS,
  ITEMS,
  MOVES,
  NATURES,
  SPECIES,
  TYPE_CHART,
} from '../src/data/index.ts';
import { Battle } from '../src/engine/battle.ts';
import type { ActionChoice, Choice } from '../src/engine/choices.ts';
import { Dex } from '../src/engine/dex.ts';
import type { MoveData, SpeciesData } from '../src/engine/dex.ts';
import type { MonsterSet, SideIndex, StatTable } from '../src/engine/model.ts';

export function testSpecies(
  id: string,
  types: SpeciesData['types'],
  stats: Partial<StatTable> = {},
  extra: Partial<SpeciesData> = {},
): SpeciesData {
  return {
    id,
    name: id,
    types,
    baseStats: { hp: 100, atk: 100, def: 100, spa: 100, spd: 100, spe: 100, ...stats },
    abilities: ['rueckstossfrei', 'scharfsinn', 'kettenlaeufer'],
    learnset: [],
    weightKg: 10,
    heightM: 1,
    lore: '',
    roles: [],
    ...extra,
  };
}

export function testMove(id: string, overrides: Partial<MoveData> = {}): MoveData {
  return {
    id,
    name: id,
    type: 'wild',
    category: 'physical',
    power: 80,
    accuracy: true,
    pp: 10,
    priority: 0,
    target: 'normal',
    flags: {},
    description: '',
    animation: { preset: 'melee' },
    ...overrides,
  };
}

/** Standard-Daten plus Test-Monster/-Attacken. Test-Monster lernen alle Attacken. */
export function makeDex(species: SpeciesData[] = [], moves: MoveData[] = []): Dex {
  const allMoves = [...MOVES, ...moves];
  const learnset = allMoves.map((move) => move.id);
  return new Dex({
    species: [
      ...SPECIES,
      ...species.map((s) => ({ ...s, learnset: s.learnset.length ? s.learnset : learnset })),
    ],
    moves: allMoves,
    abilities: ABILITIES,
    items: ITEMS,
    natures: NATURES,
    formats: [
      ...FORMATS,
      {
        id: 'test-doubles',
        name: 'Test Doppel',
        description: '',
        gameType: 'doubles',
        activePerSide: 2,
        minTeamSize: 1,
        maxTeamSize: 6,
        pickCount: 6,
        level: 50,
        teamPreview: false,
        rules: { speciesClause: false, itemClause: false, noLegendary: false },
      },
      {
        id: 'test-singles',
        name: 'Test Einzel',
        description: '',
        gameType: 'singles',
        activePerSide: 1,
        minTeamSize: 1,
        maxTeamSize: 6,
        pickCount: 6,
        level: 50,
        teamPreview: false,
        rules: { speciesClause: false, itemClause: false, noLegendary: false },
      },
    ],
    typeChart: TYPE_CHART,
  });
}

export function set(
  species: string,
  moves: string[],
  overrides: Partial<MonsterSet> = {},
): MonsterSet {
  return {
    species,
    ability: 'rueckstossfrei',
    moves,
    nature: 'ausgeglichen',
    evs: {},
    ivs: {},
    ...overrides,
  };
}

export function battle(
  dex: Dex,
  teams: [MonsterSet[], MonsterSet[]],
  options: { format?: string; seed?: string } = {},
): Battle {
  return Battle.create({
    dex,
    formatId: options.format ?? 'test-doubles',
    seed: options.seed ?? 'test',
    sides: [
      { name: 'A', team: teams[0] },
      { name: 'B', team: teams[1] },
    ],
  });
}

/** Attacke `move` (Index) auf Position `target` der Gegenseite bzw. der eigenen Seite (`ally`). */
export function move(
  index: number,
  target?: { foe?: number; ally?: number },
  side: SideIndex = 0,
): ActionChoice {
  if (!target) return { type: 'move', move: index };
  const other: SideIndex = side === 0 ? 1 : 0;
  if (target.foe !== undefined)
    return { type: 'move', move: index, target: { side: other, position: target.foe } };
  return { type: 'move', move: index, target: { side, position: target.ally ?? 0 } };
}

export const pass: ActionChoice = { type: 'pass' };

export function turn(b: Battle, side0: ActionChoice[], side1: ActionChoice[]): void {
  expectOk(b.choose(0, { type: 'move', actions: side0 }));
  expectOk(b.choose(1, { type: 'move', actions: side1.map((a) => mirror(a)) }));
}

/** Ziele in `side1`-Aktionen werden relativ angegeben (foe = Seite 0). */
function mirror(action: ActionChoice): ActionChoice {
  if (action.type !== 'move' || !action.target) return action;
  return {
    ...action,
    target: { side: action.target.side === 1 ? 0 : 1, position: action.target.position },
  };
}

export function choose(b: Battle, side: SideIndex, choice: Choice): void {
  expectOk(b.choose(side, choice));
}

export function expectOk(result: { ok: true } | { ok: false; error: string }): void {
  if (!result.ok) throw new Error(result.error);
}

export function eventsOf<T extends Battle['events'][number]['type']>(
  b: Battle,
  type: T,
): Extract<Battle['events'][number], { type: T }>[] {
  return b.events.filter(
    (e): e is Extract<Battle['events'][number], { type: T }> => e.type === type,
  );
}

/** Ereignisse der Runde `n` (vom Rundenstart bis vor den nächsten Rundenstart). */
export function turnEvents(b: Battle, n: number): Battle['events'][number][] {
  const events = b.events;
  const start = events.findIndex((e) => e.type === 'turn_start' && e.turn === n);
  if (start < 0) return [];
  const next = events.findIndex((e, i) => i > start && e.type === 'turn_start');
  return events.slice(start, next < 0 ? undefined : next);
}
