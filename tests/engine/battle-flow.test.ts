import { describe, expect, it } from 'vitest';
import { STANDARD_DEX } from '../../src/data/index.ts';
import { Battle, STRUGGLE_MOVE_ID } from '../../src/engine/battle.ts';
import { battle, choose, eventsOf, move, pass, set, turn, turnEvents } from '../helpers.ts';
import { dex } from './fixtures.ts';

const moveOrder = (b: Battle, n: number) =>
  turnEvents(b, n)
    .filter((e) => e.type === 'move_used')
    .map((e) => b.mon(e.mon).species);

describe('Team-Vorschau', () => {
  const six = ['pyrrax', 'gischtel', 'moosbock', 'voltrabe', 'frostkauz', 'bruxor'];
  const team = six.map((species) => {
    const data = STANDARD_DEX.species(species);
    return set(species, data.learnset.slice(0, 4), { ability: data.abilities[0] ?? '' });
  });

  it('6 mitbringen, 4 wählen – die ersten 2 starten', () => {
    const b = Battle.create({
      dex: STANDARD_DEX,
      formatId: 'doubles-standard',
      seed: 'preview',
      sides: [
        { name: 'A', team },
        { name: 'B', team },
      ],
    });
    const request = b.getRequest(0);
    expect(request.type).toBe('teamPreview');
    if (request.type !== 'teamPreview') return;
    expect(request.pick).toBe(4);
    expect(request.team).toHaveLength(6);
    expect(request.opponent.every((entry) => entry.item === null)).toBe(true);

    expect(b.choose(0, { type: 'teamPreview', order: [0, 1, 2] }).ok).toBe(false);
    expect(b.choose(0, { type: 'teamPreview', order: [0, 0, 1, 2] }).ok).toBe(false);
    choose(b, 0, { type: 'teamPreview', order: [5, 4, 3, 2] });
    expect(b.getRequest(0).type).toBe('wait');
    choose(b, 1, { type: 'teamPreview', order: [0, 1, 2, 3] });

    expect(b.state.sides[0].team.map((m) => m.species)).toEqual([
      'bruxor',
      'frostkauz',
      'voltrabe',
      'moosbock',
    ]);
    expect(b.monAt({ side: 0, position: 0 })?.species).toBe('bruxor');
    expect(b.monAt({ side: 0, position: 1 })?.species).toBe('frostkauz');
    expect(b.getRequest(0).type).toBe('move');
    expect(b.state.turn).toBe(1);
  });
});

describe('Entscheidungen', () => {
  it('lehnt ungültige Aktionen ab', () => {
    const b = battle(dex, [
      [set('mittel', ['t_hit']), set('lahm', ['t_hit']), set('schnecke', ['t_hit'])],
      [set('mittel', ['t_hit']), set('lahm', ['t_hit'])],
    ]);
    expect(b.choose(0, { type: 'move', actions: [move(0, { foe: 0 })] }).ok).toBe(false);
    expect(
      b.choose(0, { type: 'move', actions: [move(3, { foe: 0 }), move(0, { foe: 0 })] }).ok,
    ).toBe(false);
    expect(b.choose(0, { type: 'move', actions: [{ type: 'switch', mon: 1 }, pass] }).ok).toBe(
      false,
    );
    expect(
      b.choose(0, {
        type: 'move',
        actions: [
          { type: 'switch', mon: 2 },
          { type: 'switch', mon: 2 },
        ],
      }).ok,
    ).toBe(false);
    expect(b.choose(0, { type: 'move', actions: [move(0, { ally: 0 }), pass] }).ok).toBe(false);
    expect(b.choose(0, { type: 'switch', switches: [null, null] }).ok).toBe(false);
    expect(
      b.choose(0, { type: 'move', actions: [move(0, { foe: 1 }), move(0, { ally: 0 })] }).ok,
    ).toBe(true);
  });
});

