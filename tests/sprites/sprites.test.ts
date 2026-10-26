import { describe, expect, it } from 'vitest';
import { ITEMS, SPECIES, TYPE_IDS } from '../../src/data/index.ts';
import { STATUS_IDS } from '../../src/engine/model.ts';
import { ITEM_ICONS, STATUS_ICONS, TYPE_ICONS } from '../../src/sprites/icons.ts';
import { MONSTER_SPRITES } from '../../src/sprites/monsters/index.ts';
import {
  FRAME_SIZE,
  opaqueBounds,
  renderSprite,
  type SpriteImage,
} from '../../src/sprites/raster.ts';
import {
  buildSheet,
  ICON_FRAMES,
  ICON_SIZE,
  renderFrame,
  renderIcon,
  SHEET_COLUMNS,
} from '../../src/sprites/sheet.ts';

const POSES = [
  { view: 'front', pose: 'idle', phase: 0 },
  { view: 'front', pose: 'idle', phase: 0.25 },
  { view: 'front', pose: 'idle', phase: 0.5 },
  { view: 'front', pose: 'idle', phase: 0.75 },
  { view: 'front', pose: 'attack', phase: 0 },
  { view: 'back', pose: 'idle', phase: 0.25 },
  { view: 'back', pose: 'idle', phase: 0.75 },
  { view: 'back', pose: 'attack', phase: 0 },
] as const;

function colors(images: readonly SpriteImage[]): number {
  const set = new Set<number>();
  for (const image of images) {
    for (let i = 0; i < image.data.length; i += 4) {
      if ((image.data[i + 3] ?? 0) === 0) continue;
      set.add(
        ((image.data[i] ?? 0) << 16) | ((image.data[i + 1] ?? 0) << 8) | (image.data[i + 2] ?? 0),
      );
    }
  }
  return set.size;
}

function mask(image: SpriteImage): Uint8Array {
  const out = new Uint8Array(image.width * image.height);
  for (let i = 0; i < out.length; i++) out[i] = (image.data[i * 4 + 3] ?? 0) > 0 ? 1 : 0;
  return out;
}

