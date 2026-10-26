/**
 * Brücke zwischen dem Sprite-Generator und der Oberfläche: Spritesheets und Symbole werden als
 * PNG-Daten-URLs erzeugt und im Speicher gehalten. Monster-Sheets entstehen nacheinander im
 * Hintergrund (je ein Sheet pro Arbeitsschritt), damit die Oberfläche flüssig bleibt.
 */
import { CATEGORY_ICONS, ITEM_ICONS, STATUS_ICONS, TYPE_ICONS } from '../sprites/icons.ts';
import type { SpriteDef } from '../sprites/model.ts';
import { MONSTER_SPRITES } from '../sprites/monsters/index.ts';
import { renderSprite, type SpriteImage } from '../sprites/raster.ts';
import { buildSheet, ICON_FRAMES, ICON_SIZE, SHEET_COLUMNS } from '../sprites/sheet.ts';

export interface MonsterImages {
  /** Spritesheet: SHEET_COLUMNS × 2 Bilder (Front oben, Rück unten). */
  readonly sheet: string;
  readonly frameSize: number;
  readonly columns: number;
  /** Icon-Sheet: ICON_FRAMES Bilder à ICON_SIZE. */
  readonly icon: string;
  readonly iconSize: number;
  readonly iconFrames: number;
  /** Anzahl der verwendeten Farben (Qualitätskontrolle). */
  readonly colors: number;
}

export function imageToDataUrl(image: SpriteImage): string {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext('2d');
  if (!context) return '';
  context.putImageData(
    new ImageData(new Uint8ClampedArray(image.data), image.width, image.height),
    0,
    0,
  );
  return canvas.toDataURL('image/png');
}

function countColors(image: SpriteImage): number {
  const colors = new Set<number>();
  for (let i = 0; i < image.data.length; i += 4) {
    if ((image.data[i + 3] ?? 0) === 0) continue;
    colors.add(
      ((image.data[i] ?? 0) << 16) | ((image.data[i + 1] ?? 0) << 8) | (image.data[i + 2] ?? 0),
    );
  }
  return colors.size;
}

const monsterCache = new Map<string, MonsterImages>();
const waiting = new Map<string, ((images: MonsterImages) => void)[]>();
const queue: string[] = [];
let working = false;

function build(id: string): MonsterImages {
  const def = MONSTER_SPRITES[id];
  if (!def) throw new Error(`Kein Sprite für ${id}`);
  const sheet = buildSheet(def);
  return {
    sheet: imageToDataUrl(sheet.image),
    frameSize: sheet.frameSize,
    columns: SHEET_COLUMNS,
    icon: imageToDataUrl(sheet.icon),
    iconSize: ICON_SIZE,
    iconFrames: ICON_FRAMES,
    colors: countColors(sheet.image),
  };
}

/** Arbeitet in Zeitscheiben (~12 ms), damit Eingaben und Animationen flüssig bleiben. */
const SLICE_MS = 12;

function work(): void {
  const started = performance.now();
  while (queue.length > 0 && performance.now() - started < SLICE_MS) {
    const id = queue.shift();
    if (id === undefined) break;
    const images = monsterCache.get(id) ?? build(id);
    monsterCache.set(id, images);
    for (const resolve of waiting.get(id) ?? []) resolve(images);
    waiting.delete(id);
  }
  if (queue.length === 0) {
    working = false;
    return;
  }
  setTimeout(work, 0);
}

/** Bereits erzeugte Bilder (oder `undefined`). */
export function cachedMonsterImages(id: string): MonsterImages | undefined {
  return monsterCache.get(id);
}

/** Bilder eines Monsters; wird bei Bedarf im Hintergrund erzeugt. `urgent` stellt vorn an. */
export function monsterImages(id: string, urgent = false): Promise<MonsterImages> {
  const cached = monsterCache.get(id);
  if (cached) return Promise.resolve(cached);
  return new Promise((resolve) => {
    const list = waiting.get(id) ?? [];
    list.push(resolve);
    waiting.set(id, list);
    const index = queue.indexOf(id);
    if (index >= 0 && urgent) queue.splice(index, 1);
    if (index < 0 || urgent) {
      if (urgent) queue.unshift(id);
      else queue.push(id);
    }
    if (!working) {
      working = true;
      setTimeout(work, 0);
    }
  });
}

export function hasMonsterSprite(id: string): boolean {
  return id in MONSTER_SPRITES;
}

const iconCache = new Map<string, string>();

function iconUrl(key: string, def: SpriteDef | undefined, size: number): string {
  const cacheKey = `${key}@${size}`;
  let url = iconCache.get(cacheKey);
  if (url === undefined) {
    url = def ? imageToDataUrl(renderSprite(def, { size })) : '';
    iconCache.set(cacheKey, url);
  }
  return url;
}

export function typeIconUrl(type: string, size = 16): string {
  return iconUrl(`type:${type}`, TYPE_ICONS[type], size);
}

export function statusIconUrl(status: string, size = 16): string {
  return iconUrl(`status:${status}`, STATUS_ICONS[status], size);
}

export function itemIconUrl(item: string, size = 32): string {
  return iconUrl(`item:${item}`, ITEM_ICONS[item], size);
}

export function categoryIconUrl(category: string, size = 16): string {
  return iconUrl(`category:${category}`, CATEGORY_ICONS[category], size);
}
