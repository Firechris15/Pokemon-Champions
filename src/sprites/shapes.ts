/**
 * Grundformen der Sprite-Definitionen und ihre Rasterung: Innen-Test, Normale fürs Licht und
 * Transformationen (Animation, Spiegelung). Alles in „Einheiten“ eines 64×64-Entwurfsrasters.
 */

export type Vec = readonly [x: number, y: number];

export type Shape =
  /** Ellipse mit Mittelpunkt, Halbachsen und Drehung (Grad). */
  | { readonly kind: 'ellipse'; readonly c: Vec; readonly r: Vec; readonly rot: number }
  /** Kapsel/Gliedmaße von a nach b mit Radius ra → rb (verjüngt). */
  | {
      readonly kind: 'limb';
      readonly a: Vec;
      readonly b: Vec;
      readonly ra: number;
      readonly rb: number;
    }
  /** Bézier-Kurve (3 oder 4 Kontrollpunkte) als Schlauch mit Radius ra → rb (Schwänze, Hälse). */
  | {
      readonly kind: 'curve';
      readonly pts: readonly Vec[];
      readonly ra: number;
      readonly rb: number;
    }
  /** Polygon; `bevel` = Breite der abgerundeten Kante, `tilt` neigt die Fläche zum Licht. */
  | {
      readonly kind: 'poly';
      readonly pts: readonly Vec[];
      readonly bevel: number;
      readonly tilt: Vec;
    };

/** Ergebnis einer Abtastung: Normale (Einheitsvektor) und Abstand zur Mitte (0) bzw. zum Rand (1). */
export interface Sample {
  nx: number;
  ny: number;
  nz: number;
  edge: number;
}

export interface PreparedShape {
  /** Umgebendes Rechteck [x0, y0, x1, y1] in Einheiten. */
  readonly bbox: readonly [number, number, number, number];
  inside(x: number, y: number): boolean;
  /** Schreibt Normale und Randabstand in `out` (auch knapp außerhalb sinnvoll). */
  sample(x: number, y: number, out: Sample): void;
}

const EPS = 1e-6;
const ORIGIN: Vec = [0, 0];

function normalize(out: Sample, x: number, y: number, z: number): void {
  const len = Math.hypot(x, y, z) || 1;
  out.nx = x / len;
  out.ny = y / len;
  out.nz = z / len;
}

