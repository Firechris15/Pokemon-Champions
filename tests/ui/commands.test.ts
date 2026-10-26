import { describe, expect, it } from 'vitest';
import type { PositionRequest } from '../../src/engine/choices.ts';
import {
  actingPositions,
  moveChoice,
  needsTarget,
  replacementOptions,
  replacementPositions,
  switchChoice,
  switchOptions,
  type MoveRequest,
  type SwitchRequest,
} from '../../src/ui/battle/commands.ts';
import {
  effectClass,
  effectLabel,
  hpColor,
  hpPercent,
  slotPoint,
  spriteScales,
} from '../../src/ui/battle/layout.ts';

function slot(mon: number, switchable: number[], trapped = false): PositionRequest {
  return {
    mon,
    moves: [{ id: 'a', pp: 10, maxPp: 10, target: 'normal', disabled: false }],
    struggle: false,
    switchable,
    trapped,
  };
}

describe('Befehlseingabe (commands.ts)', () => {
  const request: MoveRequest = {
    type: 'move',
    turn: 3,
    positions: [slot(0, [2, 3]), null],
  };

  it('nur besetzte Positionen handeln, leere passen', () => {
    expect(actingPositions(request)).toEqual([0]);
    expect(moveChoice(request, [null, null])).toBeNull();
    expect(moveChoice(request, [{ type: 'move', move: 0 }, null])).toEqual({
      type: 'move',
      actions: [{ type: 'move', move: 0 }, { type: 'pass' }],
    });
  });

  it('ein Monster wird nur von einer Position eingewechselt', () => {
    const both: MoveRequest = {
      type: 'move',
      turn: 1,
      positions: [slot(0, [2, 3]), slot(1, [2, 3])],
    };
    const first = both.positions[1];
    if (!first) throw new Error('Position fehlt');
    expect(switchOptions(first, [{ type: 'switch', mon: 2 }, null])).toEqual([3]);
    expect(switchOptions(slot(1, [2, 3], true), [null, null])).toEqual([]);
  });

  it('Ziel nur abfragen, wenn es eine echte Wahl gibt', () => {
    const one = [{ side: 1 as const, position: 0 }];
    const two = [...one, { side: 1 as const, position: 1 }];
    expect(needsTarget('normal', one)).toBe(false);
    expect(needsTarget('normal', two)).toBe(true);
    expect(needsTarget('allAdjacentFoes', two)).toBe(false);
    expect(needsTarget('adjacentAlly', two)).toBe(true);
  });

  it('erzwungene Wechsel: so viele Plätze wie Ersatz vorhanden', () => {
    const forced: SwitchRequest = { type: 'switch', positions: [true, true], switchable: [3] };
    expect(replacementPositions(forced)).toEqual([0]);
    expect(replacementOptions(forced, [3, null])).toEqual([]);
    expect(switchChoice(forced, [3])).toEqual({ type: 'switch', switches: [3, null] });
  });
});

describe('Kampffeld-Anordnung (layout.ts)', () => {
  it('Plätze liegen in der Arena, eigene vorn, Gegner hinten', () => {
    for (const perSide of [1, 2]) {
      for (let position = 0; position < perSide; position++) {
        const own = slotPoint(0, position, perSide);
        const foe = slotPoint(1, position, perSide);
        for (const point of [own, foe]) {
          expect(point.x).toBeGreaterThan(0);
          expect(point.x).toBeLessThan(100);
          expect(point.y).toBeLessThanOrEqual(100);
        }
        expect(own.y).toBeGreaterThan(foe.y);
        expect(own.x).toBeLessThan(foe.x);
      }
    }
  });

  it('Sprites wachsen ganzzahlig mit der Arena, eigene eine Stufe größer', () => {
    expect(spriteScales(700, 480)).toEqual([3, 2]);
    expect(spriteScales(1600, 780)).toEqual([4, 3]);
    for (const [width, height] of [
      [400, 300],
      [3000, 2000],
    ] as const) {
      const [own, foe] = spriteScales(width, height);
      expect(own).toBe(foe + 1);
      expect(foe).toBeGreaterThanOrEqual(2);
      expect(foe).toBeLessThanOrEqual(4);
    }
  });

  it('Effektivität, LP-Farbe und Prozent', () => {
    expect([0, 0.25, 0.5, 1, 2, 4].map(effectLabel)).toEqual(['×0', '×¼', '×½', '×1', '×2', '×4']);
    expect([0, 0.5, 1, 4].map(effectClass)).toEqual(['immune', 'weak', 'neutral', 'strong']);
    expect([1, 0.5, 0.21, 0.2].map(hpColor)).toEqual(['high', 'mid', 'mid', 'low']);
    expect(hpPercent(1, 300)).toBe(1);
    expect(hpPercent(0, 300)).toBe(0);
    expect(hpPercent(150, 300)).toBe(50);
  });
});
