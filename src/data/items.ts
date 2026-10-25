import type { ItemData } from '../engine/dex.ts';
import type { BattleContext } from '../engine/effects.ts';
import type { TypeId } from '../engine/model.ts';
import type { Mon } from '../engine/state.ts';

/** Items (SPEC 3.6). Item-Klausel als Format-Option; Namenslogik siehe LORE.md. */

const itemEffect = (id: string) => ({ kind: 'item' as const, id });

/** Fix-Item: ein Wert ×1,5, aber festgelegt auf die erste eingesetzte Attacke. */
function choiceItem(
  id: string,
  name: string,
  stat: 'atk' | 'spa' | 'spe',
  statName: string,
): ItemData {
  return {
    id,
    name,
    description: `${statName} ×1,5 – aber nur die zuerst eingesetzte Attacke ist wählbar, bis zum Auswechseln.`,
    onModifyAttackStat(_ctx, _holder, _target, move) {
      if (stat === 'atk' && move.category === 'physical') return 1.5;
      if (stat === 'spa' && move.category === 'special') return 1.5;
      return undefined;
    },
    onModifySpeed() {
      return stat === 'spe' ? 1.5 : undefined;
    },
    onAfterMove(ctx, holder, move) {
      if (move.unlearnable) return;
      ctx.addVolatile(holder, 'choicelock', holder, { move: move.id });
    },
  };
}

/** Wetter-Verlängerer: die Wirkung steckt in den Zustandsdaten (`extendedBy`). */
function weatherStone(id: string, name: string, weatherName: string): ItemData {
  return {
    id,
    name,
    description: `Vom Träger ausgelöstes Wetter „${weatherName}“ hält 8 statt 5 Runden.`,
  };
}

/** Typ-Verstärker ×1,2. */
function typeBooster(id: string, name: string, type: TypeId, typeName: string): ItemData {
  return {
    id,
    name,
    description: `${typeName}-Attacken sind 1,2-mal so stark.`,
    onModifyBasePower(_ctx, _holder, _target, move) {
      return move.type === type ? 1.2 : undefined;
    },
  };
}

/** Typ-Resist-Beere: halbiert einmalig einen sehr effektiven Treffer dieser Essenz. */
function resistBerry(id: string, name: string, type: TypeId, typeName: string): ItemData {
  const applies = (ctx: BattleContext, holder: Mon, moveType: TypeId, effectiveness: number) =>
    moveType === type && effectiveness > 1 && ctx.canUseBerry(holder);
  return {
    id,
    name,
    description: `Halbiert einmalig den Schaden eines sehr effektiven ${typeName}-Treffers.`,
    onModifyDamageTaken(ctx, holder, _attacker, move, effectiveness) {
      return applies(ctx, holder, move.type, effectiveness) ? 0.5 : undefined;
    },
    onDamagingHitTaken(ctx, holder, _attacker, move) {
      if (applies(ctx, holder, move.type, ctx.effectiveness(move.type, holder)))
        ctx.useItem(holder, true);
    },
  };
}