function prepareEllipse(c: Vec, r: Vec, rot: number): PreparedShape {
  const angle = (rot * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const rx = Math.max(r[0], EPS);
  const ry = Math.max(r[1], EPS);
  const hw = Math.hypot(rx * cos, ry * sin);
  const hh = Math.hypot(rx * sin, ry * cos);
  const local = (x: number, y: number): [number, number] => {
    const dx = x - c[0];
    const dy = y - c[1];
    return [(dx * cos + dy * sin) / rx, (-dx * sin + dy * cos) / ry];
  };
  return {
    bbox: [c[0] - hw, c[1] - hh, c[0] + hw, c[1] + hh],
    inside(x, y) {
      const [u, v] = local(x, y);
      return u * u + v * v <= 1;
    },
    sample(x, y, out) {
      let [u, v] = local(x, y);
      const s = u * u + v * v;
      if (s > 0.995) {
        const k = Math.sqrt(0.995 / s);
        u *= k;
        v *= k;
      }
      const nz = Math.sqrt(Math.max(0, 1 - u * u - v * v));
      normalize(out, u * cos - v * sin, u * sin + v * cos, nz);
      out.edge = Math.min(1, Math.sqrt(s));
    },
  };
}

interface Segment {
  ax: number;
  ay: number;
  dx: number;
  dy: number;
  len2: number;
  ra: number;
  rb: number;
  /** Umgebendes Rechteck zum schnellen Verwerfen. */
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

function segment(a: Vec, b: Vec, ra: number, rb: number): Segment {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const r = Math.max(ra, rb);
  return {
    ax: a[0],
    ay: a[1],
    dx,
    dy,
    len2: dx * dx + dy * dy,
    ra,
    rb,
    x0: Math.min(a[0], b[0]) - r,
    y0: Math.min(a[1], b[1]) - r,
    x1: Math.max(a[0], b[0]) + r,
    y1: Math.max(a[1], b[1]) + r,
  };
}

function outsideBox(s: Segment, x: number, y: number): boolean {
  return x < s.x0 || x > s.x1 || y < s.y0 || y > s.y1;
}

/** Relativer Abstand (Abstand/Radius) und Versatz vom nächsten Achsenpunkt. */
function segmentDistance(
  s: Segment,
  x: number,
  y: number,
): [ratio: number, ox: number, oy: number] {
  const t =
    s.len2 < EPS ? 0 : Math.min(1, Math.max(0, ((x - s.ax) * s.dx + (y - s.ay) * s.dy) / s.len2));
  const ox = x - (s.ax + s.dx * t);
  const oy = y - (s.ay + s.dy * t);
  const r = Math.max(EPS, s.ra + (s.rb - s.ra) * t);
  return [Math.hypot(ox, oy) / r, ox / r, oy / r];
}

function prepareSegments(segments: readonly Segment[]): PreparedShape {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const s of segments) {
    const r = Math.max(s.ra, s.rb);
    x0 = Math.min(x0, s.ax - r, s.ax + s.dx - r);
    y0 = Math.min(y0, s.ay - r, s.ay + s.dy - r);
    x1 = Math.max(x1, s.ax + r, s.ax + s.dx + r);
    y1 = Math.max(y1, s.ay + r, s.ay + s.dy + r);
  }
  const nearest = (x: number, y: number): [number, number, number] => {
    let best: [number, number, number] = [Infinity, 0, 0];
    for (const s of segments) {
      const d = segmentDistance(s, x, y);
      if (d[0] < best[0]) best = d;
    }
    return best;
  };
  return {
    bbox: [x0, y0, x1, y1],
    inside(x, y) {
      for (const s of segments) {
        if (outsideBox(s, x, y)) continue;
        if (segmentDistance(s, x, y)[0] <= 1) return true;
      }
      return false;
    },
    sample(x, y, out) {
      let [ratio, ox, oy] = nearest(x, y);
      if (ratio > 0.995) {
        const k = 0.995 / ratio;
        ox *= k;
        oy *= k;
        ratio = 0.995;
      }
      normalize(out, ox, oy, Math.sqrt(Math.max(0, 1 - ratio * ratio)));
      out.edge = Math.min(1, ratio);
    },
  };
}

function bezierPoint(pts: readonly Vec[], t: number): Vec {
  let points = pts.map((p) => [p[0], p[1]] as [number, number]);
  while (points.length > 1) {
    const next: [number, number][] = [];
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i] ?? [0, 0];
      const b = points[i + 1] ?? [0, 0];
      next.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
    points = next;
  }
  const p = points[0] ?? [0, 0];
  return [p[0], p[1]];
}

const CURVE_STEPS = 12;

function prepareCurve(pts: readonly Vec[], ra: number, rb: number): PreparedShape {
  const segments: Segment[] = [];
  let prev = bezierPoint(pts, 0);
  for (let i = 1; i <= CURVE_STEPS; i++) {
    const t0 = (i - 1) / CURVE_STEPS;
    const t1 = i / CURVE_STEPS;
    const next = bezierPoint(pts, t1);
    segments.push(segment(prev, next, ra + (rb - ra) * t0, ra + (rb - ra) * t1));
    prev = next;
  }
  return prepareSegments(segments);
}

function preparePoly(pts: readonly Vec[], bevel: number, tilt: Vec): PreparedShape {
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i] ?? ORIGIN;
    const b = pts[(i + 1) % pts.length] ?? ORIGIN;
    area += a[0] * b[1] - b[0] * a[1];
  }
  const sign = area >= 0 ? 1 : -1;
  const edges = pts.map((a, i) => {
    const b = pts[(i + 1) % pts.length] ?? ORIGIN;
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    return { a, dx, dy, len2: dx * dx + dy * dy, mx: (sign * dy) / len, my: (-sign * dx) / len };
  });
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const inside = (x: number, y: number): boolean => {
    let hit = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const pi = pts[i] ?? ORIGIN;
      const pj = pts[j] ?? ORIGIN;
      if (pi[1] > y !== pj[1] > y && x < ((pj[0] - pi[0]) * (y - pi[1])) / (pj[1] - pi[1]) + pi[0])
        hit = !hit;
    }
    return hit;
  };
  return {
    bbox: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)],
    inside,
    sample(x, y, out) {
      let best = Infinity;
      let mx = 0;
      let my = 0;
      for (const e of edges) {
        const t =
          e.len2 < EPS
            ? 0
            : Math.min(1, Math.max(0, ((x - e.a[0]) * e.dx + (y - e.a[1]) * e.dy) / e.len2));
        const d = Math.hypot(x - (e.a[0] + e.dx * t), y - (e.a[1] + e.dy * t));
        if (d < best) {
          best = d;
          mx = e.mx;
          my = e.my;
        }
      }
      const k = bevel > 0 ? Math.max(0, 1 - best / bevel) : 0;
      normalize(out, mx * k * 1.3 + tilt[0], my * k * 1.3 + tilt[1], 1);
      out.edge = bevel > 0 ? k : 0.5;
    },
  };
}

