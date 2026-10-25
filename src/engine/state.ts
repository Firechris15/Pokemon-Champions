/**
 * Serialisierbarer Kampfzustand (nur einfache Daten, kein Klassen-Objekt).
 * Damit lassen sich Kämpfe klonen (KI-Vorausschau), speichern und auf einem Server fortsetzen.
 */
import type { Choice } from './choices.ts';
import type { BattleEvent } from './events.ts';
import type { BoostTable, MonsterSet, SideIndex, StatTable, TypeId } from './model.ts';
import type { RngState } from './rng.ts';

export interface MoveSlot {
  id: string;
  pp: number;
  maxPp: number;
}

export interface Mon {
  readonly side: SideIndex;
  /** Index im Kampfteam der Seite. */
  readonly index: number;
  readonly set: MonsterSet;
  readonly species: string;
  readonly name: string;
  readonly level: number;
  types: TypeId[];
  /** Berechnete Werte; `stats.hp` = max. LP. */
  readonly stats: StatTable;
  readonly maxHp: number;
  hp: number;
  boosts: BoostTable;
  moves: MoveSlot[];
  ability: string;
  item: string | null;
  /** Aktive Position oder `null`, wenn auf der Bank/besiegt. */
  position: number | null;
  fainted: boolean;
  /** Runden seit dem Einwechseln. */
  activeTurns: number;
  lastMove: string | null;
  /** Wurde dem Gegner schon gezeigt (war auf dem Feld). */
  revealed: boolean;
}

export interface SideState {
  readonly index: SideIndex;
  readonly name: string;
  /** Mitgebrachtes Team (für die Team-Vorschau). */
  readonly preview: readonly MonsterSet[];
  /** Kampfteam nach der Vorschau; die ersten Monster starten. */
  team: Mon[];
  /** Team-Index pro Position, `null` = leer. */
  active: (number | null)[];
}

export type BattlePhase = 'teamPreview' | 'move' | 'switch' | 'ended';

export interface InputRecord {
  side: SideIndex;
  choice: Choice;
}

export interface BattleState {
  readonly formatId: string;
  readonly seed: string;
  rng: RngState;
  turn: number;
  phase: BattlePhase;
  sides: [SideState, SideState];
  pending: [Choice | null, Choice | null];
  /** `undefined` = läuft noch, `null` = Unentschieden. */
  winner: SideIndex | null | undefined;
  log: BattleEvent[];
  /** Alle angenommenen Entscheidungen in Reihenfolge – zusammen mit Seed und Teams ein Replay. */
  inputs: InputRecord[];
}
