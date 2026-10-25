/**
 * Schadensformel (reine Funktionen). Engine, KI und Schadensrechner nutzen genau diesen Code.
 * Modifikatoren sind 4096-basierte Festkommazahlen wie im Vorbild (4096 = 1×) und werden
 * „halb abrunden“ angewendet. Reihenfolge laut SPEC 3.3:
 * Fläche → Wetter → Volltreffer → Zufall → Gleicher Typ → Typeffektivität → Verbrennung →
 * Schutzwände → Items/Fähigkeiten.
 */

export const MOD_ONE = 4096;
export const MOD_SPREAD = 3072; // 0,75
export const MOD_CRIT = 6144; // 1,5
export const MOD_STAB = 6144; // 1,5
export const MOD_BURN = 2048; // 0,5
export const MOD_SCREEN_SINGLES = 2048; // 1/2
export const MOD_SCREEN_DOUBLES = 2732; // 2/3

/** Wandelt einen Faktor (z. B. 1.3) in einen 4096er-Modifikator um. */
export function toMod(multiplier: number): number {
  return Math.round(multiplier * MOD_ONE);
}

/** Wendet einen Modifikator an (rundet bei genau ,5 ab). */
export function modify(value: number, mod: number): number {
  return Math.trunc((value * mod + 2047) / MOD_ONE);
}

/** Verkettet mehrere Modifikatoren zu einem. */
export function chainMods(mods: Iterable<number>): number {
  let result = MOD_ONE;
  for (const mod of mods) result = Math.trunc((result * mod + 2048) / MOD_ONE);
  return result;
}

/** Grundschaden: ⌊⌊⌊2·L/5 + 2⌋ · Stärke · A/V⌋ / 50⌋ + 2. */
export function baseDamage(level: number, power: number, attack: number, defense: number): number {
  const levelFactor = Math.floor((2 * level) / 5 + 2);
  return Math.floor(Math.floor((levelFactor * power * attack) / Math.max(1, defense)) / 50) + 2;
}

export interface DamageModifiers {
  /** Flächenattacke mit mehr als einem Ziel. */
  readonly spread: boolean;
  readonly weather: number;
  readonly crit: boolean;
  /** Gleicher-Typ-Bonus (MOD_STAB oder MOD_ONE; Fähigkeiten können ihn ändern). */
  readonly stab: number;
  /** Typeffektivität als Faktor (0, 0.25, 0.5, 1, 2, 4). */
  readonly effectiveness: number;
  /** Verbrennung halbiert physischen Schaden. */
  readonly burn: boolean;
  readonly screen: number;
  /** Verkettete Item-/Fähigkeits-Modifikatoren. */
  readonly final: number;
}

export const NEUTRAL_MODIFIERS: DamageModifiers = {
  spread: false,
  weather: MOD_ONE,
  crit: false,
  stab: MOD_ONE,
  effectiveness: 1,
  burn: false,
  screen: MOD_ONE,
  final: MOD_ONE,
};

export const MIN_ROLL = 85;
export const MAX_ROLL = 100;

/** Wendet alle Modifikatoren für einen Zufallswurf (85–100) auf den Grundschaden an. */
export function applyDamageModifiers(base: number, mods: DamageModifiers, roll: number): number {
  if (mods.effectiveness === 0) return 0;
  let damage = base;
  if (mods.spread) damage = modify(damage, MOD_SPREAD);
  damage = modify(damage, mods.weather);
  if (mods.crit) damage = modify(damage, MOD_CRIT);
  damage = Math.floor((damage * roll) / 100);
  damage = modify(damage, mods.stab);
  if (mods.effectiveness > 1) damage = damage * mods.effectiveness;
  else if (mods.effectiveness < 1) damage = Math.floor(damage * mods.effectiveness);
  if (mods.burn) damage = modify(damage, MOD_BURN);
  if (!mods.crit) damage = modify(damage, mods.screen);
  damage = modify(damage, mods.final);
  return Math.max(1, damage);
}

/** Alle 16 möglichen Schadenswerte (Würfe 85–100), aufsteigend. */
export function damageRolls(base: number, mods: DamageModifiers): number[] {
  const rolls: number[] = [];
  for (let roll = MIN_ROLL; roll <= MAX_ROLL; roll++)
    rolls.push(applyDamageModifiers(base, mods, roll));
  return rolls;
}

/** Volltreffer-Chance pro Stufe: Basis 1/24, Stufe 1: 1/8, Stufe 2: 1/2, ab Stufe 3 immer. */
export function critDenominator(stage: number): number {
  if (stage <= 0) return 24;
  if (stage === 1) return 8;
  if (stage === 2) return 2;
  return 1;
}
