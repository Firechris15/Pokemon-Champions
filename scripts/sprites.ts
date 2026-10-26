/**
 * Kontaktabzug aller Monster-Sprites als PNG (Qualitätskontrolle ohne Browser):
 * Front, Rück, Angriff, Silhouette und Icon nebeneinander.
 * Aufruf: `npm run sprites -- <Zielordner> [id,id,…]` (Standard: sprite-preview/).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { SPECIES } from '../src/data/index.ts';
import { rasterizeText } from '../src/sprites/pixelFont.ts';
import { MONSTER_SPRITES } from '../src/sprites/monsters/index.ts';
import { FRAME_SIZE, renderSprite, type SpriteImage } from '../src/sprites/raster.ts';
import { renderFrame, renderIcon } from '../src/sprites/sheet.ts';
import { encodePng } from './png.ts';

const [outDir = 'sprite-preview', filter] = process.argv.slice(2);
const only = filter ? new Set(filter.split(',')) : null;
const PER_SHEET = 6;
const BIG = 3;
const SMALL = 2;
const F = FRAME_SIZE;
const CELL_H = F * BIG + 26;
const WIDTH = F * BIG * 3 + F * SMALL + 64 * SMALL + 32 * BIG + 70;

interface Canvas {
  width: number;
  height: number;
  data: Uint8Array;
}

function fill(canvas: Canvas, x0: number, y0: number, w: number, h: number, rgb: number[]): void {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      const i = (y * canvas.width + x) * 4;
      canvas.data.set([rgb[0] ?? 0, rgb[1] ?? 0, rgb[2] ?? 0, 255], i);
    }
  }
}

/** Zeichnet ein Sprite vergrößert auf Schachbrett-Hintergrund. */
function draw(canvas: Canvas, image: SpriteImage, x0: number, y0: number, factor: number): void {
  for (let y = 0; y < image.height * factor; y++) {
    for (let x = 0; x < image.width * factor; x++) {
      const checker = (Math.floor(x / 8) + Math.floor(y / 8)) % 2 === 0;
      const bg = checker ? [128, 140, 160] : [116, 128, 148];
      const si = (Math.floor(y / factor) * image.width + Math.floor(x / factor)) * 4;
      const a = (image.data[si + 3] ?? 0) / 255;
      const i = ((y0 + y) * canvas.width + x0 + x) * 4;
      for (let c = 0; c < 3; c++)
        canvas.data[i + c] = Math.round((image.data[si + c] ?? 0) * a + (bg[c] ?? 0) * (1 - a));
      canvas.data[i + 3] = 255;
    }
  }
}

function label(canvas: Canvas, text: string, x0: number, y0: number): void {
  const mask = rasterizeText(text.replace(/[^A-Za-z0-9 ]/g, ' '));
  for (let y = 0; y < mask.height; y++)
    for (let x = 0; x < mask.width; x++)
      if (mask.data[y * mask.width + x])
        fill(canvas, x0 + x * 2, y0 + y * 2, 2, 2, [240, 240, 240]);
}

mkdirSync(outDir, { recursive: true });
const species = SPECIES.filter((s) => (only ? only.has(s.id) : true) && MONSTER_SPRITES[s.id]);
for (let sheet = 0; sheet * PER_SHEET < species.length; sheet++) {
  const batch = species.slice(sheet * PER_SHEET, (sheet + 1) * PER_SHEET);
  const canvas: Canvas = { width: WIDTH, height: CELL_H * batch.length, data: new Uint8Array(0) };
  canvas.data = new Uint8Array(canvas.width * canvas.height * 4);
  fill(canvas, 0, 0, canvas.width, canvas.height, [34, 36, 48]);
  batch.forEach((entry, row) => {
    const def = MONSTER_SPRITES[entry.id];
    if (!def) return;
    const y = row * CELL_H + 20;
    label(canvas, `${entry.id} ${entry.types.join(' ')}`, 6, row * CELL_H + 4);
    let x = 6;
    draw(canvas, renderFrame(def), x, y, BIG);
    x += F * BIG + 10;
    draw(canvas, renderFrame(def, { view: 'back' }), x, y, BIG);
    x += F * BIG + 10;
    draw(canvas, renderFrame(def, { pose: 'attack' }), x, y, BIG);
    x += F * BIG + 10;
    draw(canvas, renderFrame(def, { silhouette: true }), x, y, SMALL);
    x += F * SMALL + 10;
    draw(canvas, renderSprite(def, { size: 32 }), x, y, SMALL);
    x += 64 + 10;
    draw(canvas, renderIcon(def), x, y, BIG);
  });
  const file = join(outDir, `sprites-${String(sheet + 1).padStart(2, '0')}.png`);
  writeFileSync(file, encodePng(canvas.width, canvas.height, canvas.data));
  console.log(file);
}
