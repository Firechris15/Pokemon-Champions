/**
 * KI „Normal“ (SPEC 7): wählt die Attacke mit dem höchsten erwarteten Schaden, beachtet Essenzen und
 * Immunitäten, trifft den eigenen Partner nicht mit Flächenattacken, setzt Unterstützung ein, wenn sie
 * fehlt, und wechselt bei sehr schlechtem Matchup. Sieht nur, was ein Spieler sieht: Werte des
 * Gegners werden aus den Basiswerten geschätzt.
 */
import type { ActionChoice, PositionRequest, Request } from '../engine/choices.ts';
import { CHOSEN_TARGETS, type Dex, type MoveData } from '../engine/dex.ts';
import type { BoostId, PositionRef, StatId, TypeId } from '../engine/model.ts';
import { effectiveness } from '../engine/typechart.ts';
import type { Agent, AgentContext } from './agent.ts';
import type { OwnMon, PublicMon, PublicView } from './view.ts';

/** Geschätzter Wert eines fremden Monsters: Basiswert, IV 31, mittlere EVs, neutrales Wesen. */
function estimateStat(base: number, level: number, stat: StatId): number {
  const core = Math.floor(((2 * base + 31 + 21) * level) / 100);
  return stat === 'hp' ? core + level + 10 : core + 5;
}

function boostFactor(stage: number): number {
  return stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage);
}

function averageHits(move: MoveData): number {
  if (move.multihit === undefined) return 1;
  if (typeof move.multihit === 'number') return move.multihit;
  return move.multihit[0] === 2 && move.multihit[1] === 5
    ? 3.1
    : (move.multihit[0] + move.multihit[1]) / 2;
}

const WEATHER_BOOST: Readonly<Record<string, Partial<Record<TypeId, number>>>> = {
  gleisssonne: { ember: 1.5, tide: 0.5 },
  sturmregen: { tide: 1.5, ember: 0.5 },
};

/** Erwarteter Schaden als Anteil der max. LP des Ziels (geschätzt). */
export function estimateDamage(
  dex: Dex,
  view: PublicView,
  user: OwnMon,
  target: PublicMon | OwnMon,
  move: MoveData,
): number {
  if (move.category === 'status') return 0;
  const eff = effectiveness(dex.typeChart, move.type, target.types);
  if (!move.typeless && eff === 0) return 0;
  const factor = move.typeless ? 1 : eff;
  const species = dex.species(target.species);
  const targetHp =
    'maxHp' in target ? target.maxHp : estimateStat(species.baseStats.hp, target.level, 'hp');
  if (move.fixedDamage !== undefined) {
    const fixed = move.fixedDamage === 'level' ? user.level : move.fixedDamage;
    return fixed / targetHp;
  }
  const physical = move.category === 'physical';
  const attackStat: StatId = physical ? 'atk' : 'spa';
  const defenseStat: StatId = physical ? 'def' : 'spd';
  const attackBoost: BoostId = physical ? 'atk' : 'spa';
  const defenseBoost: BoostId = physical ? 'def' : 'spd';
  const attack = user.stats[attackStat] * boostFactor(user.boosts[attackBoost]);
  const defense =
    ('stats' in target
      ? target.stats[defenseStat]
      : estimateStat(species.baseStats[defenseStat], target.level, defenseStat)) *
    boostFactor(target.boosts[defenseBoost]);
  const base =
    Math.floor(
      Math.floor(
        (Math.floor((2 * user.level) / 5 + 2) * move.power * attack) / Math.max(1, defense),
      ) / 50,
    ) + 2;
  const stab = !move.typeless && user.types.includes(move.type) ? 1.5 : 1;
  const weather = view.weather ? (WEATHER_BOOST[view.weather]?.[move.type] ?? 1) : 1;
  const burn = physical && user.status === 'brn' ? 0.5 : 1;
  const accuracy = move.accuracy === true ? 1 : move.accuracy / 100;
  const damage = base * 0.925 * stab * factor * weather * burn * averageHits(move) * accuracy;
  return damage / targetHp;
}

interface Candidate {
  action: ActionChoice;
  score: number;
}

/** Wie gut steht `mon` gegen die aktiven Gegner (positiv = gut)? */
function matchup(dex: Dex, types: readonly TypeId[], foes: readonly PublicMon[]): number {
  let score = 0;
  for (const foe of foes) {
    const offense = Math.max(...types.map((type) => effectiveness(dex.typeChart, type, foe.types)));
    const defense = Math.max(...foe.types.map((type) => effectiveness(dex.typeChart, type, types)));
    score += Math.log2(Math.max(offense, 0.25)) - Math.log2(Math.max(defense, 0.25));
  }
  return score;
}

