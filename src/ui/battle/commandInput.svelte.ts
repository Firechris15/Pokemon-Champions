/**
 * Zwischenstand der Befehlseingabe (reaktiv). Befehls-Panel und Arena teilen ihn: Die Arena
 * zeigt wählbare Ziele an und meldet Antippen, das Panel zeigt Attacken und Wechsel.
 */
import type { ActionChoice, Choice, PositionRequest, Request } from '../../engine/choices.ts';
import type { PositionRef } from '../../engine/model.ts';
import {
  actingPositions,
  moveChoice,
  needsTarget,
  replacementOptions,
  replacementPositions,
  switchChoice,
  switchOptions,
} from './commands.ts';
import { PLAYER } from './controller.ts';
import type { BattleSession } from './session.svelte.ts';

export type CommandStep =
  | { kind: 'idle' }
  | { kind: 'action'; position: number }
  | { kind: 'target'; position: number; move: number }
  | { kind: 'switch'; position: number }
  | { kind: 'replace'; position: number };

export class CommandInput {
  step = $state<CommandStep>({ kind: 'idle' });
  actions = $state<(ActionChoice | null)[]>([]);
  picks = $state<(number | null)[]>([]);
  private request: Request | null = null;
  private readonly session: BattleSession;

  constructor(session: BattleSession) {
    this.session = session;
  }

  /** Neue Anfrage: von vorn beginnen. */
  reset(request: Request | null): void {
    this.request = request;
    this.actions = [];
    this.picks = [];
    this.step = { kind: 'idle' };
    if (request?.type === 'move') {
      this.actions = request.positions.map(() => null);
      const first = actingPositions(request)[0];
      if (first !== undefined) this.step = { kind: 'action', position: first };
    } else if (request?.type === 'switch') {
      this.picks = request.positions.map(() => null);
      const first = replacementPositions(request)[0];
      if (first === undefined) this.submit(switchChoice(request, this.picks));
      else this.step = { kind: 'replace', position: first };
    }
  }

  /** Position, für die gerade gewählt wird. */
  get position(): number | null {
    return this.step.kind === 'idle' ? null : this.step.position;
  }

  slot(position: number): PositionRequest | null {
    return this.request?.type === 'move' ? (this.request.positions[position] ?? null) : null;
  }

  /** Wählbare Ziele im Zielschritt. */
  get targets(): PositionRef[] {
    const step = this.step;
    if (step.kind !== 'target') return [];
    const option = this.slot(step.position)?.moves[step.move];
    if (!option) return [];
    return this.session.controller.battle.validTargets(PLAYER, step.position, option.target);
  }

  /** Bank-Monster für den aktuellen Wechsel- oder Ersatzschritt. */
  get switchList(): number[] {
    const step = this.step;
    if (step.kind === 'switch') {
      const slot = this.slot(step.position);
      return slot ? switchOptions(slot, this.actions) : [];
    }
    if (step.kind === 'replace' && this.request?.type === 'switch') {
      return replacementOptions(this.request, this.picks);
    }
    return [];
  }

  /** Kann die aktuelle Position wechseln? */
  get canSwitch(): boolean {
    const step = this.step;
    if (step.kind !== 'action') return false;
    const slot = this.slot(step.position);
    return slot !== null && switchOptions(slot, this.actions).length > 0;
  }

  get canGoBack(): boolean {
    const step = this.step;
    if (step.kind === 'target' || step.kind === 'switch') return true;
    if (step.kind === 'action' && this.request?.type === 'move') {
      return actingPositions(this.request)[0] !== step.position;
    }
    if (step.kind === 'replace' && this.request?.type === 'switch') {
      return replacementPositions(this.request)[0] !== step.position;
    }
    return false;
  }

  chooseMove(index: number): void {
    const step = this.step;
    if (step.kind !== 'action') return;
    const slot = this.slot(step.position);
    if (!slot) return;
    if (slot.struggle) {
      this.setAction(step.position, { type: 'move', move: 0 });
      return;
    }
    const option = slot.moves[index];
    if (!option || option.disabled) return;
    const valid = this.session.controller.battle.validTargets(PLAYER, step.position, option.target);
    if (needsTarget(option.target, valid)) {
      this.step = { kind: 'target', position: step.position, move: index };
      return;
    }
    const target = valid.length === 1 ? valid[0] : undefined;
    this.setAction(step.position, { type: 'move', move: index, ...(target ? { target } : {}) });
  }

  chooseTarget(target: PositionRef): void {
    const step = this.step;
    if (step.kind !== 'target') return;
    const ok = this.targets.some(
      (entry) => entry.side === target.side && entry.position === target.position,
    );
    if (ok) this.setAction(step.position, { type: 'move', move: step.move, target });
  }

  openSwitch(): void {
    const step = this.step;
    if (step.kind === 'action' && this.canSwitch) {
      this.step = { kind: 'switch', position: step.position };
    }
  }

  chooseSwitch(mon: number): void {
    const step = this.step;
    if (!this.switchList.includes(mon)) return;
    if (step.kind === 'switch') {
      this.setAction(step.position, { type: 'switch', mon });
    } else if (step.kind === 'replace' && this.request?.type === 'switch') {
      const request = this.request;
      this.picks[step.position] = mon;
      const order = replacementPositions(request);
      const next = order[order.indexOf(step.position) + 1];
      if (next === undefined) {
        this.submit(switchChoice(request, this.picks));
      } else {
        this.step = { kind: 'replace', position: next };
      }
    }
  }

  back(): void {
    const step = this.step;
    if (step.kind === 'target' || step.kind === 'switch') {
      this.step = { kind: 'action', position: step.position };
      return;
    }
    if (step.kind === 'action' && this.request?.type === 'move') {
      const order = actingPositions(this.request);
      const previous = order[order.indexOf(step.position) - 1];
      if (previous === undefined) return;
      this.actions[previous] = null;
      this.step = { kind: 'action', position: previous };
      return;
    }
    if (step.kind === 'replace' && this.request?.type === 'switch') {
      const order = replacementPositions(this.request);
      const previous = order[order.indexOf(step.position) - 1];
      if (previous === undefined) return;
      this.picks[previous] = null;
      this.step = { kind: 'replace', position: previous };
    }
  }

  private setAction(position: number, action: ActionChoice): void {
    const request = this.request;
    if (request?.type !== 'move') return;
    this.actions[position] = action;
    const order = actingPositions(request);
    const next = order[order.indexOf(position) + 1];
    if (next !== undefined) {
      this.step = { kind: 'action', position: next };
      return;
    }
    const choice = moveChoice(request, this.actions);
    if (choice) this.submit(choice);
  }

  /** Abschicken; lehnt die Engine ab, beginnt die Eingabe neu (Fehler steht in der Session). */
  private submit(choice: Choice): void {
    const request = this.request;
    this.step = { kind: 'idle' };
    this.session.submit(choice);
    if (this.session.error !== null) this.reset(request);
  }
}
