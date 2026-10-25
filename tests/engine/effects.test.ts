import { describe, expect, it } from 'vitest';
import { modify, toMod } from '../../src/engine/damage.ts';
import { battle, eventsOf, move, set, turn } from '../helpers.ts';
import { dex } from './fixtures.ts';

const singles = { format: 'test-singles' };

describe('Fähigkeiten (Hooks)', () => {
  it('Drohkulisse senkt beim Einwechseln den Angriff aller Gegner', () => {
    const b = battle(dex, [
      [set('faehig', ['t_wait'], { ability: 'drohkulisse' }), set('lahm', ['t_wait'])],
      [set('mittel', ['t_wait']), set('lahm', ['t_wait'])],
    ]);
    expect(eventsOf(b, 'ability')).toHaveLength(1);
    expect(b.mon({ side: 1, index: 0 }).boosts.atk).toBe(-1);
    expect(b.mon({ side: 1, index: 1 }).boosts.atk).toBe(-1);
    expect(b.mon({ side: 0, index: 1 }).boosts.atk).toBe(0);
  });

  it('Schwebend: immun gegen Erde', () => {
    const b = battle(
      dex,
      [[set('flitz', ['t_earth'])], [set('faehig', ['t_wait'], { ability: 'schwebend' })]],
      singles,
    );
    turn(b, [move(0)], [move(0)]);
    expect(eventsOf(b, 'immune')[0]?.by).toEqual({ kind: 'ability', id: 'schwebend' });
    expect(eventsOf(b, 'damage')).toHaveLength(0);
  });

  it('Blitzfänger: fängt Funke-Attacken ab und erhöht den Fokus', () => {
    const b = battle(
      dex,
      [[set('flitz', ['t_spark'])], [set('faehig', ['t_wait'], { ability: 'blitzfaenger' })]],
      singles,
    );
    const target = b.mon({ side: 1, index: 0 });
    expect(
      b.calculateDamage(b.mon({ side: 0, index: 0 }), target, dex.move('t_spark')).immune,
    ).toBe(true);
    turn(b, [move(0)], [move(0)]);
    expect(eventsOf(b, 'damage')).toHaveLength(0);
    expect(target.boosts.spa).toBe(1);
  });

  it('Siegesrausch: Angriff +1 nach einem K.O.', () => {
    const b = battle(
      dex,
      [
        [set('faehig', ['t_nuke'], { ability: 'siegesrausch' })],
        [set('lahm', ['t_wait']), set('schnecke', ['t_wait'])],
      ],
      singles,
    );
    turn(b, [move(0)], [move(0)]);
    expect(b.mon({ side: 0, index: 0 }).boosts.atk).toBe(1);
  });

  it('Scharfsinn: +1 Volltreffer-Stufe (Stufe 2 → 3 = immer)', () => {
    const b = battle(
      dex,
      [[set('faehig', ['t_crit2'], { ability: 'scharfsinn' })], [set('brocken', ['t_wait'])]],
      singles,
    );
    for (let i = 0; i < 4; i++) turn(b, [move(0)], [move(0)]);
    expect(eventsOf(b, 'crit')).toHaveLength(4);
  });

  it('Rückstoßfrei: kein Rückstoß', () => {
    const b = battle(
      dex,
      [[set('faehig', ['t_recoil'], { ability: 'rueckstossfrei' })], [set('brocken', ['t_wait'])]],
      singles,
    );
    turn(b, [move(0)], [move(0)]);
    expect(eventsOf(b, 'damage').filter((e) => e.cause === 'recoil')).toHaveLength(0);
  });

  it('Kettenläufer: Mehrfachangriffe treffen immer 5-mal', () => {
    const b = battle(
      dex,
      [[set('faehig', ['t_multi'], { ability: 'kettenlaeufer' })], [set('brocken', ['t_wait'])]],
      singles,
    );
    for (let i = 0; i < 5; i++) turn(b, [move(0)], [move(0)]);
    expect(eventsOf(b, 'hit_count').map((e) => e.hits)).toEqual([5, 5, 5, 5, 5]);
  });

  it('Wucht: schwache Attacken ×1,5', () => {
    const plain = battle(
      dex,
      [[set('faehig', ['t_small'], { ability: 'scharfsinn' })], [set('lahm', ['t_wait'])]],
      singles,
    );
    const boosted = battle(
      dex,
      [[set('faehig', ['t_small'], { ability: 'wucht' })], [set('lahm', ['t_wait'])]],
      singles,
    );
    const roll = (b: typeof plain) =>
      b.calculateDamage(
        b.mon({ side: 0, index: 0 }),
        b.mon({ side: 1, index: 0 }),
        dex.move('t_small'),
      ).rolls[15] ?? 0;
    expect(roll(boosted)).toBeGreaterThan(roll(plain) * 1.4);
  });

  it('Dickhaut: sehr effektive Treffer nur ×0,75', () => {
    const plain = battle(
      dex,
      [[set('flitz', ['t_spark'])], [set('faehig', ['t_wait'], { ability: 'scharfsinn' })]],
      singles,
    );
    const thick = battle(
      dex,
      [[set('flitz', ['t_spark'])], [set('faehig', ['t_wait'], { ability: 'dickhaut' })]],
      singles,
    );
    const roll = (b: typeof plain) =>
      b.calculateDamage(
        b.mon({ side: 0, index: 0 }),
        b.mon({ side: 1, index: 0 }),
        dex.move('t_spark'),
      ).rolls[15] ?? 0;
    expect(roll(thick)).toBe(modify(roll(plain), toMod(0.75)));
  });

  it('Glutherz: Glut-Attacken ×1,5 bei höchstens 1/3 LP', () => {
    const b = battle(
      dex,
      [[set('flamme', ['t_ember'], { ability: 'glutherz' })], [set('brocken', ['t_wait'])]],
      singles,
    );
    const user = b.mon({ side: 0, index: 0 });
    const target = b.mon({ side: 1, index: 0 });
    const full = b.calculateDamage(user, target, dex.move('t_ember')).rolls[15] ?? 0;
    user.hp = Math.floor(user.maxHp / 3);
    const pinch = b.calculateDamage(user, target, dex.move('t_ember')).rolls[15] ?? 0;
    expect(pinch).toBeGreaterThan(full * 1.4);
  });
});

