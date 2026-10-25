import { describe, expect, it } from 'vitest';
import { easyAgent } from '../../src/ai/easy.ts';
import { runHeadlessBattle } from '../../src/ai/runner.ts';
import { STANDARD_DEX } from '../../src/data/index.ts';
import { de } from '../../src/i18n/de.ts';
import { translate } from '../../src/i18n/translate.ts';
import { formatEvent } from '../../src/ui/battleLog.ts';
import type { LogContext } from '../../src/ui/battleLog.ts';

function context(names: (side: 0 | 1, index: number) => string): LogContext {
  return {
    t: (key, params) => translate(de, key, params),
    monName: (mon) => names(mon.side, mon.index),
    sideName: (side) => (side === 0 ? 'Team A' : 'Team B'),
    moveName: (id) => STANDARD_DEX.move(id).name,
    effectName: (e) =>
      e.kind === 'ability' ? STANDARD_DEX.ability(e.id).name : STANDARD_DEX.item(e.id).name,
  };
}

describe('Kampflog', () => {
  it('übersetzt jedes Ereignis eines ganzen Kampfes ohne Platzhalter-Reste', () => {
    for (let i = 0; i < 20; i++) {
      const { battle } = runHeadlessBattle({
        dex: STANDARD_DEX,
        formatId: 'doubles-standard',
        seed: `log-${i}`,
        agents: [easyAgent, easyAgent],
      });
      const ctx = context((side, index) => battle.mon({ side, index }).name);
      for (const event of battle.events) {
        const line = formatEvent(event, ctx);
        if (!line) continue;
        expect(line.text).not.toMatch(/[{}]/);
        expect(line.text).not.toMatch(/^log\./);
      }
    }
  });

  it('formuliert typische Zeilen', () => {
    const ctx = context(() => 'Pyrrax');
    const target = { side: 1 as const, index: 0 };
    expect(formatEvent({ type: 'turn_start', turn: 3 }, ctx)).toEqual({
      kind: 'turn',
      text: 'Runde 3',
    });
    expect(
      formatEvent({ type: 'move_used', mon: target, move: 'sengstrahl', targets: [] }, ctx)?.text,
    ).toBe('Pyrrax setzt Sengstrahl ein!');
    expect(
      formatEvent({ type: 'damage', target, amount: 50, hp: 50, maxHp: 100, cause: 'move' }, ctx)
        ?.text,
    ).toBe('Pyrrax verliert 50 % LP.');
    expect(
      formatEvent(
        { type: 'stat_change', target, stat: 'atk', change: -1, attempted: -1, stage: -1 },
        ctx,
      )?.text,
    ).toBe('Angriff von Pyrrax sinkt.');
    expect(
      formatEvent(
        { type: 'stat_change', target, stat: 'spe', change: 0, attempted: 2, stage: 6 },
        ctx,
      )?.text,
    ).toBe('Initiative von Pyrrax kann nicht weiter steigen.');
    expect(formatEvent({ type: 'battle_end', winner: 1, reason: 'knockout' }, ctx)?.text).toBe(
      'Team B gewinnt den Kampf!',
    );
  });
});
