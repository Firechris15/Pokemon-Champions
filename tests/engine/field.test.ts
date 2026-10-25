import { describe, expect, it } from 'vitest';
import {
  battle,
  choose,
  eventsOf,
  move,
  repeat,
  set,
  singles,
  turn,
  turnEvents,
} from '../helpers.ts';
import { dex } from './fixtures.ts';

const order = (b: ReturnType<typeof battle>, n: number) =>
  turnEvents(b, n).flatMap((e) => (e.type === 'move_used' ? [b.mon(e.mon).species] : []));

describe('Schutz', () => {
  it('Schutzschild blockt alle Attacken dieser Runde', () => {
    const b = singles(dex, [set('lahm', ['schutzschild'])], [set('flitz', ['t_hit', 't_burn'])]);
    turn(b, [move(0)], [move(0)]);
    // flitz ist schneller → Schutzschild (Priorität +4) wirkt trotzdem zuerst.
    expect(eventsOf(b, 'protected')).toHaveLength(1);
    expect(eventsOf(b, 'damage')).toHaveLength(0);
  });

  it('Erfolgschance halbiert sich nicht – sie drittelt sich bei Wiederholung (1 → 1/3 → 1/9)', () => {
    let second = 0;
    let third = 0;
    const runs = 300;
    for (let i = 0; i < runs; i++) {
      const b = singles(
        dex,
        [set('lahm', ['schutzschild'])],
        [set('flitz', ['t_idle'])],
        `stall-${i}`,
      );
      repeat(b, 3, move(0), move(0));
      const failed = eventsOf(b, 'move_failed').filter((e) => e.mon.side === 0).length;
      const succeeded = eventsOf(b, 'volatile_start').filter((e) => e.volatile === 'protect');
      expect(succeeded.length).toBeGreaterThanOrEqual(1);
      if (succeeded.length >= 2 && turnEvents(b, 2).some((e) => e.type === 'volatile_start'))
        second++;
      if (
        turnEvents(b, 2).some((e) => e.type === 'volatile_start') &&
        turnEvents(b, 3).some((e) => e.type === 'volatile_start')
      )
        third++;
      expect(failed + succeeded.length).toBe(3);
    }
    expect(second / runs).toBeGreaterThan(0.22);
    expect(second / runs).toBeLessThan(0.45);
    expect(third / runs).toBeLessThan(0.08);
  });

  it('Bastion schützt die Seite nur vor Flächenattacken', () => {
    const b = battle(dex, [
      [set('flitz', ['bastion']), set('lahm', ['t_idle'])],
      [set('mittel', ['t_spread']), set('schnecke', ['t_hit'])],
    ]);
    turn(b, [move(0), move(0)], [move(0), move(0, { foe: 1 })]);
    expect(eventsOf(b, 'protected')).toHaveLength(2);
    const hits = eventsOf(b, 'damage').filter((e) => e.cause === 'move');
    expect(hits).toHaveLength(1);
  });

  it('Vorsichtswall schützt die Seite nur vor Prioritäts-Attacken', () => {
    const b = battle(dex, [
      [set('flitz', ['vorsichtswall']), set('lahm', ['t_idle'])],
      [set('mittel', ['t_prio']), set('schnecke', ['t_hit'])],
    ]);
    turn(b, [move(0), move(0)], [move(0, { foe: 1 }), move(0, { foe: 1 })]);
    expect(eventsOf(b, 'protected')).toHaveLength(1);
    expect(eventsOf(b, 'damage').filter((e) => e.cause === 'move')).toHaveLength(1);
  });
});

