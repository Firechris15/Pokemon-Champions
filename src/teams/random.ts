/**
 * Zufallsteams mit sinnvollen Sets (SPEC 6.3 / Zufallskampf): passende Attacken zur Werteverteilung,
 * Gleicher-Typ-Attacken zuerst, dann Abdeckung, passende Wesen und EVs.
 * Deterministisch über den übergebenen Seed-Zufallsgenerator.
 */
import type { Dex, FormatData, MoveData, SpeciesData } from '../engine/dex.ts';
import type { MonsterSet, StatTable, TypeId } from '../engine/model.ts';
import type { Rng } from '../engine/rng.ts';

type Profile = 'physical' | 'special' | 'mixed';

function profileOf(species: SpeciesData): Profile {
  const { atk, spa } = species.baseStats;
  if (atk >= spa * 1.15) return 'physical';
  if (spa >= atk * 1.15) return 'special';
  return 'mixed';
}

function isTank(species: SpeciesData): boolean {
  const { hp, def, spd, spe } = species.baseStats;
  return species.roles.includes('tank') || (hp + def + spd) / 3 > spe * 1.6;
}

/** Grobe Einschätzung der Stärke einer Schadensattacke für dieses Monster. */
function moveScore(
  move: MoveData,
  species: SpeciesData,
  profile: Profile,
  doubles: boolean,
): number {
  if (move.category === 'status') return 0;
  let power = move.power;
  if (move.multihit !== undefined) {
    power *=
      typeof move.multihit === 'number' ? move.multihit : (move.multihit[0] + move.multihit[1]) / 2;
  }
  if (move.fixedDamage !== undefined) power = 65;
  let score = power * (move.accuracy === true ? 1 : move.accuracy / 100);
  if (species.types.includes(move.type)) score *= 1.5;
  if (profile !== 'mixed' && move.category !== profile) score *= 0.45;
  if (move.recoil) score *= 0.9;
  if (move.selfBoosts) score *= 0.9;
  if (move.priority > 0) score *= 1.1;
  if (doubles && (move.target === 'allAdjacentFoes' || move.target === 'allAdjacent')) {
    score *= move.target === 'allAdjacentFoes' ? 1.15 : 0.95;
  }
  return score;
}

/** Zieht ohne Zurücklegen, gewichtet nach Punktzahl (bevorzugt starke, lässt aber Abwechslung zu). */
function weightedPick<T>(rng: Rng, items: readonly { item: T; weight: number }[]): T | undefined {
  const total = items.reduce((sum, entry) => sum + Math.max(0, entry.weight), 0);
  if (total <= 0) return items[0]?.item;
  let roll = rng.float() * total;
  for (const entry of items) {
    roll -= Math.max(0, entry.weight);
    if (roll <= 0) return entry.item;
  }
  return items[items.length - 1]?.item;
}

const STATUS_PREFERENCES: Record<Profile, readonly string[]> = {
  physical: ['kampfgeist', 'drohgebruell', 'kreischen'],
  special: ['sammlung', 'selbstheilung'],
  mixed: ['drohgebruell', 'selbstheilung', 'partnerheilung', 'panzerung'],
};

function pickMoves(dex: Dex, species: SpeciesData, rng: Rng, doubles: boolean): string[] {
  const profile = profileOf(species);
  const learnable = species.learnset.map((id) => dex.move(id)).filter((move) => !move.unlearnable);
  const damaging = learnable
    .map((move) => ({ move, score: moveScore(move, species, profile, doubles) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  const chosen: MoveData[] = [];
  const coveredTypes = new Set<TypeId>();
  const take = (move: MoveData | undefined): void => {
    if (!move || chosen.includes(move) || chosen.length >= 4) return;
    chosen.push(move);
    coveredTypes.add(move.type);
  };

  // 1) Je eigener Essenz eine starke Attacke.
  for (const type of species.types) {
    const options = damaging.filter((entry) => entry.move.type === type).slice(0, 3);
    take(
      weightedPick(
        rng,
        options.map((entry) => ({ item: entry.move, weight: entry.score })),
      ),
    );
  }
  // 2) Manchmal eine passende Statusattacke (Unterstützer öfter).
  const supportChance = species.roles.includes('support') ? 0.7 : 0.3;
  if (rng.float() < supportChance) {
    const status = learnable.filter(
      (move) => move.category === 'status' && STATUS_PREFERENCES[profile].includes(move.id),
    );
    if (!doubles) {
      const index = status.findIndex((move) => move.id === 'partnerheilung');
      if (index >= 0) status.splice(index, 1);
    }
    if (status.length > 0) take(rng.pick(status));
  }
  // 3) Abdeckung: neue Essenzen bevorzugen.
  while (chosen.length < 4) {
    const options = damaging
      .filter((entry) => !chosen.includes(entry.move))
      .map((entry) => ({
        item: entry.move,
        weight: entry.score * (coveredTypes.has(entry.move.type) ? 0.25 : 1),
      }))
      .slice(0, 8);
    const next = weightedPick(rng, options);
    if (!next) break;
    take(next);
  }
  return chosen.map((move) => move.id);
}

function natureFor(species: SpeciesData, profile: Profile, tank: boolean): string {
  const fast = species.baseStats.spe >= 90;
  if (tank) {
    if (profile === 'special')
      return species.baseStats.def < species.baseStats.spd ? 'standhaft' : 'fromm';
    return species.baseStats.def < species.baseStats.spd ? 'besonnen' : 'guetig';
  }
  if (profile === 'physical') return fast ? 'verspielt' : 'verbissen';
  if (profile === 'special') return fast ? 'flink' : 'gruebler';
  return fast ? 'ungeduldig' : 'launisch';
}

function evsFor(species: SpeciesData, profile: Profile, tank: boolean): Partial<StatTable> {
  const attack = profile === 'special' ? 'spa' : 'atk';
  if (tank) {
    const weaker = species.baseStats.def <= species.baseStats.spd ? 'def' : 'spd';
    return { hp: 252, [weaker]: 252, [attack]: 4 };
  }
  return { [attack]: 252, spe: 252, hp: 4 };
}

export function randomSet(
  dex: Dex,
  species: SpeciesData,
  rng: Rng,
  options: { doubles: boolean; level: number; item?: string },
): MonsterSet {
  const profile = profileOf(species);
  const tank = isTank(species);
  const set: MonsterSet = {
    species: species.id,
    level: options.level,
    ability: rng.pick(species.abilities),
    moves: pickMoves(dex, species, rng, options.doubles),
    nature: natureFor(species, profile, tank),
    evs: evsFor(species, profile, tank),
    ivs: {},
  };
  if (options.item !== undefined) set.item = options.item;
  return set;
}

/** Ein ganzes Zufallsteam, das die Regeln des Formats einhält. */
export function randomTeam(
  dex: Dex,
  format: FormatData,
  rng: Rng,
  size = format.maxTeamSize,
): MonsterSet[] {
  const pool = dex.data.species.filter(
    (species) => !(format.rules.noLegendary && species.legendary),
  );
  const picks = rng.shuffle([...pool]).slice(0, Math.min(size, pool.length));
  const items = rng.shuffle(dex.data.items.map((item) => item.id));
  return picks.map((species, index) => {
    const item = format.rules.itemClause ? items[index] : rng.pick(items);
    return randomSet(dex, species, rng, {
      doubles: format.activePerSide > 1,
      level: format.level,
      ...(item === undefined ? {} : { item }),
    });
  });
}
