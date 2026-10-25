/**
 * Datenschema für Inhalte (Monster, Attacken, Fähigkeiten, Items, Wesen, Formate) und der `Dex`,
 * über den die Engine darauf zugreift. Die Engine kennt keine konkreten Inhalte – sie bekommt
 * einen Dex übergeben (Standard: `src/data/index.ts`, in Tests auch eigene Mini-Daten).
 */
import type { TypeChart } from '../data/typechart.ts';
import type { BattleContext, EffectHooks } from './effects.ts';
import type { BoostTable, StatId, StatTable, StatusId, TypeId } from './model.ts';
import type { ConditionState, Mon } from './state.ts';

export type MoveCategory = 'physical' | 'special' | 'status';

/**
 * Zielarten laut SPEC 3.2: ein angrenzendes Ziel, beide Gegner, alle anderen (inkl. Partner),
 * Partner, selbst, eigene Seite, gegnerische Seite, ganzes Feld, zufälliger Gegner.
 */
export type MoveTarget =
  | 'normal'
  | 'allAdjacentFoes'
  | 'allAdjacent'
  | 'adjacentAlly'
  | 'self'
  | 'allySide'
  | 'foeSide'
  | 'all'
  | 'randomFoe';

/** Zielarten, bei denen der Spieler ein Ziel auswählt. */
export const CHOSEN_TARGETS: readonly MoveTarget[] = ['normal', 'adjacentAlly'];

/** Animations-Vorlagen: jede Attacke verweist auf eine, statt einzeln animiert zu werden. */
export type AnimationPreset =
  | 'projectile'
  | 'beam'
  | 'explosion'
  | 'aura'
  | 'wave'
  | 'melee'
  | 'multi'
  | 'statUp'
  | 'statDown'
  | 'heal'
  | 'field';

export interface MoveFlags {
  readonly contact?: true;
  readonly sound?: true;
  readonly punch?: true;
  readonly bite?: true;
  readonly pulse?: true;
  /** Pulver/Sporen: wirkungslos gegen Flora-Monster und die Sturmbrille. */
  readonly powder?: true;
}

export interface SecondaryEffect {
  /** Wahrscheinlichkeit in Prozent. */
  readonly chance: number;
  readonly boosts?: Partial<BoostTable>;
  readonly selfBoosts?: Partial<BoostTable>;
  readonly status?: StatusId;
  readonly volatile?: string;
}

export type Fraction = readonly [numerator: number, denominator: number];

export interface MoveData {
  readonly id: string;
  readonly name: string;
  readonly type: TypeId;
  readonly category: MoveCategory;
  /** 0 bei Statusattacken und festem Schaden. */
  readonly power: number;
  /** `true` = trifft immer. */
  readonly accuracy: number | true;
  readonly pp: number;
  /** −7 bis +5. */
  readonly priority: number;
  readonly target: MoveTarget;
  readonly flags: MoveFlags;
  readonly description: string;
  readonly animation: { readonly preset: AnimationPreset; readonly color?: string };

  /** Anzahl Treffer: fest oder Spanne (2–5 folgt der klassischen Verteilung). */
  readonly multihit?: number | readonly [min: number, max: number];
  /** Rückstoß als Anteil am verursachten Schaden. */
  readonly recoil?: Fraction;
  /** Heilung als Anteil am verursachten Schaden. */
  readonly drain?: Fraction;
  /** Heilung als Anteil der max. LP des Ziels (Statusattacken). */
  readonly heal?: Fraction;
  /** Fester Schaden; `'level'` = Level des Anwenders. */
  readonly fixedDamage?: number | 'level';
  /** Zusätzliche Volltreffer-Stufen. */
  readonly critStage?: number;
  /** Statusattacken: Stufenänderung am Ziel (bzw. am Anwender bei `target: 'self'`). */
  readonly boosts?: Partial<BoostTable>;
  /** Garantierte Stufenänderung am Anwender nach dem Treffer (z. B. Verteidigung −1). */
  readonly selfBoosts?: Partial<BoostTable>;
  readonly secondaries?: readonly SecondaryEffect[];
  /** Ohne Essenz: kein Gleicher-Typ-Bonus, immer neutral. */
  readonly typeless?: true;
  /** Rückstoß von 1/4 der eigenen max. LP (Notattacke ohne AP). */
  readonly struggleRecoil?: true;
  /** Nicht im Teambuilder wählbar (z. B. die Notattacke). */
  readonly unlearnable?: true;

