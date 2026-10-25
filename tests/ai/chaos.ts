/**
 * Fuzzing-Hilfen: eine KI, die gleichverteilt irgendeine legale Aktion wählt (auch Status-
 * attacken und Wechsel), und Teams mit beliebigen erlernbaren Attacken, Fähigkeiten und Items.
 * So kommen auch Mechaniken zum Zug, die sinnvolle Sets und die einfache KI selten auslösen.
 */
import type { Agent, AgentContext } from '../../src/ai/agent.ts';
import type { ActionChoice, PositionRequest } from '../../src/engine/choices.ts';
import { CHOSEN_TARGETS, type Dex, type FormatData } from '../../src/engine/dex.ts';
import type { MonsterSet } from '../../src/engine/model.ts';
import type { Rng } from '../../src/engine/rng.ts';

const SWITCH_CHANCE = 0.15;

function chaosAction(
  slot: PositionRequest,
  position: number,
  context: AgentContext,
  taken: Set<number>,
): ActionChoice {
  if (slot.struggle) return { type: 'move', move: 0 };
  const switchable = slot.trapped ? [] : slot.switchable.filter((mon) => !taken.has(mon));
  if (switchable.length > 0 && context.rng.float() < SWITCH_CHANCE) {
    const mon = context.rng.pick(switchable);
    taken.add(mon);
    return { type: 'switch', mon };
  }
  const usable = slot.moves.map((move, index) => ({ move, index })).filter((e) => !e.move.disabled);
  const pick = context.rng.pick(usable);
  if (!CHOSEN_TARGETS.includes(pick.move.target)) return { type: 'move', move: pick.index };
  const targets = context.validTargets(position, pick.move.target);
  if (targets.length === 0) return { type: 'move', move: pick.index };
  return { type: 'move', move: pick.index, target: context.rng.pick(targets) };
}

export const chaosAgent: Agent = {
  id: 'chaos',
  choose(request, context) {
    switch (request.type) {
      case 'teamPreview': {
        const order = context.rng.shuffle(request.team.map((_, index) => index));
        return { type: 'teamPreview', order: order.slice(0, request.pick) };
      }
      case 'move': {
        const taken = new Set<number>();
        return {
          type: 'move',
          actions: request.positions.map((slot, position) =>
            slot ? chaosAction(slot, position, context, taken) : { type: 'pass' },
          ),
        };
      }
      case 'switch': {
        const available = context.rng.shuffle([...request.switchable]);
        return {
          type: 'switch',
          switches: request.positions.map((needs) => (needs ? (available.shift() ?? null) : null)),
        };
      }
    }
  },
};

/** Team aus beliebigen Monstern mit gleichverteilt gezogenen Attacken, Fähigkeiten und Items. */
export function chaosTeam(dex: Dex, format: FormatData, rng: Rng): MonsterSet[] {
  const species = rng.shuffle([...dex.data.species]).slice(0, format.maxTeamSize);
  const items = rng.shuffle(dex.data.items.map((item) => item.id));
  return species.map((entry, index) => ({
    species: entry.id,
    level: format.level,
    ability: rng.pick(entry.abilities),
    moves: rng.shuffle([...entry.learnset]).slice(0, 4),
    nature: rng.pick(dex.data.natures).id,
    evs: {},
    ivs: {},
    ...(items[index] === undefined ? {} : { item: items[index] }),
  }));
}
