/**
 * Spritesheets: Alle Bilder eines Monsters werden beim ersten Zugriff gerendert und gecacht.
 * Ein Feld ist FRAME_SIZE² groß (Entwurfsraster + Rand, 1 Einheit = 1 Pixel).
 * Layout: Zeile 0 = Frontansicht, Zeile 1 = Rückansicht;
 * Spalten 0–3 = Leerlauf (Atmen/Schweben), Spalte 4 = Angriffspose.
 * Icons (32×32, 2 Bilder) liegen in einem eigenen kleinen Sheet.
 */
import type { SpriteDef } from './model.ts';
import {
  DESIGN_SIZE,
  FRAME_SIZE,
  FRAME_VIEWPORT,
  opaqueBounds,
  renderSprite,
  type RenderOptions,
  type SpriteImage,
  type SpriteView,
} from './raster.ts';

export const IDLE_FRAMES = 4;
export const SHEET_COLUMNS = IDLE_FRAMES + 1;
export const ATTACK_COLUMN = IDLE_FRAMES;
export const ICON_SIZE = 32;
export const ICON_FRAMES = 2;

export interface SpriteSheet {
  readonly frameSize: number;
  /** SHEET_COLUMNS × 2 Felder. */
  readonly image: SpriteImage;
  /** ICON_FRAMES × 1 Felder à ICON_SIZE. */
  readonly icon: SpriteImage;
}

/** Kopiert `src` an (x, y) in `dst`. */
export function blit(dst: SpriteImage, src: SpriteImage, x: number, y: number): void {
  for (let row = 0; row < src.height; row++) {
    const from = row * src.width * 4;
    const to = ((y + row) * dst.width + x) * 4;
    dst.data.set(src.data.subarray(from, from + src.width * 4), to);
  }
}

export function emptyImage(width: number, height: number): SpriteImage {
  return { width, height, data: new Uint8ClampedArray(width * height * 4) };
}

/** Ein Bild aus dem Sheet: Ansicht, Spalte (0–3 Leerlauf, 4 Angriff). */
export function frameRect(
  sheet: SpriteSheet,
  view: SpriteView,
  column: number,
): { x: number; y: number; size: number } {
  const size = sheet.frameSize;
  return { x: column * size, y: view === 'front' ? 0 : size, size };
}

/** Ein Animationsbild mit Rand (FRAME_SIZE² Pixel). */
export function renderFrame(
  def: SpriteDef,
  options: Omit<RenderOptions, 'size' | 'viewport'> = {},
): SpriteImage {
  return renderSprite(def, { ...options, size: FRAME_SIZE, viewport: FRAME_VIEWPORT });
}

/** Icon: Frontansicht, auf die sichtbare Fläche zugeschnitten und neu gerastert (nicht verkleinert). */
export function renderIcon(def: SpriteDef, phase = 0, size = ICON_SIZE): SpriteImage {
  const bounds = opaqueBounds(renderFrame(def, { phase: 0 }));
  if (!bounds) return emptyImage(size, size);
  const [x0, y0, x1, y1] = bounds;
  const extent = Math.max(x1 - x0 + 1, y1 - y0 + 1) + 2;
  // Pixel des Rahmens → Entwurfseinheiten.
  const cx = (x0 + x1 + 1) / 2 + FRAME_VIEWPORT.x;
  const cy = (y0 + y1 + 1) / 2 + FRAME_VIEWPORT.y;
  const viewportSize = Math.max(extent * (size / (size - 2)), DESIGN_SIZE * 0.4);
  return renderSprite(def, {
    size,
    phase,
    viewport: { x: cx - viewportSize / 2, y: cy - viewportSize / 2, size: viewportSize },
  });
}

export function buildSheet(def: SpriteDef): SpriteSheet {
  const frameSize = FRAME_SIZE;
  const image = emptyImage(frameSize * SHEET_COLUMNS, frameSize * 2);
  for (const [row, view] of (['front', 'back'] as const).entries()) {
    for (let column = 0; column < IDLE_FRAMES; column++) {
      const frame = renderFrame(def, { view, phase: column / IDLE_FRAMES });
      blit(image, frame, column * frameSize, row * frameSize);
    }
    const attack = renderFrame(def, { view, pose: 'attack' });
    blit(image, attack, ATTACK_COLUMN * frameSize, row * frameSize);
  }
  const icon = emptyImage(ICON_SIZE * ICON_FRAMES, ICON_SIZE);
  for (let column = 0; column < ICON_FRAMES; column++) {
    blit(icon, renderIcon(def, 0.25 + column / ICON_FRAMES), column * ICON_SIZE, 0);
  }
  return { frameSize, image, icon };
}

const sheetCache = new Map<string, SpriteSheet>();

/** Gecachtes Spritesheet (wird beim ersten Zugriff erzeugt). */
export function spriteSheet(key: string, def: SpriteDef): SpriteSheet {
  let sheet = sheetCache.get(key);
  if (!sheet) {
    sheet = buildSheet(def);
    sheetCache.set(key, sheet);
  }
  return sheet;
}
