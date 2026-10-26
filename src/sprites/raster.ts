/**
 * Rastert eine Sprite-Definition zu Pixel-Art:
 * 1. Teile nach Ansicht/Pose transformieren und nach Tiefe sortieren,
 * 2. Abdeckung pro Pixel (2×2-Abtastung) mit Besitzer, Normale und Randabstand,
 * 3. Licht von links oben → 2–4 Töne pro Material, Schlagschatten vorderer Teile,
 *    dunkle Innenlinien zwischen Teilen, Glanzpunkte,
 * 4. 1-Pixel-Außenlinie.
 * Rein funktional und deterministisch – läuft im Browser und in Node.
 */
import { hexToRgb, makeRamp, shade, type Rgb } from './color.ts';
import type { Part, SpriteDef } from './model.ts';
import {
  IDENTITY,
  compose,
  prepareShape,
  rotate,
  scale,
  transformShape,
  translate,
  type Mat,
  type PreparedShape,
  type Sample,
  type Vec,
} from './shapes.ts';

export const DESIGN_SIZE = 64;
/** Rand um das Entwurfsraster, damit Angriffspose, Schweben und Schwänze nie abgeschnitten werden. */
export const FRAME_MARGIN = 8;
/** Kantenlänge eines Animationsbilds im Spritesheet (1 Einheit = 1 Pixel). */
export const FRAME_SIZE = DESIGN_SIZE + 2 * FRAME_MARGIN;
export const FRAME_VIEWPORT = { x: -FRAME_MARGIN, y: -FRAME_MARGIN, size: FRAME_SIZE } as const;

export interface SpriteImage {
  readonly width: number;
  readonly height: number;
  /** RGBA, zeilenweise. */
  readonly data: Uint8ClampedArray;
}

export type SpriteView = 'front' | 'back';
export type SpritePose = 'idle' | 'attack';

export interface RenderOptions {
  /** Ausgabegröße in Pixeln (quadratisch). Standard 64. */
  readonly size?: number;
  readonly view?: SpriteView;
  readonly pose?: SpritePose;
  /** Phase der Leerlauf-Animation (0–1). */
  readonly phase?: number;
  /** Ausschnitt: linke obere Ecke und Größe in Entwurfseinheiten (Standard: ganzes Raster). */
  readonly viewport?: { readonly x: number; readonly y: number; readonly size: number };
  /** Nur die Silhouette in Schwarz (Qualitätskontrolle). */
  readonly silhouette?: boolean;
}

// Licht von links oben vorn.
const LIGHT = normalize3(-0.45, -0.65, 0.75);
const HALF = normalize3(LIGHT[0], LIGHT[1], LIGHT[2] + 1);

function normalize3(x: number, y: number, z: number): [number, number, number] {
  const len = Math.hypot(x, y, z);
  return [x / len, y / len, z / len];
}

const DEFAULT_WHITE = '#f8f5ec';
const DEFAULT_EYE = '#3b2f52';

interface Resolved {
  ramps: Map<string, Rgb[]>;
  outline: Rgb;
  white: Rgb;
  ground: number;
}

const resolvedCache = new WeakMap<SpriteDef, Resolved>();

function parseRamp(value: string | readonly string[]): Rgb[] {
  if (typeof value !== 'string') return value.map(hexToRgb);
  const [hex = '#ff00ff', tones] = value.split(':');
  const count = tones === '2' ? 2 : tones === '3' ? 3 : 4;
  return makeRamp(hex, count);
}

