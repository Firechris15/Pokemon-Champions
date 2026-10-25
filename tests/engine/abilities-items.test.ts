import { describe, expect, it } from 'vitest';
import { ABILITIES, ITEMS } from '../../src/data/index.ts';
import { modify, toMod } from '../../src/engine/damage.ts';
import type { Battle } from '../../src/engine/battle.ts';
import { battle, eventsOf, move, repeat, set, singles, turn } from '../helpers.ts';
import { dex } from './fixtures.ts';

/** Höchster Schadenswurf von Seite 0 / Position 0 gegen Seite 1 / Position 0. */
const top = (b: Battle, moveId: string, crit = false) =>
  b.calculateDamage(b.mon({ side: 0, index: 0 }), b.mon({ side: 1, index: 0 }), dex.move(moveId), {
    crit,
  }).rolls[15] ?? 0;

const withAbility = (ability: string, moves: string[], target = 'lahm', species = 'faehig') =>
  singles(dex, [set(species, moves, { ability })], [set(target, ['t_idle'])]);

const withItem = (item: string, moves: string[], target = 'lahm', species = 'flitz') =>
  singles(dex, [set(species, moves, { item })], [set(target, ['t_idle'])]);

describe('Fähigkeiten', () => {
  it('Notlage-Verstärker für Glut, Flut und Flora', () => {
    for (const [ability, moveId] of [
      ['glutherz', 't_ember'],
      ['tiefenzorn', 't_tide'],
      ['wildwuchs', 't_flora'],
    ] as const) {
      const b = withAbility(ability, [moveId]);
      const full = top(b, moveId);
      const user = b.mon({ side: 0, index: 0 });
      user.hp = Math.floor(user.maxHp / 3);
      expect(top(b, moveId), ability).toBeGreaterThan(full * 1.4);
    }
  });

  it('Schlagkraft ×1,2, Reißzahn ×1,5, Pulsar ×1,5 für passende Attacken', () => {
    for (const [ability, moveId, factor] of [
      ['schlagkraft', 't_punch', 1.2],
      ['reisszahn', 't_bite', 1.5],
      ['pulsar', 't_pulse', 1.5],
    ] as const) {
      const plain = top(withAbility('rueckstossfrei', [moveId]), moveId);
      const boosted = top(withAbility(ability, [moveId]), moveId);
      expect(boosted / plain, ability).toBeGreaterThan(factor - 0.12);
      expect(top(withAbility(ability, ['t_hit']), 't_hit'), ability).toBe(
        top(withAbility('rueckstossfrei', ['t_hit']), 't_hit'),
      );
    }
  });

  it('Urkraft: Gleicher-Typ-Bonus 2', () => {
    const plain = top(withAbility('rueckstossfrei', ['t_tide']), 't_tide');
    const strong = top(withAbility('urkraft', ['t_tide']), 't_tide');
    expect(strong / plain).toBeGreaterThan(1.25);
  });

  it('Trotzkraft: Angriff ×1,5 mit Status, Brandmal halbiert nicht', () => {
    const b = withAbility('trotzkraft', ['t_hit']);
    const plain = top(b, 't_hit');
    b.mon({ side: 0, index: 0 }).status = 'brn';
    expect(top(b, 't_hit')).toBeGreaterThan(plain * 1.4);
  });

  it('Wetter- und Feld-Setzer beim Einwechseln', () => {
    for (const [ability, weather] of [
      ['sonnenkind', 'gleisssonne'],
      ['regenbringer', 'sturmregen'],
      ['staubwirbler', 'staubsturm'],
      ['frostatem', 'eisgestoeber'],
    ] as const) {
      expect(withAbility(ability, ['t_idle']).state.field.weather?.id, ability).toBe(weather);
    }
    for (const [ability, terrain] of [
      ['funkenaura', 'funkenfeld'],
      ['bluetenaura', 'bluetenfeld'],
      ['sternenaura', 'sternenfeld'],
      ['psiaura', 'psifeld'],
    ] as const) {
      expect(withAbility(ability, ['t_idle']).state.field.terrain?.id, ability).toBe(terrain);
    }
  });

  it('Initiative ×2 im passenden Wetter (und kein Wetterschaden für Sand-/Schneeläufer)', () => {
    for (const [ability, setter] of [
      ['lichtsprinter', 'sonnenbann'],
      ['wellenreiter', 'wolkenruf'],
      ['sandlaeufer', 'staubruf'],
      ['schneelaeufer', 'frostruf'],
    ] as const) {
      const b = withAbility(ability, [setter], 'flitz');
      const user = b.mon({ side: 0, index: 0 });
      const speed = b.getSpeed(user);
      turn(b, [move(0)], [move(0)]);
      expect(b.getSpeed(user), ability).toBe(speed * 2);
      const chip = eventsOf(b, 'damage').filter(
        (e) => e.effect?.kind === 'weather' && e.target.side === 0,
      );
      expect(chip, ability).toHaveLength(0);
    }
  });

  it('Wasserschlucker heilt, Feuerfänger stärkt Glut, Saftfresser erhöht Angriff', () => {
    const water = singles(
      dex,
      [set('flitz', ['t_tide'])],
      [set('faehig', ['t_idle'], { ability: 'wasserschlucker' })],
    );
    const target = water.mon({ side: 1, index: 0 });
    target.hp = 50;
    turn(water, [move(0)], [move(0)]);
    expect(target.hp).toBe(50 + Math.floor(target.maxHp / 4));

    const fire = singles(
      dex,
      [set('flitz', ['t_ember'])],
      [set('faehig', ['t_ember'], { ability: 'feuerfaenger' })],
    );
    const before =
      fire.calculateDamage(
        fire.mon({ side: 1, index: 0 }),
        fire.mon({ side: 0, index: 0 }),
        dex.move('t_ember'),
      ).rolls[15] ?? 0;
    turn(fire, [move(0)], [move(0)]);
    expect(eventsOf(fire, 'immune')[0]?.by?.id).toBe('feuerfaenger');
    const after =
      fire.calculateDamage(
        fire.mon({ side: 1, index: 0 }),
        fire.mon({ side: 0, index: 0 }),
        dex.move('t_ember'),
      ).rolls[15] ?? 0;
    expect(after).toBeGreaterThan(before * 1.4);

    const sap = singles(
      dex,
      [set('flitz', ['t_flora'])],
      [set('faehig', ['t_idle'], { ability: 'saftfresser' })],
    );
    turn(sap, [move(0)], [move(0)]);
    expect(sap.mon({ side: 1, index: 0 }).boosts.atk).toBe(1);
  });

  it('Schalldämpfer: immun gegen Klang', () => {
    const b = singles(
      dex,
      [set('flitz', ['t_sound'])],
      [set('faehig', ['t_idle'], { ability: 'schalldaempfer' })],
    );
    turn(b, [move(0)], [move(0)]);
    expect(eventsOf(b, 'immune')).toHaveLength(1);
  });

  it('Schutzgeist: Partner erleidet nur 3/4', () => {
    const plain = battle(dex, [
      [set('flitz', ['t_idle'], { ability: 'rueckstossfrei' }), set('lahm', ['t_idle'])],
      [set('mittel', ['t_hit']), set('schnecke', ['t_idle'])],
    ]);
    const guarded = battle(dex, [
      [set('flitz', ['t_idle'], { ability: 'schutzgeist' }), set('lahm', ['t_idle'])],
      [set('mittel', ['t_hit']), set('schnecke', ['t_idle'])],
    ]);
    const roll = (b: Battle) =>
      b.calculateDamage(
        b.mon({ side: 1, index: 0 }),
        b.mon({ side: 0, index: 1 }),
        dex.move('t_hit'),
      ).rolls[15] ?? 0;
    expect(roll(guarded)).toBe(modify(roll(plain), toMod(0.75)));
  });

  it('Unbeugsam blockt gegnerische Wertsenkungen, Trotzreaktion antwortet mit Angriff +2', () => {
    const stubborn = singles(
      dex,
      [set('flitz', ['t_atkdrop'])],
      [set('faehig', ['t_idle'], { ability: 'unbeugsam' })],
    );
    turn(stubborn, [move(0)], [move(0)]);
    expect(stubborn.mon({ side: 1, index: 0 }).boosts.atk).toBe(0);
    const defiant = singles(
      dex,
      [set('flitz', ['t_atkdrop'])],
      [set('faehig', ['t_idle'], { ability: 'trotzreaktion' })],
    );
    turn(defiant, [move(0)], [move(0)]);
    expect(defiant.mon({ side: 1, index: 0 }).boosts.atk).toBe(1);
  });

  it('Eisern: kein Zurückschrecken, Drohkulisse wirkt nicht', () => {
    const b = battle(dex, [
      [set('flitz', ['t_flinchhit'], { ability: 'drohkulisse' }), set('lahm', ['t_idle'])],
      [set('faehig', ['t_hit'], { ability: 'eisern' }), set('schnecke', ['t_idle'])],
    ]);
    expect(b.mon({ side: 1, index: 0 }).boosts.atk).toBe(0);
    expect(b.mon({ side: 1, index: 1 }).boosts.atk).toBe(-1);
    turn(b, [move(0, { foe: 0 }), move(0)], [move(0, { foe: 0 }), move(0)]);
    expect(eventsOf(b, 'cant_move')).toHaveLength(0);
  });

  it('Wachsam: schläft nie ein', () => {
    const b = singles(
      dex,
      [set('flitz', ['t_slp'])],
      [set('faehig', ['t_idle'], { ability: 'wachsam' })],
    );
    turn(b, [move(0)], [move(0)]);
    expect(b.mon({ side: 1, index: 0 }).status).toBeNull();
  });

  it('Häutung: streift Statusprobleme mit ~30 % pro Runde ab', () => {
    let cured = 0;
    for (let i = 0; i < 100; i++) {
      const b = singles(
        dex,
        [set('flitz', ['t_psn'])],
        [set('faehig', ['t_idle'], { ability: 'haeutung' })],
        `shed-${i}`,
      );
      turn(b, [move(0)], [move(0)]);
      cured += eventsOf(b, 'status_cure').length;
    }
    expect(cured).toBeGreaterThan(15);
    expect(cured).toBeLessThan(45);
  });

  it('Kontakt-Fähigkeiten: Glutpanzer, Statikfell, Giftdorn (~30 %), Rauhaut (1/8)', () => {
    for (const [ability, status] of [
      ['glutpanzer', 'brn'],
      ['statikfell', 'par'],
      ['giftdorn', 'psn'],
    ] as const) {
      let hits = 0;
      for (let i = 0; i < 60; i++) {
        const b = singles(
          dex,
          [set('lahm', ['t_contact'])],
          [set('koloss', ['t_idle'], { ability })],
          `${ability}-${i}`,
        );
        turn(b, [move(0)], [move(0)]);
        if (b.mon({ side: 0, index: 0 }).status === status) hits++;
      }
      expect(hits, ability).toBeGreaterThan(8);
      expect(hits, ability).toBeLessThan(32);
      const noContact = singles(
        dex,
        [set('lahm', ['t_special'])],
        [set('koloss', ['t_idle'], { ability })],
      );
      repeat(noContact, 5, move(0), move(0));
      expect(noContact.mon({ side: 0, index: 0 }).status, ability).toBeNull();
    }
    const rough = singles(
      dex,
      [set('lahm', ['t_contact'])],
      [set('koloss', ['t_idle'], { ability: 'rauhaut' })],
    );
    turn(rough, [move(0)], [move(0)]);
    const attacker = rough.mon({ side: 0, index: 0 });
    expect(eventsOf(rough, 'damage').find((e) => e.effect?.id === 'rauhaut')?.amount).toBe(
      Math.floor(attacker.maxHp / 8),
    );
  });

  it('Beerenbann: Gegner können keine Beeren essen', () => {
    const b = singles(
      dex,
      [set('faehig', ['t_hit'], { ability: 'beerenbann' })],
      [set('brocken', ['t_idle'], { item: 'rotbeere' })],
    );
    const target = b.mon({ side: 1, index: 0 });
    target.hp = Math.floor(target.maxHp / 2) + 1;
    turn(b, [move(0)], [move(0)]);
    expect(target.item).toBe('rotbeere');
  });

  it('jede Fähigkeit hat Name, Beschreibung und mindestens eine Wirkung', () => {
    expect(ABILITIES.length).toBeGreaterThanOrEqual(40);
    for (const ability of ABILITIES) {
      expect(ability.description.length, ability.id).toBeGreaterThan(10);
      const effects = Object.keys(ability).filter(
        (key) =>
          key.startsWith('on') ||
          ['floating', 'preventsBerries', 'ignoresBurnPenalty'].includes(key),
      );
      expect(effects.length, ability.id).toBeGreaterThan(0);
    }
  });
});