export function prepareShape(shape: Shape): PreparedShape {
  switch (shape.kind) {
    case 'ellipse':
      return prepareEllipse(shape.c, shape.r, shape.rot);
    case 'limb':
      return prepareSegments([segment(shape.a, shape.b, shape.ra, shape.rb)]);
    case 'curve':
      return prepareCurve(shape.pts, shape.ra, shape.rb);
    case 'poly':
      return preparePoly(shape.pts, shape.bevel, shape.tilt);
  }
}

// ───────────────────────────── Transformationen ─────────────────────────────

/** Affine Abbildung: x' = a·x + c·y + e, y' = b·x + d·y + f. */
export type Mat = readonly [a: number, b: number, c: number, d: number, e: number, f: number];

export const IDENTITY: Mat = [1, 0, 0, 1, 0, 0];

/** Erst `m`, dann `n`. */
export function compose(m: Mat, n: Mat): Mat {
  return [
    n[0] * m[0] + n[2] * m[1],
    n[1] * m[0] + n[3] * m[1],
    n[0] * m[2] + n[2] * m[3],
    n[1] * m[2] + n[3] * m[3],
    n[0] * m[4] + n[2] * m[5] + n[4],
    n[1] * m[4] + n[3] * m[5] + n[5],
  ];
}

export function translate(dx: number, dy: number): Mat {
  return [1, 0, 0, 1, dx, dy];
}

/** Drehung um `pivot` (Grad, im Bild im Uhrzeigersinn). */
export function rotate(deg: number, pivot: Vec): Mat {
  const a = (deg * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  return [
    cos,
    sin,
    -sin,
    cos,
    pivot[0] - cos * pivot[0] + sin * pivot[1],
    pivot[1] - sin * pivot[0] - cos * pivot[1],
  ];
}

/** Skalierung um `pivot`. */
export function scale(sx: number, sy: number, pivot: Vec): Mat {
  return [sx, 0, 0, sy, pivot[0] * (1 - sx), pivot[1] * (1 - sy)];
}

export function apply(m: Mat, p: Vec): Vec {
  return [m[0] * p[0] + m[2] * p[1] + m[4], m[1] * p[0] + m[3] * p[1] + m[5]];
}

function linear(m: Mat, v: Vec): Vec {
  return [m[0] * v[0] + m[2] * v[1], m[1] * v[0] + m[3] * v[1]];
}

export function transformShape(shape: Shape, m: Mat): Shape {
  const radius = Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2]));
  switch (shape.kind) {
    case 'ellipse': {
      const a = (shape.rot * Math.PI) / 180;
      const u = linear(m, [Math.cos(a) * shape.r[0], Math.sin(a) * shape.r[0]]);
      const v = linear(m, [-Math.sin(a) * shape.r[1], Math.cos(a) * shape.r[1]]);
      return {
        kind: 'ellipse',
        c: apply(m, shape.c),
        r: [Math.hypot(u[0], u[1]), Math.hypot(v[0], v[1])],
        rot: (Math.atan2(u[1], u[0]) * 180) / Math.PI,
      };
    }
    case 'limb':
      return {
        kind: 'limb',
        a: apply(m, shape.a),
        b: apply(m, shape.b),
        ra: shape.ra * radius,
        rb: shape.rb * radius,
      };
    case 'curve':
      return {
        kind: 'curve',
        pts: shape.pts.map((p) => apply(m, p)),
        ra: shape.ra * radius,
        rb: shape.rb * radius,
      };
    case 'poly': {
      const tilt = linear(m, shape.tilt);
      const k = radius || 1;
      return {
        kind: 'poly',
        pts: shape.pts.map((p) => apply(m, p)),
        bevel: shape.bevel * radius,
        tilt: [tilt[0] / k, tilt[1] / k],
      };
    }
  }
}