describe('Monster-Sprites', () => {
  it('jedes Monster hat genau eine Sprite-Definition', () => {
    expect(Object.keys(MONSTER_SPRITES).sort()).toEqual(SPECIES.map((s) => s.id).sort());
  });

  describe.each(SPECIES.map((s) => [s.id] as const))('%s', (id) => {
    const def = MONSTER_SPRITES[id];
    if (!def) throw new Error(id);
    const frames = POSES.map((options) => renderFrame(def, options));

    it('nutzt eine begrenzte Palette (8–16 Farben)', () => {
      const count = colors(frames);
      expect(count).toBeGreaterThanOrEqual(8);
      expect(count).toBeLessThanOrEqual(16);
    });

    it('passt in jeder Pose ins Bild (nichts wird am Rand abgeschnitten)', () => {
      for (const [index, frame] of frames.entries()) {
        const bounds = opaqueBounds(frame);
        expect(bounds, `${id} Pose ${index}`).not.toBeNull();
        const [x0, y0, x1, y1] = bounds ?? [0, 0, 0, 0];
        expect(x0, `${id} Pose ${index} links`).toBeGreaterThan(0);
        expect(y0, `${id} Pose ${index} oben`).toBeGreaterThan(0);
        expect(x1, `${id} Pose ${index} rechts`).toBeLessThan(frame.width - 1);
        expect(y1, `${id} Pose ${index} unten`).toBeLessThan(frame.height - 1);
      }
    });

    it('füllt das Bild sinnvoll (mindestens 30 % Breite oder Höhe)', () => {
      const [x0, y0, x1, y1] = opaqueBounds(frames[0] ?? renderFrame(def)) ?? [0, 0, 0, 0];
      expect(Math.max(x1 - x0, y1 - y0)).toBeGreaterThan(64 * 0.3);
    });

    it('ist deterministisch und animiert', () => {
      const again = renderFrame(def, { phase: 0.25 });
      expect(again.data).toEqual(frames[1]?.data);
      // Leerlauf-Bilder unterscheiden sich, Rückansicht unterscheidet sich von vorn.
      expect(frames[1]?.data).not.toEqual(frames[3]?.data);
      expect(frames[5]?.data).not.toEqual(frames[1]?.data);
      expect(frames[4]?.data).not.toEqual(frames[0]?.data);
    });

    it('hat eine dunkle Außenlinie (leuchtende Teile dürfen hell umrandet sein)', () => {
      const frame = frames[0];
      if (!frame) throw new Error(id);
      // Ohne leuchtende Teile muss der Rand fast vollständig dunkel sein.
      const glowing = def.parts.some((p) => p.shading === 'glow');
      const m = mask(frame);
      let edge = 0;
      let dark = 0;
      for (let y = 1; y < frame.height - 1; y++) {
        for (let x = 1; x < frame.width - 1; x++) {
          const i = y * frame.width + x;
          if (!m[i]) continue;
          if (m[i - 1] && m[i + 1] && m[i - frame.width] && m[i + frame.width]) continue;
          edge++;
          const r = frame.data[i * 4] ?? 0;
          const g = frame.data[i * 4 + 1] ?? 0;
          const b = frame.data[i * 4 + 2] ?? 0;
          if (0.299 * r + 0.587 * g + 0.114 * b < 110) dark++;
        }
      }
      expect(dark / edge).toBeGreaterThan(glowing ? 0.4 : 0.75);
    });
  });

  it('alle Silhouetten sind unterscheidbar', () => {
    const masks = SPECIES.map((s) => {
      const def = MONSTER_SPRITES[s.id];
      if (!def) throw new Error(s.id);
      return { id: s.id, mask: mask(renderSprite(def, { silhouette: true })) };
    });
    const similar: string[] = [];
    for (let a = 0; a < masks.length; a++) {
      for (let b = a + 1; b < masks.length; b++) {
        const ma = masks[a];
        const mb = masks[b];
        if (!ma || !mb) continue;
        let both = 0;
        let either = 0;
        for (let i = 0; i < ma.mask.length; i++) {
          if (ma.mask[i] && mb.mask[i]) both++;
          if (ma.mask[i] || mb.mask[i]) either++;
        }
        if (both / either > 0.8) similar.push(`${ma.id}/${mb.id} ${(both / either).toFixed(2)}`);
      }
    }
    expect(similar).toEqual([]);
  });

  it('Spritesheet und Icon haben das erwartete Format', () => {
    const def = MONSTER_SPRITES.pyrrax;
    if (!def) throw new Error('pyrrax');
    const sheet = buildSheet(def);
    expect(sheet.image.width).toBe(FRAME_SIZE * SHEET_COLUMNS);
    expect(sheet.image.height).toBe(FRAME_SIZE * 2);
    expect(sheet.icon.width).toBe(ICON_SIZE * ICON_FRAMES);
    const icon = renderIcon(def);
    const [x0, y0, x1, y1] = opaqueBounds(icon) ?? [0, 0, 0, 0];
    // Das Icon wird auf die sichtbare Fläche zugeschnitten, nicht verkleinert.
    expect(Math.max(x1 - x0, y1 - y0)).toBeGreaterThanOrEqual(ICON_SIZE - 4);
  });
});

describe('Symbole', () => {
  it('gibt es für jede Essenz, jedes Statusproblem und jedes Item', () => {
    expect(Object.keys(TYPE_ICONS).sort()).toEqual([...TYPE_IDS].sort());
    expect(Object.keys(STATUS_ICONS).sort()).toEqual([...STATUS_IDS].sort());
    expect(Object.keys(ITEM_ICONS).sort()).toEqual(ITEMS.map((item) => item.id).sort());
  });

  it('sind auch klein (16 px) gefüllt und unterscheidbar', () => {
    const rendered = Object.entries(TYPE_ICONS).map(([id, def]) => ({
      id,
      data: renderSprite(def, { size: 16 }).data,
    }));
    for (const { id, data } of rendered) {
      let opaque = 0;
      for (let i = 3; i < data.length; i += 4) if ((data[i] ?? 0) > 0) opaque++;
      expect(opaque, id).toBeGreaterThan(150);
    }
    const unique = new Set(rendered.map((entry) => Array.from(entry.data).join(',')));
    expect(unique.size).toBe(rendered.length);
  });
});