  /** Statusattacke: verursacht dieses Statusproblem beim Ziel. */
  readonly status?: StatusId;
  /** Statusattacke: flüchtiger Zustand beim Ziel (bei `target: 'self'` beim Anwender). */
  readonly volatile?: string;
  /** Seiteneffekt für `allySide`/`foeSide`. */
  readonly sideCondition?: string;
  /** Wetter, Feld oder Feldeffekt für `target: 'all'`. */
  readonly weather?: string;
  readonly terrain?: string;
  readonly field?: string;
  /** Schutz-Attacke: Erfolgschance sinkt bei Wiederholung (1 → 1/3 → 1/9 …). */
  readonly stalling?: true;
  /** Wechselt den Anwender nach dem Treffer aus. */
  readonly pivot?: true;
  /** Zwei-Runden-Attacke: erst aufladen, dann angreifen. */
  readonly charge?: true;
  /** Bei diesem Wetter entfällt das Aufladen. */
  readonly chargeSkipWeather?: string;
  /** Funktioniert nur in der ersten Runde nach dem Einwechseln. */
  readonly firstTurnOnly?: true;
  /** Nur bei diesem Wetter einsetzbar. */
  readonly requiresWeather?: string;
  /** Tauscht die Position mit dem Partner. */
  readonly allySwap?: true;
  /** Entfernt Fallen von der eigenen Seite. */
  readonly clearOwnHazards?: true;
  /** Doppelte Stärke, wenn der Anwender in dieser Runde schon getroffen wurde. */
  readonly revenge?: true;
}

export type Role =
  | 'physicalSweeper'
  | 'specialSweeper'
  | 'mixed'
  | 'tank'
  | 'support'
  | 'priority'
  | 'setup'
  | 'weather'
  | 'trickRoom'
  | 'speedControl'
  | 'redirect';

export interface SpeciesData {
  readonly id: string;
  readonly name: string;
  readonly types: readonly [TypeId] | readonly [TypeId, TypeId];
  readonly baseStats: Readonly<StatTable>;
  /** 1–3 mögliche Fähigkeiten. */
  readonly abilities: readonly string[];
  /** Lernbare Attacken (15–40). */
  readonly learnset: readonly string[];
  readonly weightKg: number;
  readonly heightM: number;
  /** Kurzer Kompendium-Text. */
  readonly lore: string;
  readonly roles: readonly Role[];
  /** Starke Legenden sind nur im freien Format erlaubt. */
  readonly legendary?: true;
  /** Entwicklungslinie (nur Lore, kein Leveln). */
  readonly evolution?: { readonly from?: string; readonly into?: readonly string[] };
}

export interface AbilityData extends EffectHooks {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  /** Schwebt: gilt nicht als „am Boden“ (Felder, Fallen). */
  readonly floating?: true;
  /** Brandmal halbiert den physischen Schaden nicht. */
  readonly ignoresBurnPenalty?: true;
  /** Gegner können keine Beeren essen, solange dieses Monster auf dem Feld ist. */
  readonly preventsBerries?: true;
}

export interface ItemData extends EffectHooks {
  readonly id: string;
  readonly name: string;
  readonly description: string;
}

export type ConditionKind = 'status' | 'volatile' | 'side' | 'weather' | 'terrain' | 'field';

/**
 * Zustände: Statusprobleme, flüchtige Zustände, Seiteneffekte, Wetter, Felder und Feldeffekte.
 * Ihre Hooks wirken auf das jeweils betroffene Monster (siehe `effects.ts`).
 */
export interface ConditionData extends EffectHooks {
  readonly id: string;
  readonly name: string;
  readonly kind: ConditionKind;
  readonly description: string;
  /** Dauer in Runden, gezählt am Rundenende (die Startrunde zählt mit). */
  readonly duration?: number;
  /** Zufällige Dauer (inklusive). */
  readonly durationRange?: readonly [number, number];
  /** Trägt der Verursacher dieses Item, gilt `extendedDuration`. */
  readonly extendedBy?: string;
  readonly extendedDuration?: number;
  /** Kein Ereignis beim Beginn/Ende (z. B. Schutz, Zurückschrecken). */
  readonly silentStart?: true;
  readonly silentEnd?: true;
  /** Essenzen, die gegen dieses Statusproblem immun sind. */
  readonly immuneTypes?: readonly TypeId[];
  /** Reihenfolge der `onBeforeMove`-Prüfungen (höher = früher). */
  readonly beforeMoveOrder?: number;
  /** Fallen: wie oft stapelbar. */
  readonly maxLayers?: number;
  readonly hazard?: true;
  /** Schutzwand gegen physische, spezielle oder alle Attacken. */
  readonly screen?: 'physical' | 'special' | 'both';
  /** Endet, wenn der Verursacher das Feld verlässt. */
  readonly endsWithSource?: true;
  /** Wetter: Schadensfaktor für eine Attacke (z. B. Glut ×1,5 in der Gleißsonne). */
  weatherDamage?(move: MoveData): number | undefined;
  /** Beim Beginn (Status/flüchtiger Zustand): Zustand vorbereiten; `false` = schlägt fehl. */
  onConditionStart?(
    ctx: BattleContext,
    holder: Mon,
    state: ConditionState,
    source: Mon | undefined,
  ): boolean | undefined;
}

