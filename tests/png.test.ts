import { inflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { crc32, encodePng } from '../scripts/png.ts';

describe('PNG-Encoder (Icon-Generator)', () => {
  it('berechnet CRC32 wie die Referenz', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
  });

  it('schreibt Signatur, Header und verlustfreie Bilddaten', () => {
    const rgba = new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 1, 2, 3, 4]);
    const png = encodePng(2, 2, rgba);
    expect([...png.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(png.toString('ascii', 12, 16)).toBe('IHDR');
    expect(png.readUInt32BE(16)).toBe(2);
    expect(png.readUInt32BE(20)).toBe(2);

    const idatLength = png.readUInt32BE(33);
    expect(png.toString('ascii', 37, 41)).toBe('IDAT');
    const raw = inflateSync(png.subarray(41, 41 + idatLength));
    // Pro Zeile: 1 Filter-Byte + 2 Pixel × 4 Byte.
    expect([...raw.subarray(1, 9)]).toEqual([...rgba.subarray(0, 8)]);
    expect([...raw.subarray(10, 18)]).toEqual([...rgba.subarray(8, 16)]);
  });

  it('lehnt falsche Puffergrößen ab', () => {
    expect(() => encodePng(2, 2, new Uint8Array(3))).toThrow();
  });
});
