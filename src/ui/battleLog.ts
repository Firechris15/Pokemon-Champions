/**
 * Übersetzt Engine-Ereignisse in Kampflog-Zeilen. Rein funktional und ohne Svelte,
 * damit Kampf-Bildschirm, Replays und Tests denselben Text erzeugen.
 */
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
  sideName(side: SideIndex): string;
  moveName(id: string): string;
  effectName(effect: EffectRef): string;
}

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
      return line('action', 'log.switchIn', {
        side: ctx.sideName(event.mon.side),
        name: ctx.monName(event.mon),
      });
    case 'switch_out':
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
      return line('result', 'log.forfeit', { side: ctx.sideName(event.side) });
    case 'battle_end':
      if (event.reason === 'turnLimit') return line('result', 'log.turnLimit');
      return event.winner === null
        ? line('result', 'log.tie')
        : line('result', 'log.win', { side: ctx.sideName(event.winner) });
  }
}
