/**
 * Erzeugt alle App-Icons prozedural als Pixel-Art (keine externen Grafiken).
 * Aufruf: `npm run icons` – schreibt nach public/icons/.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dilate, rasterizeText } from '../src/sprites/pixelFont.ts';
import { encodePng } from './png.ts';

type Rgba = readonly [number, number, number, number];

const ART = 32;

function hex(color: string, alpha = 255): Rgba {
  const value = Number.parseInt(color.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255, alpha];
}

const BG_TOP = hex('#24194a');
const BG_BOTTOM = hex('#0b0e1a');
const FLOOR = hex('#3b2358');
const FLOOR_EDGE = hex('#c9a24a');
const OUTLINE = hex('#2a1406');
const GOLD = ['#fff6c8', '#ffd25e', '#f29b38', '#c45a23'].map((c) => hex(c));
const SPARK = hex('#fff3b0');

/** 32×32 Pixel-Art: goldenes „A“ über einer Arena-Plattform vor Nachthimmel. */
function paintArt(): Rgba[] {
  const pixels: Rgba[] = [];
  for (let y = 0; y < ART; y++) {
    for (let x = 0; x < ART; x++) {
      // Gestufter Himmelsverlauf (4 Bänder) für den Pixel-Look.
      const band = Math.min(3, Math.floor((y / ART) * 4));
      const mix = band / 3;
      pixels.push([
        Math.round(BG_TOP[0] + (BG_BOTTOM[0] - BG_TOP[0]) * mix),
        Math.round(BG_TOP[1] + (BG_BOTTOM[1] - BG_TOP[1]) * mix),
        Math.round(BG_TOP[2] + (BG_BOTTOM[2] - BG_TOP[2]) * mix),
        255,
      ]);
    }
  }
  const set = (x: number, y: number, color: Rgba): void => {
    if (x >= 0 && y >= 0 && x < ART && y < ART) pixels[y * ART + x] = color;
  };

  // Arena-Plattform als flache Ellipse.
  for (let y = 22; y < 30; y++) {
    for (let x = 0; x < ART; x++) {
      const dx = (x + 0.5 - 16) / 13;
      const dy = (y + 0.5 - 25.5) / 3.6;
      const d = dx * dx + dy * dy;
      if (d <= 1) set(x, y, d > 0.72 ? FLOOR_EDGE : FLOOR);
    }
  }

  // „A“ der Pixelschrift dreifach vergrößert, mit Outline.
  const glyph = rasterizeText('A');
  const scale = 3;
  const big = {
    width: glyph.width * scale,
    height: glyph.height * scale,
    data: new Uint8Array(glyph.width * scale * glyph.height * scale),
  };
  for (let y = 0; y < big.height; y++) {
    for (let x = 0; x < big.width; x++) {
      big.data[y * big.width + x] =
        glyph.data[Math.floor(y / scale) * glyph.width + Math.floor(x / scale)] ?? 0;
    }
  }
  const outline = dilate(big, 1);
  const ox = Math.floor((ART - outline.width) / 2);
  const oy = 2;
  for (let y = 0; y < outline.height; y++) {
    for (let x = 0; x < outline.width; x++) {
      if (outline.data[y * outline.width + x]) set(ox + x, oy + y, OUTLINE);
    }
  }
  for (let y = 0; y < big.height; y++) {
    for (let x = 0; x < big.width; x++) {
      if (!big.data[y * big.width + x]) continue;
      const tone = GOLD[Math.min(GOLD.length - 1, Math.floor((y / big.height) * GOLD.length))];
      if (tone) set(ox + 1 + x, oy + 1 + y, tone);
    }
  }

  // Funkeln.
  for (const [x, y] of [
    [4, 5],
    [27, 8],
    [25, 3],
    [6, 15],
  ] as const) {
    set(x, y, SPARK);
  }
  return pixels;
}

/** Skaliert die Pixel-Art ganzzahlig (Nearest Neighbour) und zentriert sie auf `size`. */
function render(size: number, art: Rgba[], contentRatio: number): Uint8Array {
  const scale = Math.max(1, Math.floor((size * contentRatio) / ART));
  const offset = Math.floor((size - ART * scale) / 2);
  const out = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const ax = Math.floor((x - offset) / scale);
      const ay = Math.floor((y - offset) / scale);
      const inside = ax >= 0 && ay >= 0 && ax < ART && ay < ART;
      // Außerhalb der Pixel-Art: Hintergrundfarbe der jeweiligen Zeile fortsetzen.
      const color = inside
        ? art[ay * ART + ax]
        : art[Math.min(ART - 1, Math.max(0, ay)) * ART + (ax < 0 ? 0 : ART - 1)];
      out.set(color ?? BG_BOTTOM, (y * size + x) * 4);
    }
  }
  return out;
}

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');
mkdirSync(outDir, { recursive: true });
const art = paintArt();
const icons: [name: string, size: number, contentRatio: number][] = [
  ['favicon-32.png', 32, 1],
  ['apple-touch-icon.png', 180, 1],
  ['icon-192.png', 192, 1],
  ['icon-512.png', 512, 1],
  // Maskable: Inhalt muss im inneren 80-%-Kreis liegen.
  ['icon-maskable-512.png', 512, 0.7],
];
for (const [name, size, ratio] of icons) {
  writeFileSync(join(outDir, name), encodePng(size, size, render(size, art, ratio)));
  console.log(`✓ ${name} (${size}×${size})`);
}
