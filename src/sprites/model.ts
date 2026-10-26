/**
 * Sprite-Definitionen: Jedes Monster besteht aus geschichteten Grundformen (Körper, Kopf, Augen,
 * Gliedmaßen, Schwanz, Muster) mit Material aus einer begrenzten Palette. Der Rasterizer
 * (`raster.ts`) macht daraus Pixel-Art mit Licht, Schattierung, Innen- und Außenlinien.
 *
 * Entwurfsraster: 64×64 Einheiten, x nach rechts, y nach unten. Frontansicht schaut nach links
 * (Richtung eigener Seite); die Rückansicht entsteht automatisch (gespiegelt, Gesicht ausgeblendet).
 */
import type { Shape, Vec } from './shapes.ts';

export type { Shape, Vec } from './shapes.ts';

/**
 * Schattierung einer Form:
 * - `round`: plastisch nach der Form (Kugel/Zylinder), Standard
 * - `bevel`: flache Fläche mit abgerundeten Kanten (Platten, Kristalle, Blätter)
 * - `glow`: leuchtet von innen (hell in der Mitte, kein Schatten) – Flammen, Lichter, Funken
 * - `flat`: nur der Grundton (Muster, Abzeichen)
 */
export type Shading = 'round' | 'bevel' | 'glow' | 'flat';

export interface PartAnim {
  /** Zusätzliches Auf und Ab im Leerlauf (Einheiten). */
  readonly bob?: number;
  /** Pendeln im Leerlauf (Grad) um `pivot` – Flügel, Schwänze, Ohren. */
  readonly sway?: number;
  readonly pivot?: Vec;
  /** Phasenversatz 0–1 gegenüber dem Atemrhythmus. */
  readonly phase?: number;
  /** Angriffspose: Drehung (Grad) um `pivot` und Versatz. */
  readonly attackRot?: number;
  readonly attackShift?: Vec;
}

export interface Part {
  readonly shape: Shape;
  /** Palettenschlüssel (Farbrampe). Eingebaut: `ink` (Linienfarbe), `white`, `eye`. */
  readonly mat: string;
  /** Zeichenreihenfolge: höher = weiter vorn. */
  readonly z: number;
  /** Name für `clip`. */
  readonly id?: string;
  /** Teile derselben Gruppe verschmelzen ohne Innenlinie (Standard: Material). */
  readonly group?: string;
  /** Ausgeschnittene Formen (Maul, Löcher, Sicheln). */
  readonly cut?: readonly Shape[];
  /** Nur dort zeichnen, wo bereits Teile mit dieser `id`/`group` liegen (Muster, Bauch). */
  readonly clip?: string;
  readonly shading?: Shading;
  /** Innenlinien zu dahinterliegenden Teilen (Standard: ja, bei `clip` nein). */
  readonly lines?: boolean;
  /** Nur in dieser Ansicht sichtbar (Gesicht nur vorn, Rückenmuster nur hinten). */
  readonly view?: 'front' | 'back';
  /** Zeichenreihenfolge in der Rückansicht (Schwanz und Flügel kommen nach vorn). */
  readonly backZ?: number;
  /** Material in der Rückansicht (z. B. Bauch → Körperfarbe). */
  readonly backMat?: string;
  /** Zusätzlich an der Mittelachse x = 32 gespiegelt zeichnen (symmetrische Teile). */
  readonly mirror?: boolean;
  /** Deckkraft 0–1 (Geister, Flammenränder). */
  readonly alpha?: number;
  /** Glanzpunkt (Metall, Kristall, Panzer). */
  readonly gloss?: boolean;
  /** Tonverschiebung: −1 = eine Stufe dunkler (ferne Gliedmaßen), +1 heller. */
  readonly tone?: number;
  readonly anim?: PartAnim;
}

export interface SpriteDef {
  /**
   * Farbrampen: `'#rrggbb'` = 4 Töne, `'#rrggbb:3'` bzw. `:2` = weniger Töne,
   * oder eine eigene Liste von dunkel nach hell.
   */
  readonly palette: Readonly<Record<string, string | readonly string[]>>;
  /** Außenlinie (Standard: sehr dunkler Ton der Körperfarbe). */
  readonly outline?: string;
  /** Schwebt: Auf-und-ab-Amplitude in Einheiten. */
  readonly float?: number;
  /** Atem-Streckung im Leerlauf (Standard 0,03). */
  readonly breathe?: number;
  /** Vorbeugen in der Angriffspose in Grad (Standard 7). */
  readonly lean?: number;
  readonly parts: readonly Part[];
}

