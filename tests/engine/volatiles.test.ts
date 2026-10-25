import { describe, expect, it } from 'vitest';
import { battle, eventsOf, move, repeat, set, singles, turn, turnEvents } from '../helpers.ts';
import { dex } from './fixtures.ts';

const request = (b: ReturnType<typeof singles>, side: 0 | 1 = 1) => {
  const r = b.getRequest(side);
  if (r.type !== 'move') throw new Error(`Erwartet Attacken-Anfrage, war ${r.type}`);
  const slot = r.positions[0];
  if (!slot) throw new Error('Position leer');
  return slot;
};

describe('Flüchtige Zustände', () => {
  it('Wirrsinn: 2–5 Handlungen, ~1/3 Selbsttreffer, endet von selbst', () => {
    let selfHits = 0;
    let attempts = 0;
    for (let i = 0; i < 20; i++) {
      const b = singles(
        dex,
        [set('flitz', ['t_confuse', 't_wait'])],
        [set('koloss', ['t_wait'])],
        `conf-${i}`,
      );
      turn(b, [move(0)], [move(0)]);
      repeat(b, 6, move(1), move(0));
      expect(eventsOf(b, 'volatile_end').filter((e) => e.volatile === 'confusion')).toHaveLength(1);
      selfHits += eventsOf(b, 'confusion_hit').length;
      attempts +=
        eventsOf(b, 'confusion_hit').length +
        eventsOf(b, 'move_used').filter((e) => e.mon.side === 1).length;
      expect(eventsOf(b, 'damage').filter((e) => e.cause === 'confusion').length).toBe(
        eventsOf(b, 'confusion_hit').length,
      );
    }
    expect(selfHits).toBeGreaterThan(5);
    expect(selfHits / attempts).toBeLessThan(0.4);
  });

  it('Zurückschrecken wirkt nur, wenn der Angreifer zuerst handelt', () => {
    const fast = singles(dex, [set('flitz', ['t_flinchhit'])], [set('lahm', ['t_hit'])]);
    turn(fast, [move(0)], [move(0)]);
    expect(eventsOf(fast, 'cant_move')[0]?.reason).toBe('flinch');

    const slow = singles(dex, [set('schnecke', ['t_flinchhit'])], [set('flitz', ['t_hit'])]);
    turn(slow, [move(0)], [move(0)]);
    expect(eventsOf(slow, 'cant_move')).toHaveLength(0);
  });

  it('Überrumpler: nur in der ersten Runde nach dem Einwechseln', () => {
    const b = singles(dex, [set('lahm', ['ueberrumpler'])], [set('flitz', ['t_wait'])]);
    turn(b, [move(0)], [move(0)]);
    expect(eventsOf(b, 'cant_move')).toHaveLength(1);
    turn(b, [move(0)], [move(0)]);
    expect(eventsOf(b, 'move_failed')).toHaveLength(1);
  });

  it('Spott: sperrt Statusattacken für 3 Runden', () => {
    const b = singles(
      dex,
      [set('flitz', ['spott', 't_wait'])],
      [set('brocken', ['t_wait', 't_small'])],
    );
    turn(b, [move(0)], [move(1)]);
    expect(request(b).moves[0]?.disabled).toBe(true);
    expect(request(b).moves[1]?.disabled).toBe(false);
    repeat(b, 3, move(1), move(1));
    expect(eventsOf(b, 'volatile_end').some((e) => e.volatile === 'taunt')).toBe(true);
    expect(request(b).moves[0]?.disabled).toBe(false);
  });

  it('Spott wirkt auch, wenn er vor der Statusattacke des Ziels kommt', () => {
    const b = singles(dex, [set('flitz', ['spott'])], [set('lahm', ['t_wait'])]);
    turn(b, [move(0)], [move(0)]);
    expect(eventsOf(b, 'cant_move')[0]?.reason).toBe('taunt');
  });

  it('Echozwang: erzwingt die letzte Attacke', () => {
    const b = singles(
      dex,
      [set('flitz', ['echozwang', 't_wait'])],
      [set('lahm', ['t_wait', 't_hit'])],
    );
    const usedBy1 = (n: number) =>
      turnEvents(b, n).flatMap((e) => (e.type === 'move_used' && e.mon.side === 1 ? [e.move] : []));
    turn(b, [move(1)], [move(0)]);
    // flitz ist schneller: der Echozwang greift, bevor lahm seine gewählte Attacke einsetzt.
    turn(b, [move(0)], [move(1)]);
    expect(usedBy1(2)).toEqual(['t_wait']);
    expect(request(b).moves.map((m) => m.disabled)).toEqual([false, true]);
  });

  it('Echozwang schlägt fehl, wenn das Ziel noch nichts eingesetzt hat', () => {
    const b = singles(dex, [set('flitz', ['echozwang'])], [set('lahm', ['t_wait'])]);
    turn(b, [move(0)], [move(0)]);
    expect(eventsOf(b, 'move_failed')).toHaveLength(1);
  });

  it('Trugbild: kostet 1/4 LP, fängt Schaden ab, blockt Status, zerfällt', () => {
    const b = singles(
      dex,
      [set('lahm', ['trugbild', 't_wait'])],
      [set('flitz', ['t_hit', 't_burn'])],
    );
    const user = b.mon({ side: 0, index: 0 });
    turn(b, [move(0)], [move(1)]);
    // flitz ist schneller: Brandmal kam vor dem Trugbild.
    expect(user.status).toBe('brn');
    const hpAfterSub = user.hp;
    expect(user.volatiles.substitute?.hp).toBe(Math.floor(user.maxHp / 4));
    turn(b, [move(1)], [move(0)]);
    expect(eventsOf(b, 'substitute_damage').length).toBeGreaterThan(0);
    expect(user.hp).toBeLessThanOrEqual(hpAfterSub);
    const statusMoves = singles(
      dex,
      [set('lahm', ['trugbild', 't_wait'])],
      [set('schnecke', ['t_psn'])],
    );
    turn(statusMoves, [move(0)], [move(0)]);
    expect(statusMoves.mon({ side: 0, index: 0 }).status).toBeNull();
    expect(eventsOf(statusMoves, 'move_failed')).toHaveLength(1);
  });

  it('Klang-Attacken gehen durch das Trugbild', () => {
    const b = singles(dex, [set('flitz', ['trugbild', 't_wait'])], [set('lahm', ['t_sound'])]);
    turn(b, [move(0)], [move(0)]);
    expect(eventsOf(b, 'substitute_damage')).toHaveLength(0);
    expect(eventsOf(b, 'damage').some((e) => e.cause === 'move')).toBe(true);
  });

  it('Schärfeblick: Volltreffer-Stufe +2', () => {
    const b = singles(
      dex,
      [set('flitz', ['schaerfeblick', 'frostklaue'])],
      [set('koloss', ['t_wait'])],
    );
    turn(b, [move(0)], [move(0)]);
    repeat(b, 5, move(1), move(0));
    // Frostklaue (Stufe 1) + 2 = Stufe 3 → immer Volltreffer.
    expect(eventsOf(b, 'crit')).toHaveLength(5);
  });

  it('Zwei-Runden-Attacke: lädt auf, greift in Runde 2 an, kein Wechsel dazwischen', () => {
    const b = singles(
      dex,
      [set('flitz', ['sternensturz', 't_wait']), set('lahm', ['t_wait'])],
      [set('koloss', ['t_wait'])],
    );
    turn(b, [move(0)], [move(0)]);
    expect(eventsOf(b, 'charge')).toHaveLength(1);
    expect(eventsOf(b, 'damage')).toHaveLength(0);
    const slot = request(b, 0);
    expect(slot.trapped).toBe(true);
    expect(slot.switchable).toEqual([]);
    expect(slot.moves.map((m) => m.disabled)).toEqual([false, true]);
    turn(b, [move(0)], [move(0)]);
    expect(eventsOf(b, 'damage')).toHaveLength(1);
    expect(request(b, 0).trapped).toBe(false);
  });

  it('Sonnenlanze lädt in der Gleißsonne nicht auf', () => {
    const b = singles(
      dex,
      [set('flitz', ['sonnenbann', 'sonnenlanze'])],
      [set('koloss', ['t_wait'])],
    );
    turn(b, [move(0)], [move(0)]);
    turn(b, [move(1)], [move(0)]);
    expect(eventsOf(b, 'charge')).toHaveLength(0);
    expect(eventsOf(b, 'damage').some((e) => e.cause === 'move')).toBe(true);
  });

  it('Umklammerung: 1/8 pro Runde, kein Wechsel, endet nach 4–5 Runden', () => {
    const b = singles(
      dex,
      [set('flitz', ['rankenfessel', 't_wait'])],
      [set('koloss', ['t_wait']), set('lahm', ['t_wait'])],
    );
    turn(b, [move(0)], [move(0)]);
    const target = b.mon({ side: 1, index: 0 });
    expect(request(b).switchable).toEqual([]);
    const bindDamage = eventsOf(b, 'damage').filter((e) => e.effect?.id === 'bound');
    expect(bindDamage[0]?.amount).toBe(Math.floor(target.maxHp / 8));
    repeat(b, 5, move(1), move(0));
    expect(eventsOf(b, 'volatile_end').some((e) => e.volatile === 'bound')).toBe(true);
    const total = eventsOf(b, 'damage').filter((e) => e.effect?.id === 'bound').length;
    expect(total).toBeGreaterThanOrEqual(4);
    expect(total).toBeLessThanOrEqual(5);
  });

  it('Seelenfluch: Anwender zahlt 1/2 LP, Ziel verliert 1/4 pro Runde', () => {
    const b = singles(dex, [set('flitz', ['seelenfluch'])], [set('koloss', ['t_wait'])]);
    turn(b, [move(0)], [move(0)]);
    const user = b.mon({ side: 0, index: 0 });
    const target = b.mon({ side: 1, index: 0 });
    const curse = eventsOf(b, 'damage').filter((e) => e.effect?.id === 'curse');
    expect(curse[0]?.amount).toBe(Math.floor(user.maxHp / 2));
    expect(curse[1]?.amount).toBe(Math.floor(target.maxHp / 4));
  });

  it('Schattenbann: kein Wechsel, solange der Verursacher auf dem Feld ist', () => {
    const b = singles(
      dex,
      [set('flitz', ['schattenbann', 't_wait']), set('lahm', ['t_wait'])],
      [set('koloss', ['t_wait']), set('schnecke', ['t_wait'])],
    );
    turn(b, [move(0)], [move(0)]);
    expect(request(b).switchable).toEqual([]);
    turn(b, [{ type: 'switch', mon: 1 }], [move(0)]);
    expect(request(b).switchable).toEqual([1]);
  });
});

