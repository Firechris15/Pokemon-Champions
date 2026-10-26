/**
 * Schnittstelle für KI-Gegner: Sie bekommen dieselbe Anfrage wie ein menschlicher Spieler und
 * antworten mit einer Entscheidung. Keine versteckten Informationen (außer später bei „Unfair“).
 */
import type { Choice, Request } from '../engine/choices.ts';
import type { Dex, MoveTarget } from '../engine/dex.ts';
import type { PositionRef, SideIndex } from '../engine/model.ts';
import type { Rng } from '../engine/rng.ts';
import type { PublicView } from './view.ts';

export interface AgentContext {
  readonly side: SideIndex;
  readonly dex: Dex;
  /** Eigener Zufallsgenerator der KI (unabhängig vom Kampf-Seed). */
  readonly rng: Rng;
  /** Wählbare Ziele einer Attacke von dieser Position aus. */
  validTargets(position: number, target: MoveTarget): PositionRef[];
  /** Was diese Seite gerade sieht (eigenes Team vollständig, Gegner nur öffentlich). */
  view(): PublicView;
}

export interface Agent {
  readonly id: string;
  choose(request: Exclude<Request, { type: 'wait' }>, context: AgentContext): Choice;
}
