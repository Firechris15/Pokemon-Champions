import type { ConditionData } from '../engine/dex.ts';
import type { BattleContext } from '../engine/effects.ts';
import type { EffectRef } from '../engine/events.ts';
import type { MonRef, TypeId } from '../engine/model.ts';
import type { Mon } from '../engine/state.ts';

/**
 * Zustände (SPEC 3.5): Statusprobleme, flüchtige Zustände, Seiteneffekte, Wetter, Felder, Feldeffekte.
 * Eigene Namen siehe LORE.md. Die Engine kennt nur die IDs aus `ENGINE_CONDITIONS` direkt.
 */

const ref = (mon: Mon): MonRef => ({ side: mon.side, index: mon.index });
const fraction = (mon: Mon, num: number, den: number): number =>
  Math.max(1, Math.floor((mon.maxHp * num) / den));

function effectDamage(ctx: BattleContext, mon: Mon, amount: number, effect: EffectRef): void {
  ctx.damage(mon, amount, 'effect', undefined, effect);
}

function cantMove(ctx: BattleContext, mon: Mon, reason: string): false {
  ctx.log({ type: 'cant_move', mon: ref(mon), reason });
  return false;
}

function hasType(mon: Mon, types: readonly TypeId[]): boolean {
  return mon.types.some((type) => types.includes(type));
}

// ───────────────────────────── Statusprobleme ─────────────────────────────

const STATUS: ConditionData[] = [
  {
    id: 'brn',
    name: 'Brandmal',
    kind: 'status',
    description:
      'Verliert am Rundenende 1/16 der LP; physische Attacken richten nur halben Schaden an.',
    immuneTypes: ['ember'],
    onResidual(ctx, holder) {
      effectDamage(ctx, holder, fraction(holder, 1, 16), { kind: 'status', id: 'brn' });
    },
  },
  {
    id: 'par',
    name: 'Starre',
    kind: 'status',
    description: 'Initiative halbiert; in 25 % der Fälle kann das Monster nicht handeln.',
    immuneTypes: ['spark'],
    beforeMoveOrder: 1,
    onModifySpeed() {
      return 0.5;
    },
    onBeforeMove(ctx, holder) {
      return ctx.rng.chance(1, 4) ? cantMove(ctx, holder, 'par') : undefined;
    },
  },
  {
    id: 'psn',
    name: 'Toxin',
    kind: 'status',
    description: 'Verliert am Rundenende 1/8 der LP.',
    immuneTypes: ['venom', 'metal'],
    onResidual(ctx, holder) {
      effectDamage(ctx, holder, fraction(holder, 1, 8), { kind: 'status', id: 'psn' });
    },
  },
  {
    id: 'tox',
    name: 'Fäulnis',
    kind: 'status',
    description:
      'Schwere Vergiftung: 1/16, 2/16, 3/16 … der LP pro Runde. Setzt sich beim Auswechseln zurück.',
    immuneTypes: ['venom', 'metal'],
    onConditionStart(_ctx, _holder, state) {
      state.stage = 1;
      return true;
    },
    onResidual(ctx, holder) {
      const stage = holder.statusState.stage ?? 1;
      effectDamage(ctx, holder, fraction(holder, stage, 16), { kind: 'status', id: 'tox' });
      holder.statusState.stage = Math.min(15, stage + 1);
    },
    onSwitchOut(_ctx, holder) {
      if (holder.status === 'tox') holder.statusState.stage = 1;
    },
  },
  {
    id: 'slp',
    name: 'Schlummer',
    kind: 'status',
    description: 'Schläft 1–3 eigene Runden und kann so lange nicht handeln.',
    beforeMoveOrder: 10,
    onConditionStart(ctx, _holder, state) {
      state.turns = ctx.rng.int(1, 3);
      return true;
    },
    onBeforeMove(ctx, holder) {
      const turns = holder.statusState.turns ?? 0;
      if (turns <= 0) {
        ctx.cureStatus(holder);
        return undefined;
      }
      holder.statusState.turns = turns - 1;
      return cantMove(ctx, holder, 'slp');
    },
  },
  {
    id: 'frz',
    name: 'Frostbann',
    kind: 'status',
    description: 'Eingefroren: taut mit 20 % Chance pro Runde auf oder sofort durch Glut-Treffer.',
    immuneTypes: ['frost'],
    beforeMoveOrder: 9,
    onBeforeMove(ctx, holder) {
      if (ctx.rng.chance(1, 5)) {
        ctx.cureStatus(holder);
        return undefined;
      }
      return cantMove(ctx, holder, 'frz');
    },
    onDamagingHitTaken(ctx, holder, _attacker, move) {
      if (move.type === 'ember' && holder.status === 'frz' && holder.hp > 0) ctx.cureStatus(holder);
    },
  },
];

