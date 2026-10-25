import { describe, expect, it } from 'vitest';
import { easyAgent } from '../../src/ai/easy.ts';
import { simulateMany } from '../../src/ai/simulate.ts';
import { STANDARD_DEX } from '../../src/data/index.ts';
import { TURN_LIMIT } from '../../src/engine/battle.ts';

describe('Headless-Simulator (KI gegen KI)', () => {
  it.each(['doubles-standard', 'singles-standard', 'random-doubles'])(
    '%s: Kämpfe laufen ohne Fehler und ohne Endlosschleifen durch',
    (formatId) => {
      const report = simulateMany({
        dex: STANDARD_DEX,
        formatId,
        battles: 200,
        seedPrefix: `test-${formatId}`,
        agents: [easyAgent, easyAgent],
      });
      expect(report.errors).toEqual([]);
      expect(report.battles).toBe(200);
      expect(report.wins[0] + report.wins[1] + report.ties).toBe(200);
      expect(report.turns.max).toBeLessThan(TURN_LIMIT);
      // Beide Seiten gewinnen regelmäßig – kein systematischer Vorteil einer Seite.
      expect(Math.min(...report.wins)).toBeGreaterThan(60);
      expect(Object.keys(report.species).length).toBe(STANDARD_DEX.data.species.length);
      expect(Object.keys(report.moves).length).toBeGreaterThan(30);
    },
  );
});