function resolve(def: SpriteDef): Resolved {
  const cached = resolvedCache.get(def);
  if (cached) return cached;
  const ramps = new Map<string, Rgb[]>();
  for (const [key, value] of Object.entries(def.palette)) ramps.set(key, parseRamp(value));
  const body = ramps.get('body') ?? [hexToRgb('#808080')];
  const outline = def.outline
    ? hexToRgb(def.outline)
    : shade(body[0] ?? hexToRgb('#404040'), -0.75);
  const white = ramps.get('white')?.[0] ?? hexToRgb(DEFAULT_WHITE);
  ramps.set('ink', [outline]);
  ramps.set('white', [white]);
  if (!ramps.has('eye')) ramps.set('eye', [hexToRgb(DEFAULT_EYE)]);
  let ground = 0;
  for (const p of def.parts) ground = Math.max(ground, prepareShape(p.shape).bbox[3]);
  const result: Resolved = { ramps, outline, white, ground };
  resolvedCache.set(def, result);
  return result;
}

interface Instance {
  readonly part: Part;
  readonly shape: PreparedShape;
  readonly cuts: readonly PreparedShape[];
  readonly z: number;
  readonly mat: string;
  readonly group: string;
  readonly lines: boolean;
}

const MIRROR: Mat = [-1, 0, 0, 1, DESIGN_SIZE, 0];

function partMatrix(part: Part, mirrored: boolean, phase: number, pose: SpritePose): Mat {
  let m: Mat = mirrored ? MIRROR : IDENTITY;
  const anim = part.anim;
  if (!anim) return m;
  const pivot: Vec = anim.pivot
    ? mirrored
      ? [DESIGN_SIZE - anim.pivot[0], anim.pivot[1]]
      : anim.pivot
    : [DESIGN_SIZE / 2, DESIGN_SIZE / 2];
  const wave = Math.sin(2 * Math.PI * (phase + (anim.phase ?? 0)));
  const dir = mirrored ? -1 : 1;
  if (pose === 'idle') {
    if (anim.sway) m = compose(m, rotate(anim.sway * wave * dir, pivot));
    if (anim.bob) m = compose(m, translate(0, anim.bob * wave));
  } else {
    if (anim.attackRot) m = compose(m, rotate(anim.attackRot * dir, pivot));
    if (anim.attackShift) m = compose(m, translate(anim.attackShift[0] * dir, anim.attackShift[1]));
  }
  return m;
}

function globalMatrix(def: SpriteDef, ground: number, phase: number, pose: SpritePose): Mat {
  const wave = Math.sin(2 * Math.PI * phase);
  const pivot: Vec = [DESIGN_SIZE / 2, ground];
  let m: Mat = IDENTITY;
  if (pose === 'idle') {
    const breathe = def.breathe ?? 0.03;
    m = compose(m, scale(1 - breathe * wave * 0.3, 1 + breathe * wave, pivot));
    if (def.float) m = compose(m, translate(0, -def.float * (wave + 1) * 0.5));
  } else {
    m = compose(m, rotate(-(def.lean ?? 7), pivot));
    m = compose(m, translate(-2, 0));
    if (def.float) m = compose(m, translate(0, -def.float));
  }
  return m;
}

function buildInstances(def: SpriteDef, view: SpriteView, pose: SpritePose, phase: number) {
  const { ground } = resolve(def);
  let global = globalMatrix(def, ground, phase, pose);
  if (view === 'back') global = compose(global, MIRROR);
  const instances: Instance[] = [];
  def.parts.forEach((part) => {
    if (part.view && part.view !== view) return;
    const copies = part.mirror ? [false, true] : [false];
    for (const mirrored of copies) {
      const m = compose(partMatrix(part, mirrored, phase, pose), global);
      const mat = view === 'back' ? (part.backMat ?? part.mat) : part.mat;
      instances.push({
        part,
        shape: prepareShape(transformShape(part.shape, m)),
        cuts: (part.cut ?? []).map((cut) => prepareShape(transformShape(cut, m))),
        z: view === 'back' ? (part.backZ ?? part.z) : part.z,
        mat,
        group: part.group ?? mat,
        lines: part.lines ?? part.clip === undefined,
      });
    }
  });
  // Stabile Sortierung nach Tiefe.
  return instances
    .map((instance, order) => ({ instance, order }))
    .sort((a, b) => a.instance.z - b.instance.z || a.order - b.order)
    .map((entry) => entry.instance);
}

