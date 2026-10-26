/**
 * Farben für die prozeduralen Sprites: Hex/RGB/HSL und Farbrampen mit Farbton-Verschiebung
 * (Schatten kühler, Lichter wärmer – wie in handgemachter Pixel-Art).
 */

export type Rgb = readonly [r: number, g: number, b: number];

export function hexToRgb(hex: string): Rgb {
  const clean = hex.startsWith('#') ? hex.slice(1) : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) throw new Error(`Ungültige Farbe: ${hex}`);
  const value = Number.parseInt(clean, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

export function rgbToHex([r, g, b]: Rgb): string {
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

/** HSL mit h in Grad (0–360), s und l in 0–1. */
export interface Hsl {
  h: number;
  s: number;
  l: number;
}

export function rgbToHsl([r, g, b]: Rgb): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return { h: h * 60, s, l };
}

export function hslToRgb({ h, s, l }: Hsl): Rgb {
  const hue = (((h % 360) + 360) % 360) / 360;
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const channel = (t: number): number => {
    let x = t;
    if (x < 0) x += 1;
    if (x > 1) x -= 1;
    if (x < 1 / 6) return p + (q - p) * 6 * x;
    if (x < 1 / 2) return q;
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
    return p;
  };
  return [
    Math.round(channel(hue + 1 / 3) * 255),
    Math.round(channel(hue) * 255),
    Math.round(channel(hue - 1 / 3) * 255),
  ];
}

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

/** Verschiebt den Farbton um höchstens `amount` Grad in Richtung `target`. */
function shiftHue(hue: number, target: number, amount: number): number {
  const diff = ((target - hue + 540) % 360) - 180;
  const step = Math.sign(diff) * Math.min(Math.abs(diff), amount);
  return hue + step;
}

/** Wärmer und heller bzw. kühler und dunkler – `amount` −1 (tief) bis +1 (Licht). */
export function shade(rgb: Rgb, amount: number): Rgb {
  const hsl = rgbToHsl(rgb);
  // Graue Töne bekommen nur einen Hauch Farbe, damit Metall nicht bunt wird.
  const hueWeight = Math.min(1, hsl.s * 2.5);
  if (amount >= 0) {
    return hslToRgb({
      h: shiftHue(hsl.h, 55, 14 * amount * hueWeight),
      s: clamp01(hsl.s * (1 - 0.08 * amount)),
      l: clamp01(hsl.l + (0.94 - hsl.l) * 0.42 * amount),
    });
  }
  const depth = -amount;
  return hslToRgb({
    h: shiftHue(hsl.h, 255, 22 * depth * hueWeight),
    s: clamp01(hsl.s * (1 + 0.12 * depth) + 0.04 * depth),
    l: clamp01(hsl.l * (1 - 0.62 * depth)),
  });
}

/**
 * Farbrampe von dunkel nach hell aus einer Grundfarbe:
 * 4 Töne = [tief, Schatten, Grund, Licht], 3 Töne = [Schatten, Grund, Licht], 2 Töne = [Schatten, Grund].
 */
export function makeRamp(base: string, tones: 2 | 3 | 4 = 4): Rgb[] {
  const rgb = hexToRgb(base);
  const ramp: Rgb[] = [];
  if (tones === 4) ramp.push(shade(rgb, -0.95));
  ramp.push(shade(rgb, -0.5));
  ramp.push(rgb);
  if (tones >= 3) ramp.push(shade(rgb, 0.65));
  return ramp;
}

export function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}
