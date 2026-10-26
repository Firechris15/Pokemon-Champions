import { describe, expect, it } from 'vitest';
import { easyAgent } from '../../src/ai/easy.ts';
import { simulateMany } from '../../src/ai/simulate.ts';
import { STANDARD_DEX } from '../../src/data/index.ts';
import { TURN_LIMIT } from '../../src/engine/battle.ts';

describe('Headless-Simulator (KI gegen KI)', () => {
  it.each([
    ['doubles-standard', 1000],
    ['singles-standard', 200],
    ['random-doubles', 200],
  ] as const)(
    '%s: %i Kämpfe laufen ohne Fehler und ohne Endlosschleifen durch',
    (formatId, battles) => {
      const report = simulateMany({
        dex: STANDARD_DEX,
        formatId,
        battles,
        seedPrefix: `test-${formatId}`,
        agents: [easyAgent, easyAgent],
      });
      expect(report.errors).toEqual([]);
      expect(report.battles).toBe(battles);
      expect(report.wins[0] + report.wins[1] + report.ties).toBe(battles);
      expect(report.turns.max).toBeLessThan(TURN_LIMIT);
      // Beide Seiten gewinnen regelmäßig – kein systematischer Vorteil einer Seite.
      expect(Math.min(...report.wins)).toBeGreaterThan(battles * 0.3);
      const format = STANDARD_DEX.format(formatId);
      const eligible = STANDARD_DEX.data.species.filter(
        (species) => !(format.rules.noLegendary && species.legendary),
      );
      expect(Object.keys(report.species).length).toBe(eligible.length);
      expect(Object.keys(report.moves).length).toBeGreaterThan(60);
    },
  );
});