const SUBSAMPLES: readonly Vec[] = [
  [0.25, 0.25],
  [0.75, 0.25],
  [0.25, 0.75],
  [0.75, 0.75],
];

function toneLevel(instance: Instance, sample: Sample): number {
  const shading = instance.part.shading ?? 'round';
  if (shading === 'flat') return 2;
  if (shading === 'glow') return sample.edge < 0.5 ? 3 : sample.edge < 0.82 ? 2 : 1;
  const d = sample.nx * LIGHT[0] + sample.ny * LIGHT[1] + sample.nz * LIGHT[2];
  if (d >= 0.9) return 3;
  if (d >= 0.52) return 2;
  if (d >= 0.2) return 1;
  return 0;
}

/** Welche Rampenstufe ein Lichtniveau (0 tief … 3 Licht) bei 1–4 Tönen bekommt. */
const TONE_MAP: Readonly<Record<number, readonly number[]>> = {
  1: [0, 0, 0, 0],
  2: [0, 0, 1, 1],
  3: [0, 0, 1, 2],
  4: [0, 1, 2, 3],
};

function rampColor(ramp: readonly Rgb[], level: number): Rgb {
  const map = TONE_MAP[Math.min(4, ramp.length)] ?? [0, 1, 2, 3];
  const index = map[Math.min(3, Math.max(0, level))] ?? 0;
  return ramp[index] ?? ramp[0] ?? [255, 0, 255];
}