describe('Doppelkampf-Spezialitäten', () => {
  it('Lockruf zieht gegnerische Ein-Ziel-Attacken auf sich', () => {
    const b = battle(dex, [
      [set('lahm', ['lockruf']), set('brocken', ['t_wait'])],
      [set('mittel', ['t_hit']), set('schnecke', ['t_hit'])],
    ]);
    turn(b, [move(0), move(0)], [move(0, { foe: 1 }), move(0, { foe: 1 })]);
    const hits = eventsOf(b, 'damage').filter((e) => e.cause === 'move');
    expect(hits).toHaveLength(2);
    expect(hits.every((e) => b.mon(e.target).species === 'lahm')).toBe(true);
  });

  it('Blitzfänger zieht Funke-Attacken an und schluckt sie', () => {
    const b = battle(dex, [
      [set('faehig', ['t_wait'], { ability: 'blitzfaenger' }), set('brocken', ['t_wait'])],
      [set('mittel', ['t_spark']), set('schnecke', ['t_wait'])],
    ]);
    turn(b, [move(0), move(0)], [move(0, { foe: 1 }), move(0)]);
    expect(eventsOf(b, 'immune')[0]?.by?.id).toBe('blitzfaenger');
    expect(b.mon({ side: 0, index: 0 }).boosts.spa).toBe(1);
  });

  it('Beistand: Attacke des Partners ×1,5', () => {
    const b = battle(dex, [
      [set('flitz', ['beistand']), set('lahm', ['t_hit'])],
      [set('koloss', ['t_wait']), set('koloss', ['t_wait'])],
    ]);
    const user = b.mon({ side: 0, index: 1 });
    const target = b.mon({ side: 1, index: 0 });
    const normal = b.calculateDamage(user, target, dex.move('t_hit')).rolls;
    turn(b, [move(0, { ally: 1 }), move(0, { foe: 0 })], [move(0), move(0)]);
    const hit = eventsOf(b, 'damage').find((e) => e.cause === 'move');
    expect(hit?.amount ?? 0).toBeGreaterThan(Math.max(...normal));
  });

  it('Platztausch tauscht die Positionen; geplante Aktionen bleiben gültig', () => {
    const b = battle(dex, [
      [set('flitz', ['platztausch']), set('lahm', ['t_hit'])],
      [set('mittel', ['t_hit']), set('schnecke', ['t_wait'])],
    ]);
    turn(b, [move(0), move(0, { foe: 0 })], [move(0, { foe: 0 }), move(0)]);
    expect(eventsOf(b, 'swap')).toHaveLength(1);
    expect(b.monAt({ side: 0, position: 0 })?.species).toBe('lahm');
    expect(b.monAt({ side: 0, position: 1 })?.species).toBe('flitz');
    // mittel zielte auf Position 0 → trifft nach dem Tausch lahm; lahm handelt trotzdem.
    const hits = eventsOf(b, 'damage')
      .filter((e) => e.cause === 'move')
      .map((e) => b.mon(e.target).species);
    expect(hits).toContain('lahm');
    expect(eventsOf(b, 'move_used').map((e) => b.mon(e.mon).species)).toContain('lahm');
  });
});