describe('Zugreihenfolge', () => {
  it('Wechsel zuerst, dann Priorität, dann Initiative', () => {
    const b = battle(dex, [
      [set('lahm', ['t_hit']), set('schnecke', ['t_prio']), set('mittel', ['t_hit'])],
      [set('flitz', ['t_wait']), set('mittel', ['t_wait'])],
    ]);
    turn(b, [{ type: 'switch', mon: 2 }, move(0, { foe: 0 })], [move(0), move(0)]);
    const events = turnEvents(b, 1).filter((e) => e.type === 'switch_in' || e.type === 'move_used');
    expect(events[0]?.type).toBe('switch_in');
    expect(moveOrder(b, 1)).toEqual(['schnecke', 'flitz', 'mittel']);
  });

  it('Initiative wird mitten in der Runde neu berechnet', () => {
    const b = battle(dex, [
      [set('flitz', ['t_slow']), set('schnecke', ['t_wait'])],
      [set('mittel', ['t_wait']), set('lahm', ['t_wait'])],
    ]);
    // Vorher: flitz > mittel > lahm > schnecke. flitz senkt die Initiative von mittel um 6 Stufen.
    turn(b, [move(0, { foe: 0 }), move(0)], [move(0), move(0)]);
    expect(moveOrder(b, 1)).toEqual(['flitz', 'lahm', 'mittel', 'schnecke']);
  });

  it('Gleichstand wird per Zufall entschieden', () => {
    const firsts = new Set<string>();
    for (let i = 0; i < 30; i++) {
      const b = battle(
        dex,
        [
          [set('gleich', ['t_wait'], { nickname: 'links' })],
          [set('gleich', ['t_wait'], { nickname: 'rechts' })],
        ],
        { format: 'test-singles', seed: `tie-${i}` },
      );
      turn(b, [move(0)], [move(0)]);
      const first = turnEvents(b, 1).find((e) => e.type === 'move_used');
      if (first?.type === 'move_used') firsts.add(b.mon(first.mon).name);
    }
    expect(firsts).toEqual(new Set(['links', 'rechts']));
  });
});

describe('Ziele', () => {
  it('leitet bei ausgefallenem Ziel auf den anderen Gegner um', () => {
    const b = battle(dex, [
      [set('flitz', ['t_nuke']), set('mittel', ['t_hit'])],
      [set('lahm', ['t_wait']), set('schnecke', ['t_wait'])],
    ]);
    turn(b, [move(0, { foe: 0 }), move(0, { foe: 0 })], [move(0), move(0)]);
    const used = eventsOf(b, 'move_used').filter((e) => b.mon(e.mon).species === 'mittel');
    expect(used[0]?.targets.map((t) => b.mon(t).species)).toEqual(['schnecke']);
  });

  it('schlägt fehl, wenn der gewählte Partner ausgefallen ist', () => {
    const b = battle(dex, [
      [set('lahm', ['t_allyheal', 't_hurt_ally']), set('schnecke', ['t_wait'])],
      [set('flitz', ['t_nuke']), set('mittel', ['t_wait'])],
    ]);
    turn(b, [move(0, { ally: 1 }), move(0)], [move(0, { foe: 1 }), move(0)]);
    const failed = eventsOf(b, 'move_failed');
    expect(failed).toHaveLength(1);
    expect(failed[0]?.reason).toBe('noTarget');
  });

  it('Flächenattacken: 0,75× bei mehreren Zielen, voller Schaden bei einem', () => {
    const b = battle(dex, [
      [set('flitz', ['t_spread']), set('schnecke', ['t_wait'])],
      [set('brocken', ['t_wait']), set('brocken', ['t_wait'])],
    ]);
    const user = b.mon({ side: 0, index: 0 });
    const target = b.mon({ side: 1, index: 0 });
    const spreadRolls = b.calculateDamage(user, target, dex.move('t_spread'), {
      spread: true,
    }).rolls;
    const singleRolls = b.calculateDamage(user, target, dex.move('t_spread')).rolls;
    expect(Math.max(...spreadRolls)).toBeLessThan(Math.min(...singleRolls));
    turn(b, [move(0), move(0)], [move(0), move(0)]);
    const damage = eventsOf(b, 'damage');
    expect(damage).toHaveLength(2);
    for (const hit of damage) expect(spreadRolls).toContain(hit.amount);

    const solo = battle(dex, [[set('flitz', ['t_spread'])], [set('brocken', ['t_wait'])]]);
    turn(solo, [move(0), pass], [move(0), pass]);
    expect(singleRolls).toContain(eventsOf(solo, 'damage')[0]?.amount);
  });

  it('„alle anderen“ trifft auch den Partner', () => {
    const b = battle(dex, [
      [set('flitz', ['t_all']), set('brocken', ['t_wait'])],
      [set('brocken', ['t_wait']), set('brocken', ['t_wait'])],
    ]);
    turn(b, [move(0), move(0)], [move(0), move(0)]);
    const targets = eventsOf(b, 'move_used')[0]?.targets ?? [];
    expect(targets).toHaveLength(3);
    expect(targets.some((t) => t.side === 0)).toBe(true);
  });
});

