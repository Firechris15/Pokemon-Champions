import { afterEach, describe, expect, it } from 'vitest';
import { easyAgent } from '../../src/ai/easy.ts';
import { STANDARD_DEX } from '../../src/data/index.ts';
import { Rng } from '../../src/engine/rng.ts';
import { randomTeam } from '../../src/teams/random.ts';
import { CommandInput } from '../../src/ui/battle/commandInput.svelte.ts';
import { BattleSession } from '../../src/ui/battle/session.svelte.ts';
import { settings } from '../../src/ui/settings.svelte.ts';

const dex = STANDARD_DEX;

function makeSession(formatId: string, seed: string): BattleSession {
  const format = dex.format(formatId);
  return new BattleSession({
    dex,
    formatId,
    seed,
    teams: [
      randomTeam(dex, format, Rng.fromSeed(`${seed}:a`)),
      randomTeam(dex, format, Rng.fromSeed(`${seed}:b`)),
    ],
    agent: easyAgent,
    names: ['Du', 'KI'],
  });
}

/** Wartet, bis die Session nicht mehr abspielt (überspringt dabei jede Pause). */
async function settle(session: BattleSession): Promise<void> {
  for (let i = 0; i < 20000 && session.phase === 'playing'; i++) {
    session.skipCurrent();
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

const sessions: BattleSession[] = [];
afterEach(() => {
  for (const session of sessions.splice(0)) session.dispose();
});

describe('BattleSession + CommandInput', () => {
  it.each([
    ['doubles-standard', 'session-a'],
    ['singles-standard', 'session-b'],
    ['doubles-standard', 'session-c'],
  ])('spielt %s komplett über die Befehlseingabe (%s)', async (formatId, seed) => {
    settings.textSpeed = 'instant';
    const session = makeSession(formatId, seed);
    sessions.push(session);
    const input = new CommandInput(session);
    session.start();
    await settle(session);
    expect(session.phase).toBe('preview');
    const preview = session.request;
    if (preview?.type !== 'teamPreview') throw new Error('Team-Vorschau erwartet');
    session.submit({
      type: 'teamPreview',
      order: Array.from({ length: preview.pick }, (_, index) => index),
    });
    const rng = Rng.fromSeed(`${seed}:player`);
    for (let guard = 0; guard < 3000 && session.phase !== 'ended'; guard++) {
      await settle(session);
      if (session.phase !== 'command') continue;
      // Was die Oberfläche bei jeder neuen Anfrage tut.
      if (input.step.kind === 'idle') input.reset(session.request);
      const step = input.step;
      expect(step.kind, `Schritt bei ${session.request?.type}`).not.toBe('idle');
      if (step.kind === 'action') {
        const slot = input.slot(step.position);
        const usable = slot?.moves.flatMap((move, index) => (move.disabled ? [] : [index])) ?? [];
        if (input.canSwitch && rng.chance(1, 8)) input.openSwitch();
        else input.chooseMove(usable.length > 0 ? rng.pick(usable) : 0);
      } else if (step.kind === 'target') {
        input.chooseTarget(rng.pick(input.targets));
      } else {
        input.chooseSwitch(rng.pick(input.switchList));
      }
      expect(session.error).toBeNull();
    }
    expect(session.phase).toBe('ended');
    expect(session.view.ended).toBe(true);
    expect(session.log.at(-1)?.kind).toBe('result');
  });
});
