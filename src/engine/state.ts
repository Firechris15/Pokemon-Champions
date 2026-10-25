/**
 * Serialisierbarer Kampfzustand (nur einfache Daten, kein Klassen-Objekt).
 * Damit lassen sich Kämpfe klonen (KI-Vorausschau), speichern und auf einem Server fortsetzen.
 */
import type { Choice } from './choices.ts';
import type { BattleEvent } from './events.ts';
import type {
  BoostTable,
  MonRef,
  MonsterSet,
  PositionRef,
  SideIndex,
  StatTable,
  StatusId,
  TypeId,
} from './model.ts';
import type { RngState } from './rng.ts';

/** Zustand eines Effekts (Status, flüchtiger Zustand, Seiteneffekt, Wetter …). Alle Felder optional. */
export interface ConditionState {
  /** Verbleibende Runden (Rundenende-Ticks) bzw. eigener Zähler (Schlaf, Verwirrung). */
  turns?: number;
  /** Verursacher (z. B. bei Bindung und Wechselsperre). */
  source?: MonRef;
  /** Betroffene Attacke (Wahl-Sperre, Wiederholzwang, Zwei-Runden-Attacke). */
  move?: string;
  /** Gespeichertes Ziel (Zwei-Runden-Attacke). */
  target?: PositionRef;
  /** LP eines Trugbilds. */
  hp?: number;
  /** Stufe (z. B. Fäulnis). */
  stage?: number;
  /** Stapel (Fallen). */
  layers?: number;
}

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
  status: StatusId | null;
  statusState: ConditionState;
  /** Flüchtige Zustände (enden beim Auswechseln). */
  volatiles: Record<string, ConditionState>;
  /** Erfolgreiche Schutz-Attacken in Folge (Chance 1/3^n). */
  protectStreak: number;
  /** In dieser Runde von einer gegnerischen Attacke getroffen. */
  hurtThisTurn: boolean;
  /** Hat in dieser Runde schon gehandelt. */
  movedThisTurn: boolean;
  /** Zählt Einwechslungen – erkennt veraltete Aktionen nach einem Wechsel. */
  entries: number;
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
  /** Seiteneffekte (Rückenwind, Schutzwände, Fallen …). */
  conditions: Record<string, ConditionState>;
}

export interface FieldState {
  weather: { id: string; turns: number } | null;
  terrain: { id: string; turns: number } | null;
  /** Feldeffekte wie die Raumverzerrung. */
  effects: Record<string, ConditionState>;
}

/** Eine noch auszuführende Aktion der laufenden Runde (serialisierbar). */
export interface QueuedAction {
  kind: 'move' | 'switch';
  mon: MonRef;
  /** `entries` des Monsters bei der Auswahl – ändert es sich, ist die Aktion hinfällig. */
  entry: number;
  priority: number;
  tie: number;
  moveIndex?: number;
  /** Bei der Auswahl war keine Attacke einsetzbar → Notattacke. */
  struggle?: boolean;
  target?: PositionRef;
  /** Team-Index des Einwechselnden (bei `switch`). */
  incoming?: number;
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
  field: FieldState;
  /** Restliche Aktionen der laufenden Runde. */
  queue: QueuedAction[];
  /** Wechsel mitten in der Runde (nach einer Wechsel-nach-Treffer-Attacke). */
  pivot: { side: SideIndex; position: number } | null;
  pending: [Choice | null, Choice | null];
  /** `undefined` = läuft noch, `null` = Unentschieden. */
  winner: SideIndex | null | undefined;
  log: BattleEvent[];
  /** Alle angenommenen Entscheidungen in Reihenfolge – zusammen mit Seed und Teams ein Replay. */
  inputs: InputRecord[];
}