// ───────────────────────────── Bausteine ─────────────────────────────

/** Ellipse: Mittelpunkt, Halbachsen, Drehung in Grad. */
export function oval(x: number, y: number, rx: number, ry = rx, rot = 0): Shape {
  return { kind: 'ellipse', c: [x, y], r: [rx, ry], rot };
}

/** Verjüngte Kapsel von (x1, y1) nach (x2, y2). */
export function limb(x1: number, y1: number, x2: number, y2: number, ra: number, rb = ra): Shape {
  return { kind: 'limb', a: [x1, y1], b: [x2, y2], ra, rb };
}

/** Bézier-Schlauch aus Punkten [x1, y1, x2, y2, …] (3 oder 4 Punkte). */
export function curve(points: readonly number[], ra: number, rb = ra): Shape {
  return { kind: 'curve', pts: pairs(points), ra, rb };
}

/** Polygon aus [x1, y1, x2, y2, …]; `bevel` rundet die Kanten, `tilt` neigt die Fläche. */
export function poly(points: readonly number[], bevel = 2, tilt: Vec = [0, 0]): Shape {
  return { kind: 'poly', pts: pairs(points), bevel, tilt };
}

/** Spitze (Horn, Stachel, Kralle) von der Basis-Mitte (bx, by) mit Breite w zur Spitze (tx, ty). */
export function spike(bx: number, by: number, tx: number, ty: number, w: number, bevel = 1): Shape {
  const dx = tx - bx;
  const dy = ty - by;
  const len = Math.hypot(dx, dy) || 1;
  const px = (-dy / len) * (w / 2);
  const py = (dx / len) * (w / 2);
  return poly([bx + px, by + py, tx, ty, bx - px, by - py], bevel);
}