export interface NatureData {
  readonly id: string;
  readonly name: string;
  readonly plus: Exclude<StatId, 'hp'> | null;
  readonly minus: Exclude<StatId, 'hp'> | null;
}

export interface FormatRules {
  /** Jedes Monster nur einmal pro Team. */
  readonly speciesClause: boolean;
  /** Jedes Item nur einmal pro Team. */
  readonly itemClause: boolean;
  /** Legenden verboten. */
  readonly noLegendary: boolean;
}

export interface FormatData {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly gameType: 'singles' | 'doubles';
  /** Monster gleichzeitig auf dem Feld pro Seite. */
  readonly activePerSide: 1 | 2;
  readonly minTeamSize: number;
  readonly maxTeamSize: number;
  /** Wie viele Monster nach der Team-Vorschau kämpfen (die ersten `activePerSide` starten). */
  readonly pickCount: number;
  /** Level, auf das alle Monster gesetzt werden. */
  readonly level: number;
  readonly teamPreview: boolean;
  readonly rules: FormatRules;
  /** Beide Seiten bekommen automatisch generierte Teams. */
  readonly randomTeams?: true;
  /** Optionaler Rundentimer in Sekunden (wird von UI/Server durchgesetzt). */
  readonly turnTimerSeconds?: number;
}

export interface DexData {
  readonly species: readonly SpeciesData[];
  readonly moves: readonly MoveData[];
  readonly abilities: readonly AbilityData[];
  readonly items: readonly ItemData[];
  readonly natures: readonly NatureData[];
  readonly formats: readonly FormatData[];
  readonly conditions: readonly ConditionData[];
  readonly typeChart: TypeChart;
  /** Essenzen, die nie „am Boden“ sind (Felder, Fallen). */
  readonly floatingTypes: readonly TypeId[];
}

function indexById<T extends { readonly id: string }>(
  kind: string,
  entries: readonly T[],
): Map<string, T> {
  const map = new Map<string, T>();
  for (const entry of entries) {
    if (map.has(entry.id)) throw new Error(`Doppelte ${kind}-ID: ${entry.id}`);
    map.set(entry.id, entry);
  }
  return map;
}

function lookup<T>(kind: string, map: ReadonlyMap<string, T>, id: string): T {
  const entry = map.get(id);
  if (!entry) throw new Error(`Unbekannte ${kind}-ID: ${id}`);
  return entry;
}

export class Dex {
  readonly typeChart: TypeChart;
  readonly data: DexData;
  private readonly speciesById: Map<string, SpeciesData>;
  private readonly movesById: Map<string, MoveData>;
  private readonly abilitiesById: Map<string, AbilityData>;
  private readonly itemsById: Map<string, ItemData>;
  private readonly naturesById: Map<string, NatureData>;
  private readonly formatsById: Map<string, FormatData>;
  private readonly conditionsById: Map<string, ConditionData>;

  constructor(data: DexData) {
    this.data = data;
    this.typeChart = data.typeChart;
    this.speciesById = indexById('Monster', data.species);
    this.movesById = indexById('Attacken', data.moves);
    this.abilitiesById = indexById('Fähigkeiten', data.abilities);
    this.itemsById = indexById('Item', data.items);
    this.naturesById = indexById('Wesen', data.natures);
    this.formatsById = indexById('Format', data.formats);
    this.conditionsById = indexById('Zustands', data.conditions);
  }

  species(id: string): SpeciesData {
    return lookup('Monster', this.speciesById, id);
  }
  move(id: string): MoveData {
    return lookup('Attacken', this.movesById, id);
  }
  ability(id: string): AbilityData {
    return lookup('Fähigkeiten', this.abilitiesById, id);
  }
  item(id: string): ItemData {
    return lookup('Item', this.itemsById, id);
  }
  nature(id: string): NatureData {
    return lookup('Wesen', this.naturesById, id);
  }
  format(id: string): FormatData {
    return lookup('Format', this.formatsById, id);
  }
  condition(id: string): ConditionData {
    return lookup('Zustands', this.conditionsById, id);
  }

  hasSpecies(id: string): boolean {
    return this.speciesById.has(id);
  }
  hasMove(id: string): boolean {
    return this.movesById.has(id);
  }
  hasAbility(id: string): boolean {
    return this.abilitiesById.has(id);
  }
  hasItem(id: string): boolean {
    return this.itemsById.has(id);
  }
  hasNature(id: string): boolean {
    return this.naturesById.has(id);
  }
  hasCondition(id: string): boolean {
    return this.conditionsById.has(id);
  }
}
