/** Anfragen an die Spieler und ihre Antworten (Entscheidungen). */
import type { MoveTarget } from './dex.ts';
import type { PositionRef } from './model.ts';

export interface PreviewEntry {
  species: string;
  name: string;
  level: number;
  item: string | null;
}

export interface MoveOption {
  id: string;
  pp: number;
  maxPp: number;
  target: MoveTarget;
  disabled: boolean;
}

export interface PositionRequest {
  /** Team-Index des aktiven Monsters. */
  mon: number;
  moves: MoveOption[];
  /** Alle Attacken ohne AP: Wahl von Attacke 0 löst die Notattacke aus. */
  struggle: boolean;
  /** Team-Indizes, zu denen gewechselt werden darf. */
  switchable: number[];
}

export type Request =
  | { type: 'teamPreview'; pick: number; team: PreviewEntry[]; opponent: PreviewEntry[] }
  | { type: 'move'; turn: number; positions: (PositionRequest | null)[] }
  | { type: 'switch'; positions: boolean[]; switchable: number[] }
  | { type: 'wait' };

export type ActionChoice =
  | { type: 'move'; move: number; target?: PositionRef }
  | { type: 'switch'; mon: number }
  | { type: 'pass' };

export type Choice =
  | { type: 'teamPreview'; order: number[] }
  | { type: 'move'; actions: ActionChoice[] }
  /** Pro Position: Team-Index des Ersatzes oder `null`. */
  | { type: 'switch'; switches: (number | null)[] }
  /** Aufgeben – jederzeit möglich, solange der Kampf läuft. */
  | { type: 'forfeit' };

export type ChoiceResult = { ok: true } | { ok: false; error: string };
