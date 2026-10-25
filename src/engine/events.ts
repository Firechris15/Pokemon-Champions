/**
 * Ereignisse, die die Engine ausgibt. Renderer, Kampflog und Replays spielen nur diese ab –
 * sie enthalten IDs statt Texten (Texte entstehen in der UI über i18n).
 */
import type { BoostId, MonRef, SideIndex } from './model.ts';

/** `effect` = Schaden durch einen Effekt (Item, Fähigkeit, Status, Wetter, Falle …), siehe `effect`-Feld. */
export type DamageCause = 'move' | 'recoil' | 'confusion' | 'effect';
export type HealCause = 'move' | 'drain' | 'effect';
export type FailReason = 'noTarget' | 'noEffect';
export type EndReason = 'knockout' | 'forfeit' | 'turnLimit';
export type EffectKind =
  'ability' | 'item' | 'status' | 'volatile' | 'side' | 'weather' | 'terrain' | 'field';
export interface EffectRef {
  kind: EffectKind;
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
  | { type: 'status_set'; mon: MonRef; status: string; source?: MonRef }
  | { type: 'status_cure'; mon: MonRef; status: string }
  /** Kann nicht handeln; `reason` ist die ID des verhindernden Zustands. */
  | { type: 'cant_move'; mon: MonRef; reason: string }
  | { type: 'volatile_start'; mon: MonRef; volatile: string; source?: MonRef }
  | { type: 'volatile_end'; mon: MonRef; volatile: string }
  | { type: 'side_start'; side: SideIndex; condition: string; layers?: number }
  | { type: 'side_end'; side: SideIndex; condition: string }
  | { type: 'weather_start'; weather: string; turns: number; source?: MonRef }
  | { type: 'weather_end'; weather: string }
  | { type: 'terrain_start'; terrain: string; turns: number; source?: MonRef }
  | { type: 'terrain_end'; terrain: string }
  | { type: 'field_start'; field: string; turns: number }
  | { type: 'field_end'; field: string }
  | { type: 'protected'; target: MonRef; by?: EffectRef }
  | { type: 'substitute_damage'; target: MonRef; amount: number }
  | { type: 'charge'; mon: MonRef; move: string }
  | { type: 'swap'; side: SideIndex; positions: [number, number]; mons: [MonRef, MonRef] }
  | { type: 'confusion_hit'; mon: MonRef }
  | { type: 'turn_end'; turn: number }
  | { type: 'forfeit'; side: SideIndex }
  | { type: 'battle_end'; winner: SideIndex | null; reason: EndReason };

export type BattleEventType = BattleEvent['type'];
