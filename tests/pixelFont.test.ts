import { describe, expect, it } from 'vitest';
import {
  GLYPH_HEIGHT,
  GLYPH_WIDTH,
  dilate,
  hasGlyph,
  rasterizeText,
  toRuns,
} from '../src/sprites/pixelFont.ts';

describe('Pixelschrift', () => {
  it('hat Glyphen für A–Z und 0–9', () => {
    for (const char of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')
      expect(hasGlyph(char), char).toBe(true);
  });

  it('rastert Text mit Abstand zwischen den Zeichen', () => {
    const mask = rasterizeText('AB');
    expect(mask.width).toBe(GLYPH_WIDTH * 2 + 1);
    expect(mask.height).toBe(GLYPH_HEIGHT);
    // Trennspalte ist leer.
    for (let y = 0; y < mask.height; y++) expect(mask.data[y * mask.width + GLYPH_WIDTH]).toBe(0);
  });

  it('dilate erzeugt einen geschlossenen Rand um jedes Pixel', () => {
    const dot = { width: 1, height: 1, data: new Uint8Array([1]) };
    const grown = dilate(dot, 1);
    expect(grown.width).toBe(3);
    expect([...grown.data]).toEqual([1, 1, 1, 1, 1, 1, 1, 1, 1]);
  });

  it('toRuns deckt genau die gesetzten Pixel ab', () => {
    const mask = rasterizeText('ARENA');
    const covered = toRuns(mask).reduce((sum, run) => sum + run.length, 0);
    expect(covered).toBe(mask.data.reduce((sum, v) => sum + v, 0));
  });
});