/** Stern mit `points` Zacken (Funkeln, Abzeichen). */
export function star(x: number, y: number, r: number, points = 4, inner = 0.38, rot = 0): Shape {
  const values: number[] = [];
  for (let i = 0; i < points * 2; i++) {
    const angle = ((rot - 90) * Math.PI) / 180 + (i * Math.PI) / points;
    const radius = i % 2 === 0 ? r : r * inner;
    values.push(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
  }
  return poly(values, 0.6);
}

/** Gebogene Spitze: Basis (bx, by), Kontrollpunkt (cx, cy), Spitze (tx, ty), Basisradius r. */
export function horn(
  bx: number,
  by: number,
  cx: number,
  cy: number,
  tx: number,
  ty: number,
  r: number,
): Shape {
  return curve([bx, by, cx, cy, tx, ty], r, 0.35);
}

function pairs(values: readonly number[]): Vec[] {
  const out: Vec[] = [];
  for (let i = 0; i + 1 < values.length; i += 2) out.push([values[i] ?? 0, values[i + 1] ?? 0]);
  return out;
}

export type PartOptions = Omit<Part, 'shape' | 'mat' | 'z'>;

export function part(shape: Shape, mat: string, z: number, options: PartOptions = {}): Part {
  return { shape, mat, z, ...options };
}

export interface EyeOptions {
  /** Irisfarbe (Palettenschlüssel, Standard `eye`). */
  readonly iris?: string;
  /** Blickrichtung der Pupille (Einheiten). */
  readonly look?: Vec;
  /** Form: rund, schmal (Schlitz), leuchtend (ohne Pupille), Knopfauge (nur dunkel). */
  readonly style?: 'round' | 'slit' | 'glow' | 'button';
  /** Lid von oben (0–1): 0 = offen, 0.4 = grimmig. */
  readonly lid?: number;
  /** Neigung des Lids in Grad (positiv = innen tiefer, „böse“). */
  readonly lidTilt?: number;
  /** Lidfarbe (Standard: `body`). */
  readonly lidMat?: string;
  readonly mirror?: boolean;
  readonly z?: number;
}

/** Auge aus Augapfel, Iris, Pupille und Lichtpunkt – nur in der Frontansicht. */
export function eye(
  x: number,
  y: number,
  rx: number,
  ry: number,
  options: EyeOptions = {},
): Part[] {
  const z = options.z ?? 50;
  const look = options.look ?? [-0.6, 0];
  const style = options.style ?? 'round';
  const base: PartOptions = {
    view: 'front',
    lines: false,
    ...(options.mirror ? { mirror: true } : {}),
  };
  const parts: Part[] = [];
  const id = `eye@${x},${y}`;
  if (style === 'glow') {
    parts.push(
      part(oval(x, y, rx, ry), options.iris ?? 'eye', z, {
        ...base,
        id,
        group: id,
        shading: 'glow',
      }),
    );
  } else if (style === 'button') {
    parts.push(part(oval(x, y, rx, ry), 'ink', z, { ...base, id, group: id, shading: 'flat' }));
    parts.push(
      part(oval(x - rx * 0.35, y - ry * 0.4, rx * 0.38, ry * 0.38), 'white', z + 0.2, {
        ...base,
        shading: 'flat',
      }),
    );
  } else {
    parts.push(part(oval(x, y, rx, ry), 'white', z, { ...base, id, group: id, shading: 'flat' }));
    const ix = x + look[0];
    const iy = y + look[1];
    const irx = style === 'slit' ? rx * 0.7 : rx * 0.72;
    parts.push(
      part(oval(ix, iy, irx, ry * 0.8), options.iris ?? 'eye', z + 0.1, {
        ...base,
        shading: 'flat',
        clip: id,
      }),
    );
    parts.push(
      part(
        style === 'slit' ? oval(ix, iy, rx * 0.2, ry * 0.7) : oval(ix, iy, rx * 0.36, ry * 0.42),
        'ink',
        z + 0.2,
        { ...base, shading: 'flat', clip: id },
      ),
    );
    parts.push(
      part(oval(ix - rx * 0.32, iy - ry * 0.38, rx * 0.22, ry * 0.22), 'white', z + 0.3, {
        ...base,
        shading: 'flat',
        clip: id,
      }),
    );
  }
  if (options.lid !== undefined && options.lid > 0) {
    const tilt = options.lidTilt ?? 0;
    const top = y - ry - 1;
    const cut = y - ry + 2 * ry * options.lid;
    parts.push(
      part(
        poly(
          [
            x - rx - 1,
            top,
            x + rx + 1,
            top,
            x + rx + 1,
            cut + (tilt * rx) / 30,
            x - rx - 1,
            cut - (tilt * rx) / 30,
          ],
          0,
        ),
        options.lidMat ?? 'body',
        z + 0.4,
        { ...base, shading: 'flat', clip: id },
      ),
    );
  }
  return parts;
}

/** Flamme/Tropfen: Basis (x, y), Breite r, Höhe h, Neigung der Spitze (Einheiten). */
export function flame(x: number, y: number, r: number, h: number, lean = 0): Shape {
  return curve([x, y, x + lean * 0.2, y - h * 0.55, x + lean, y - h], r, 0.25);
}

/**
 * Flughaut: Schulter (sx, sy), Fingerspitzen [x1, y1, x2, y2, …] von vorn nach hinten,
 * Ansatz am Körper (bx, by). Liefert Haut (mit Bögen zwischen den Spitzen) und Knochen.
 */
export function wing(
  shoulder: Vec,
  tips: readonly number[],
  base: Vec,
  mat: string,
  bone: string,
  z: number,
  options: PartOptions = {},
): Part[] {
  const points = pairs(tips);
  const outline = [shoulder[0], shoulder[1], ...tips, base[0], base[1]];
  const cuts: Shape[] = [];
  for (let i = 0; i + 1 < points.length; i++) {
    const a = points[i] ?? shoulder;
    const b = points[i + 1] ?? shoulder;
    const mx = (a[0] + b[0]) / 2;
    const my = (a[1] + b[1]) / 2;
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    // Bogen nach außen: Kreis jenseits der Verbindungslinie (vom Körper weg).
    const ox = mx - shoulder[0];
    const oy = my - shoulder[1];
    const olen = Math.hypot(ox, oy) || 1;
    const r = len * 0.42;
    cuts.push(oval(mx + (ox / olen) * r * 0.75, my + (oy / olen) * r * 0.75, r, r));
  }
  const parts: Part[] = [part(poly(outline, 2.5), mat, z, { ...options, cut: cuts })];
  for (const tip of points) {
    parts.push(
      part(limb(shoulder[0], shoulder[1], tip[0], tip[1], 1.3, 0.6), bone, z + 0.05, {
        ...options,
        group: `${bone}@wing${z}`,
      }),
    );
  }
  return parts;
}
