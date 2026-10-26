/**
 * Ablaufsteuerung eines Kampfes Spieler gegen KI – ohne Darstellung, damit sie in Node testbar ist.
 * Die KI entscheidet, sobald sie gefragt wird; neue Engine-Ereignisse holt die Oberfläche mit
 * `takeEvents()` ab und spielt sie ab. Der Spieler ist immer Seite 0.
 */
import type { Agent, AgentContext } from '../../ai/agent.ts';
import { publicView } from '../../ai/view.ts';
import { Battle } from '../../engine/battle.ts';
import type { Choice, ChoiceResult, Request } from '../../engine/choices.ts';
import type { Dex } from '../../engine/dex.ts';
import type { BattleEvent } from '../../engine/events.ts';
import type { MonsterSet, SideIndex } from '../../engine/model.ts';
import { Rng } from '../../engine/rng.ts';

export const PLAYER: SideIndex = 0;
export const OPPONENT: SideIndex = 1;

export interface BattleSetup {
  readonly dex: Dex;
  readonly formatId: string;
  readonly seed: string;
  readonly teams: readonly [readonly MonsterSet[], readonly MonsterSet[]];
  readonly agent: Agent;
  readonly names: readonly [string, string];
}

export class BattleController {
  readonly battle: Battle;
  readonly setup: BattleSetup;
  private readonly context: AgentContext;
  private delivered = 0;

  constructor(setup: BattleSetup) {
    this.setup = setup;
    this.battle = Battle.create({
      dex: setup.dex,
      formatId: setup.formatId,
      seed: setup.seed,
      sides: [
        { name: setup.names[0], team: setup.teams[0] },
        { name: setup.names[1], team: setup.teams[1] },
      ],
    });
    this.context = {
      side: OPPONENT,
      dex: setup.dex,
      rng: Rng.fromSeed(`${setup.seed}:ai`),
      validTargets: (position, target) => this.battle.validTargets(OPPONENT, position, target),
      view: () => publicView(this.battle, OPPONENT),
    };
  }

  get ended(): boolean {
    return this.battle.ended;
  }

  /** Lässt die KI entscheiden, solange sie gefragt ist. */
  runAi(): void {
    for (let guard = 0; guard < 8 && !this.battle.ended; guard++) {
      const request = this.battle.getRequest(OPPONENT);
      if (request.type === 'wait') return;
      const result = this.battle.choose(OPPONENT, this.setup.agent.choose(request, this.context));
      if (!result.ok) throw new Error(`KI-Entscheidung ungültig: ${result.error}`);
    }
  }

  /** Neue, noch nicht abgeholte Ereignisse. */
  takeEvents(): BattleEvent[] {
    const events = this.battle.events.slice(this.delivered);
    this.delivered = this.battle.events.length;
    return events;
  }

  /** Aktuelle Anfrage an den Spieler (KI vorher entscheiden lassen). */
  request(): Request {
    this.runAi();
    return this.battle.getRequest(PLAYER);
  }

  submit(choice: Choice): ChoiceResult {
    const result = this.battle.choose(PLAYER, choice);
    if (result.ok) this.runAi();
    return result;
  }

  forfeit(): void {
    if (!this.battle.ended) this.battle.choose(PLAYER, { type: 'forfeit' });
  }
}
