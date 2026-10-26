import { describe, expect, it } from 'vitest';
import { easyAgent } from '../../src/ai/easy.ts';
import { estimateDamage, normalAgent } from '../../src/ai/normal.ts';
import { simulateMany } from '../../src/ai/simulate.ts';
import { publicView } from '../../src/ai/view.ts';
import { STANDARD_DEX } from '../../src/data/index.ts';
import { Battle, TURN_LIMIT } from '../../src/engine/battle.ts';
import type { MonsterSet } from '../../src/engine/model.ts';

const set = (species: string, moves: string[], ability?: string): MonsterSet => ({
  species,
  ability: ability ?? STANDARD_DEX.species(species).abilities[0] ?? '',
  moves,
  nature: 'ausgeglichen',
  evs: {},
  ivs: {},
});

function start(teams: [MonsterSet[], MonsterSet[]], format = 'singles-standard'): Battle {
  const battle = Battle.create({
    dex: STANDARD_DEX,
    formatId: format,
    seed: 'normal-test',
    sides: [
      { name: 'A', team: teams[0] },
      { name: 'B', team: teams[1] },
    ],
  });
  for (const side of [0, 1] as const) {
    const request = battle.getRequest(side);
    if (request.type === 'teamPreview') {
      battle.choose(side, {
        type: 'teamPreview',
        order: request.team.map((_, i) => i).slice(0, request.pick),
      });
    }
  }
  return battle;
}

describe('KI „Normal“', () => {
  it('schlägt die KI „Leicht“ deutlich und läuft fehlerfrei', () => {
    const report = simulateMany({
      dex: STANDARD_DEX,
      formatId: 'doubles-standard',
      battles: 300,
      seedPrefix: 'normal-vs-easy',
      agents: [normalAgent, easyAgent],
    });
    expect(report.errors).toEqual([]);
    expect(report.wins[0]).toBeGreaterThan(300 * 0.75);
  });

  it('spielt gegen sich selbst ohne Endlosschleifen (auch Einzel)', () => {
    for (const formatId of ['doubles-standard', 'singles-standard', 'doubles-free']) {
      const report = simulateMany({
        dex: STANDARD_DEX,
        formatId,
        battles: 100,
        seedPrefix: `normal-mirror-${formatId}`,
        agents: [normalAgent, normalAgent],
      });
      expect(report.errors, formatId).toEqual([]);
      expect(report.turns.max).toBeLessThan(TURN_LIMIT);
    }
  });

  it('schätzt Schaden mit Essenzen und Immunitäten', () => {
    const battle = start([
      [set('pyrrax', ['flammenwoge', 'bodenwelle', 'wyrmatem', 'sengstrahl'])],
      [set('moosbock', ['rankenpeitsche'])],
    ]);
    const view = publicView(battle, 0);
    const user = view.own[0];
    const foe = view.foes[0];
    if (!user || !foe) throw new Error('Monster fehlen');
    const fire = estimateDamage(STANDARD_DEX, view, user, foe, STANDARD_DEX.move('sengstrahl'));
    const dragon = estimateDamage(STANDARD_DEX, view, user, foe, STANDARD_DEX.move('wyrmatem'));
    expect(fire).toBeGreaterThan(dragon);
    // Erde gegen Wind ist wirkungslos.
    const flyer = start([[set('pyrrax', ['bodenwelle'])], [set('voltrabe', ['donnerpuls'])]]);
    const flyerView = publicView(flyer, 0);
    const flyerUser = flyerView.own[0];
    const flyerFoe = flyerView.foes[0];
    if (!flyerUser || !flyerFoe) throw new Error('Monster fehlen');
    expect(
      estimateDamage(STANDARD_DEX, flyerView, flyerUser, flyerFoe, STANDARD_DEX.move('bodenwelle')),
    ).toBe(0);
  });

  it('wählt im Einzel die stärkste wirksame Attacke', () => {
    const battle = start([
      [set('pyrrax', ['prankenhieb', 'sengstrahl', 'bodenwelle', 'kreischen'])],
      [set('moosbock', ['rankenpeitsche'])],
    ]);
    const request = battle.getRequest(0);
    if (request.type !== 'move') throw new Error(request.type);
    const choice = normalAgent.choose(request, {
      side: 0,
      dex: STANDARD_DEX,
      rng: { float: () => 0.5 } as never,
      validTargets: (position, target) => battle.validTargets(0, position, target),
      view: () => publicView(battle, 0),
    });
    expect(choice).toMatchObject({ type: 'move', actions: [{ type: 'move', move: 1 }] });
  });

  it('die öffentliche Sicht zeigt nur gesehene Gegner und keine gegnerischen Sets', () => {
    const battle = start([
      [set('pyrrax', ['sengstrahl']), set('gischtel', ['wasserpeitsche'])],
      [set('moosbock', ['rankenpeitsche']), set('voltrabe', ['donnerpuls'])],
    ]);
    const view = publicView(battle, 0);
    expect(view.own).toHaveLength(2);
    expect(view.foes.map((foe) => foe.species)).toEqual(['moosbock']);
    const foe = view.foes[0];
    expect(foe).not.toHaveProperty('moves');
    expect(foe).not.toHaveProperty('stats');
    expect(foe).not.toHaveProperty('item');
  });
});
