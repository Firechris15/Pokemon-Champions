import type { ItemData } from '../engine/dex.ts';

/** Items. Der volle Umfang (≥ 30) folgt in Phase 2. */
export const ITEMS: readonly ItemData[] = [
  {
    id: 'lebenskristall',
    name: 'Lebenskristall',
    description:
      'Schadensattacken richten 30 % mehr Schaden an; der Träger verliert dafür 1/10 seiner LP.',
    onModifyDamageDealt() {
      return 1.3;
    },
    onAfterMove(ctx, holder, move, damageDealt) {
      if (move.category === 'status' || damageDealt <= 0) return;
      ctx.damage(holder, Math.max(1, Math.floor(holder.maxHp / 10)), 'item', undefined, {
        kind: 'item',
        id: 'lebenskristall',
      });
    },
  },
  {
    id: 'moosherz',
    name: 'Moosherz',
    description: 'Heilt am Ende jeder Runde 1/16 der maximalen LP.',
    onResidual(ctx, holder) {
      if (holder.hp >= holder.maxHp) return;
      ctx.heal(holder, Math.max(1, Math.floor(holder.maxHp / 16)), 'item', {
        kind: 'item',
        id: 'moosherz',
      });
    },
  },
  {
    id: 'ankerband',
    name: 'Ankerband',
    description: 'Übersteht mit vollen LP einen sonst tödlichen Treffer mit 1 LP. Einmalig.',
    onBeforeDamageTaken(ctx, holder, damage) {
      if (holder.hp !== holder.maxHp || damage < holder.hp) return undefined;
      ctx.useItem(holder, true);
      return holder.hp - 1;
    },
  },
  {
    id: 'rotbeere',
    name: 'Rotbeere',
    description:
      'Heilt einmalig 1/4 der maximalen LP, sobald die LP auf die Hälfte oder darunter fallen.',
    onAfterDamageTaken(ctx, holder) {
      if (holder.hp <= 0 || holder.hp * 2 > holder.maxHp) return;
      ctx.useItem(holder, true);
      ctx.heal(holder, Math.floor(holder.maxHp / 4), 'item', { kind: 'item', id: 'rotbeere' });
    },
  },
];