describe('Wetter', () => {
  it('dauert 5 Runden, mit Wetter-Item 8', () => {
    for (const [item, turns] of [
      [undefined, 5],
      ['glutstein', 8],
    ] as const) {
      const b = singles(
        dex,
        [set('flitz', ['sonnenbann', 't_idle'], item ? { item } : {})],
        [set('koloss', ['t_idle'])],
      );
      turn(b, [move(0)], [move(0)]);
      repeat(b, 10, move(1), move(0));
      const end = b.events.findIndex((e) => e.type === 'weather_end');
      const turnAtEnd = b.events.slice(0, end).filter((e) => e.type === 'turn_start').length;
      expect(turnAtEnd, String(item)).toBe(turns);
    }
  });

  it('Gleißsonne: Glut ×1,5, Flut ×0,5; Sturmregen umgekehrt', () => {
    const b = singles(
      dex,
      [set('flitz', ['sonnenbann', 'wolkenruf', 't_ember', 't_tide'])],
      [set('koloss', ['t_idle'])],
    );
    const user = b.mon({ side: 0, index: 0 });
    const target = b.mon({ side: 1, index: 0 });
    const roll = (id: string) => b.calculateDamage(user, target, dex.move(id)).rolls[15] ?? 0;
    const ember = roll('t_ember');
    const tide = roll('t_tide');
    turn(b, [move(0)], [move(0)]);
    expect(roll('t_ember')).toBeGreaterThan(ember * 1.4);
    expect(roll('t_tide')).toBeLessThan(tide * 0.6);
    turn(b, [move(1)], [move(0)]);
    expect(roll('t_tide')).toBeGreaterThan(tide * 1.4);
    expect(roll('t_ember')).toBeLessThan(ember * 0.6);
  });

  it('Staubsturm: 1/16 Schaden (außer Erde/Kristall/Metall, Sandläufer, Sturmbrille), Kristall-Wille ×1,5', () => {
    const b = battle(dex, [
      [set('flitz', ['staubruf']), set('erdling', ['t_idle'])],
      [set('koloss', ['t_idle'], { item: 'sturmbrille' }), set('kristalling', ['t_idle'])],
    ]);
    const crystal = b.mon({ side: 1, index: 1 });
    const special = () =>
      b.calculateDamage(b.mon({ side: 0, index: 0 }), crystal, dex.move('t_special')).rolls[15] ??
      0;
    const before = special();
    turn(b, [move(0), move(0)], [move(0), move(0)]);
    const chip = eventsOf(b, 'damage').filter((e) => e.effect?.kind === 'weather');
    expect(chip.map((e) => b.mon(e.target).species)).toEqual(['flitz']);
    expect(special()).toBeLessThan(before);
  });

  it('Eisgestöber: 1/16 Schaden außer Frost; Frost-Verteidigung ×1,5; Polarschleier nur im Eisgestöber', () => {
    const b = singles(
      dex,
      [set('flitz', ['polarschleier', 'frostruf', 't_hit'])],
      [set('frostling', ['t_idle'])],
    );
    const user = b.mon({ side: 0, index: 0 });
    const target = b.mon({ side: 1, index: 0 });
    const physical = () => b.calculateDamage(user, target, dex.move('t_hit')).rolls[15] ?? 0;
    turn(b, [move(0)], [move(0)]);
    expect(eventsOf(b, 'move_failed').filter((e) => e.mon.side === 0)).toHaveLength(1);
    const before = physical();
    turn(b, [move(1)], [move(0)]);
    expect(physical()).toBeLessThan(before);
    expect(
      eventsOf(b, 'damage')
        .filter((e) => e.effect?.kind === 'weather')
        .map((e) => b.mon(e.target).species),
    ).toEqual(['flitz']);
    turn(b, [move(0)], [move(0)]);
    expect(b.state.sides[0].conditions.polarschleier).toBeDefined();
  });

  it('Wetter-Fähigkeiten beim Einwechseln, Initiative ×2 im passenden Wetter', () => {
    const b = singles(
      dex,
      [
        set('faehig', ['t_idle'], { ability: 'regenbringer' }),
        set('wasserling', ['t_idle'], { ability: 'wellenreiter' }),
      ],
      [set('koloss', ['t_idle'])],
    );
    expect(b.state.field.weather?.id).toBe('sturmregen');
    const runner = b.mon({ side: 0, index: 1 });
    const speed = b.getSpeed(runner);
    b.state.field.weather = null;
    expect(b.getSpeed(runner)).toBe(speed / 2);
  });
});