export function renderSprite(def: SpriteDef, options: RenderOptions = {}): SpriteImage {
  const size = options.size ?? DESIGN_SIZE;
  const view = options.view ?? 'front';
  const pose = options.pose ?? 'idle';
  const phase = options.phase ?? 0;
  const viewport = options.viewport ?? { x: 0, y: 0, size: DESIGN_SIZE };
  const unit = viewport.size / size;
  const resolved = resolve(def);
  const instances = buildInstances(def, view, pose, phase);

  const count = size * size;
  const owner = new Int16Array(count).fill(-1);
  const nx = new Float32Array(count);
  const ny = new Float32Array(count);
  const nz = new Float32Array(count);
  const edge = new Float32Array(count);
  const sample: Sample = { nx: 0, ny: 0, nz: 1, edge: 0 };

  instances.forEach((instance, index) => {
    const [bx0, by0, bx1, by1] = instance.shape.bbox;
    const px0 = Math.max(0, Math.floor((bx0 - viewport.x) / unit) - 1);
    const py0 = Math.max(0, Math.floor((by0 - viewport.y) / unit) - 1);
    const px1 = Math.min(size - 1, Math.ceil((bx1 - viewport.x) / unit) + 1);
    const py1 = Math.min(size - 1, Math.ceil((by1 - viewport.y) / unit) + 1);
    const clip = instance.part.clip;
    for (let py = py0; py <= py1; py++) {
      for (let px = px0; px <= px1; px++) {
        const i = py * size + px;
        if (clip !== undefined) {
          const current = owner[i] ?? -1;
          const target = current >= 0 ? instances[current] : undefined;
          if (!target || (target.part.id !== clip && target.group !== clip)) continue;
        }
        let hits = 0;
        for (let k = 0; k < SUBSAMPLES.length && hits < 2; k++) {
          const [sx, sy] = SUBSAMPLES[k] ?? [0.5, 0.5];
          const ux = viewport.x + (px + sx) * unit;
          const uy = viewport.y + (py + sy) * unit;
          if (!instance.shape.inside(ux, uy)) {
            // Nach zwei Fehlschlägen sind höchstens noch zwei Treffer möglich.
            if (k - hits >= 2) break;
            continue;
          }
          let cut = false;
          for (const shape of instance.cuts) {
            if (shape.inside(ux, uy)) {
              cut = true;
              break;
            }
          }
          if (!cut) hits++;
        }
        if (hits < 2) continue;
        instance.shape.sample(
          viewport.x + (px + 0.5) * unit,
          viewport.y + (py + 0.5) * unit,
          sample,
        );
        owner[i] = index;
        nx[i] = sample.nx;
        ny[i] = sample.ny;
        nz[i] = sample.nz;
        edge[i] = sample.edge;
      }
    }
  });

  const data = new Uint8ClampedArray(count * 4);
  const put = (i: number, rgb: Rgb, alpha: number): void => {
    data[i * 4] = rgb[0];
    data[i * 4 + 1] = rgb[1];
    data[i * 4 + 2] = rgb[2];
    data[i * 4 + 3] = alpha;
  };
  const ownerAt = (px: number, py: number): number =>
    px < 0 || py < 0 || px >= size || py >= size ? -1 : (owner[py * size + px] ?? -1);
  const shadowReach = Math.max(1, Math.round(size / 40));

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const i = py * size + px;
      const index = owner[i] ?? -1;
      if (index < 0) continue;
      const instance = instances[index];
      if (!instance) continue;
      const alpha = Math.round((instance.part.alpha ?? 1) * 255);
      if (options.silhouette) {
        put(i, [0, 0, 0], 255);
        continue;
      }
      const ramp = resolved.ramps.get(instance.mat) ?? [hexToRgb('#ff00ff')];
      sample.nx = nx[i] ?? 0;
      sample.ny = ny[i] ?? 0;
      sample.nz = nz[i] ?? 1;
      sample.edge = edge[i] ?? 0;
      let level = toneLevel(instance, sample) + (instance.part.tone ?? 0);

      // Schlagschatten: Ein weiter vorn liegendes Teil zwischen Pixel und Licht verdunkelt.
      if (instance.part.shading !== 'glow') {
        for (let k = 1; k <= shadowReach; k++) {
          const caster = ownerAt(px - k, py - k);
          const other = caster >= 0 ? instances[caster] : undefined;
          if (other && other.z > instance.z && other.group !== instance.group && other.lines) {
            level -= 1;
            break;
          }
        }
      }

      // Innenlinie: Rand zu einem dahinterliegenden Teil einer anderen Gruppe.
      let line = false;
      if (instance.lines) {
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ] as const) {
          const neighbor = ownerAt(px + dx, py + dy);
          const other = neighbor >= 0 ? instances[neighbor] : undefined;
          if (other && other.z < instance.z && other.group !== instance.group) {
            line = true;
            break;
          }
        }
      }

      let color = line ? rampColor(ramp, Math.min(level, 0)) : rampColor(ramp, level);
      if (!line && instance.part.gloss) {
        const spec = sample.nx * HALF[0] + sample.ny * HALF[1] + sample.nz * HALF[2];
        if (spec > 0.975) color = resolved.white;
      }
      put(i, color, alpha);
    }
  }

  // Außenlinie: leere Pixel neben dem Sprite (4er-Nachbarschaft).
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const i = py * size + px;
      if ((owner[i] ?? -1) >= 0) continue;
      let alpha = 0;
      let glowRamp: readonly Rgb[] | undefined;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ] as const) {
        const neighbor = ownerAt(px + dx, py + dy);
        if (neighbor < 0) continue;
        const other = instances[neighbor];
        if (!other) continue;
        alpha = Math.max(alpha, Math.round((other.part.alpha ?? 1) * 255));
        if (other.part.shading === 'glow') glowRamp = resolved.ramps.get(other.mat);
      }
      if (alpha === 0) continue;
      if (options.silhouette) put(i, [0, 0, 0], 255);
      else put(i, glowRamp ? rampColor(glowRamp, 0) : resolved.outline, alpha);
    }
  }

  return { width: size, height: size, data };
}

/** Umgebendes Rechteck der sichtbaren Pixel [x0, y0, x1, y1] (inklusive), oder null. */
export function opaqueBounds(image: SpriteImage): [number, number, number, number] | null {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      if ((image.data[(y * image.width + x) * 4 + 3] ?? 0) === 0) continue;
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
    }
  }
  return x1 < 0 ? null : [x0, y0, x1, y1];
}