describe('Items (Hooks)', () => {
  it('Lebenskristall: ×1,3 Schaden, 1/10 LP Rückstoß', () => {
    const plain = battle(dex, [[set('flitz', ['t_hit'])], [set('brocken', ['t_wait'])]], singles);
    const orb = battle(
      dex,
      [[set('flitz', ['t_hit'], { item: 'lebenskristall' })], [set('brocken', ['t_wait'])]],
      singles,
    );
    const roll = (b: typeof plain) =>
      b.calculateDamage(
        b.mon({ side: 0, index: 0 }),
        b.mon({ side: 1, index: 0 }),
        dex.move('t_hit'),
      ).rolls[15] ?? 0;
    expect(roll(orb)).toBe(modify(roll(plain), toMod(1.3)));
    turn(orb, [move(0)], [move(0)]);
    const user = orb.mon({ side: 0, index: 0 });
    const itemDamage = eventsOf(orb, 'damage').find((e) => e.effect?.id === 'lebenskristall');
    expect(itemDamage?.amount).toBe(Math.floor(user.maxHp / 10));
  });

  it('Moosherz: heilt am Rundenende 1/16', () => {
    const b = battle(
      dex,
      [[set('flitz', ['t_wait'], { item: 'moosherz' })], [set('mittel', ['t_hit'])]],
      singles,
    );
    turn(b, [move(0)], [move(0)]);
    const user = b.mon({ side: 0, index: 0 });
    expect(eventsOf(b, 'heal')[0]?.amount).toBe(Math.floor(user.maxHp / 16));
  });

  it('Ankerband: übersteht einen K.O.-Treffer mit 1 LP und wird verbraucht', () => {
    const b = battle(
      dex,
      [[set('flitz', ['t_nuke'])], [set('lahm', ['t_wait'], { item: 'ankerband' })]],
      singles,
    );
    turn(b, [move(0)], [move(0)]);
    const target = b.mon({ side: 1, index: 0 });
    expect(target.hp).toBe(1);
    expect(target.item).toBeNull();
    turn(b, [move(0)], [move(0)]);
    expect(target.fainted).toBe(true);
  });

  it('Rotbeere: heilt einmalig 1/4, sobald die LP auf die Hälfte fallen', () => {
    const b = battle(
      dex,
      [[set('flitz', ['t_hit'])], [set('brocken', ['t_wait'], { item: 'rotbeere' })]],
      singles,
    );
    const target = b.mon({ side: 1, index: 0 });
    target.hp = Math.floor(target.maxHp / 2) + 1;
    turn(b, [move(0)], [move(0)]);
    expect(eventsOf(b, 'item')[0]?.item).toBe('rotbeere');
    expect(eventsOf(b, 'heal')[0]?.amount).toBe(Math.floor(target.maxHp / 4));
    expect(target.item).toBeNull();
  });
});

describe('Rundenende', () => {
  it('Effekte am Rundenende in Initiative-Reihenfolge', () => {
    const b = battle(dex, [
      [
        set('lahm', ['t_wait'], { item: 'moosherz' }),
        set('flitz', ['t_wait'], { item: 'moosherz' }),
      ],
      [set('mittel', ['t_spread']), set('schnecke', ['t_wait'])],
    ]);
    turn(b, [move(0), move(0)], [move(0), move(0)]);
    const heals = eventsOf(b, 'heal').map((e) => b.mon(e.target).species);
    expect(heals).toEqual(['flitz', 'lahm']);
  });
});