describe('Items', () => {
  it('Fix-Items: ×1,5 und Festlegung auf die erste Attacke bis zum Auswechseln', () => {
    const plain = top(withItem('moosherz', ['t_hit', 't_special']), 't_hit');
    const band = withItem('fixband', ['t_hit', 't_special']);
    expect(top(band, 't_hit') / plain).toBeGreaterThan(1.4);
    turn(band, [move(0)], [move(0)]);
    const request = band.getRequest(0);
    expect(request.type === 'move' && request.positions[0]?.moves.map((m) => m.disabled)).toEqual([
      false,
      true,
    ]);

    const specs = withItem('fixbrille', ['t_special']);
    expect(
      top(specs, 't_special') / top(withItem('moosherz', ['t_special']), 't_special'),
    ).toBeGreaterThan(1.4);
    const scarf = withItem('fixschal', ['t_hit']);
    const user = scarf.mon({ side: 0, index: 0 });
    expect(scarf.getSpeed(user)).toBe(Math.floor((user.stats.spe * 3) / 2));
  });

  it('Schärflinse: Volltreffer-Stufe +1 (Stufe 2 → immer)', () => {
    const b = singles(
      dex,
      [set('flitz', ['t_crit2'], { item: 'schaerflinse' })],
      [set('koloss', ['t_idle'])],
    );
    repeat(b, 4, move(0), move(0));
    expect(eventsOf(b, 'crit')).toHaveLength(4);
  });

  it('Typ-Verstärker ×1,2', () => {
    for (const [item, moveId] of [
      ['glutkern', 't_ember'],
      ['tiefenperle', 't_tide'],
      ['blitzspule', 't_spark'],
      ['frostsplitter', 't_frosthit'],
    ] as const) {
      const ratio =
        top(withItem(item, [moveId]), moveId) / top(withItem('moosherz', [moveId]), moveId);
      expect(ratio, item).toBeGreaterThan(1.1);
    }
  });

  it('Kampfweste: Wille ×1,5, keine Statusattacken', () => {
    const b = singles(
      dex,
      [set('flitz', ['t_special'])],
      [set('lahm', ['t_idle', 't_hit'], { item: 'kampfweste' })],
    );
    const vest = top(b, 't_special');
    const plain = top(
      singles(dex, [set('flitz', ['t_special'])], [set('lahm', ['t_idle', 't_hit'])]),
      't_special',
    );
    expect(vest).toBeLessThan(plain * 0.75);
    const request = b.getRequest(1);
    expect(request.type === 'move' && request.positions[0]?.moves.map((m) => m.disabled)).toEqual([
      true,
      false,
    ]);
  });

  it('Dornenhelm: Kontakt kostet den Angreifer 1/6', () => {
    const b = singles(
      dex,
      [set('lahm', ['t_contact'])],
      [set('koloss', ['t_idle'], { item: 'dornenhelm' })],
    );
    turn(b, [move(0)], [move(0)]);
    const attacker = b.mon({ side: 0, index: 0 });
    expect(eventsOf(b, 'damage').find((e) => e.effect?.id === 'dornenhelm')?.amount).toBe(
      Math.floor(attacker.maxHp / 6),
    );
  });

  it('Sturmbrille: kein Pulver, kein Wetterschaden', () => {
    const b = singles(
      dex,
      [set('flitz', ['schlafsporen', 'staubruf'])],
      [set('koloss', ['t_idle'], { item: 'sturmbrille' })],
    );
    turn(b, [move(0)], [move(0)]);
    expect(b.mon({ side: 1, index: 0 }).status).toBeNull();
    turn(b, [move(1)], [move(0)]);
    expect(
      eventsOf(b, 'damage').filter((e) => e.effect?.kind === 'weather' && e.target.side === 1),
    ).toHaveLength(0);
  });

  it('Klärkraut setzt gesenkte Werte einmalig zurück', () => {
    const b = singles(
      dex,
      [set('flitz', ['t_atkdrop'])],
      [set('koloss', ['t_idle'], { item: 'klaerkraut' })],
    );
    turn(b, [move(0)], [move(0)]);
    expect(b.mon({ side: 1, index: 0 }).boosts.atk).toBe(0);
    expect(b.mon({ side: 1, index: 0 }).item).toBeNull();
  });

  it('Faulherz: Gift heilt 1/16, andere verlieren 1/8', () => {
    const venom = singles(
      dex,
      [set('giftling', ['t_idle'], { item: 'faulherz' })],
      [set('flitz', ['t_hit'])],
    );
    turn(venom, [move(0)], [move(0)]);
    expect(eventsOf(venom, 'heal').find((e) => e.effect?.id === 'faulherz')).toBeDefined();
    const other = singles(
      dex,
      [set('lahm', ['t_idle'], { item: 'faulherz' })],
      [set('flitz', ['t_idle'])],
    );
    turn(other, [move(0)], [move(0)]);
    const mon = other.mon({ side: 0, index: 0 });
    expect(eventsOf(other, 'damage').find((e) => e.effect?.id === 'faulherz')?.amount).toBe(
      Math.floor(mon.maxHp / 8),
    );
  });

  it('Klarbeere heilt Statusprobleme und Wirrsinn sofort', () => {
    const status = singles(
      dex,
      [set('flitz', ['t_burn'])],
      [set('koloss', ['t_idle'], { item: 'klarbeere' })],
    );
    turn(status, [move(0)], [move(0)]);
    expect(status.mon({ side: 1, index: 0 }).status).toBeNull();
    const confusion = singles(
      dex,
      [set('flitz', ['t_confuse'])],
      [set('koloss', ['t_idle'], { item: 'klarbeere' })],
    );
    turn(confusion, [move(0)], [move(0)]);
    expect(confusion.mon({ side: 1, index: 0 }).volatiles.confusion).toBeUndefined();
  });

  it('Resist-Beeren halbieren einmalig einen sehr effektiven Treffer', () => {
    for (const [item, moveId, target] of [
      ['kuehlbeere', 't_ember', 'blatt'],
      ['duerrbeere', 't_tide', 'erdling'],
      ['borkenbeere', 't_flora', 'wasserling'],
      ['erdungsbeere', 't_spark', 'wasserling'],
      ['gluehbeere', 't_frosthit', 'blatt'],
      ['wurzelbeere', 't_earth', 'funkling'],
      ['polsterbeere', 't_brawl', 'lahm'],
      ['lichtbeere', 't_shadow', 'spuk'],
    ] as const) {
      const plain = singles(dex, [set('flitz', [moveId])], [set(target, ['t_idle'])]);
      const berry = singles(dex, [set('flitz', [moveId])], [set(target, ['t_idle'], { item })]);
      expect(top(berry, moveId), item).toBe(modify(top(plain, moveId), toMod(0.5)));
      turn(berry, [move(0)], [move(0)]);
      expect(berry.mon({ side: 1, index: 0 }).item, item).toBeNull();
    }
  });

  it('Wetter-Steine und Feldkristall verlängern auf 8 Runden', () => {
    for (const [item, moveId] of [
      ['glutstein', 'sonnenbann'],
      ['regenstein', 'wolkenruf'],
      ['staubstein', 'staubruf'],
      ['froststein', 'frostruf'],
      ['feldkristall', 'psifeld'],
    ] as const) {
      const b = singles(
        dex,
        [set('metalling', [moveId], { item })],
        [set('metalling', ['t_idle'])],
      );
      turn(b, [move(0)], [move(0)]);
      const start = eventsOf(b, 'weather_start')[0] ?? eventsOf(b, 'terrain_start')[0];
      expect(start?.turns, item).toBe(8);
    }
  });

  it('jedes Item hat Name und Beschreibung', () => {
    expect(ITEMS.length).toBeGreaterThanOrEqual(30);
    for (const item of ITEMS) expect(item.description.length, item.id).toBeGreaterThan(10);
  });
});