const STATUS_IMMUNE: Readonly<Record<string, readonly TypeId[]>> = {
  brn: ['ember'],
  par: ['spark'],
  psn: ['venom', 'metal'],
  tox: ['venom', 'metal'],
  frz: ['frost'],
  slp: [],
};

function statusMoveScore(
  dex: Dex,
  view: PublicView,
  user: OwnMon,
  move: MoveData,
  foes: readonly PublicMon[],
  target: PublicMon | undefined,
): number {
  const ownSide = view.side;
  const foeSide = ownSide === 0 ? 1 : 0;
  if (move.stalling) return user.hpFraction < 0.35 ? 0.12 : 0.04;
  if (move.weather) return view.weather === move.weather ? -1 : 0.32;
  if (move.terrain) return view.terrain === move.terrain ? -1 : 0.28;
  if (move.field) {
    if (view.fieldEffects.includes(move.field)) return -1;
    // Raumverzerrung lohnt sich, wenn das eigene Team langsamer ist.
    const ownSpeed = view.own.filter((m) => m.position !== null).map((m) => m.stats.spe);
    const foeSpeed = foes.map((foe) =>
      estimateStat(dex.species(foe.species).baseStats.spe, foe.level, 'spe'),
    );
    const avg = (values: number[]) =>
      values.reduce((a, b) => a + b, 0) / Math.max(1, values.length);
    return avg(ownSpeed) < avg(foeSpeed) ? 0.45 : -1;
  }
  if (move.sideCondition) {
    const side = move.target === 'foeSide' ? foeSide : ownSide;
    return view.sideConditions[side].includes(move.sideCondition) ? -1 : 0.3;
  }
  if (move.heal) return user.hpFraction < 0.55 ? (1 - user.hpFraction) * 0.7 : -0.5;
  if (move.target === 'self' && move.boosts) {
    const stats = Object.keys(move.boosts) as BoostId[];
    const capped = stats.every((stat) => user.boosts[stat] >= 2);
    return capped || user.hpFraction < 0.6 ? -0.2 : 0.26;
  }
  if (move.status) {
    if (!target || target.status) return -1;
    const immune = (STATUS_IMMUNE[move.status] ?? []).some((type) => target.types.includes(type));
    return immune ? -1 : 0.3;
  }
  if (move.volatile) {
    if (target?.volatiles.includes(move.volatile)) return -1;
    if (move.volatile === 'substitute') return user.hpFraction > 0.6 ? 0.12 : -1;
    return 0.16;
  }
  if (move.boosts) return 0.14;
  return 0.06;
}

