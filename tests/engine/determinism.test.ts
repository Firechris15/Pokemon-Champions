import { describe, expect, it } from 'vitest';
import { easyAgent } from '../../src/ai/easy.ts';
import { runHeadlessBattle } from '../../src/ai/runner.ts';
import { STANDARD_DEX } from '../../src/data/index.ts';
import { Battle } from '../../src/engine/battle.ts';
import type { BattleState } from '../../src/engine/state.ts';

const run = (seed: string) =>
  runHeadlessBattle({
    dex: STANDARD_DEX,
    formatId: 'doubles-standard',
    seed,
    agents: [easyAgent, easyAgent],
  });

describe('Determinismus und Replays', () => {
  it('gleicher Seed + gleiche Entscheidungen = exakt gleicher Kampf', () => {
    const a = run('replay-1');
    const b = run('replay-1');
    expect(b.battle.events).toEqual(a.battle.events);
    expect(run('replay-2').battle.events).not.toEqual(a.battle.events);
  });

  it('ein Replay (Seed + Teams + Entscheidungen) spielt den Kampf exakt nach', () => {
    const original = run('replay-3').battle;
    const replay = original.toReplay();
    // Replays müssen klein sein: kein Ereignisprotokoll, nur Eingaben.
    expect(JSON.stringify(replay).length).toBeLessThan(JSON.stringify(original.events).length);
    const replayed = Battle.replay(
      STANDARD_DEX,
      JSON.parse(JSON.stringify(replay)) as typeof replay,
    );
    expect(replayed.events).toEqual(original.events);
    expect(replayed.winner).toBe(original.winner);
  });

  it('geklonte und aus JSON wiederhergestellte Kämpfe verlaufen identisch weiter', () => {
    const original = run('replay-4').battle;
    const inputs = original.state.inputs;
    const half = Math.floor(inputs.length / 2);
    const replay = original.toReplay();

    const partial = Battle.replay(STANDARD_DEX, { ...replay, inputs: inputs.slice(0, half) });
    const clone = partial.clone();
    const fromJson = Battle.restore(
      STANDARD_DEX,
      JSON.parse(JSON.stringify(partial.snapshot())) as BattleState,
    );
    for (const copy of [partial, clone, fromJson]) {
      for (const input of inputs.slice(half))
        expect(copy.choose(input.side, input.choice).ok).toBe(true);
      expect(copy.events).toEqual(original.events);
    }
  });
});
