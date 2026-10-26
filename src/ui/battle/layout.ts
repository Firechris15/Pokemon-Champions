/**
 * Anordnung des 2D-Kampffelds (Phase 4): Plätze in Prozent der Arena, Sprite-Größen und
 * Anzeigehilfen. Phase 6 ersetzt die Szene durch HD-2D, die Plätze bleiben dieselben.
 */
import type { PositionRef, SideIndex } from '../../engine/model.ts';

export interface SlotPoint {
  /** Mitte in % der Arenabreite. */
  readonly x: number;
  /** Fußpunkt in % der Arenahöhe. */
  readonly y: number;
}

/** Eigene Monster vorn links (Rücken), Gegner hinten rechts (Front). */
const SLOTS: Readonly<Record<1 | 2, readonly [readonly SlotPoint[], readonly SlotPoint[]]>> = {
  1: [[{ x: 27, y: 94 }], [{ x: 71, y: 52 }]],
  2: [
    [
      { x: 17, y: 91 },
      { x: 40, y: 95 },
    ],
    [
      { x: 60, y: 54 },
      { x: 81, y: 50 },
    ],
  ],
};

export function slotPoint(side: SideIndex, position: number, activePerSide: number): SlotPoint {
  const layout = SLOTS[activePerSide === 1 ? 1 : 2][side];
  return layout[position] ?? layout[0] ?? { x: 50, y: 50 };
}

/** Mitte des Sprites (für Effekte), Sprite-Höhe in % der Arena. */
export function slotCenter(
  ref: PositionRef,
  activePerSide: number,
  spriteHeight: readonly [number, number],
): SlotPoint {
  const point = slotPoint(ref.side, ref.position, activePerSide);
  return { x: point.x, y: point.y - spriteHeight[ref.side] * 0.42 };
}

/**
 * Ganzzahlige Vergrößerung der 80-px-Frames (Pixel bleiben scharf): Gegner kleiner (weiter weg),
 * eigene Monster eine Stufe größer.
 */
export function spriteScales(width: number, height: number): [own: number, foe: number] {
  const foe = Math.max(2, Math.min(4, Math.floor(Math.min(height / 230, width / 430))));
  return [foe + 1, foe];
}

/** Flüchtige Zustände, die als Abzeichen am Infofeld erscheinen. */
export const SHOWN_VOLATILES: readonly string[] = [
  'confusion',
  'substitute',
  'taunt',
  'encore',
  'bound',
  'curse',
  'trapped',
  'focusenergy',
  'gluthunger',
];

export const ARENAS = ['wald', 'kristall', 'wueste', 'stadion'] as const;
export type ArenaId = (typeof ARENAS)[number];

export type EffectClass = 'immune' | 'weak' | 'neutral' | 'strong';

export function effectClass(factor: number): EffectClass {
  if (factor === 0) return 'immune';
  if (factor < 1) return 'weak';
  if (factor > 1) return 'strong';
  return 'neutral';
}

/** Kurzform für Abzeichen: ×0, ×¼, ×½, ×2, ×4. */
export function effectLabel(factor: number): string {
  if (factor === 0) return '×0';
  if (factor === 0.25) return '×¼';
  if (factor === 0.5) return '×½';
  return `×${factor}`;
}

export function hpColor(fraction: number): 'high' | 'mid' | 'low' {
  if (fraction > 0.5) return 'high';
  if (fraction > 0.2) return 'mid';
  return 'low';
}

/** Anzeige-Prozent wie beim Gegner üblich: aufgerundet, nie 0 solange LP übrig sind. */
export function hpPercent(hp: number, maxHp: number): number {
  if (hp <= 0 || maxHp <= 0) return 0;
  return Math.max(1, Math.ceil((hp / maxHp) * 100));
}