function chooseAction(
  slot: PositionRequest,
  position: number,
  context: AgentContext,
  view: PublicView,
  takenSwitches: Set<number>,
): ActionChoice {
  if (slot.struggle) return { type: 'move', move: 0 };
  const dex = context.dex;
  const user = view.own[slot.mon];
  if (!user) return { type: 'move', move: 0 };
  const activeFoes = view.foes.filter((foe) => foe.position !== null && !foe.fainted);
  const ally = view.own.find(
    (mon) => mon.position !== null && mon.position !== position && !mon.fainted,
  );
  const candidates: Candidate[] = [];

  slot.moves.forEach((option, index) => {
    if (option.disabled || option.pp <= 0) return;
    const move = dex.move(option.id);
    const noise = context.rng.float() * 0.06;
    const foeAt = (ref: PositionRef) => activeFoes.find((foe) => foe.position === ref.position);
    if (move.category === 'status') {
      const targets = CHOSEN_TARGETS.includes(move.target)
        ? context.validTargets(position, move.target).filter((ref) => ref.side !== view.side)
        : [];
      const ref = targets[0];
      const target = ref ? foeAt(ref) : activeFoes[0];
      if (move.target === 'adjacentAlly') {
        const allyRef = context.validTargets(position, move.target)[0];
        if (!allyRef) return;
        candidates.push({
          action: { type: 'move', move: index, target: allyRef },
          score: (move.heal && ally && ally.hpFraction < 0.5 ? 0.5 : 0.1) + noise,
        });
        return;
      }
      const score = statusMoveScore(dex, view, user, move, activeFoes, target);
      const action: ActionChoice =
        ref && CHOSEN_TARGETS.includes(move.target)
          ? { type: 'move', move: index, target: ref }
          : { type: 'move', move: index };
      candidates.push({ action, score: score + noise });
      return;
    }
    const value = (target: PublicMon | OwnMon): number => {
      const dealt = estimateDamage(dex, view, user, target, move);
      const capped = Math.min(dealt, target.hpFraction);
      return capped + (dealt >= target.hpFraction ? 0.35 : 0);
    };
    if (CHOSEN_TARGETS.includes(move.target)) {
      for (const ref of context.validTargets(position, move.target)) {
        if (ref.side === view.side) continue;
        const target = foeAt(ref);
        if (!target) continue;
        candidates.push({
          action: { type: 'move', move: index, target: ref },
          score: value(target) + noise,
        });
      }
      return;
    }
    // Flächen- und Zufallsattacken.
    const spread = activeFoes.length > 1 && move.target !== 'randomFoe' ? 0.75 : 1;
    let score = 0;
    for (const foe of activeFoes) score += value(foe) * spread;
    if (move.target === 'randomFoe') score /= Math.max(1, activeFoes.length);
    if (move.target === 'allAdjacent' && ally) {
      score -= estimateDamage(dex, view, user, ally, move) * spread * 1.5;
    }
    candidates.push({ action: { type: 'move', move: index }, score: score + noise });
  });

  const best = candidates.reduce<Candidate | null>(
    (top, c) => (!top || c.score > top.score ? c : top),
    null,
  );

  // Bei sehr schlechtem Matchup wechseln.
  if (!slot.trapped && (!best || best.score < 0.15)) {
    const current = matchup(dex, user.types, activeFoes);
    const options = slot.switchable
      .filter((index) => !takenSwitches.has(index))
      .map((index) => ({ index, mon: view.own[index] }))
      .filter((entry): entry is { index: number; mon: OwnMon } => entry.mon !== undefined)
      .map((entry) => ({
        index: entry.index,
        score: matchup(dex, entry.mon.types, activeFoes) + entry.mon.hpFraction,
      }))
      .sort((a, b) => b.score - a.score);
    const option = options[0];
    if (option && option.score - current > 1.5 && context.rng.float() < 0.7) {
      takenSwitches.add(option.index);
      return { type: 'switch', mon: option.index };
    }
  }
  return best?.action ?? { type: 'move', move: slot.moves.findIndex((m) => !m.disabled) };
}

function bestSwitches(
  context: AgentContext,
  needs: readonly boolean[],
  switchable: readonly number[],
): (number | null)[] {
  const view = context.view();
  const foes = view.foes.filter((foe) => foe.position !== null && !foe.fainted);
  const ranked = [...switchable].sort((a, b) => {
    const ma = view.own[a];
    const mb = view.own[b];
    const sa = ma ? matchup(context.dex, ma.types, foes) + ma.hpFraction : -99;
    const sb = mb ? matchup(context.dex, mb.types, foes) + mb.hpFraction : -99;
    return sb - sa;
  });
  return needs.map((need) => (need ? (ranked.shift() ?? null) : null));
}

function teamPreview(request: Extract<Request, { type: 'teamPreview' }>, context: AgentContext) {
  const dex = context.dex;
  const foeTypes = request.opponent.map((entry) => dex.species(entry.species).types);
  const scored = request.team.map((entry, index) => {
    const types = dex.species(entry.species).types;
    let score = 0;
    for (const foe of foeTypes) {
      const offense = Math.max(...types.map((type) => effectiveness(dex.typeChart, type, foe)));
      const defense = Math.max(...foe.map((type) => effectiveness(dex.typeChart, type, types)));
      score += Math.log2(Math.max(offense, 0.25)) - Math.log2(Math.max(defense, 0.25));
    }
    return { index, score: score + context.rng.float() * 0.5 };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, request.pick).map((entry) => entry.index);
}

export const normalAgent: Agent = {
  id: 'normal',
  choose(request, context) {
    switch (request.type) {
      case 'teamPreview':
        return { type: 'teamPreview', order: teamPreview(request, context) };
      case 'move': {
        const view = context.view();
        const taken = new Set<number>();
        return {
          type: 'move',
          actions: request.positions.map((slot, position) =>
            slot ? chooseAction(slot, position, context, view, taken) : { type: 'pass' },
          ),
        };
      }
      case 'switch':
        return {
          type: 'switch',
          switches: bestSwitches(context, request.positions, request.switchable),
        };
    }
  },
};
