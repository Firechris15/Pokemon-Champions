import { describe, expect, it } from 'vitest';
import { Rng } from '../../src/engine/rng.ts';

describe('Rng (Seed-Zufall)', () => {
  it('gleicher Seed → gleiche Folge, anderer Seed → andere Folge', () => {
    const a = Rng.fromSeed('arena');
    const b = Rng.fromSeed('arena');
    const c = Rng.fromSeed('arena2');
    const seqA = Array.from({ length: 20 }, () => a.next());
    expect(Array.from({ length: 20 }, () => b.next())).toEqual(seqA);
    expect(Array.from({ length: 20 }, () => c.next())).not.toEqual(seqA);
  });

  it('Zustand lässt sich speichern und fortsetzen', () => {
    const rng = Rng.fromSeed(42);
    rng.next();
    const copy = new Rng(rng.getState());
    expect(Array.from({ length: 10 }, () => copy.float())).toEqual(
      Array.from({ length: 10 }, () => rng.float()),
    );
  });

  it('int liegt immer im Bereich und trifft alle Werte', () => {
    const rng = Rng.fromSeed('int');
    const seen = new Set<number>();
    for (let i = 0; i < 5000; i++) {
      const v = rng.int(85, 100);
      expect(v).toBeGreaterThanOrEqual(85);
      expect(v).toBeLessThanOrEqual(100);
      seen.add(v);
    }
    expect(seen.size).toBe(16);
  });

  it('ist grob gleichverteilt', () => {
    const rng = Rng.fromSeed('verteilung');
    const buckets = new Array<number>(10).fill(0);
    const n = 100_000;
    for (let i = 0; i < n; i++) {
      const bucket = Math.floor(rng.float() * 10);
      buckets[bucket] = (buckets[bucket] ?? 0) + 1;
    }
    for (const count of buckets) expect(Math.abs(count - n / 10)).toBeLessThan(n * 0.01);
  });

  it('chance entspricht der Wahrscheinlichkeit', () => {
    const rng = Rng.fromSeed('chance');
    let hits = 0;
    for (let i = 0; i < 24_000; i++) if (rng.chance(1, 24)) hits++;
    expect(hits).toBeGreaterThan(800);
    expect(hits).toBeLessThan(1200);
  });

  it('shuffle ist eine Permutation', () => {
    const rng = Rng.fromSeed('mischen');
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    expect([...rng.shuffle([...items])].sort()).toEqual(items);
  });
});
