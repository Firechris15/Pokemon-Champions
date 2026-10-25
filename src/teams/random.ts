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

/** Statusattacken, die zur Werteverteilung passen (Verstärkung, Heilung). */
const STATUS_PREFERENCES: Record<Profile, readonly string[]> = {
  physical: ['kampfgeist', 'schaerfeblick', 'drohgebruell', 'kreischen'],
  special: ['sammlung', 'selbstheilung'],
  mixed: ['drohgebruell', 'selbstheilung', 'panzerung'],
};

/** Unterstützung, die ein Team trägt (Initiative-Kontrolle, Schutzwände, Status, Felder …). */
const SUPPORT_MOVES: readonly string[] = [
  'aufwind',
  'raumverzerrung',
  'prallschild',
  'aetherschild',
  'polarschleier',
  'lockruf',
  'beistand',
  'partnerheilung',
  'spott',
  'echozwang',
  'starrfunke',
  'schlafsporen',
  'brandzeichen',
  'faeulnisgift',
  'giftnebel',
  'gaukelspiel',
  'splitterfalle',
  'dornensaat',
  'trugbild',
  'seelenfluch',
  'schattenbann',
  'sonnenbann',
  'wolkenruf',
  'staubruf',
  'frostruf',
  'funkenfeld',
  'bluetenfeld',
  'sternenfeld',
  'psifeld',
];

/** Nur im Doppel sinnvoll. */
const DOUBLES_ONLY: ReadonlySet<string> = new Set([
  'partnerheilung',
  'beistand',
  'lockruf',
  'platztausch',
  'bastion',
  'vorsichtswall',
]);

/** Items, die Statusattacken ausschließen bzw. auf eine Attacke festlegen. */
const ATTACK_ONLY_ITEMS: ReadonlySet<string> = new Set([
  'fixband',
  'fixbrille',
  'fixschal',
  'kampfweste',
]);

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
  const usable = (move: MoveData) => doubles || !DOUBLES_ONLY.has(move.id);
  // 2) Im Doppel oft Schutzschild – das wichtigste Werkzeug im Doppelkampf.
  const protect = learnable.find((move) => move.id === 'schutzschild');
  if (doubles && protect && rng.float() < 0.45) take(protect);
  // 3) Raumverzerrungs-Monster bringen ihre Raumverzerrung mit.
  if (species.roles.includes('trickRoom'))
    take(learnable.find((move) => move.id === 'raumverzerrung'));
  // 4) Unterstützung bzw. passende Verstärkung (Unterstützer öfter).
  const supportChance = species.roles.includes('support') ? 0.8 : 0.3;
  if (rng.float() < supportChance) {
    const support = learnable.filter((move) => SUPPORT_MOVES.includes(move.id) && usable(move));
    const boosting = learnable.filter((move) => STATUS_PREFERENCES[profile].includes(move.id));
    const pool =
      species.roles.includes('support') && support.length > 0 ? support : [...support, ...boosting];
    if (pool.length > 0) take(rng.pick(pool));
  }
  // 5) Abdeckung: neue Essenzen bevorzugen.
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
  options: { doubles: boolean; level: number; items?: readonly string[] },
): MonsterSet {
  const profile = profileOf(species);
  const tank = isTank(species);
  const moves = pickMoves(dex, species, rng, options.doubles);
  const set: MonsterSet = {
    species: species.id,
    level: options.level,
    ability: rng.pick(species.abilities),
    moves,
    nature: natureFor(species, profile, tank),
    evs: evsFor(species, profile, tank),
    ivs: {},
  };
  // Erstes passendes Item aus der (bereits gemischten) Kandidatenliste.
  const hasStatus = moves.some((id) => dex.move(id).category === 'status');
  const item = options.items?.find((id) => !(hasStatus && ATTACK_ONLY_ITEMS.has(id)));
  if (item !== undefined) set.item = item;
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
  const available = rng.shuffle(dex.data.items.map((item) => item.id));
  return picks.map((species) => {
    const items = format.rules.itemClause ? available : rng.shuffle([...available]);
    const set = randomSet(dex, species, rng, {
      doubles: format.activePerSide > 1,
      level: format.level,
      items,
    });
    // Item-Klausel: jedes Item nur einmal.
    if (format.rules.itemClause && set.item !== undefined)
      available.splice(available.indexOf(set.item), 1);
    return set;
  });
}
