import { describe, expect, it } from 'vitest';
import { battle, eventsOf, move, repeat, set, singles, turn } from '../helpers.ts';
import { dex } from './fixtures.ts';

const wait = move(1);

describe('Statusprobleme', () => {
  it('Brandmal: 1/16 pro Runde und halber physischer Schaden; Glut ist immun', () => {
    const b = singles(
      dex,
      [set('flitz', ['t_burn', 't_wait'])],
      [set('brocken', ['t_hit', 't_wait'])],
    );
    const target = b.mon({ side: 1, index: 0 });
    const user = b.mon({ side: 0, index: 0 });
    const physical = () => b.calculateDamage(target, user, dex.move('t_hit')).rolls[15] ?? 0;
    const before = physical();
    turn(b, [move(0)], [move(1)]);
    expect(target.status).toBe('brn');
    expect(eventsOf(b, 'damage').at(-1)?.amount).toBe(Math.floor(target.maxHp / 16));
    expect(physical()).toBeLessThanOrEqual(Math.ceil(before / 2));
    const special = b.calculateDamage(target, user, dex.move('t_special')).rolls[15] ?? 0;
    expect(special).toBeGreaterThan(physical() * 1.8);

    const immune = singles(dex, [set('flitz', ['t_burn'])], [set('flamme', ['t_wait'])]);
    turn(immune, [move(0)], [move(0)]);
    expect(immune.mon({ side: 1, index: 0 }).status).toBeNull();
    expect(eventsOf(immune, 'move_failed')).toHaveLength(1);
  });

  it('Starre: Initiative halbiert, ~25 % keine Handlung; Funke ist immun', () => {
    const b = singles(dex, [set('flitz', ['t_par', 't_wait'])], [set('koloss', ['t_wait'])]);
    const target = b.mon({ side: 1, index: 0 });
    const speed = b.getSpeed(target);
    turn(b, [move(0)], [move(0)]);
    expect(target.status).toBe('par');
    expect(b.getSpeed(target)).toBe(Math.floor(speed / 2));
    repeat(b, 60, wait, move(0));
    const stuck = eventsOf(b, 'cant_move').filter((e) => e.reason === 'par').length;
    expect(stuck).toBeGreaterThan(5);
    expect(stuck).toBeLessThan(27);

    const immune = singles(dex, [set('flitz', ['t_par'])], [set('funkling', ['t_wait'])]);
    turn(immune, [move(0)], [move(0)]);
    expect(immune.mon({ side: 1, index: 0 }).status).toBeNull();
  });

  it('Toxin: 1/8 pro Runde; Gift und Metall sind immun', () => {
    const b = singles(dex, [set('flitz', ['t_psn', 't_wait'])], [set('koloss', ['t_wait'])]);
    turn(b, [move(0)], [move(0)]);
    const target = b.mon({ side: 1, index: 0 });
    expect(eventsOf(b, 'damage').at(-1)?.amount).toBe(Math.floor(target.maxHp / 8));
    for (const species of ['giftling', 'metalling']) {
      const immune = singles(dex, [set('flitz', ['t_psn'])], [set(species, ['t_wait'])]);
      turn(immune, [move(0)], [move(0)]);
      expect(immune.mon({ side: 1, index: 0 }).status, species).toBeNull();
    }
  });

  it('Fäulnis: 1/16, 2/16, 3/16 … und setzt sich beim Auswechseln zurück', () => {
    const b = singles(
      dex,
      [set('flitz', ['t_tox', 't_wait'])],
      [set('koloss', ['t_wait']), set('brocken', ['t_wait'])],
    );
    const target = b.mon({ side: 1, index: 0 });
    turn(b, [move(0)], [move(0)]);
    repeat(b, 2, wait, move(0));
    const amounts = eventsOf(b, 'damage').map((e) => e.amount);
    expect(amounts).toEqual([1, 2, 3].map((n) => Math.floor((target.maxHp * n) / 16)));
    turn(b, [wait], [{ type: 'switch', mon: 1 }]);
    turn(b, [wait], [{ type: 'switch', mon: 0 }]);
    expect(eventsOf(b, 'damage').at(-1)?.amount).toBe(Math.floor(target.maxHp / 16));
  });

  it('Schlummer: 1–3 Runden ohne Handlung, dann Aufwachen', () => {
    const lengths = new Set<number>();
    for (let i = 0; i < 40; i++) {
      const b = singles(
        dex,
        [set('flitz', ['t_slp', 't_wait'])],
        [set('koloss', ['t_wait'])],
        `slp-${i}`,
      );
      turn(b, [move(0)], [move(0)]);
      repeat(b, 5, wait, move(0));
      const asleep = eventsOf(b, 'cant_move').filter((e) => e.reason === 'slp').length;
      lengths.add(asleep);
      expect(eventsOf(b, 'status_cure')).toHaveLength(1);
    }
    expect(lengths).toEqual(new Set([1, 2, 3]));
  });

  it('Frostbann: taut mit ~20 % pro Runde oder durch Glut-Treffer; Frost ist immun', () => {
    let thawTurns = 0;
    for (let i = 0; i < 30; i++) {
      const b = singles(
        dex,
        [set('flitz', ['t_frz', 't_wait'])],
        [set('koloss', ['t_wait'])],
        `frz-${i}`,
      );
      turn(b, [move(0)], [move(0)]);
      repeat(b, 60, wait, move(0));
      thawTurns += eventsOf(b, 'cant_move').length;
      expect(eventsOf(b, 'status_cure')).toHaveLength(1);
    }
    expect(thawTurns / 30).toBeGreaterThan(2);
    expect(thawTurns / 30).toBeLessThan(7);

    const ember = singles(dex, [set('flitz', ['t_frz', 't_ember'])], [set('koloss', ['t_wait'])]);
    turn(ember, [move(0)], [move(0)]);
    turn(ember, [move(1)], [move(0)]);
    expect(ember.mon({ side: 1, index: 0 }).status).toBeNull();

    const immune = singles(dex, [set('flitz', ['t_frz'])], [set('frostling', ['t_wait'])]);
    turn(immune, [move(0)], [move(0)]);
    expect(immune.mon({ side: 1, index: 0 }).status).toBeNull();
  });

  it('nur ein Statusproblem gleichzeitig', () => {
    const b = singles(dex, [set('flitz', ['t_burn', 't_psn'])], [set('koloss', ['t_wait'])]);
    turn(b, [move(0)], [move(0)]);
    turn(b, [move(1)], [move(0)]);
    expect(b.mon({ side: 1, index: 0 }).status).toBe('brn');
    expect(eventsOf(b, 'move_failed')).toHaveLength(1);
  });

  it('Status-Attacken respektieren Typ-Immunitäten, Pulver wirkt nicht auf Flora', () => {
    const spark = singles(dex, [set('flitz', ['starrfunke'])], [set('erdling', ['t_wait'])]);
    turn(spark, [move(0)], [move(0)]);
    expect(eventsOf(spark, 'immune')).toHaveLength(1);

    const powder = singles(dex, [set('flitz', ['schlafsporen'])], [set('blatt', ['t_wait'])]);
    turn(powder, [move(0)], [move(0)]);
    expect(eventsOf(powder, 'immune')).toHaveLength(1);
    expect(powder.mon({ side: 1, index: 0 }).status).toBeNull();
  });

  it('Nebeneffekte verursachen Statusprobleme mit ihrer Wahrscheinlichkeit', () => {
    let paralyzed = 0;
    for (let i = 0; i < 200; i++) {
      const b = battle(dex, [[set('flitz', ['funkenbiss'])], [set('koloss', ['t_wait'])]], {
        format: 'test-singles',
        seed: `para-${i}`,
      });
      turn(b, [move(0)], [move(0)]);
      paralyzed += eventsOf(b, 'status_set').length;
    }
    // Funkenbiss: 10 % Starre.
    expect(paralyzed).toBeGreaterThan(8);
    expect(paralyzed).toBeLessThan(36);
  });
});
