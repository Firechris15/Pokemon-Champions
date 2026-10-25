import { describe, expect, it } from 'vitest';
import {
  MOD_ONE,
  MOD_SCREEN_DOUBLES,
  MOD_STAB,
  NEUTRAL_MODIFIERS,
  applyDamageModifiers,
  baseDamage,
  chainMods,
  critDenominator,
  damageRolls,
  modify,
  toMod,
} from '../../src/engine/damage.ts';

describe('Schadensformel', () => {
  it('Grundschaden: L50, Stärke 80, A 100, V 100 → 37', () => {
    expect(baseDamage(50, 80, 100, 100)).toBe(37);
    expect(baseDamage(100, 100, 300, 200)).toBe(
      Math.floor(Math.floor((42 * 100 * 300) / 200) / 50) + 2,
    );
  });

  it('modify rundet bei genau ,5 ab und sonst kaufmännisch', () => {
    expect(modify(37, MOD_STAB)).toBe(55); // 55,5 → 55
    expect(modify(37, 3072)).toBe(28); // 27,75 → 28
    expect(modify(10, toMod(1.3))).toBe(13);
  });

  it('verkettet Modifikatoren 4096-basiert', () => {
    expect(chainMods([])).toBe(MOD_ONE);
    expect(chainMods([toMod(1.5), toMod(1.5)])).toBe(toMod(2.25));
    expect(chainMods([toMod(1.3), toMod(0.75)])).toBe(
      Math.trunc((toMod(1.3) * toMod(0.75) + 2048) / 4096),
    );
  });

  it('Zufall 85–100 erzeugt 16 aufsteigende Werte', () => {
    const rolls = damageRolls(37, NEUTRAL_MODIFIERS);
    expect(rolls).toHaveLength(16);
    expect(rolls[0]).toBe(31); // ⌊37 · 0,85⌋
    expect(rolls[15]).toBe(37);
    expect([...rolls].sort((a, b) => a - b)).toEqual(rolls);
  });

  it('wendet die Modifikatoren in fester Reihenfolge an', () => {
    // 37 → Fläche 28 → Volltreffer 42 → Zufall 100 → 42 → Gleicher Typ 63 → ×2 = 126
    const mods = {
      ...NEUTRAL_MODIFIERS,
      spread: true,
      crit: true,
      stab: MOD_STAB,
      effectiveness: 2,
    };
    expect(applyDamageModifiers(37, mods, 100)).toBe(126);
    // Andere Reihenfolge (Zufall vor Fläche) ergäbe einen anderen Wert – die Reihenfolge ist relevant.
    expect(applyDamageModifiers(37, { ...NEUTRAL_MODIFIERS, spread: true }, 85)).toBe(23);
  });

  it('Typeffektivität 4× und 0,25×, Immunität = 0', () => {
    expect(applyDamageModifiers(37, { ...NEUTRAL_MODIFIERS, effectiveness: 4 }, 100)).toBe(148);
    expect(applyDamageModifiers(37, { ...NEUTRAL_MODIFIERS, effectiveness: 0.25 }, 100)).toBe(9);
    expect(applyDamageModifiers(37, { ...NEUTRAL_MODIFIERS, effectiveness: 0 }, 100)).toBe(0);
  });

  it('mindestens 1 Schaden, wenn nicht immun', () => {
    expect(applyDamageModifiers(2, { ...NEUTRAL_MODIFIERS, effectiveness: 0.25 }, 85)).toBe(1);
  });

  it('Verbrennung halbiert, Schutzwände 2/3 im Doppel – aber nicht bei Volltreffern', () => {
    expect(applyDamageModifiers(100, { ...NEUTRAL_MODIFIERS, burn: true }, 100)).toBe(50);
    expect(
      applyDamageModifiers(100, { ...NEUTRAL_MODIFIERS, screen: MOD_SCREEN_DOUBLES }, 100),
    ).toBe(67);
    expect(
      applyDamageModifiers(
        100,
        { ...NEUTRAL_MODIFIERS, screen: MOD_SCREEN_DOUBLES, crit: true },
        100,
      ),
    ).toBe(150);
  });

  it('Volltreffer-Stufen: 1/24, 1/8, 1/2, immer', () => {
    expect(critDenominator(0)).toBe(24);
    expect(critDenominator(1)).toBe(8);
    expect(critDenominator(2)).toBe(2);
    expect(critDenominator(3)).toBe(1);
    expect(critDenominator(5)).toBe(1);
  });
});
