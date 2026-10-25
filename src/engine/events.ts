/**
 * Ereignisse, die die Engine ausgibt. Renderer, Kampflog und Replays spielen nur diese ab –
 * sie enthalten IDs statt Texten (Texte entstehen in der UI über i18n).
 */
import type { BoostId, MonRef, SideIndex } from './model.ts';

export type DamageCause = 'move' | 'recoil' | 'item' | 'ability' | 'residual';
export type HealCause = 'move' | 'drain' | 'item' | 'ability';
export type FailReason = 'noTarget' | 'noEffect';
export type EndReason = 'knockout' | 'forfeit' | 'turnLimit';
export interface EffectRef {
  kind: 'ability' | 'item';
  id: string;
}

export type BattleEvent =
  | { type: 'battle_start'; format: string; seed: string }
  | { type: 'team_preview'; pick: number }
  | { type: 'turn_start'; turn: number }
  | {
      type: 'switch_in';
      mon: MonRef;
      position: number;
      species: string;
      name: string;
      level: number;
      hp: number;
      maxHp: number;
    }
  | { type: 'switch_out'; mon: MonRef; position: number }
  | { type: 'move_used'; mon: MonRef; move: string; targets: MonRef[] }
  | { type: 'move_failed'; mon: MonRef; move: string; reason: FailReason }
  | { type: 'miss'; mon: MonRef; target: MonRef }
  | { type: 'immune'; target: MonRef; by?: EffectRef }
  | { type: 'crit'; target: MonRef }
  | { type: 'effectiveness'; target: MonRef; multiplier: number }
  | {
      type: 'damage';
      target: MonRef;
      amount: number;
      hp: number;
      maxHp: number;
      cause: DamageCause;
      source?: MonRef;
      effect?: EffectRef;
    }
  | {
      type: 'heal';
      target: MonRef;
      amount: number;
      hp: number;
      maxHp: number;
      cause: HealCause;
      effect?: EffectRef;
    }
  | {
      type: 'stat_change';
      target: MonRef;
      stat: BoostId;
      /** Tatsächliche Änderung (0 = kann nicht weiter steigen/sinken). */
      change: number;
      attempted: number;
      stage: number;
    }
  | { type: 'hit_count'; target: MonRef; hits: number }
  | { type: 'faint'; mon: MonRef }
  | { type: 'ability'; mon: MonRef; ability: string }
  | { type: 'item'; mon: MonRef; item: string; consumed: boolean }
  | { type: 'turn_end'; turn: number }
  | { type: 'forfeit'; side: SideIndex }
  | { type: 'battle_end'; winner: SideIndex | null; reason: EndReason };

export type BattleEventType = BattleEvent['type'];
