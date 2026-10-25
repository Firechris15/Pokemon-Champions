/** Lässt zwei KIs ohne Grafik gegeneinander kämpfen (Headless-Simulator, Tests, Balancing). */
import { Battle } from '../engine/battle.ts';
import type { Dex } from '../engine/dex.ts';
import type { MonsterSet, SideIndex } from '../engine/model.ts';
import { Rng } from '../engine/rng.ts';
import { randomTeam } from '../teams/random.ts';
import type { Agent, AgentContext } from './agent.ts';

/** Obergrenze an Entscheidungsrunden – erkennt Endlosschleifen in der Engine. */
export const MAX_DECISION_STEPS = 5000;

export interface HeadlessBattleOptions {
  dex: Dex;
  formatId: string;
  seed: string;
  agents: readonly [Agent, Agent];
  /** Fehlt: Zufallsteams aus dem Seed. */
  teams?: readonly [readonly MonsterSet[], readonly MonsterSet[]];
}

export interface HeadlessResult {
  battle: Battle;
  winner: SideIndex | null;
  turns: number;
  teams: readonly [readonly MonsterSet[], readonly MonsterSet[]];
}

export function runHeadlessBattle(options: HeadlessBattleOptions): HeadlessResult {
  const { dex, formatId, seed, agents } = options;
  const format = dex.format(formatId);
  const teamRng = Rng.fromSeed(`${seed}:teams`);
  const teams = options.teams ?? [
    randomTeam(dex, format, teamRng),
    randomTeam(dex, format, teamRng),
  ];
  const battle = Battle.create({
    dex,
    formatId,
    seed,
    sides: [
      { name: agents[0].id, team: teams[0] },
      { name: agents[1].id, team: teams[1] },
    ],
  });
  const contexts: [AgentContext, AgentContext] = [0, 1].map((side): AgentContext => ({
    side: side as SideIndex,
    dex,
    rng: Rng.fromSeed(`${seed}:ai${side}`),
    validTargets: (position, target) => battle.validTargets(side as SideIndex, position, target),
  })) as [AgentContext, AgentContext];

  for (let step = 0; !battle.ended; step++) {
    if (step >= MAX_DECISION_STEPS)
      throw new Error(`Kampf ${seed}: kein Ende nach ${step} Entscheidungen`);
    let decided = false;
    for (const side of [0, 1] as const) {
      const request = battle.getRequest(side);
      if (request.type === 'wait') continue;
      const result = battle.choose(side, agents[side].choose(request, contexts[side]));
      if (!result.ok) throw new Error(`Kampf ${seed}, KI ${side}: ${result.error}`);
      decided = true;
    }
    if (!decided && battle.state.phase !== 'ended')
      throw new Error(`Kampf ${seed}: hängt, niemand muss entscheiden`);
  }
  return { battle, winner: battle.winner ?? null, turns: battle.state.turn, teams };
}
