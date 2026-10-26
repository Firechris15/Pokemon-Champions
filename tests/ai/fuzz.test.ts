import { describe, expect, it } from 'vitest';
import { runHeadlessBattle } from '../../src/ai/runner.ts';
import { STANDARD_DEX } from '../../src/data/index.ts';
import { Battle } from '../../src/engine/battle.ts';
import { Rng } from '../../src/engine/rng.ts';
import { validateTeam } from '../../src/teams/validate.ts';
import { chaosAgent, chaosTeam } from './chaos.ts';

const dex = STANDARD_DEX;

describe('Fuzzing: zufällige legale Aktionen mit beliebigen Sets', () => {
  it.each([
    ['doubles-free', 700],
    ['singles-standard', 300],
  ] as const)(
    '%s: %i Kämpfe ohne Fehler, jede erlernbare Attacke kommt zum Einsatz',
    (formatId, battles) => {
      const format = dex.format(formatId);
      const used = new Set<string>();
      const abilities = new Set<string>();
      const items = new Set<string>();
      for (let i = 0; i < battles; i++) {
        const seed = `fuzz-${formatId}-${i}`;
        const rng = Rng.fromSeed(`${seed}:teams`);
        const teams = [chaosTeam(dex, format, rng), chaosTeam(dex, format, rng)] as const;
        for (const team of teams) expect(validateTeam(dex, format, team), seed).toEqual([]);
        const { battle } = runHeadlessBattle({
          dex,
          formatId,
          seed,
          agents: [chaosAgent, chaosAgent],
          teams,
        });
        expect(battle.ended, seed).toBe(true);
        for (const event of battle.events) {
          if (event.type === 'move_used') used.add(event.move);
          if (event.type === 'ability') abilities.add(event.ability);
          if (event.type === 'immune' && event.by?.kind === 'ability') abilities.add(event.by.id);
          if (event.type === 'item') items.add(event.item);
        }
        // Wiederholung aus Seed, Teams und Eingaben ergibt denselben Verlauf.
        if (i % 50 === 0)
          expect(Battle.replay(dex, battle.toReplay()).events).toEqual(battle.events);
      }
      const learnable = new Set(
        dex.data.species
          .filter((species) => !(format.rules.noLegendary && species.legendary))
          .flatMap((species) => species.learnset),
      );
      expect([...learnable].filter((id) => !used.has(id))).toEqual([]);
      expect(abilities.size).toBeGreaterThan(20);
      // Passive Items (Fixband, Essenz-Verstärker …) melden sich nicht – nur aktive zählen.
      expect(items.size).toBeGreaterThan(8);
    },
  );
});