describe('Felder', () => {
  it('5 Runden, ×1,3 für Monster am Boden, nicht für schwebende', () => {
    const b = singles(
      dex,
      [set('flitz', ['funkenfeld', 't_spark', 't_idle']), set('windling', ['t_spark'])],
      [set('lahm', ['t_idle'])],
    );
    const grounded = b.mon({ side: 0, index: 0 });
    const flyer = b.mon({ side: 0, index: 1 });
    const target = b.mon({ side: 1, index: 0 });
    const roll = (mon: typeof grounded) =>
      b.calculateDamage(mon, target, dex.move('t_spark')).rolls[15] ?? 0;
    const groundedBefore = roll(grounded);
    const flyerBefore = roll(flyer);
    turn(b, [move(0)], [move(0)]);
    expect(roll(grounded)).toBeGreaterThan(groundedBefore * 1.25);
    expect(roll(flyer)).toBe(flyerBefore);
    repeat(b, 8, move(2), move(0));
    const end = b.events.findIndex((e) => e.type === 'terrain_end');
    expect(b.events.slice(0, end).filter((e) => e.type === 'turn_start').length).toBe(5);
  });

  it('Funkenfeld verhindert Schlummer, Sternenfeld jedes Statusproblem (am Boden)', () => {
    const spark = singles(
      dex,
      [set('flitz', ['funkenfeld', 't_slp'])],
      [set('koloss', ['t_idle'])],
    );
    turn(spark, [move(0)], [move(0)]);
    turn(spark, [move(1)], [move(0)]);
    expect(spark.mon({ side: 1, index: 0 }).status).toBeNull();
    const star = singles(
      dex,
      [set('flitz', ['sternenfeld', 't_burn'])],
      [set('koloss', ['t_idle'])],
    );
    turn(star, [move(0)], [move(0)]);
    turn(star, [move(1)], [move(0)]);
    expect(star.mon({ side: 1, index: 0 }).status).toBeNull();
  });

  it('Blütenfeld heilt am Boden 1/16 pro Runde', () => {
    const b = singles(dex, [set('flitz', ['bluetenfeld', 't_hit'])], [set('koloss', ['t_idle'])]);
    turn(b, [move(0)], [move(0)]);
    turn(b, [move(1)], [move(0)]);
    const target = b.mon({ side: 1, index: 0 });
    const heal = eventsOf(b, 'heal').find((e) => e.target.side === 1);
    expect(heal?.amount).toBe(Math.floor(target.maxHp / 16));
  });

  it('Psifeld schützt Monster am Boden vor gegnerischen Prioritäts-Attacken', () => {
    const b = singles(
      dex,
      [set('lahm', ['psifeld', 't_idle'])],
      [set('flitz', ['t_idle', 't_prio'])],
    );
    turn(b, [move(0)], [move(0)]);
    turn(b, [move(1)], [move(1)]);
    expect(eventsOf(b, 'protected')[0]?.by?.id).toBe('psifeld');
  });
});