describe('K.O. und Ersatz', () => {
  it('ersetzt besiegte Monster am Rundenende', () => {
    const b = battle(dex, [
      [set('flitz', ['t_nuke']), set('schnecke', ['t_wait'])],
      [set('lahm', ['t_wait']), set('lahm', ['t_wait']), set('mittel', ['t_wait'])],
    ]);
    turn(b, [move(0, { foe: 0 }), move(0)], [move(0), move(0)]);
    expect(eventsOf(b, 'faint')).toHaveLength(1);
    expect(b.getRequest(0).type).toBe('wait');
    const request = b.getRequest(1);
    expect(request).toEqual({ type: 'switch', positions: [true, false], switchable: [2] });
    // Der Besiegte bleibt bis zum Rundenende leer; der Ersatz kommt erst nach turn_end.
    const turnEnd = b.events.findIndex((e) => e.type === 'turn_end');
    choose(b, 1, { type: 'switch', switches: [2, null] });
    const switchIn = b.events.findIndex((e, i) => i > turnEnd && e.type === 'switch_in');
    expect(switchIn).toBeGreaterThan(turnEnd);
    expect(b.monAt({ side: 1, position: 0 })?.species).toBe('mittel');
    expect(b.state.turn).toBe(2);
    expect(b.getRequest(0).type).toBe('move');
  });

  it('ohne Ersatz bleibt die Position leer und muss passen', () => {
    const b = battle(dex, [
      [set('flitz', ['t_nuke']), set('schnecke', ['t_wait'])],
      [set('lahm', ['t_wait']), set('lahm', ['t_wait'])],
    ]);
    turn(b, [move(0, { foe: 0 }), move(0)], [move(0), move(0)]);
    const request = b.getRequest(1);
    expect(request.type).toBe('move');
    if (request.type !== 'move') return;
    expect(request.positions[0]).toBeNull();
    expect(b.choose(1, { type: 'move', actions: [move(0), move(0)] }).ok).toBe(false);
    expect(b.choose(1, { type: 'move', actions: [pass, move(0)] }).ok).toBe(true);
  });

  it('der Kampf endet, wenn eine Seite keine Monster mehr hat', () => {
    const b = battle(dex, [
      [set('flitz', ['t_nuke']), set('mittel', ['t_nuke'])],
      [set('lahm', ['t_wait']), set('schnecke', ['t_wait'])],
    ]);
    turn(b, [move(0, { foe: 0 }), move(0, { foe: 1 })], [move(0), move(0)]);
    expect(b.ended).toBe(true);
    expect(b.winner).toBe(0);
    expect(b.events.at(-1)).toEqual({ type: 'battle_end', winner: 0, reason: 'knockout' });
    expect(b.getRequest(0).type).toBe('wait');
    expect(b.choose(0, { type: 'move', actions: [move(0), move(0)] }).ok).toBe(false);
  });

  it('Aufgeben beendet den Kampf', () => {
    const b = battle(dex, [[set('flitz', ['t_hit'])], [set('lahm', ['t_hit'])]], {
      format: 'test-singles',
    });
    choose(b, 1, { type: 'forfeit' });
    expect(b.winner).toBe(0);
    expect(b.events.at(-1)).toEqual({ type: 'battle_end', winner: 0, reason: 'forfeit' });
  });
});

describe('AP und Wechsel', () => {
  it('verbraucht AP; ohne AP folgt die Notattacke mit Rückstoß', () => {
    const b = battle(dex, [[set('flitz', ['t_onepp'])], [set('brocken', ['t_wait'])]], {
      format: 'test-singles',
    });
    turn(b, [move(0)], [move(0)]);
    expect(b.mon({ side: 0, index: 0 }).moves[0]?.pp).toBe(0);
    const request = b.getRequest(0);
    expect(request.type === 'move' && request.positions[0]?.struggle).toBe(true);
    turn(b, [move(0)], [move(0)]);
    const used = eventsOf(b, 'move_used').filter((e) => e.mon.side === 0);
    expect(used.at(-1)?.move).toBe(STRUGGLE_MOVE_ID);
    const user = b.mon({ side: 0, index: 0 });
    const recoil = eventsOf(b, 'damage').find((e) => e.cause === 'recoil');
    expect(recoil?.amount).toBe(Math.floor(user.maxHp / 4));
  });

  it('Auswechseln setzt Stat-Stufen zurück', () => {
    const b = battle(
      dex,
      [[set('flitz', ['t_speedup']), set('lahm', ['t_wait'])], [set('brocken', ['t_wait'])]],
      {
        format: 'test-singles',
      },
    );
    turn(b, [move(0)], [move(0)]);
    expect(b.mon({ side: 0, index: 0 }).boosts.spe).toBe(2);
    turn(b, [{ type: 'switch', mon: 1 }], [move(0)]);
    turn(b, [{ type: 'switch', mon: 0 }], [move(0)]);
    expect(b.mon({ side: 0, index: 0 }).boosts.spe).toBe(0);
  });

  it('Einzelkampf läuft mit derselben Engine', () => {
    const b = battle(
      dex,
      [[set('flitz', ['t_nuke'])], [set('lahm', ['t_wait']), set('mittel', ['t_wait'])]],
      {
        format: 'test-singles',
      },
    );
    expect(b.state.sides[0].active).toHaveLength(1);
    turn(b, [move(0)], [move(0)]);
    choose(b, 1, { type: 'switch', switches: [1] });
    turn(b, [move(0)], [move(0)]);
    expect(b.winner).toBe(0);
  });
});
