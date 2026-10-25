import { describe, expect, it } from 'vitest';
import {
  ABILITIES,
  FORMATS,
  ITEMS,
  MOVES,
  SPECIES,
  STANDARD_DEX,
  TYPE_IDS,
} from '../../src/data/index.ts';
import { Rng } from '../../src/engine/rng.ts';
import { STAT_IDS } from '../../src/engine/model.ts';
import { randomTeam } from '../../src/teams/random.ts';
import { validateTeam } from '../../src/teams/validate.ts';

const unique = (values: string[]) => new Set(values).size === values.length;

describe('Datenbestand', () => {
  it('erfüllt den Umfang von Phase 1', () => {
    expect(SPECIES.length).toBeGreaterThanOrEqual(15);
    expect(MOVES.length).toBeGreaterThanOrEqual(40);
    expect(ABILITIES.length).toBeGreaterThanOrEqual(10);
    expect(FORMATS.map((f) => f.id)).toEqual(
      expect.arrayContaining([
        'doubles-standard',
        'doubles-free',
        'singles-standard',
        'random-doubles',
      ]),
    );
  });

  it('IDs und Namen sind eindeutig', () => {
    for (const list of [SPECIES, MOVES, ABILITIES, ITEMS]) {
      expect(unique(list.map((e) => e.id))).toBe(true);
      expect(unique(list.map((e) => e.name))).toBe(true);
      for (const entry of list) expect(entry.id).toMatch(/^[a-z0-9]+$/);
    }
  });

  describe.each(SPECIES.map((s) => [s.name, s] as const))('%s', (_name, species) => {
    it('hat gültige Essenzen, Fähigkeiten und Werte', () => {
      expect(species.types.length).toBeGreaterThanOrEqual(1);
      expect(new Set(species.types).size).toBe(species.types.length);
      for (const type of species.types) expect(TYPE_IDS).toContain(type);
      expect(species.abilities.length).toBeGreaterThanOrEqual(1);
      expect(species.abilities.length).toBeLessThanOrEqual(3);
      for (const ability of species.abilities) expect(STANDARD_DEX.hasAbility(ability)).toBe(true);
      const total = STAT_IDS.reduce((sum, stat) => sum + species.baseStats[stat], 0);
      expect(total).toBeGreaterThanOrEqual(300);
      expect(total).toBeLessThanOrEqual(600);
      for (const stat of STAT_IDS) expect(species.baseStats[stat]).toBeGreaterThan(0);
      expect(species.weightKg).toBeGreaterThan(0);
      expect(species.heightM).toBeGreaterThan(0);
      expect(species.lore.length).toBeGreaterThan(20);
      expect(species.roles.length).toBeGreaterThan(0);
    });

    it('hat 15–40 lernbare, existierende Attacken inkl. eigener Essenz', () => {
      expect(species.learnset.length).toBeGreaterThanOrEqual(15);
      expect(species.learnset.length).toBeLessThanOrEqual(40);
      expect(unique([...species.learnset])).toBe(true);
      for (const id of species.learnset) {
        expect(STANDARD_DEX.hasMove(id), id).toBe(true);
        expect(STANDARD_DEX.move(id).unlearnable).toBeUndefined();
      }
      for (const type of species.types) {
        const stab = species.learnset.filter((id) => {
          const move = STANDARD_DEX.move(id);
          return move.type === type && move.category !== 'status';
        });
        expect(stab.length, `${species.id}: Schadensattacke ${type}`).toBeGreaterThan(0);
      }
    });
  });

  it('jede Essenz kommt bei mindestens einem Monster vor', () => {
    for (const type of TYPE_IDS)
      expect(
        SPECIES.some((s) => s.types.includes(type)),
        type,
      ).toBe(true);
  });

  it('Attacken haben gültige Werte (keine Sofort-K.O.-Attacken)', () => {
    for (const move of MOVES) {
      expect(TYPE_IDS).toContain(move.type);
      expect(move.priority).toBeGreaterThanOrEqual(-7);
      expect(move.priority).toBeLessThanOrEqual(5);
      expect(move.pp).toBeGreaterThan(0);
      if (move.accuracy !== true) {
        expect(move.accuracy).toBeGreaterThan(0);
        expect(move.accuracy).toBeLessThanOrEqual(100);
      }
      if (move.category === 'status') expect(move.power).toBe(0);
      else expect(move.power > 0 || move.fixedDamage !== undefined, move.id).toBe(true);
      if (typeof move.fixedDamage === 'number') expect(move.fixedDamage).toBeLessThan(200);
      for (const fraction of [move.recoil, move.drain, move.heal]) {
        if (fraction) expect(fraction[0]).toBeLessThanOrEqual(fraction[1]);
      }
      for (const secondary of move.secondaries ?? []) {
        expect(secondary.chance).toBeGreaterThan(0);
        expect(secondary.chance).toBeLessThanOrEqual(100);
      }
      expect(move.description.length).toBeGreaterThan(5);
    }
  });

  it('Zufallsteams sind für jedes Format gültig', () => {
    for (const format of FORMATS) {
      const rng = Rng.fromSeed(`valid-${format.id}`);
      for (let i = 0; i < 50; i++) {
        const team = randomTeam(STANDARD_DEX, format, rng);
        expect(validateTeam(STANDARD_DEX, format, team)).toEqual([]);
        for (const set of team) expect(set.moves.length).toBe(4);
      }
    }
  });
});
