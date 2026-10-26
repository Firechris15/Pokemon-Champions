/**
 * Einstellungen eines Kampfes gegen die KI, wie sie der Setup-Bildschirm erzeugt.
 * Teams sind bis zum Teambuilder (Phase 5) Zufallsteams.
 */
import { AGENTS, type AgentId } from '../../ai/agents.ts';
import type { Dex } from '../../engine/dex.ts';
import type { MonsterSet } from '../../engine/model.ts';
import { Rng } from '../../engine/rng.ts';
import { randomTeam } from '../../teams/random.ts';
import { ARENAS, type ArenaId } from './layout.ts';
import type { BattleSetup } from './controller.ts';

export interface BattleConfig {
  readonly formatId: string;
  readonly agent: AgentId;
  readonly arena: ArenaId;
  readonly seed: string;
  readonly teams: readonly [readonly MonsterSet[], readonly MonsterSet[]];
}

/** Zufälliger Seed aus der Browser-Kryptografie (außerhalb der deterministischen Engine). */
export function newSeed(): string {
  const values = new Uint32Array(2);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => value.toString(36)).join('');
}

export function makeTeam(dex: Dex, formatId: string, seed: string): MonsterSet[] {
  return randomTeam(dex, dex.format(formatId), Rng.fromSeed(`${seed}:team`));
}

export function pickArena(choice: ArenaId | 'random', seed: string): ArenaId {
  if (choice !== 'random') return choice;
  return Rng.fromSeed(`${seed}:arena`).pick(ARENAS);
}

export function createConfig(
  dex: Dex,
  options: {
    formatId: string;
    agent: AgentId;
    arena: ArenaId | 'random';
    team: readonly MonsterSet[];
  },
): BattleConfig {
  const seed = newSeed();
  const format = dex.format(options.formatId);
  // Im Zufallsformat bekommt auch der Spieler jedes Mal ein neues Team.
  const own = format.randomTeams ? makeTeam(dex, options.formatId, `${seed}:own`) : options.team;
  return {
    formatId: options.formatId,
    agent: options.agent,
    arena: pickArena(options.arena, seed),
    seed,
    teams: [own, makeTeam(dex, options.formatId, `${seed}:foe`)],
  };
}

/** Revanche: dieselben Teams und dieselbe Arena, neuer Zufall. */
export function rematch(config: BattleConfig): BattleConfig {
  return { ...config, seed: newSeed() };
}

export function toSetup(
  dex: Dex,
  config: BattleConfig,
  names: readonly [string, string],
): BattleSetup {
  return {
    dex,
    formatId: config.formatId,
    seed: config.seed,
    teams: config.teams,
    agent: AGENTS[config.agent],
    names,
  };
}
