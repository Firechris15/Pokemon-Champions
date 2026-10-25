import { describe, expect, it } from 'vitest';
import { NATURES } from '../../src/data/natures.ts';
import {
  accuracyFraction,
  applyBoost,
  boostFraction,
  calcStat,
  natureFactor,
} from '../../src/engine/stats.ts';

describe('Werteformel', () => {
  it('berechnet Level-50-Werte (Basis 100, IV 31, EV 252)', () => {
    expect(calcStat('hp', 100, 31, 252, 50)).toBe(207);
    expect(calcStat('atk', 100, 31, 252, 50)).toBe(152);
    expect(calcStat('atk', 100, 31, 252, 50, 110)).toBe(167);
    expect(calcStat('atk', 100, 31, 252, 50, 90)).toBe(136);
  });

  it('berechnet Level-100-Werte', () => {
    expect(calcStat('hp', 100, 31, 252, 100)).toBe(404);
    expect(calcStat('spe', 100, 31, 252, 100)).toBe(299);
    expect(calcStat('spe', 100, 31, 252, 100, 110)).toBe(328);
    expect(calcStat('spe', 100, 0, 0, 100, 90)).toBe(184);
  });

  it('EVs zählen nur in Viererschritten', () => {
    expect(calcStat('def', 80, 31, 3, 50)).toBe(calcStat('def', 80, 31, 0, 50));
    expect(calcStat('def', 80, 31, 7, 50)).toBe(calcStat('def', 80, 31, 4, 50));
    // Level 100: jede volle Vierergruppe zählt +1.
    expect(calcStat('def', 80, 31, 8, 100)).toBe(calcStat('def', 80, 31, 0, 100) + 2);
  });

  it('LP-Formel ist getrennt: kein Wesens-Einfluss', () => {
    expect(calcStat('hp', 50, 31, 0, 50, 110)).toBe(calcStat('hp', 50, 31, 0, 50, 100));
  });
});

describe('Wesen', () => {
  it('es gibt 25 Wesen, davon 5 neutrale, jede Kombination genau einmal', () => {
    expect(NATURES).toHaveLength(25);
    expect(NATURES.filter((n) => n.plus === null)).toHaveLength(5);
    const combos = new Set(NATURES.filter((n) => n.plus).map((n) => `${n.plus}-${n.minus}`));
    expect(combos.size).toBe(20);
    expect(new Set(NATURES.map((n) => n.name)).size).toBe(25);
  });

  it('+10 % / −10 %, LP nie betroffen', () => {
    const nature = NATURES.find((n) => n.plus === 'atk' && n.minus === 'spa');
    expect(nature).toBeDefined();
    if (!nature) return;
    expect(natureFactor(nature, 'atk')).toBe(110);
    expect(natureFactor(nature, 'spa')).toBe(90);
    expect(natureFactor(nature, 'spe')).toBe(100);
    expect(natureFactor(nature, 'hp')).toBe(100);
  });
});

describe('Stat-Stufen', () => {
  it('nutzt die Tabelle (2+n)/2 bzw. 2/(2+n) und begrenzt auf ±6', () => {
    expect(boostFraction(0)).toEqual([2, 2]);
    expect(boostFraction(1)).toEqual([3, 2]);
    expect(boostFraction(6)).toEqual([8, 2]);
    expect(boostFraction(-1)).toEqual([2, 3]);
    expect(boostFraction(-6)).toEqual([2, 8]);
    expect(boostFraction(9)).toEqual([8, 2]);
    expect(applyBoost(100, 2)).toBe(200);
    expect(applyBoost(100, -1)).toBe(66);
  });

  it('Genauigkeit/Ausweichen nutzen eine eigene Tabelle (3+n)/3', () => {
    expect(accuracyFraction(1)).toEqual([4, 3]);
    expect(accuracyFraction(6)).toEqual([9, 3]);
    expect(accuracyFraction(-1)).toEqual([3, 4]);
    expect(accuracyFraction(-6)).toEqual([3, 9]);
  });
});