describe('Feldeffekte', () => {
  it('Raumverzerrung: langsame zuerst, 5 Runden, erneuter Einsatz hebt sie auf', () => {
    const b = battle(dex, [
      [set('flitz', ['raumverzerrung', 't_idle']), set('schnecke', ['t_idle'])],
      [set('mittel', ['t_idle']), set('lahm', ['t_idle'])],
    ]);
    turn(b, [move(0), move(0)], [move(0), move(0)]);
    // Priorität −7: Raumverzerrung kommt zuletzt.
    expect(order(b, 1).at(-1)).toBe('flitz');
    turn(b, [move(1), move(0)], [move(0), move(0)]);
    expect(order(b, 2)).toEqual(['schnecke', 'lahm', 'mittel', 'flitz']);
    repeat(b, 0, move(0), move(0));
    turn(b, [move(0), move(0)], [move(0), move(0)]);
    expect(eventsOf(b, 'field_end')).toHaveLength(1);
  });

  it('Aufwind: Initiative ×2 für 4 Runden', () => {
    const b = singles(dex, [set('lahm', ['aufwind', 't_idle'])], [set('mittel', ['t_idle'])]);
    const user = b.mon({ side: 0, index: 0 });
    const speed = b.getSpeed(user);
    turn(b, [move(0)], [move(0)]);
    expect(b.getSpeed(user)).toBe(speed * 2);
    repeat(b, 5, move(1), move(0));
    const end = b.events.findIndex((e) => e.type === 'side_end');
    expect(b.events.slice(0, end).filter((e) => e.type === 'turn_start').length).toBe(4);
  });

  it('Schutzwände: Doppel 2/3, Einzel 1/2; Volltreffer ignorieren sie', () => {
    const doubles = battle(dex, [
      [set('flitz', ['prallschild']), set('lahm', ['t_idle'])],
      [set('mittel', ['t_hit']), set('schnecke', ['t_idle'])],
    ]);
    const attacker = doubles.mon({ side: 1, index: 0 });
    const defender = doubles.mon({ side: 0, index: 1 });
    const plain = doubles.calculateDamage(attacker, defender, dex.move('t_hit')).rolls[15] ?? 0;
    const crit =
      doubles.calculateDamage(attacker, defender, dex.move('t_hit'), { crit: true }).rolls[15] ?? 0;
    turn(doubles, [move(0), move(0)], [move(0, { foe: 1 }), move(0)]);
    const screened = doubles.calculateDamage(attacker, defender, dex.move('t_hit')).rolls[15] ?? 0;
    expect(screened).toBe(Math.trunc((plain * 2732 + 2047) / 4096));
    expect(
      doubles.calculateDamage(attacker, defender, dex.move('t_hit'), { crit: true }).rolls[15],
    ).toBe(crit);
    expect(
      doubles.calculateDamage(attacker, defender, dex.move('t_special')).rolls[15],
    ).toBeGreaterThan(screened);

    const single = singles(dex, [set('lahm', ['aetherschild'])], [set('flitz', ['t_special'])]);
    const a = single.mon({ side: 1, index: 0 });
    const d = single.mon({ side: 0, index: 0 });
    const before = single.calculateDamage(a, d, dex.move('t_special')).rolls[15] ?? 0;
    turn(single, [move(0)], [move(0)]);
    expect(single.calculateDamage(a, d, dex.move('t_special')).rolls[15]).toBe(
      Math.trunc((before * 2048 + 2047) / 4096),
    );
  });

  it('Splitterfalle: Schaden nach Kristall-Effektivität beim Einwechseln', () => {
    const b = singles(
      dex,
      [set('flitz', ['splitterfalle', 't_idle'])],
      [set('koloss', ['t_idle']), set('windling', ['t_idle']), set('erdling', ['t_idle'])],
    );
    turn(b, [move(0)], [move(0)]);
    turn(b, [move(1)], [{ type: 'switch', mon: 1 }]);
    const flyer = b.mon({ side: 1, index: 1 });
    // Wind ist schwach gegen Kristall: 2/8 = 1/4.
    expect(eventsOf(b, 'damage').at(-1)?.amount).toBe(Math.floor(flyer.maxHp / 4));
    turn(b, [move(1)], [{ type: 'switch', mon: 2 }]);
    const earth = b.mon({ side: 1, index: 2 });
    expect(eventsOf(b, 'damage').at(-1)?.amount).toBe(Math.floor(earth.maxHp / 16));
  });

  it('Dornensaat: bis zu 3 Lagen, nur am Boden; Sturmfeger räumt die eigene Seite', () => {
    const b = singles(
      dex,
      [set('flitz', ['dornensaat', 't_idle'])],
      [
        set('koloss', ['sturmfeger', 't_idle']),
        set('lahm', ['t_idle']),
        set('windling', ['t_idle']),
      ],
    );
    repeat(b, 3, move(0), move(1));
    turn(b, [move(0)], [move(1)]);
    expect(eventsOf(b, 'move_failed').filter((e) => e.mon.side === 0)).toHaveLength(1);
    turn(b, [move(1)], [{ type: 'switch', mon: 1 }]);
    const lahm = b.mon({ side: 1, index: 1 });
    expect(eventsOf(b, 'damage').at(-1)?.amount).toBe(Math.floor(lahm.maxHp / 4));
    turn(b, [move(1)], [{ type: 'switch', mon: 2 }]);
    expect(
      eventsOf(b, 'damage').filter((e) => b.mon(e.target).species === 'windling'),
    ).toHaveLength(0);
    turn(b, [move(1)], [{ type: 'switch', mon: 0 }]);
    turn(b, [move(1)], [move(0)]);
    expect(b.state.sides[1].conditions.dornensaat).toBeUndefined();
  });
});