// ───────────────────────────── Flüchtige Zustände ─────────────────────────────

const VOLATILES: ConditionData[] = [
  {
    id: 'confusion',
    name: 'Wirrsinn',
    kind: 'volatile',
    description:
      'Für 2–5 Handlungen verwirrt: verletzt sich mit 1/3 Chance selbst statt anzugreifen.',
    beforeMoveOrder: 5,
    onConditionStart(ctx, _holder, state) {
      state.turns = ctx.rng.int(2, 5);
      return true;
    },
    onBeforeMove(ctx, holder) {
      const state = holder.volatiles.confusion;
      if (!state) return undefined;
      state.turns = (state.turns ?? 1) - 1;
      if (state.turns <= 0) {
        ctx.removeVolatile(holder, 'confusion');
        return undefined;
      }
      if (!ctx.rng.chance(1, 3)) return undefined;
      ctx.log({ type: 'confusion_hit', mon: ref(holder) });
      ctx.damage(holder, ctx.selfHitDamage(holder), 'confusion');
      return false;
    },
  },
  {
    id: 'flinch',
    name: 'Schreck',
    kind: 'volatile',
    description: 'Schreckt zurück und verliert diese Runde seine Handlung.',
    duration: 1,
    silentStart: true,
    silentEnd: true,
    beforeMoveOrder: 8,
    onBeforeMove(ctx, holder) {
      return cantMove(ctx, holder, 'flinch');
    },
  },
  {
    id: 'taunt',
    name: 'Spott',
    kind: 'volatile',
    description: 'Kann 3 Runden lang keine Statusattacken einsetzen.',
    duration: 3,
    beforeMoveOrder: 7,
    onConditionStart(_ctx, holder, state) {
      if (holder.movedThisTurn) state.turns = 4;
      return true;
    },
    onDisableMove(_ctx, _holder, move) {
      return move.category === 'status';
    },
    onBeforeMove(ctx, holder, move) {
      return move.category === 'status' ? cantMove(ctx, holder, 'taunt') : undefined;
    },
  },
  {
    id: 'encore',
    name: 'Echozwang',
    kind: 'volatile',
    description: 'Muss 3 Runden lang die zuletzt eingesetzte Attacke wiederholen.',
    duration: 3,
    onConditionStart(_ctx, holder, state) {
      const last = holder.lastMove;
      const slot = holder.moves.find((move) => move.id === last);
      if (!last || !slot || slot.pp <= 0) return false;
      state.move = last;
      if (holder.movedThisTurn) state.turns = 4;
      return true;
    },
    onDisableMove(_ctx, holder, move) {
      return move.id !== holder.volatiles.encore?.move;
    },
    onResidual(ctx, holder) {
      const encored = holder.volatiles.encore?.move;
      const slot = holder.moves.find((move) => move.id === encored);
      if (!slot || slot.pp <= 0) ctx.removeVolatile(holder, 'encore');
    },
  },
  {
    id: 'substitute',
    name: 'Trugbild',
    kind: 'volatile',
    description:
      'Ein Trugbild aus 1/4 der LP fängt Schadensattacken ab und blockt gegnerische Statusattacken.',
    onConditionStart(ctx, holder, state) {
      const cost = Math.floor(holder.maxHp / 4);
      if (holder.hp <= cost || cost <= 0) return false;
      effectDamage(ctx, holder, cost, { kind: 'volatile', id: 'substitute' });
      state.hp = cost;
      return true;
    },
  },
  {
    id: 'focusenergy',
    name: 'Schärfeblick',
    kind: 'volatile',
    description: 'Volltreffer-Stufe +2.',
    onModifyCritStage(_ctx, _holder, _move, stage) {
      return stage + 2;
    },
  },
  {
    id: 'lockedmove',
    name: 'Aufladen',
    kind: 'volatile',
    description: 'Lädt eine Zwei-Runden-Attacke auf und kann solange nicht wechseln.',
    silentStart: true,
    silentEnd: true,
    onDisableMove(_ctx, holder, move) {
      return move.id !== holder.volatiles.lockedmove?.move;
    },
    onTrapMon() {
      return true;
    },
  },
  {
    id: 'bound',
    name: 'Umklammerung',
    kind: 'volatile',
    description:
      '4–5 Runden lang gefesselt: verliert 1/8 der LP pro Runde und kann nicht wechseln.',
    durationRange: [4, 5],
    endsWithSource: true,
    onResidual(ctx, holder) {
      effectDamage(ctx, holder, fraction(holder, 1, 8), { kind: 'volatile', id: 'bound' });
    },
    onTrapMon() {
      return true;
    },
  },
  {
    id: 'curse',
    name: 'Seelenfluch',
    kind: 'volatile',
    description:
      'Verflucht: verliert jede Runde 1/4 der LP. Der Verursacher zahlt dafür 1/2 seiner LP.',
    onConditionStart(ctx, _holder, _state, source) {
      if (source)
        effectDamage(ctx, source, Math.floor(source.maxHp / 2), { kind: 'volatile', id: 'curse' });
      return true;
    },
    onResidual(ctx, holder) {
      effectDamage(ctx, holder, fraction(holder, 1, 4), { kind: 'volatile', id: 'curse' });
    },
  },
  {
    id: 'trapped',
    name: 'Schattenbann',
    kind: 'volatile',
    description: 'Kann nicht auswechseln, solange der Verursacher auf dem Feld steht.',
    endsWithSource: true,
    onTrapMon() {
      return true;
    },
  },
  {
    id: 'protect',
    name: 'Schutzschild',
    kind: 'volatile',
    description: 'Schützt diese Runde vor allen Attacken.',
    duration: 1,
    silentEnd: true,
    onTryHitTaken(ctx, holder, attacker) {
      if (attacker === holder) return undefined;
      ctx.log({ type: 'protected', target: ref(holder), by: { kind: 'volatile', id: 'protect' } });
      return false;
    },
  },
  {
    id: 'followme',
    name: 'Lockruf',
    kind: 'volatile',
    description: 'Zieht diese Runde alle gegnerischen Ein-Ziel-Attacken auf sich.',
    duration: 1,
    silentEnd: true,
    onRedirectTarget() {
      return true;
    },
  },
  {
    id: 'helpinghand',
    name: 'Beistand',
    kind: 'volatile',
    description: 'Die nächste Attacke in dieser Runde ist 1,5-mal so stark.',
    duration: 1,
    silentEnd: true,
    onModifyBasePower() {
      return 1.5;
    },
  },
  {
    id: 'gluthunger',
    name: 'Gluthunger',
    kind: 'volatile',
    description: 'Hat Glut aufgesogen: eigene Glut-Attacken sind 1,5-mal so stark.',
    onModifyBasePower(_ctx, _holder, _target, move) {
      return move.type === 'ember' ? 1.5 : undefined;
    },
  },
  {
    id: 'choicelock',
    name: 'Fixierung',
    kind: 'volatile',
    description: 'Durch ein Fix-Item auf eine Attacke festgelegt, bis zum Auswechseln.',
    silentStart: true,
    silentEnd: true,
    onDisableMove(_ctx, holder, move) {
      return move.id !== holder.volatiles.choicelock?.move;
    },
  },
];

