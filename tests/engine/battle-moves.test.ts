import { describe, expect, it } from 'vitest';
import { battle, eventsOf, move, set, turn } from '../helpers.ts';
import { dex } from './fixtures.ts';

const singles = { format: 'test-singles' };

describe('Volltreffer', () => {
  it('ab Stufe 3 immer', () => {
    const b = battle(dex, [[set('flitz', ['t_crit'])], [set('brocken', ['t_wait'])]], singles);
    for (let i = 0; i < 5; i++) turn(b, [move(0)], [move(0)]);
    expect(eventsOf(b, 'crit')).toHaveLength(5);
  });

  it('ignoriert eigene negative und gegnerische positive Stufen', () => {
    const b = battle(dex, [[set('flitz', ['t_crit'])], [set('brocken', ['t_wait'])]], singles);
    const user = b.mon({ side: 0, index: 0 });
    const target = b.mon({ side: 1, index: 0 });
    const plain = b.calculateDamage(user, target, dex.move('t_crit'), { crit: true }).rolls;
    user.boosts.atk = -6;
    target.boosts.def = 6;
    expect(b.calculateDamage(user, target, dex.move('t_crit'), { crit: true }).rolls).toEqual(
      plain,
    );
    expect(b.calculateDamage(user, target, dex.move('t_crit')).rolls[15]).toBeLessThan(
      plain[0] ?? 0,
    );
  });
});

describe('Genauigkeit', () => {
  it('trifft bei 50 % etwa jedes zweite Mal', () => {
    const b = battle(dex, [[set('flitz', ['t_miss'])], [set('brocken', ['t_wait'])]], singles);
    for (let i = 0; i < 60; i++) turn(b, [move(0)], [move(0)]);
    const misses = eventsOf(b, 'miss').length;
    expect(misses).toBeGreaterThan(15);
    expect(misses).toBeLessThan(45);
  });
});

describe('Attacken-Eigenschaften', () => {
  it('Mehrfachtreffer: 2–5 Treffer', () => {
    const b = battle(dex, [[set('flitz', ['t_multi'])], [set('brocken', ['t_wait'])]], singles);
    for (let i = 0; i < 20; i++) turn(b, [move(0)], [move(0)]);
    const counts = eventsOf(b, 'hit_count').map((e) => e.hits);
    expect(counts).toHaveLength(20);
    for (const hits of counts) expect(hits).toBeGreaterThanOrEqual(2);
    for (const hits of counts) expect(hits).toBeLessThanOrEqual(5);
    expect(new Set(counts).size).toBeGreaterThan(1);
  });

  it('Rückstoß und Absorbieren als Anteil am Schaden', () => {
    const b = battle(
      dex,
      [
        [set('flitz', ['t_recoil', 't_drain'], { ability: 'scharfsinn' })],
        [set('brocken', ['t_wait'])],
      ],
      singles,
    );
    turn(b, [move(0)], [move(0)]);
    const [hit, recoil] = eventsOf(b, 'damage');
    expect(recoil?.cause).toBe('recoil');
    expect(recoil?.amount).toBe(Math.floor((hit?.amount ?? 0) / 2));
    turn(b, [move(1)], [move(0)]);
    const drainHit = eventsOf(b, 'damage').at(-1);
    const heal = eventsOf(b, 'heal').at(-1);
    expect(heal?.cause).toBe('drain');
    expect(heal?.amount).toBe(Math.floor((drainHit?.amount ?? 0) / 2));
  });

  it('fester Schaden in Höhe des Levels', () => {
    const b = battle(dex, [[set('flitz', ['t_level'])], [set('brocken', ['t_wait'])]], singles);
    turn(b, [move(0)], [move(0)]);
    expect(eventsOf(b, 'damage')[0]?.amount).toBe(50);
  });

  it('Nebeneffekt mit 100 % senkt die Initiative des Ziels', () => {
    const b = battle(dex, [[set('flitz', ['t_debuffhit'])], [set('brocken', ['t_wait'])]], singles);
    turn(b, [move(0)], [move(0)]);
    expect(eventsOf(b, 'stat_change')).toContainEqual(
      expect.objectContaining({
        target: { side: 1, index: 0 },
        stat: 'spe',
        change: -1,
        stage: -1,
      }),
    );
  });

  it('Stufen enden bei +6', () => {
    const b = battle(dex, [[set('flitz', ['t_speedup'])], [set('brocken', ['t_wait'])]], singles);
    for (let i = 0; i < 4; i++) turn(b, [move(0)], [move(0)]);
    const changes = eventsOf(b, 'stat_change').filter((e) => e.target.side === 0);
    expect(changes.map((e) => e.change)).toEqual([2, 2, 2, 0]);
    expect(b.mon({ side: 0, index: 0 }).boosts.spe).toBe(6);
  });

  it('Immunität durch Essenz: Wild-Attacke gegen Spuk', () => {
    const b = battle(dex, [[set('flitz', ['t_hit'])], [set('spuk', ['t_wait'])]], singles);
    turn(b, [move(0)], [move(0)]);
    expect(eventsOf(b, 'immune')).toHaveLength(1);
    expect(eventsOf(b, 'damage')).toHaveLength(0);
  });

  it('Gleicher-Typ-Bonus und Effektivität fließen in den Schaden ein', () => {
    const b = battle(
      dex,
      [[set('flamme', ['t_ember', 't_hit'])], [set('blatt', ['t_wait'])]],
      singles,
    );
    const user = b.mon({ side: 0, index: 0 });
    const target = b.mon({ side: 1, index: 0 });
    const ember = b.calculateDamage(user, target, dex.move('t_ember'));
    const wild = b.calculateDamage(user, target, dex.move('t_hit'));
    expect(ember.effectiveness).toBe(2);
    // 1,5 (gleicher Typ) × 2 (sehr effektiv) ≈ 3-facher Schaden
    expect(ember.rolls[15] ?? 0).toBeGreaterThanOrEqual(2.9 * (wild.rolls[15] ?? 0));
  });

  it('Heilung des Partners', () => {
    const b = battle(dex, [
      [set('flitz', ['t_allyheal']), set('brocken', ['t_wait'])],
      [set('mittel', ['t_hit']), set('lahm', ['t_wait'])],
    ]);
    turn(b, [move(0, { ally: 1 }), move(0)], [move(0, { foe: 1 }), move(0)]);
    // flitz heilt zuerst (volle LP → wirkungslos), dann trifft mittel den Partner.
    expect(eventsOf(b, 'move_failed')[0]?.reason).toBe('noEffect');
    turn(b, [move(0, { ally: 1 }), move(0)], [move(0), move(0)]);
    expect(eventsOf(b, 'heal')).toHaveLength(1);
  });
});