describe('Attacken-Eigenschaften (Phase 2)', () => {
  it('Wechsel nach Treffer: Wechsel mitten in der Runde, danach geht die Runde weiter', () => {
    const b = battle(dex, [
      [set('flitz', ['rueckzugshieb']), set('lahm', ['t_idle']), set('brocken', ['t_idle'])],
      [set('mittel', ['t_hit']), set('schnecke', ['t_idle'])],
    ]);
    turn(b, [move(0, { foe: 0 }), move(0)], [move(0, { foe: 0 }), move(0)]);
    const request = b.getRequest(0);
    expect(request).toEqual({ type: 'switch', positions: [true, false], switchable: [2] });
    expect(b.getRequest(1).type).toBe('wait');
    choose(b, 0, { type: 'switch', switches: [2, null] });
    expect(b.monAt({ side: 0, position: 0 })?.species).toBe('brocken');
    // mittel greift danach Position 0 an – jetzt steht dort brocken.
    const lastHit = eventsOf(b, 'damage')
      .filter((e) => e.cause === 'move')
      .at(-1);
    expect(lastHit && b.mon(lastHit.target).species).toBe('brocken');
    expect(b.state.turn).toBe(2);
  });

  it('Negative Priorität: Rachefaust kommt nach normalen Attacken und trifft doppelt, wenn getroffen', () => {
    const b = singles(dex, [set('flitz', ['rachefaust'])], [set('koloss', ['t_hit'])]);
    const user = b.mon({ side: 0, index: 0 });
    const target = b.mon({ side: 1, index: 0 });
    const normal = b.calculateDamage(user, target, dex.move('rachefaust')).rolls;
    turn(b, [move(0)], [move(0)]);
    expect(order(b, 1)).toEqual(['koloss', 'flitz']);
    const hit = eventsOf(b, 'damage')
      .filter((e) => e.target.side === 1)
      .at(-1);
    expect(hit?.amount ?? 0).toBeGreaterThan(Math.max(...normal));
  });

  it('Hoheit blockt gegnerische Prioritäts-Attacken gegen sich und den Partner', () => {
    const b = battle(dex, [
      [set('lahm', ['t_idle'], { ability: 'hoheit' }), set('schnecke', ['t_idle'])],
      [set('mittel', ['t_prio']), set('flitz', ['t_prio'])],
    ]);
    turn(b, [move(0), move(0)], [move(0, { foe: 0 }), move(0, { foe: 1 })]);
    expect(eventsOf(b, 'protected')).toHaveLength(2);
    expect(eventsOf(b, 'damage')).toHaveLength(0);
  });
});
