import { describe, expect, it } from 'vitest';
import type { AgentContext } from '../../src/ai/agent.ts';
import { easyAgent } from '../../src/ai/easy.ts';
import { normalAgent } from '../../src/ai/normal.ts';
import { publicView } from '../../src/ai/view.ts';
import { STANDARD_DEX } from '../../src/data/index.ts';
import { Rng } from '../../src/engine/rng.ts';
import { de } from '../../src/i18n/de.ts';
import { translate } from '../../src/i18n/translate.ts';
import { randomTeam } from '../../src/teams/random.ts';
import { dexNames, formatEvent, type LogContext } from '../../src/ui/battleLog.ts';
import { BattleController, PLAYER } from '../../src/ui/battle/controller.ts';
import { applyEvent, emptyView, syncView, type BattleView } from '../../src/ui/battle/viewModel.ts';

const dex = STANDARD_DEX;

function controllerFor(formatId: string, seed: string): BattleController {
  const format = dex.format(formatId);
  const rng = Rng.fromSeed(`${seed}:teams`);
  return new BattleController({
    dex,
    formatId,
    seed,
    teams: [randomTeam(dex, format, rng), randomTeam(dex, format, rng)],
    agent: normalAgent,
    names: ['Du', 'Gegner'],
  });
}

/** Vergleichbare Kurzfassung: aktive Positionen, LP, Status, K.O. (nur Monster aus `known`). */
function summary(view: BattleView, known: BattleView = view) {
  return view.sides.map((side, s) => ({
    // Besiegte bleiben im Sichtmodell bis zum Ersatz stehen (K.O.-Animation), die Engine räumt sofort.
    active: side.active.map((index) =>
      index !== null && side.mons[index]?.fainted === true ? null : index,
    ),
    mons: Object.values(side.mons)
      .filter((mon) => (known.sides[s]?.mons[mon.index] ?? null) !== null)
      .map((mon) => ({
        index: mon.index,
        hp: mon.hp,
        status: mon.status,
        fainted: mon.fainted,
      })),
  }));
}

describe('Kampf-Ablauf (Spieler gegen KI, ohne Oberfläche)', () => {
  it.each([
    ['doubles-standard', 60],
    ['singles-standard', 40],
    ['random-doubles', 40],
  ] as const)(
    '%s: %i Kämpfe laufen bis zum Ende, das Sichtmodell folgt der Engine',
    (formatId, battles) => {
      for (let i = 0; i < battles; i++) {
        const controller = controllerFor(formatId, `flow-${formatId}-${i}`);
        const view = emptyView(PLAYER, dex.format(formatId).activePerSide);
        const human: AgentContext = {
          side: PLAYER,
          dex,
          rng: Rng.fromSeed(`human-${i}`),
          validTargets: (position, target) =>
            controller.battle.validTargets(PLAYER, position, target),
          view: () => publicView(controller.battle, PLAYER),
        };
        let steps = 0;
        while (!controller.ended) {
          expect(steps++, 'keine Endlosschleife').toBeLessThan(800);
          const request = controller.request();
          for (const event of controller.takeEvents()) applyEvent(view, event, dex);
          if (controller.battle.ended) break;
          // Nach dem Abspielen stimmt das Sichtmodell mit der Engine überein.
          const fresh = emptyView(PLAYER, dex.format(formatId).activePerSide);
          syncView(fresh, controller.battle);
          // Das Ereignis-Modell kennt die eigene Bank erst nach dem Abgleich – verglichen wird,
          // was es kennt; die Oberfläche gleicht an jedem Entscheidungspunkt ab.
          expect(summary(view), `${formatId} #${i} Runde ${controller.battle.state.turn}`).toEqual(
            summary(fresh, view),
          );
          syncView(view, controller.battle);
          expect(request.type, 'Spieler muss gefragt werden').not.toBe('wait');
          if (request.type === 'wait') break;
          const result = controller.submit(easyAgent.choose(request, human));
          expect(result).toEqual({ ok: true });
        }
        for (const event of controller.takeEvents()) applyEvent(view, event, dex);
        expect(view.ended).toBe(true);
      }
    },
  );

  it('Aufgeben beendet den Kampf zugunsten der KI', () => {
    const controller = controllerFor('doubles-standard', 'forfeit');
    controller.request();
    controller.forfeit();
    expect(controller.ended).toBe(true);
    expect(controller.battle.winner).toBe(1);
  });

  it('erzählt aus Sicht des Spielers', () => {
    const t = (key: Parameters<LogContext['t']>[0], params?: Parameters<LogContext['t']>[1]) =>
      translate(de, key, params);
    const ctx: LogContext = {
      t,
      monName: (mon) => (mon.side === PLAYER ? 'Pyrrax' : 'Gischtel (Gegner)'),
      sideName: (side) => (side === PLAYER ? 'Du' : 'Gegner'),
      ...dexNames(dex),
      perspective: PLAYER,
    };
    const switchIn = (side: 0 | 1) =>
      formatEvent(
        {
          type: 'switch_in',
          mon: { side, index: 0 },
          position: 0,
          species: 'pyrrax',
          name: 'Pyrrax',
          level: 50,
          hp: 100,
          maxHp: 100,
        },
        ctx,
      )?.text;
    expect(switchIn(0)).toBe('Los, Pyrrax!');
    expect(switchIn(1)).toBe('Der Gegner schickt Gischtel (Gegner) in den Kampf!');
    expect(formatEvent({ type: 'battle_end', winner: 0, reason: 'knockout' }, ctx)?.text).toBe(
      'Du hast gewonnen!',
    );
    expect(
      formatEvent({ type: 'side_start', side: 1, condition: 'splitterfalle' }, ctx)?.text,
    ).toBe('Splitterfalle liegt jetzt auf der gegnerischen Seite!');
  });
});