// ───────────────────────────── Seiteneffekte ─────────────────────────────

const SPREAD_TARGETS = new Set(['allAdjacentFoes', 'allAdjacent']);

const SIDE: ConditionData[] = [
  {
    id: 'aufwind',
    name: 'Aufwind',
    kind: 'side',
    description: '4 Runden lang doppelte Initiative für die eigene Seite.',
    duration: 4,
    onModifySpeed() {
      return 2;
    },
  },
  {
    id: 'prallschild',
    name: 'Prallschild',
    kind: 'side',
    description: '5 Runden lang weniger Schaden durch physische Attacken (Doppel 2/3, Einzel 1/2).',
    duration: 5,
    screen: 'physical',
  },
  {
    id: 'aetherschild',
    name: 'Ätherschild',
    kind: 'side',
    description: '5 Runden lang weniger Schaden durch spezielle Attacken (Doppel 2/3, Einzel 1/2).',
    duration: 5,
    screen: 'special',
  },
  {
    id: 'polarschleier',
    name: 'Polarschleier',
    kind: 'side',
    description: '5 Runden lang weniger Schaden durch alle Attacken. Entsteht nur im Eisgestöber.',
    duration: 5,
    screen: 'both',
  },
  {
    id: 'bastion',
    name: 'Bastion',
    kind: 'side',
    description: 'Schützt die eigene Seite diese Runde vor Flächenattacken.',
    duration: 1,
    silentEnd: true,
    onTryHitTaken(ctx, holder, attacker, move) {
      if (attacker.side === holder.side || !SPREAD_TARGETS.has(move.target)) return undefined;
      ctx.log({ type: 'protected', target: ref(holder), by: { kind: 'side', id: 'bastion' } });
      return false;
    },
  },
  {
    id: 'vorsichtswall',
    name: 'Vorsichtswall',
    kind: 'side',
    description: 'Schützt die eigene Seite diese Runde vor Attacken mit erhöhter Priorität.',
    duration: 1,
    silentEnd: true,
    onTryHitTaken(ctx, holder, attacker, move) {
      if (attacker.side === holder.side || move.activePriority <= 0) return undefined;
      ctx.log({
        type: 'protected',
        target: ref(holder),
        by: { kind: 'side', id: 'vorsichtswall' },
      });
      return false;
    },
  },
  {
    id: 'splitterfalle',
    name: 'Splitterfalle',
    kind: 'side',
    description:
      'Einwechselnde Gegner verlieren 1/8 der LP, je nach Kristall-Effektivität mehr oder weniger.',
    hazard: true,
    onSwitchIn(ctx, holder) {
      const factor = ctx.effectiveness('crystal', holder);
      if (factor <= 0) return;
      effectDamage(ctx, holder, Math.max(1, Math.floor((holder.maxHp * factor) / 8)), {
        kind: 'side',
        id: 'splitterfalle',
      });
    },
  },
  {
    id: 'dornensaat',
    name: 'Dornensaat',
    kind: 'side',
    description:
      'Bis zu 3 Lagen: Einwechselnde Gegner am Boden verlieren 1/8, 1/6 bzw. 1/4 der LP.',
    hazard: true,
    maxLayers: 3,
    onSwitchIn(ctx, holder) {
      if (!ctx.isGrounded(holder)) return;
      const layers = ctx.sideCondition(holder.side, 'dornensaat')?.layers ?? 1;
      const den = layers >= 3 ? 4 : layers === 2 ? 6 : 8;
      effectDamage(ctx, holder, fraction(holder, 1, den), { kind: 'side', id: 'dornensaat' });
    },
  },
];

