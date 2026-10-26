/**
 * Übersetzt Engine-Ereignisse in Kampflog-Zeilen. Rein funktional und ohne Svelte,
 * damit Kampf-Bildschirm, Replays und Tests denselben Text erzeugen.
 */
import type { Dex } from '../engine/dex.ts';
import type { BattleEvent, EffectRef } from '../engine/events.ts';
import type { BoostId, MonRef, SideIndex } from '../engine/model.ts';
import type { MessageKey, MessageParams } from '../i18n/types.ts';

export type LogKind = 'turn' | 'action' | 'detail' | 'result';

export interface LogLine {
  kind: LogKind;
  text: string;
}

export interface LogContext {
  t(key: MessageKey, params?: MessageParams): string;
  monName(mon: MonRef): string;
  /** Name ohne Zusatz wie „(Gegner)“ – für Sätze, die die Seite schon nennen. */
  plainName?(mon: MonRef): string;
  sideName(side: SideIndex): string;
  moveName(id: string): string;
  /** Name einer Fähigkeit, eines Items oder eines Zustands. */
  effectName(effect: EffectRef): string;
  /** Ist der Seiteneffekt eine Falle (anderer Satz als bei Schutz-Effekten)? */
  isHazard(condition: string): boolean;
  /** Aus Sicht dieser Seite erzählen („Los, Pyrrax!“ statt „Team A schickt …“). */
  perspective?: SideIndex;
}

/** Namen aus dem Datenbestand für den Kampflog (Attacken, Fähigkeiten, Items, Zustände). */
export function dexNames(dex: Dex): Pick<LogContext, 'moveName' | 'effectName' | 'isHazard'> {
  return {
    moveName: (id) => dex.move(id).name,
    effectName: (effect) => {
      if (effect.kind === 'ability') return dex.ability(effect.id).name;
      if (effect.kind === 'item') return dex.item(effect.id).name;
      return dex.condition(effect.id).name;
    },
    isHazard: (id) => dex.condition(id).hazard === true,
  };
}

/** Ordnet IDs ihren Textschlüsseln zu; unbekannte IDs nutzen den allgemeinen Satz. */
function pick(
  keys: Partial<Record<string, MessageKey>>,
  id: string,
  fallback: MessageKey,
): MessageKey {
  return keys[id] ?? fallback;
}

const STATUS_SET: Partial<Record<string, MessageKey>> = {
  brn: 'log.statusSet.brn',
  par: 'log.statusSet.par',
  psn: 'log.statusSet.psn',
  tox: 'log.statusSet.tox',
  slp: 'log.statusSet.slp',
  frz: 'log.statusSet.frz',
};
const STATUS_CURE: Partial<Record<string, MessageKey>> = {
  brn: 'log.statusCure.brn',
  par: 'log.statusCure.par',
  psn: 'log.statusCure.psn',
  tox: 'log.statusCure.tox',
  slp: 'log.statusCure.slp',
  frz: 'log.statusCure.frz',
};
const CANT_MOVE: Partial<Record<string, MessageKey>> = {
  slp: 'log.cantMove.slp',
  frz: 'log.cantMove.frz',
  par: 'log.cantMove.par',
  flinch: 'log.cantMove.flinch',
  taunt: 'log.cantMove.taunt',
};
const VOLATILE_START: Partial<Record<string, MessageKey>> = {
  confusion: 'log.volatileStart.confusion',
  taunt: 'log.volatileStart.taunt',
  encore: 'log.volatileStart.encore',
  substitute: 'log.volatileStart.substitute',
  focusenergy: 'log.volatileStart.focusenergy',
  bound: 'log.volatileStart.bound',
  curse: 'log.volatileStart.curse',
  trapped: 'log.volatileStart.trapped',
  protect: 'log.volatileStart.protect',
  followme: 'log.volatileStart.followme',
  helpinghand: 'log.volatileStart.helpinghand',
  gluthunger: 'log.volatileStart.gluthunger',
};
const VOLATILE_END: Partial<Record<string, MessageKey>> = {
  confusion: 'log.volatileEnd.confusion',
  taunt: 'log.volatileEnd.taunt',
  encore: 'log.volatileEnd.encore',
  substitute: 'log.volatileEnd.substitute',
  bound: 'log.volatileEnd.bound',
};
const WEATHER_START: Partial<Record<string, MessageKey>> = {
  gleisssonne: 'log.weatherStart.gleisssonne',
  sturmregen: 'log.weatherStart.sturmregen',
  staubsturm: 'log.weatherStart.staubsturm',
  eisgestoeber: 'log.weatherStart.eisgestoeber',
};
const WEATHER_END: Partial<Record<string, MessageKey>> = {
  gleisssonne: 'log.weatherEnd.gleisssonne',
  sturmregen: 'log.weatherEnd.sturmregen',
  staubsturm: 'log.weatherEnd.staubsturm',
  eisgestoeber: 'log.weatherEnd.eisgestoeber',
};

