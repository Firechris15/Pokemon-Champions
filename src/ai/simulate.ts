/**
 * Viele KI-gegen-KI-Kämpfe am Stück mit Statistik fürs Balancing (SPEC 3.7):
 * Siegrate pro Monster, Nutzung von Attacken, Kampflängen, Fehler.
 */
import type { Dex } from '../engine/dex.ts';
import type { Agent } from './agent.ts';
import { runHeadlessBattle } from './runner.ts';

export interface SpeciesStats {
  /** Mitgebracht (Team-Vorschau). */
  brought: number;
  /** Tatsächlich gekämpft (nach der Auswahl). */
  played: number;
  /** Davon gewonnen. */
  won: number;
}

export interface SimulationReport {
  battles: number;
  wins: [number, number];
  ties: number;
  errors: { seed: string; message: string }[];
  turns: { min: number; max: number; average: number };
  species: Record<string, SpeciesStats>;
  moves: Record<string, number>;
}

export interface SimulationOptions {
  dex: Dex;
  formatId: string;
  battles: number;
  seedPrefix: string;
  agents: readonly [Agent, Agent];
}

export function simulateMany(options: SimulationOptions): SimulationReport {
  const report: SimulationReport = {
    battles: 0,
    wins: [0, 0],
    ties: 0,
    errors: [],
    turns: { min: Number.POSITIVE_INFINITY, max: 0, average: 0 },
    species: {},
    moves: {},
  };
  let totalTurns = 0;
  const stats = (id: string): SpeciesStats =>
    (report.species[id] ??= { brought: 0, played: 0, won: 0 });

  for (let i = 0; i < options.battles; i++) {
    const seed = `${options.seedPrefix}-${i}`;
    try {
      const { battle, winner, turns, teams } = runHeadlessBattle({
        dex: options.dex,
        formatId: options.formatId,
        seed,
        agents: options.agents,
      });
      report.battles++;
      totalTurns += turns;
      report.turns.min = Math.min(report.turns.min, turns);
      report.turns.max = Math.max(report.turns.max, turns);
      if (winner === null) report.ties++;
      else report.wins[winner]++;
      for (const team of teams) for (const set of team) stats(set.species).brought++;
      for (const side of battle.state.sides) {
        for (const mon of side.team) {
          const entry = stats(mon.species);
          entry.played++;
          if (winner === side.index) entry.won++;
        }
      }
      for (const event of battle.events) {
        if (event.type === 'move_used')
          report.moves[event.move] = (report.moves[event.move] ?? 0) + 1;
      }
    } catch (error) {
      report.errors.push({ seed, message: error instanceof Error ? error.message : String(error) });
    }
  }
  report.turns.average = report.battles > 0 ? totalTurns / report.battles : 0;
  if (report.battles === 0) report.turns.min = 0;
  return report;
}
