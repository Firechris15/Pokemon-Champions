/**
 * Kleine 5×7-Pixelschrift für Logo, Überschriften und App-Icons.
 * Reine Daten + reine Funktionen: läuft im Browser und in Node-Skripten (Icon-Generator).
 */

export const GLYPH_WIDTH = 5;
export const GLYPH_HEIGHT = 7;

const GLYPHS: Readonly<Record<string, readonly string[]>> = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
  D: ['###..', '#..#.', '#...#', '#...#', '#...#', '#..#.', '###..'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.####'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['.###.', '..#..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  J: ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  N: ['#...#', '#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '#.#.#', '.#.#.'],
  X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
  '0': ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
  '1': ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  '2': ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
  '3': ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
  '4': ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
  '5': ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  '6': ['..##.', '.#...', '#....', '####.', '#...#', '#...#', '.###.'],
  '7': ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  '8': ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
  '9': ['.###.', '#...#', '#...#', '.####', '....#', '...#.', '.##..'],
  ' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....'],
  '-': ['.....', '.....', '.....', '#####', '.....', '.....', '.....'],
  '.': ['.....', '.....', '.....', '.....', '.....', '.....', '..#..'],
  ':': ['.....', '..#..', '.....', '.....', '.....', '..#..', '.....'],
  '!': ['..#..', '..#..', '..#..', '..#..', '..#..', '.....', '..#..'],
  '?': ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'],
};

/** Ein einfarbiges Pixelbild: 1 = gesetzt, 0 = leer, zeilenweise. */
export interface PixelMask {
  readonly width: number;
  readonly height: number;
  readonly data: Uint8Array;
}

export function hasGlyph(char: string): boolean {
  return char.toUpperCase() in GLYPHS;
}

/** Rastert einen Text (Großbuchstaben) mit `spacing` leeren Spalten zwischen den Zeichen. */
export function rasterizeText(text: string, spacing = 1): PixelMask {
  const chars = Array.from(text.toUpperCase());
  const width = Math.max(0, chars.length * (GLYPH_WIDTH + spacing) - spacing);
  const data = new Uint8Array(width * GLYPH_HEIGHT);
  chars.forEach((char, index) => {
    const glyph = GLYPHS[char] ?? GLYPHS['?'];
    if (!glyph) return;
    const offsetX = index * (GLYPH_WIDTH + spacing);
    glyph.forEach((row, y) => {
      for (let x = 0; x < GLYPH_WIDTH; x++) {
        if (row[x] === '#') data[y * width + offsetX + x] = 1;
      }
    });
  });
  return { width, height: GLYPH_HEIGHT, data };
}

/** Vergrößert eine Maske um `padding` Pixel Rand und setzt alle Nachbarn gesetzter Pixel (für Outlines). */
export function dilate(mask: PixelMask, padding = 1): PixelMask {
  const width = mask.width + padding * 2;
  const height = mask.height + padding * 2;
  const data = new Uint8Array(width * height);
  for (let y = 0; y < mask.height; y++) {
    for (let x = 0; x < mask.width; x++) {
      if (!mask.data[y * mask.width + x]) continue;
      for (let dy = -padding; dy <= padding; dy++) {
        for (let dx = -padding; dx <= padding; dx++) {
          data[(y + padding + dy) * width + (x + padding + dx)] = 1;
        }
      }
    }
  }
  return { width, height, data };
}

/** Zerlegt eine Maske in waagerechte Läufe – spart DOM-Knoten beim Zeichnen als SVG. */
export function toRuns(mask: PixelMask): { x: number; y: number; length: number }[] {
  const runs: { x: number; y: number; length: number }[] = [];
  for (let y = 0; y < mask.height; y++) {
    let x = 0;
    while (x < mask.width) {
      if (!mask.data[y * mask.width + x]) {
        x++;
        continue;
      }
      const start = x;
      while (x < mask.width && mask.data[y * mask.width + x]) x++;
      runs.push({ x: start, y, length: x - start });
    }
  }
  return runs;
}