// ───────────────────────────── Wetter ─────────────────────────────

function weatherChip(
  id: string,
  immuneTypes: readonly TypeId[],
  immuneAbility: string,
): NonNullable<ConditionData['onResidual']> {
  return (ctx, holder) => {
    if (
      hasType(holder, immuneTypes) ||
      holder.ability === immuneAbility ||
      holder.item === 'sturmbrille'
    )
      return;
    effectDamage(ctx, holder, fraction(holder, 1, 16), { kind: 'weather', id });
  };
}

const WEATHER: ConditionData[] = [
  {
    id: 'gleisssonne',
    name: 'Gleißsonne',
    kind: 'weather',
    description: '5 Runden: Glut-Attacken ×1,5, Flut-Attacken ×0,5.',
    duration: 5,
    extendedBy: 'glutstein',
    extendedDuration: 8,
    weatherDamage(move) {
      if (move.type === 'ember') return 1.5;
      if (move.type === 'tide') return 0.5;
      return undefined;
    },
  },
  {
    id: 'sturmregen',
    name: 'Sturmregen',
    kind: 'weather',
    description: '5 Runden: Flut-Attacken ×1,5, Glut-Attacken ×0,5.',
    duration: 5,
    extendedBy: 'regenstein',
    extendedDuration: 8,
    weatherDamage(move) {
      if (move.type === 'tide') return 1.5;
      if (move.type === 'ember') return 0.5;
      return undefined;
    },
  },
  {
    id: 'staubsturm',
    name: 'Staubsturm',
    kind: 'weather',
    description:
      '5 Runden: 1/16 Schaden pro Runde (außer Erde, Kristall, Metall); Kristall-Monster: Wille ×1,5.',
    duration: 5,
    extendedBy: 'staubstein',
    extendedDuration: 8,
    onResidual: weatherChip('staubsturm', ['earth', 'crystal', 'metal'], 'sandlaeufer'),
    onModifyDefenseStat(_ctx, holder, _attacker, move) {
      return move.category === 'special' && holder.types.includes('crystal') ? 1.5 : undefined;
    },
  },
  {
    id: 'eisgestoeber',
    name: 'Eisgestöber',
    kind: 'weather',
    description:
      '5 Runden: 1/16 Schaden pro Runde (außer Frost); Frost-Monster: Verteidigung ×1,5.',
    duration: 5,
    extendedBy: 'froststein',
    extendedDuration: 8,
    onResidual: weatherChip('eisgestoeber', ['frost'], 'schneelaeufer'),
    onModifyDefenseStat(_ctx, holder, _attacker, move) {
      return move.category === 'physical' && holder.types.includes('frost') ? 1.5 : undefined;
    },
  },
];

