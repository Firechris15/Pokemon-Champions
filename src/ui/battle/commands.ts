/**
 * Befehlseingabe Schritt für Schritt: pro aktiver Position eine Aktion (Attacke + Ziel oder
 * Wechsel), bei erzwungenen Wechseln pro leerer Position ein Ersatz. Reine Funktionen über die
 * Engine-Anfrage – die Oberfläche hält nur den Zwischenstand.
 */
import type { ActionChoice, Choice, PositionRequest, Request } from '../../engine/choices.ts';
import { CHOSEN_TARGETS, type MoveTarget } from '../../engine/dex.ts';
import type { PositionRef } from '../../engine/model.ts';

export type MoveRequest = Extract<Request, { type: 'move' }>;
export type SwitchRequest = Extract<Request, { type: 'switch' }>;

/** Positionen, die in dieser Runde handeln müssen. */
export function actingPositions(request: MoveRequest): number[] {
  return request.positions.flatMap((slot, position) => (slot ? [position] : []));
}

/** Monster, die bereits für einen Wechsel eingeplant sind. */
export function plannedSwitches(actions: readonly (ActionChoice | null)[]): Set<number> {
  const planned = new Set<number>();
  for (const action of actions) if (action?.type === 'switch') planned.add(action.mon);
  return planned;
}

/** Bank-Monster, zu denen diese Position noch wechseln kann. */
export function switchOptions(
  slot: PositionRequest,
  actions: readonly (ActionChoice | null)[],
): number[] {
  const planned = plannedSwitches(actions);
  return slot.trapped ? [] : slot.switchable.filter((mon) => !planned.has(mon));
}

/** Muss der Spieler für diese Zielart ein Ziel antippen? */
export function needsTarget(target: MoveTarget, valid: readonly PositionRef[]): boolean {
  return CHOSEN_TARGETS.includes(target) && valid.length > 1;
}

/** Fertige Entscheidung: leere Positionen passen. */
export function moveChoice(
  request: MoveRequest,
  actions: readonly (ActionChoice | null)[],
): Choice | null {
  const result: ActionChoice[] = [];
  for (let position = 0; position < request.positions.length; position++) {
    if (!request.positions[position]) {
      result.push({ type: 'pass' });
      continue;
    }
    const action = actions[position];
    if (!action) return null;
    result.push(action);
  }
  return { type: 'move', actions: result };
}

/** Positionen, die beim erzwungenen Wechsel tatsächlich besetzt werden können. */
export function replacementPositions(request: SwitchRequest): number[] {
  const needed = request.positions.flatMap((needs, position) => (needs ? [position] : []));
  return needed.slice(0, request.switchable.length);
}

export function replacementOptions(
  request: SwitchRequest,
  picks: readonly (number | null)[],
): number[] {
  return request.switchable.filter((mon) => !picks.includes(mon));
}

export function switchChoice(request: SwitchRequest, picks: readonly (number | null)[]): Choice {
  return {
    type: 'switch',
    switches: request.positions.map((_, position) => picks[position] ?? null),
  };
}