function percent(amount: number, maxHp: number): number {
  return Math.max(1, Math.round((amount / maxHp) * 100));
}

function statLine(
  ctx: LogContext,
  target: MonRef,
  stat: BoostId,
  change: number,
  attempted: number,
): string {
  const params = { name: ctx.monName(target), stat: ctx.t(`stats.${stat}`) };
  if (change === 0) return ctx.t(attempted > 0 ? 'log.statMax' : 'log.statMin', params);
  if (change >= 2) return ctx.t('log.statUpSharp', params);
  if (change > 0) return ctx.t('log.statUp', params);
  if (change <= -2) return ctx.t('log.statDownSharp', params);
  return ctx.t('log.statDown', params);
}

export function formatEvent(event: BattleEvent, ctx: LogContext): LogLine | null {
  const line = (kind: LogKind, key: MessageKey, params?: MessageParams): LogLine => ({
    kind,
    text: ctx.t(key, params),
  });
  switch (event.type) {
    case 'battle_start':
      return line('result', 'log.battleStart');
    case 'team_preview':
    case 'turn_end':
      return null;
    case 'turn_start':
      return line('turn', 'log.turn', { turn: event.turn });
    case 'switch_in':
      if (ctx.perspective !== undefined) {
        return line(
          'action',
          event.mon.side === ctx.perspective ? 'log.switchInSelf' : 'log.switchInFoe',
          { name: ctx.plainName?.(event.mon) ?? ctx.monName(event.mon) },
        );
      }
      return line('action', 'log.switchIn', {
        side: ctx.sideName(event.mon.side),
        name: ctx.monName(event.mon),
      });
    case 'switch_out':
      if (ctx.perspective !== undefined) {
        return line(
          'action',
          event.mon.side === ctx.perspective ? 'log.switchOutSelf' : 'log.switchOutFoe',
          { name: ctx.plainName?.(event.mon) ?? ctx.monName(event.mon) },
        );
      }
      return line('action', 'log.switchOut', { name: ctx.monName(event.mon) });
    case 'move_used':
      return line('action', 'log.move', {
        name: ctx.monName(event.mon),
        move: ctx.moveName(event.move),
      });
    case 'move_failed':
      return line('detail', event.reason === 'noTarget' ? 'log.noTarget' : 'log.noEffect');
    case 'miss':
      return line('detail', 'log.miss', {
        name: ctx.monName(event.mon),
        target: ctx.monName(event.target),
      });
    case 'immune':
      return event.by
        ? line('detail', 'log.immuneBy', {
            target: ctx.monName(event.target),
            effect: ctx.effectName(event.by),
          })
        : line('detail', 'log.immune', { target: ctx.monName(event.target) });
    case 'crit':
      return line('detail', 'log.crit');
    case 'effectiveness':
      return line('detail', event.multiplier > 1 ? 'log.superEffective' : 'log.notVeryEffective');
    case 'damage': {
      const params = {
        name: ctx.monName(event.target),
        percent: percent(event.amount, event.maxHp),
      };
      if (event.effect)
        return line('detail', 'log.effectDamage', {
          ...params,
          effect: ctx.effectName(event.effect),
        });
      return line('detail', event.cause === 'recoil' ? 'log.recoil' : 'log.damage', params);
    }
    case 'heal': {
      const params = {
        name: ctx.monName(event.target),
        percent: percent(event.amount, event.maxHp),
      };
      if (event.effect)
        return line('detail', 'log.effectHeal', {
          ...params,
          effect: ctx.effectName(event.effect),
        });
      return line('detail', 'log.heal', params);
    }
    case 'stat_change':
      return {
        kind: 'detail',
        text: statLine(ctx, event.target, event.stat, event.change, event.attempted),
      };
    case 'hit_count':
      return line('detail', 'log.hits', { count: event.hits });
    case 'faint':
      return line('action', 'log.faint', { name: ctx.monName(event.mon) });
    case 'ability':
      return line('detail', 'log.ability', {
        name: ctx.monName(event.mon),
        effect: ctx.effectName({ kind: 'ability', id: event.ability }),
      });
    case 'item':
      return line('detail', 'log.item', {
        name: ctx.monName(event.mon),
        effect: ctx.effectName({ kind: 'item', id: event.item }),
      });
    case 'forfeit':
      if (ctx.perspective !== undefined)
        return line(
          'result',
          event.side === ctx.perspective ? 'log.forfeitSelf' : 'log.forfeitFoe',
        );
      return line('result', 'log.forfeit', { side: ctx.sideName(event.side) });
    case 'battle_end':
      if (event.reason === 'turnLimit') return line('result', 'log.turnLimit');
      if (event.winner === null) return line('result', 'log.tie');
      if (ctx.perspective !== undefined)
        return line('result', event.winner === ctx.perspective ? 'log.winSelf' : 'log.winFoe');
      return line('result', 'log.win', { side: ctx.sideName(event.winner) });
    case 'status_set':
      return line('detail', pick(STATUS_SET, event.status, 'log.volatileStart.generic'), {
        name: ctx.monName(event.mon),
        condition: ctx.effectName({ kind: 'status', id: event.status }),
      });
    case 'status_cure':
      return line('detail', pick(STATUS_CURE, event.status, 'log.volatileEnd.generic'), {
        name: ctx.monName(event.mon),
        condition: ctx.effectName({ kind: 'status', id: event.status }),
      });
    case 'cant_move':
      return line('action', pick(CANT_MOVE, event.reason, 'log.cantMove.generic'), {
        name: ctx.monName(event.mon),
      });
    case 'volatile_start':
      return line('detail', pick(VOLATILE_START, event.volatile, 'log.volatileStart.generic'), {
        name: ctx.monName(event.mon),
        condition: ctx.effectName({ kind: 'volatile', id: event.volatile }),
      });
    case 'volatile_end':
      return line('detail', pick(VOLATILE_END, event.volatile, 'log.volatileEnd.generic'), {
        name: ctx.monName(event.mon),
        condition: ctx.effectName({ kind: 'volatile', id: event.volatile }),
      });
    case 'side_start': {
      const hazard = ctx.isHazard(event.condition);
      const condition = ctx.effectName({ kind: 'side', id: event.condition });
      if (ctx.perspective !== undefined) {
        const self = event.side === ctx.perspective;
        const key: MessageKey = hazard
          ? self
            ? 'log.sideHazardSelf'
            : 'log.sideHazardFoe'
          : self
            ? 'log.sideBuffSelf'
            : 'log.sideBuffFoe';
        return line('detail', key, { condition });
      }
      return line('detail', hazard ? 'log.sideHazard' : 'log.sideBuff', {
        side: ctx.sideName(event.side),
        condition,
      });
    }
    case 'side_end': {
      const condition = ctx.effectName({ kind: 'side', id: event.condition });
      if (ctx.perspective !== undefined) {
        return line(
          'detail',
          event.side === ctx.perspective ? 'log.sideEndSelf' : 'log.sideEndFoe',
          { condition },
        );
      }
      return line('detail', 'log.sideEnd', { side: ctx.sideName(event.side), condition });
    }
    case 'weather_start':
      return line('action', pick(WEATHER_START, event.weather, 'log.weatherStart.generic'), {
        condition: ctx.effectName({ kind: 'weather', id: event.weather }),
      });
    case 'weather_end':
      return line('detail', pick(WEATHER_END, event.weather, 'log.weatherEnd.generic'), {
        condition: ctx.effectName({ kind: 'weather', id: event.weather }),
      });
    case 'terrain_start':
      return line('action', 'log.terrainStart', {
        condition: ctx.effectName({ kind: 'terrain', id: event.terrain }),
      });
    case 'terrain_end':
      return line('detail', 'log.terrainEnd', {
        condition: ctx.effectName({ kind: 'terrain', id: event.terrain }),
      });
    case 'field_start':
      return line('action', 'log.fieldStart', {
        condition: ctx.effectName({ kind: 'field', id: event.field }),
      });
    case 'field_end':
      return line('detail', 'log.fieldEnd', {
        condition: ctx.effectName({ kind: 'field', id: event.field }),
      });
    case 'protected':
      return event.by && event.by.kind !== 'volatile'
        ? line('detail', 'log.protectedBy', {
            name: ctx.monName(event.target),
            effect: ctx.effectName(event.by),
          })
        : line('detail', 'log.protected', { name: ctx.monName(event.target) });
    case 'substitute_damage':
      return line('detail', 'log.substituteDamage', { name: ctx.monName(event.target) });
    case 'charge':
      return line('action', 'log.charge', {
        name: ctx.monName(event.mon),
        move: ctx.moveName(event.move),
      });
    case 'swap':
      return line('action', 'log.swap', {
        a: ctx.monName(event.mons[0]),
        b: ctx.monName(event.mons[1]),
      });
    case 'confusion_hit':
      return line('detail', 'log.confusionHit', { name: ctx.monName(event.mon) });
  }
}
