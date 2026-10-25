import type { AbilityData } from '../engine/dex.ts';
import type { EffectHooks } from '../engine/effects.ts';
import type { TypeId } from '../engine/model.ts';

/** Fähigkeiten. Hooks siehe `src/engine/effects.ts`. Weitere folgen in Phase 2. */

/** Notlage-Verstärker: Attacken einer Essenz ×1,5, solange die LP bei höchstens 1/3 liegen. */
function pinchBoost(id: string, name: string, type: TypeId, typeName: string): AbilityData {
  return {
    id,
    name,
    description: `Bei höchstens 1/3 der LP sind ${typeName}-Attacken 1,5-mal so stark.`,
    onModifyAttackStat(_ctx, holder, _target, move) {
      return move.type === type && holder.hp * 3 <= holder.maxHp ? 1.5 : undefined;
    },
  };
}

/** Immunität gegen eine Essenz. */
function typeImmunity(type: TypeId): NonNullable<EffectHooks['onCheckImmunity']> {
  return (_ctx, _holder, _attacker, move) =>
    move.type === type && move.category !== 'status' ? true : undefined;
}

export const ABILITIES: readonly AbilityData[] = [
  pinchBoost('glutherz', 'Glutherz', 'ember', 'Glut'),
  pinchBoost('tiefenzorn', 'Tiefenzorn', 'tide', 'Flut'),
  pinchBoost('wildwuchs', 'Wildwuchs', 'flora', 'Flora'),
  {
    id: 'drohkulisse',
    name: 'Drohkulisse',
    description: 'Beim Einwechseln sinkt der Angriff aller Gegner um eine Stufe.',
    onSwitchIn(ctx, holder) {
      const foes = ctx.activeFoes(holder);
      if (foes.length === 0) return;
      ctx.showAbility(holder);
      for (const foe of foes) ctx.boost(foe, { atk: -1 }, holder);
    },
  },
  {
    id: 'schwebend',
    name: 'Schwebend',
    description: 'Schwebt über dem Boden: immun gegen Erde-Attacken.',
    onCheckImmunity: typeImmunity('earth'),
  },
  {
    id: 'blitzfaenger',
    name: 'Blitzfänger',
    description: 'Fängt Funke-Attacken ab, ist immun dagegen und erhöht dabei den eigenen Fokus.',
    onCheckImmunity: typeImmunity('spark'),
    onImmunityTriggered(ctx, holder) {
      ctx.boost(holder, { spa: 1 }, holder);
    },
  },
  {
    id: 'siegesrausch',
    name: 'Siegesrausch',
    description: 'Nach jedem besiegten Monster steigt der eigene Angriff um eine Stufe.',
    onAfterKO(ctx, holder) {
      ctx.showAbility(holder);
      ctx.boost(holder, { atk: 1 }, holder);
    },
  },
  {
    id: 'scharfsinn',
    name: 'Scharfsinn',
    description: 'Erkennt Schwachstellen: Volltreffer-Stufe +1.',
    onModifyCritStage(_ctx, _holder, _move, stage) {
      return stage + 1;
    },
  },
  {
    id: 'rueckstossfrei',
    name: 'Rückstoßfrei',
    description: 'Erleidet keinen Rückstoß durch eigene Attacken.',
    onModifyRecoil() {
      return 0;
    },
  },
  {
    id: 'kettenlaeufer',
    name: 'Kettenläufer',
    description: 'Mehrfachangriffe treffen immer so oft wie möglich.',
    onModifyHitCount(_ctx, _holder, move, hits) {
      return typeof move.multihit === 'object' ? move.multihit[1] : hits;
    },
  },
  {
    id: 'wucht',
    name: 'Wucht',
    description: 'Attacken mit Stärke 60 oder weniger sind 1,5-mal so stark.',
    onModifyBasePower(_ctx, _holder, _target, _move, power) {
      return power <= 60 ? 1.5 : undefined;
    },
  },
  {
    id: 'dickhaut',
    name: 'Dickhaut',
    description: 'Sehr effektive Attacken richten nur 3/4 des Schadens an.',
    onModifyDamageTaken(_ctx, _holder, _attacker, _move, effectiveness) {
      return effectiveness > 1 ? 0.75 : undefined;
    },
  },
];
