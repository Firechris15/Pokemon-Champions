/** KI „Leicht“: zufällige legale Aktionen, bevorzugt Schadensattacken (SPEC 7). */
import type { ActionChoice, PositionRequest } from '../engine/choices.ts';
import { CHOSEN_TARGETS } from '../engine/dex.ts';
import type { Agent, AgentContext } from './agent.ts';

const DAMAGING_PREFERENCE = 0.85;

function chooseAction(
  slot: PositionRequest,
  position: number,
  context: AgentContext,
): ActionChoice {
  if (slot.struggle) return { type: 'move', move: 0 };
  const usable = slot.moves
    .map((move, index) => ({ move, index }))
    .filter((entry) => !entry.move.disabled);
  const damaging = usable.filter((entry) => context.dex.move(entry.move.id).category !== 'status');
  const pool = damaging.length > 0 && context.rng.float() < DAMAGING_PREFERENCE ? damaging : usable;
  const pick = context.rng.pick(pool);
  if (!CHOSEN_TARGETS.includes(pick.move.target)) return { type: 'move', move: pick.index };
  const targets = context.validTargets(position, pick.move.target);
  const foes = targets.filter((target) => target.side !== context.side);
  const candidates = pick.move.target === 'normal' && foes.length > 0 ? foes : targets;
  if (candidates.length === 0) return { type: 'move', move: pick.index };
  return { type: 'move', move: pick.index, target: context.rng.pick(candidates) };
}

export const easyAgent: Agent = {
  id: 'easy',
  choose(request, context) {
    switch (request.type) {
      case 'teamPreview': {
        const order = context.rng.shuffle(request.team.map((_, index) => index));
        return { type: 'teamPreview', order: order.slice(0, request.pick) };
      }
      case 'move':
        return {
          type: 'move',
          actions: request.positions.map((slot, position) =>
            slot ? chooseAction(slot, position, context) : { type: 'pass' },
          ),
        };
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
