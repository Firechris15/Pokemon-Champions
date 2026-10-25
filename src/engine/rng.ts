/**
 * Deterministischer Zufallsgenerator (sfc32, 128 Bit Zustand).
 * Gleicher Seed → gleiche Zahlenfolge auf jeder Plattform. Der Zustand ist serialisierbar,
 * damit Kämpfe geklont (KI-Vorausschau) und fortgesetzt (Online-Server) werden können.
 */

export type RngState = readonly [number, number, number, number];

/** Streut einen Text-Seed auf 128 Bit (cyrb128). */
function hashSeed(seed: string): RngState {
  let h1 = 1779033703;
  let h2 = 3144134277;
  let h3 = 1013904242;
  let h4 = 2773480762;
  for (let i = 0; i < seed.length; i++) {
    const k = seed.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  h1 ^= h2 ^ h3 ^ h4;
  h2 ^= h1;
  h3 ^= h1;
  h4 ^= h1;
  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

export class Rng {
  private a: number;
  private b: number;
  private c: number;
  private d: number;

  constructor(state: RngState) {
    [this.a, this.b, this.c, this.d] = state;
  }

  static fromSeed(seed: string | number): Rng {
    const rng = new Rng(hashSeed(String(seed)));
    // Die ersten Ausgaben von sfc32 sind schwach gemischt.
    for (let i = 0; i < 15; i++) rng.next();
    return rng;
  }

  getState(): RngState {
    return [this.a >>> 0, this.b >>> 0, this.c >>> 0, this.d >>> 0];
  }

  /** Gleichverteilte 32-Bit-Ganzzahl. */
  next(): number {
    const t0 = (this.a + this.b) | 0;
    this.a = this.b ^ (this.b >>> 9);
    this.b = (this.c + (this.c << 3)) | 0;
    this.c = (this.c << 21) | (this.c >>> 11);
    this.d = (this.d + 1) | 0;
    const t = (t0 + this.d) | 0;
    this.c = (this.c + t) | 0;
    return t >>> 0;
  }

  /** Gleitkommazahl in [0, 1). */
  float(): number {
    return this.next() / 4294967296;
  }

  /** Ganzzahl in [min, max] (beide inklusive). */
  int(min: number, max: number): number {
    if (max < min) throw new Error(`Rng.int: max (${max}) < min (${min})`);
    return min + Math.floor(this.float() * (max - min + 1));
  }

  /** Wahr mit Wahrscheinlichkeit numerator/denominator. */
  chance(numerator: number, denominator: number): boolean {
    return this.float() * denominator < numerator;
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('Rng.pick: leere Liste');
    return items[this.int(0, items.length - 1)] as T;
  }

  /** Mischt die Liste an Ort und Stelle (Fisher-Yates). */
  shuffle<T>(items: T[]): T[] {
    for (let i = items.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      const tmp = items[i] as T;
      items[i] = items[j] as T;
      items[j] = tmp;
    }
    return items;
  }
}