// ───────────────────────────── Felder ─────────────────────────────

function terrainBoost(type: TypeId): NonNullable<ConditionData['onModifyBasePower']> {
  return (ctx, holder, _target, move) =>
    move.type === type && ctx.isGrounded(holder) ? 1.3 : undefined;
}

const TERRAIN: ConditionData[] = [
  {
    id: 'funkenfeld',
    name: 'Funkenfeld',
    kind: 'terrain',
    description:
      '5 Runden: Funke-Attacken von Monstern am Boden ×1,3; Monster am Boden schlafen nicht ein.',
    duration: 5,
    extendedBy: 'feldkristall',
    extendedDuration: 8,
    onModifyBasePower: terrainBoost('spark'),
    onSetStatus(ctx, holder, status) {
      return status === 'slp' && ctx.isGrounded(holder) ? false : undefined;
    },
  },
  {
    id: 'bluetenfeld',
    name: 'Blütenfeld',
    kind: 'terrain',
    description:
      '5 Runden: Flora-Attacken von Monstern am Boden ×1,3; Monster am Boden heilen 1/16 pro Runde.',
    duration: 5,
    extendedBy: 'feldkristall',
    extendedDuration: 8,
    onModifyBasePower: terrainBoost('flora'),
    onResidual(ctx, holder) {
      if (ctx.isGrounded(holder)) {
        ctx.heal(holder, fraction(holder, 1, 16), 'effect', { kind: 'terrain', id: 'bluetenfeld' });
      }
    },
  },
  {
    id: 'sternenfeld',
    name: 'Sternenfeld',
    kind: 'terrain',
    description:
      '5 Runden: Astral-Attacken von Monstern am Boden ×1,3; Monster am Boden bekommen keine Statusprobleme.',
    duration: 5,
    extendedBy: 'feldkristall',
    extendedDuration: 8,
    onModifyBasePower: terrainBoost('astral'),
    onSetStatus(ctx, holder) {
      return ctx.isGrounded(holder) ? false : undefined;
    },
  },
  {
    id: 'psifeld',
    name: 'Psifeld',
    kind: 'terrain',
    description:
      '5 Runden: Psi-Attacken von Monstern am Boden ×1,3; Monster am Boden sind vor gegnerischen Prioritäts-Attacken geschützt.',
    duration: 5,
    extendedBy: 'feldkristall',
    extendedDuration: 8,
    onModifyBasePower: terrainBoost('psi'),
    onTryHitTaken(ctx, holder, attacker, move) {
      if (attacker.side === holder.side || move.activePriority <= 0 || !ctx.isGrounded(holder))
        return undefined;
      ctx.log({ type: 'protected', target: ref(holder), by: { kind: 'terrain', id: 'psifeld' } });
      return false;
    },
  },
];

// ───────────────────────────── Feldeffekte ─────────────────────────────

const FIELD: ConditionData[] = [
  {
    id: 'raumverzerrung',
    name: 'Raumverzerrung',
    kind: 'field',
    description: '5 Runden: Innerhalb einer Prioritätsstufe handeln langsame Monster zuerst.',
    duration: 5,
  },
];

export const CONDITIONS: readonly ConditionData[] = [
  ...STATUS,
  ...VOLATILES,
  ...SIDE,
  ...WEATHER,
  ...TERRAIN,
  ...FIELD,
];