export const ITEMS: readonly ItemData[] = [
  // ── Offensiv ──
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
      ctx.damage(
        holder,
        Math.max(1, Math.floor(holder.maxHp / 10)),
        'effect',
        undefined,
        itemEffect('lebenskristall'),
      );
    },
  },
  choiceItem('fixband', 'Fixband', 'atk', 'Angriff'),
  choiceItem('fixbrille', 'Fixbrille', 'spa', 'Fokus'),
  choiceItem('fixschal', 'Fixschal', 'spe', 'Initiative'),
  {
    id: 'schaerflinse',
    name: 'Schärflinse',
    description: 'Volltreffer-Stufe +1.',
    onModifyCritStage(_ctx, _holder, _move, stage) {
      return stage + 1;
    },
  },
  typeBooster('glutkern', 'Glutkern', 'ember', 'Glut'),
  typeBooster('tiefenperle', 'Tiefenperle', 'tide', 'Flut'),
  typeBooster('blitzspule', 'Blitzspule', 'spark', 'Funke'),
  typeBooster('frostsplitter', 'Frostsplitter', 'frost', 'Frost'),

  // ── Defensiv ──
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
    id: 'kampfweste',
    name: 'Kampfweste',
    description: 'Wille ×1,5, aber nur Schadensattacken sind wählbar.',
    onModifyDefenseStat(_ctx, _holder, _attacker, move) {
      return move.category === 'special' ? 1.5 : undefined;
    },
    onDisableMove(_ctx, _holder, move) {
      return move.category === 'status';
    },
  },
  {
    id: 'dornenhelm',
    name: 'Dornenhelm',
    description: 'Wer mit Kontakt angreift, verliert 1/6 seiner LP.',
    onDamagingHitTaken(ctx, _holder, attacker, move) {
      if (!move.flags.contact || attacker.hp <= 0) return;
      ctx.damage(
        attacker,
        Math.max(1, Math.floor(attacker.maxHp / 6)),
        'effect',
        undefined,
        itemEffect('dornenhelm'),
      );
    },
  },
  {
    id: 'sturmbrille',
    name: 'Sturmbrille',
    description: 'Schützt vor Wetterschaden sowie vor Pulver- und Sporen-Attacken.',
    onCheckImmunity(_ctx, _holder, _attacker, move) {
      return move.flags.powder ? true : undefined;
    },
  },
  {
    id: 'klaerkraut',
    name: 'Klärkraut',
    description: 'Setzt gesenkte Werte einmalig sofort zurück.',
    onAfterBoost(ctx, holder, changes) {
      if (!Object.values(changes).some((delta) => delta < 0)) return;
      ctx.useItem(holder, true);
      for (const stat of Object.keys(holder.boosts) as (keyof typeof holder.boosts)[]) {
        if (holder.boosts[stat] < 0) holder.boosts[stat] = 0;
      }
    },
  },

  // ── Heilung ──
  {
    id: 'moosherz',
    name: 'Moosherz',
    description: 'Heilt am Ende jeder Runde 1/16 der maximalen LP.',
    onResidual(ctx, holder) {
      ctx.heal(
        holder,
        Math.max(1, Math.floor(holder.maxHp / 16)),
        'effect',
        itemEffect('moosherz'),
      );
    },
  },
  {
    id: 'faulherz',
    name: 'Faulherz',
    description: 'Gift-Monster heilen am Rundenende 1/16 der LP, alle anderen verlieren 1/8.',
    onResidual(ctx, holder) {
      if (holder.types.includes('venom')) {
        ctx.heal(
          holder,
          Math.max(1, Math.floor(holder.maxHp / 16)),
          'effect',
          itemEffect('faulherz'),
        );
      } else {
        ctx.damage(
          holder,
          Math.max(1, Math.floor(holder.maxHp / 8)),
          'effect',
          undefined,
          itemEffect('faulherz'),
        );
      }
    },
  },
  {
    id: 'rotbeere',
    name: 'Rotbeere',
    description:
      'Heilt einmalig 1/4 der maximalen LP, sobald die LP auf die Hälfte oder darunter fallen.',
    onAfterDamageTaken(ctx, holder) {
      if (holder.hp <= 0 || holder.hp * 2 > holder.maxHp || !ctx.canUseBerry(holder)) return;
      ctx.useItem(holder, true);
      ctx.heal(holder, Math.floor(holder.maxHp / 4), 'effect', itemEffect('rotbeere'));
    },
  },
  {
    id: 'klarbeere',
    name: 'Klarbeere',
    description: 'Heilt einmalig sofort jedes Statusproblem und Wirrsinn.',
    onAfterSetStatus(ctx, holder) {
      if (!ctx.canUseBerry(holder)) return;
      ctx.useItem(holder, true);
      ctx.cureStatus(holder);
    },
    onTryAddVolatile(ctx, holder, id) {
      if (id !== 'confusion' || !ctx.canUseBerry(holder)) return undefined;
      ctx.useItem(holder, true);
      return false;
    },
  },
  resistBerry('kuehlbeere', 'Kühlbeere', 'ember', 'Glut'),
  resistBerry('duerrbeere', 'Dürrbeere', 'tide', 'Flut'),
  resistBerry('borkenbeere', 'Borkenbeere', 'flora', 'Flora'),
  resistBerry('erdungsbeere', 'Erdungsbeere', 'spark', 'Funke'),
  resistBerry('gluehbeere', 'Glühbeere', 'frost', 'Frost'),
  resistBerry('wurzelbeere', 'Wurzelbeere', 'earth', 'Erde'),
  resistBerry('polsterbeere', 'Polsterbeere', 'brawl', 'Faust'),
  resistBerry('lichtbeere', 'Lichtbeere', 'shadow', 'Schatten'),

  // ── Wetter und Felder ──
  weatherStone('glutstein', 'Glutstein', 'Gleißsonne'),
  weatherStone('regenstein', 'Regenstein', 'Sturmregen'),
  weatherStone('staubstein', 'Staubstein', 'Staubsturm'),
  weatherStone('froststein', 'Froststein', 'Eisgestöber'),
  {
    id: 'feldkristall',
    name: 'Feldkristall',
    description: 'Vom Träger erzeugte Felder halten 8 statt 5 Runden.',
  },
];
