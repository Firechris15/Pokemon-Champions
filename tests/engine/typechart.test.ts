import { describe, expect, it } from 'vitest';
import { TYPE_CHART, TYPE_COLORS, TYPE_IDS } from '../../src/data/typechart.ts';
import { effectiveness, typeFactor } from '../../src/engine/typechart.ts';

describe('Typentabelle', () => {
  it('hat 18 Essenzen mit Farbe', () => {
    expect(TYPE_IDS).toHaveLength(18);
    for (const type of TYPE_IDS) expect(TYPE_COLORS[type]).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('jede Essenz hat Stärken, Schwächen und Widerstände', () => {
    for (const type of TYPE_IDS) {
      const strongAgainst = TYPE_IDS.filter((d) => typeFactor(TYPE_CHART, type, d) === 2);
      const weakTo = TYPE_IDS.filter((a) => typeFactor(TYPE_CHART, a, type) === 2);
      const resists = TYPE_IDS.filter((a) => typeFactor(TYPE_CHART, a, type) < 1);
      expect(strongAgainst.length, `${type} offensiv`).toBeGreaterThan(0);
      expect(weakTo.length, `${type} Schwächen`).toBeGreaterThan(0);
      expect(weakTo.length, `${type} zu viele Schwächen`).toBeLessThanOrEqual(5);
      expect(resists.length, `${type} Widerstände`).toBeGreaterThan(0);
    }
  });

  it('enthält Immunitäten', () => {
    const immunities = TYPE_IDS.flatMap((a) =>
      TYPE_IDS.filter((d) => typeFactor(TYPE_CHART, a, d) === 0),
    );
    expect(immunities.length).toBeGreaterThanOrEqual(5);
  });

  it('nur gültige Faktoren', () => {
    for (const a of TYPE_IDS) {
      for (const [d, f] of Object.entries(TYPE_CHART[a])) {
        expect(TYPE_IDS).toContain(d);
        expect([0, 0.5, 2]).toContain(f);
      }
    }
  });

  it('Doppeltypen multiplizieren', () => {
    expect(effectiveness(TYPE_CHART, 'ember', ['flora', 'frost'])).toBe(4);
    expect(effectiveness(TYPE_CHART, 'ember', ['tide', 'crystal'])).toBe(0.25);
    expect(effectiveness(TYPE_CHART, 'ember', ['flora', 'tide'])).toBe(1);
    expect(effectiveness(TYPE_CHART, 'earth', ['gale', 'ember'])).toBe(0);
  });
});
