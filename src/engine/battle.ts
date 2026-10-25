/**
 * Der Kampf: nimmt Entscheidungen entgegen, löst Runden auf und schreibt Ereignisse.
 * Deterministisch: gleicher Seed + gleiche Entscheidungen = exakt gleicher Kampf.
 *
 * Ablauf einer Runde: Aktionen in `state.queue` → nacheinander ausführen (vor jeder Aktion neu sortiert)
 * → ggf. Pause für einen Wechsel mitten in der Runde (`state.pivot`) → Rundenende (Wetter, Rest-Effekte,
 * Dauern) → Ersatz für Besiegte → nächste Runde.
 */
import type {
  ActionChoice,
  Choice,
  ChoiceResult,
  PositionRequest,
  PreviewEntry,
  Request,
} from './choices.ts';
import { deepClone } from './clone.ts';
import {
  MAX_ROLL,
  MIN_ROLL,
  MOD_ONE,
  MOD_SCREEN_DOUBLES,
  MOD_SCREEN_SINGLES,
  MOD_STAB,
  NEUTRAL_MODIFIERS,
  applyDamageModifiers,
  baseDamage,
  chainMods,
  critDenominator,
  damageRolls,
  modify,
  toMod,
} from './damage.ts';
import type { DamageModifiers } from './damage.ts';
import { CHOSEN_TARGETS } from './dex.ts';
import type { ConditionData, Dex, FormatData, MoveData, MoveTarget } from './dex.ts';
import type { ActiveMove, BattleContext, EffectHooks } from './effects.ts';
import type {
  BattleEvent,
  DamageCause,
  EffectKind,
  EffectRef,
  EndReason,
  HealCause,
} from './events.ts';
import { BOOST_IDS, emptyBoosts, otherSide } from './model.ts';
import type {
  BoostTable,
  MonRef,
  MonsterSet,
  PositionRef,
  SideIndex,
  StatusId,
  TypeId,
} from './model.ts';
import { Rng } from './rng.ts';
import type {
  BattleState,
  ConditionState,
  InputRecord,
  Mon,
  QueuedAction,
  SideState,
} from './state.ts';
import { accuracyFraction, applyBoost, calcStats, clampBoost } from './stats.ts';
import { effectiveness } from './typechart.ts';

/** Notattacke, wenn keine Attacke mehr einsetzbar ist. */
export const STRUGGLE_MOVE_ID = 'verzweifler';
/** Schutz vor Endloskämpfen. */
export const TURN_LIMIT = 300;

/** Zustände, die die Engine selbst kennt (müssen im Dex existieren). */
export const ENGINE_CONDITIONS = {
  lockedMove: 'lockedmove',
  encore: 'encore',
  substitute: 'substitute',
  trickRoom: 'raumverzerrung',
} as const;

export interface SideSetup {
  name: string;
  team: readonly MonsterSet[];
}

export interface BattleOptions {
  dex: Dex;
  formatId: string;
  seed: string;
  sides: readonly [SideSetup, SideSetup];
}

/** Alles, was zum exakten Nachspielen eines Kampfes nötig ist. */
export interface ReplayData {
  version: 1;
  formatId: string;
  seed: string;
  sides: [SideSetup, SideSetup];
  inputs: InputRecord[];
}

export interface DamagePreview {
  /** 16 mögliche Schadenswerte (aufsteigend); bei Immunität alle 0. */
  rolls: number[];
  effectiveness: number;
  immune: boolean;
}

interface ActiveEffect {
  hooks: EffectHooks;
  ref: EffectRef;
  /** Reihenfolge für `onBeforeMove` (höher = früher). */
  order: number;
}

interface HitResult {
  hit: boolean;
  damage: number;
}

const MISSED: HitResult = { hit: false, damage: 0 };
const FIELD_TARGETS: readonly MoveTarget[] = ['allySide', 'foeSide', 'all'];
/** Reihenfolge der Rest-Effekte am Rundenende (Wetter läuft vorher separat). */
const RESIDUAL_ORDER: readonly EffectKind[] = [
  'terrain',
  'item',
  'status',
  'volatile',
  'ability',
  'side',
];
const CONFUSION_POWER = 40;

function ref(mon: Mon): MonRef {
  return { side: mon.side, index: mon.index };
}

function createMon(
  dex: Dex,
  format: FormatData,
  side: SideIndex,
  index: number,
  set: MonsterSet,
): Mon {
  const species = dex.species(set.species);
  const level = Math.min(set.level ?? format.level, format.level);
  const stats = calcStats(species, set, dex.nature(set.nature), level);
  return {
    side,
    index,
    set,
    species: species.id,
    name: set.nickname ?? species.name,
    level,
    types: [...species.types],
    stats,
    maxHp: stats.hp,
    hp: stats.hp,
    boosts: emptyBoosts(),
    moves: set.moves.map((id) => {
      const move = dex.move(id);
      return { id, pp: move.pp, maxPp: move.pp };
    }),
    ability: set.ability,
    item: set.item ?? null,
    position: null,
    fainted: false,
    activeTurns: 0,
    lastMove: null,
    revealed: false,
    status: null,
    statusState: {},
    volatiles: {},
    protectStreak: 0,
    hurtThisTurn: false,
    movedThisTurn: false,
    entries: 0,
  };
}

export class Battle implements BattleContext {
  readonly dex: Dex;
  readonly format: FormatData;
  readonly state: BattleState;
  readonly rng: Rng;
  /** Wer ein Monster in der laufenden Aktion zuletzt per Attacke getroffen hat (für „nach K.O.“). */
  private readonly lastAttacker = new Map<Mon, Mon>();

  private constructor(dex: Dex, state: BattleState) {
    this.dex = dex;
    this.state = state;
    this.format = dex.format(state.formatId);
    this.rng = new Rng(state.rng);
  }

  // ───────────────────────────── Erzeugen, Klonen, Replays ─────────────────────────────

  static create(options: BattleOptions): Battle {
    const { dex, formatId, seed, sides } = options;
    const format = dex.format(formatId);
    sides.forEach((side, index) => {
      const size = side.team.length;
      if (size < format.minTeamSize || size > format.maxTeamSize) {
        throw new Error(
          `Seite ${index}: Team hat ${size} Monster, Format erlaubt ${format.minTeamSize}–${format.maxTeamSize}`,
        );
      }
      for (const set of side.team) createMon(dex, format, 0, 0, set); // wirft bei unbekannten IDs
    });
    const makeSide = (index: SideIndex, setup: SideSetup): SideState => ({
      index,
      name: setup.name,
      preview: setup.team.map((set) => deepClone(set)),
      team: [],
      active: Array.from({ length: format.activePerSide }, () => null),
      conditions: {},
    });
    const state: BattleState = {
      formatId,
      seed,
      rng: Rng.fromSeed(seed).getState(),
      turn: 0,
      phase: 'teamPreview',
      sides: [makeSide(0, sides[0]), makeSide(1, sides[1])],
      field: { weather: null, terrain: null, effects: {} },
      queue: [],
      pivot: null,
      pending: [null, null],
      winner: undefined,
      log: [],
      inputs: [],
    };
    const battle = new Battle(dex, state);
    battle.log({ type: 'battle_start', format: formatId, seed });
    if (format.teamPreview) {
      battle.log({ type: 'team_preview', pick: battle.pickCount(0) });
    } else {
      for (const side of [0, 1] as const) {
        const order = Array.from({ length: battle.pickCount(side) }, (_, i) => i);
        battle.applyTeamOrder(side, order);
      }
      battle.start();
    }
    battle.syncRng();
    return battle;
  }

  /** Setzt einen gespeicherten Zustand fort (z. B. auf einem Server oder für die KI). */
  static restore(dex: Dex, state: BattleState): Battle {
    return new Battle(dex, deepClone(state));
  }

  /** Spielt einen Kampf aus Seed, Teams und Entscheidungen exakt nach. */
  static replay(dex: Dex, replay: ReplayData): Battle {
    const battle = Battle.create({
      dex,
      formatId: replay.formatId,
      seed: replay.seed,
      sides: replay.sides,
    });
    for (const input of replay.inputs) {
      const result = battle.choose(input.side, input.choice);
      if (!result.ok) throw new Error(`Replay ungültig: ${result.error}`);
    }
    return battle;
  }

  snapshot(): BattleState {
    this.syncRng();
    return deepClone(this.state);
  }

  clone(): Battle {
    return new Battle(this.dex, this.snapshot());
  }

  toReplay(): ReplayData {
    const setup = (side: SideState): SideSetup => ({
      name: side.name,
      team: deepClone(side.preview),
    });
    return {
      version: 1,
      formatId: this.state.formatId,
      seed: this.state.seed,
      sides: [setup(this.state.sides[0]), setup(this.state.sides[1])],
      inputs: deepClone(this.state.inputs),
    };
  }

  // ───────────────────────────── Lesender Zugriff ─────────────────────────────

  get ended(): boolean {
    return this.state.phase === 'ended';
  }

  get winner(): SideIndex | null | undefined {
    return this.state.winner;
  }

  get events(): readonly BattleEvent[] {
    return this.state.log;
  }

  mon(monRef: MonRef): Mon {
    const mon = this.state.sides[monRef.side].team[monRef.index];
    if (!mon) throw new Error(`Unbekanntes Monster ${monRef.side}/${monRef.index}`);
    return mon;
  }

  monAt(position: PositionRef): Mon | null {
    const side = this.state.sides[position.side];
    const index = side.active[position.position];
    if (index === null || index === undefined) return null;
    return side.team[index] ?? null;
  }

  activeFoes(mon: Mon): Mon[] {
    return this.activeOn(otherSide(mon.side));
  }

  activeAllies(mon: Mon): Mon[] {
    return this.activeOn(mon.side).filter((other) => other !== mon);
  }

  /** Positionen, die eine Attacke mit dieser Zielart von `position` aus wählen kann. */
  validTargets(side: SideIndex, position: number, target: MoveTarget): PositionRef[] {
    const user = this.monAt({ side, position });
    if (!user) return [];
    const toRef = (mon: Mon): PositionRef => ({ side: mon.side, position: mon.position ?? 0 });
    if (target === 'normal')
      return [...this.activeFoes(user), ...this.activeAllies(user)].map(toRef);
    if (target === 'adjacentAlly') return this.activeAllies(user).map(toRef);
    return [];
  }

  /** Aktuelle Initiative inkl. Stufen und Effekten. */
  getSpeed(mon: Mon): number {
    const speed = applyBoost(mon.stats.spe, mon.boosts.spe);
    return modify(
      speed,
      this.chain(mon, (e) => e.onModifySpeed?.(this, mon)),
    );
  }

  effectiveness(moveType: TypeId, target: Mon): number {
    return effectiveness(this.dex.typeChart, moveType, target.types);
  }

  isGrounded(mon: Mon): boolean {
    if (mon.types.some((type) => this.dex.data.floatingTypes.includes(type))) return false;
    return !this.dex.ability(mon.ability).floating;
  }

  weather(): string | null {
    return this.state.field.weather?.id ?? null;
  }

  terrain(): string | null {
    return this.state.field.terrain?.id ?? null;
  }

  sideCondition(side: SideIndex, id: string): ConditionState | undefined {
    return this.state.sides[side].conditions[id];
  }

  /**
   * Alle 16 möglichen Schadenswerte einer Attacke – ohne Zufall und ohne den Zustand zu ändern.
   * Grundlage für KI und Schadensrechner.
   */
  calculateDamage(
    attacker: Mon,
    defender: Mon,
    move: MoveData,
    options: { crit?: boolean; spread?: boolean } = {},
  ): DamagePreview {
    const active = this.activeMove(move, move.priority, options.spread ?? false);
    const eff = this.moveEffectiveness(active, defender);
    const immune = eff === 0 || this.immunityEffect(defender, attacker, active) !== null;
    if (move.category === 'status' || immune) {
      return {
        rolls: Array.from({ length: 16 }, () => 0),
        effectiveness: immune ? 0 : eff,
        immune,
      };
    }
    if (move.fixedDamage !== undefined) {
      const fixed = move.fixedDamage === 'level' ? attacker.level : move.fixedDamage;
      return { rolls: Array.from({ length: 16 }, () => fixed), effectiveness: eff, immune };
    }
    const { base, mods } = this.damageInputs(attacker, defender, active, {
      crit: options.crit ?? false,
      effectiveness: eff,
    });
    return { rolls: damageRolls(base, mods), effectiveness: eff, immune };
  }

  // ───────────────────────────── Anfragen & Entscheidungen ─────────────────────────────

  getRequest(side: SideIndex): Request {
    const state = this.state;
    if (state.phase === 'ended' || state.pending[side] !== null) return { type: 'wait' };
    switch (state.phase) {
      case 'teamPreview':
        return {
          type: 'teamPreview',
          pick: this.pickCount(side),
          team: state.sides[side].preview.map((set) => this.previewEntry(set, true)),
          opponent: state.sides[otherSide(side)].preview.map((set) =>
            this.previewEntry(set, false),
          ),
        };
      case 'move':
        return {
          type: 'move',
          turn: state.turn,
          positions: state.sides[side].active.map((_, position) =>
            this.positionRequest(side, position),
          ),
        };
      case 'switch': {
        const pivot = state.pivot;
        if (pivot) {
          if (pivot.side !== side) return { type: 'wait' };
          return {
            type: 'switch',
            positions: state.sides[side].active.map((_, position) => position === pivot.position),
            switchable: this.bench(side),
          };
        }
        const needs = this.switchNeeds(side);
        if (!needs.some(Boolean)) return { type: 'wait' };
        return { type: 'switch', positions: needs, switchable: this.bench(side) };
      }
    }
  }

  choose(side: SideIndex, choice: Choice): ChoiceResult {
    if (choice.type === 'forfeit') {
      if (this.ended) return { ok: false, error: 'Der Kampf ist bereits vorbei.' };
      this.state.inputs.push({ side, choice: deepClone(choice) });
      this.log({ type: 'forfeit', side });
      this.end(otherSide(side), 'forfeit');
      this.syncRng();
      return { ok: true };
    }
    const error = this.validateChoice(side, this.getRequest(side), choice);
    if (error) return { ok: false, error };
    this.state.pending[side] = deepClone(choice);
    this.state.inputs.push({ side, choice: deepClone(choice) });
    if (this.getRequest(0).type === 'wait' && this.getRequest(1).type === 'wait') this.resolve();
    this.syncRng();
    return { ok: true };
  }

  // ───────────────────────────── BattleContext (für Effekte) ─────────────────────────────

  log(event: BattleEvent): void {
    this.state.log.push(event);
  }

  damage(
    target: Mon,
    amount: number,
    cause: DamageCause,
    source?: Mon,
    effect?: EffectRef,
  ): number {
    if (target.fainted || target.hp <= 0 || amount <= 0) return 0;
    const applied = Math.min(target.hp, Math.max(1, Math.floor(amount)));
    target.hp -= applied;
    const event: Extract<BattleEvent, { type: 'damage' }> = {
      type: 'damage',
      target: ref(target),
      amount: applied,
      hp: target.hp,
      maxHp: target.maxHp,
      cause,
    };
    if (source) event.source = ref(source);
    if (effect) event.effect = effect;
    this.log(event);
    if (source && cause === 'move') {
      this.lastAttacker.set(target, source);
      if (source.side !== target.side) target.hurtThisTurn = true;
    }
    for (const { hooks } of this.effectsOf(target))
      hooks.onAfterDamageTaken?.(this, target, applied, cause);
    return applied;
  }

  heal(target: Mon, amount: number, cause: HealCause, effect?: EffectRef): number {
    if (target.fainted || target.hp <= 0 || target.hp >= target.maxHp || amount <= 0) return 0;
    const applied = Math.min(target.maxHp - target.hp, Math.max(1, Math.floor(amount)));
    target.hp += applied;
    const event: Extract<BattleEvent, { type: 'heal' }> = {
      type: 'heal',
      target: ref(target),
      amount: applied,
      hp: target.hp,
      maxHp: target.maxHp,
      cause,
    };
    if (effect) event.effect = effect;
    this.log(event);
    return applied;
  }

  boost(target: Mon, boosts: Partial<BoostTable>, source?: Mon): void {
    if (target.fainted || target.hp <= 0) return;
    const wanted: Partial<BoostTable> = { ...boosts };
    for (const { hooks } of this.effectsOf(target))
      hooks.onTryBoost?.(this, target, wanted, source);
    const changes: Partial<BoostTable> = {};
    for (const stat of BOOST_IDS) {
      const delta = wanted[stat];
      if (!delta) continue;
      const current = target.boosts[stat];
      const next = clampBoost(current + delta);
      target.boosts[stat] = next;
      if (next !== current) changes[stat] = next - current;
      this.log({
        type: 'stat_change',
        target: ref(target),
        stat,
        change: next - current,
        attempted: delta,
        stage: next,
      });
    }
    if (Object.keys(changes).length > 0) {
      for (const { hooks } of this.effectsOf(target))
        hooks.onAfterBoost?.(this, target, changes, source);
    }
  }

  showAbility(mon: Mon): void {
    this.log({ type: 'ability', mon: ref(mon), ability: mon.ability });
  }

  useItem(mon: Mon, consume: boolean): void {
    if (!mon.item) return;
    this.log({ type: 'item', mon: ref(mon), item: mon.item, consumed: consume });
    if (consume) mon.item = null;
  }

  canUseBerry(mon: Mon): boolean {
    return !this.activeFoes(mon).some(
      (foe) => this.dex.ability(foe.ability).preventsBerries === true,
    );
  }

  trySetStatus(target: Mon, status: StatusId, source?: Mon): boolean {
    if (target.fainted || target.hp <= 0 || target.status !== null) return false;
    const condition = this.dex.condition(status);
    if (condition.immuneTypes?.some((type) => target.types.includes(type))) return false;
    for (const { hooks } of this.effectsOf(target)) {
      if (hooks.onSetStatus?.(this, target, status, source) === false) return false;
    }
    target.status = status;
    target.statusState = {};
    condition.onConditionStart?.(this, target, target.statusState, source);
    const event: Extract<BattleEvent, { type: 'status_set' }> = {
      type: 'status_set',
      mon: ref(target),
      status,
    };
    if (source && source !== target) event.source = ref(source);
    this.log(event);
    for (const { hooks } of this.effectsOf(target))
      hooks.onAfterSetStatus?.(this, target, status, source);
    return true;
  }

  cureStatus(target: Mon): void {
    if (target.status === null) return;
    const status = target.status;
    target.status = null;
    target.statusState = {};
    this.log({ type: 'status_cure', mon: ref(target), status });
  }

  addVolatile(target: Mon, id: string, source?: Mon, data: Partial<ConditionState> = {}): boolean {
    if (target.fainted || target.hp <= 0 || target.position === null || id in target.volatiles)
      return false;
    const condition = this.dex.condition(id);
    for (const { hooks } of this.effectsOf(target)) {
      if (hooks.onTryAddVolatile?.(this, target, id, source) === false) return false;
    }
    const state: ConditionState = { ...data };
    if (source) state.source = ref(source);
    if (condition.duration !== undefined) state.turns = condition.duration;
    if (condition.durationRange) state.turns = this.rng.int(...condition.durationRange);
    if (condition.onConditionStart?.(this, target, state, source) === false) return false;
    target.volatiles[id] = state;
    if (!condition.silentStart) {
      const event: Extract<BattleEvent, { type: 'volatile_start' }> = {
        type: 'volatile_start',
        mon: ref(target),
        volatile: id,
      };
      if (source && source !== target) event.source = ref(source);
      this.log(event);
    }
    return true;
  }

  removeVolatile(target: Mon, id: string): void {
    if (!(id in target.volatiles)) return;
    const rest = { ...target.volatiles };
    // Zustand bleibt reine Daten: Eintrag aus der Kopie entfernen.
    Reflect.deleteProperty(rest, id);
    target.volatiles = rest;
    if (!this.dex.condition(id).silentEnd)
      this.log({ type: 'volatile_end', mon: ref(target), volatile: id });
  }

  addSideCondition(side: SideIndex, id: string, source?: Mon): boolean {
    const condition = this.dex.condition(id);
    const conditions = this.state.sides[side].conditions;
    const existing = conditions[id];
    if (existing) {
      const layers = existing.layers ?? 1;
      if (!condition.maxLayers || layers >= condition.maxLayers) return false;
      existing.layers = layers + 1;
      this.log({ type: 'side_start', side, condition: id, layers: existing.layers });
      return true;
    }
    const state: ConditionState = {};
    if (condition.maxLayers) state.layers = 1;
    const turns = this.durationFor(condition, source);
    if (turns !== undefined) state.turns = turns;
    if (source) state.source = ref(source);
    conditions[id] = state;
    if (!condition.silentStart) {
      const event: Extract<BattleEvent, { type: 'side_start' }> = {
        type: 'side_start',
        side,
        condition: id,
      };
      if (state.layers !== undefined) event.layers = state.layers;
      this.log(event);
    }
    return true;
  }

  removeSideCondition(side: SideIndex, id: string): void {
    const rest = { ...this.state.sides[side].conditions };
    if (!(id in rest)) return;
    Reflect.deleteProperty(rest, id);
    this.state.sides[side].conditions = rest;
    if (!this.dex.condition(id).silentEnd) this.log({ type: 'side_end', side, condition: id });
  }

  setWeather(id: string, source?: Mon): boolean {
    if (this.weather() === id) return false;
    const turns = this.durationFor(this.dex.condition(id), source) ?? 5;
    this.state.field.weather = { id, turns };
    const event: Extract<BattleEvent, { type: 'weather_start' }> = {
      type: 'weather_start',
      weather: id,
      turns,
    };
    if (source) event.source = ref(source);
    this.log(event);
    return true;
  }

  setTerrain(id: string, source?: Mon): boolean {
    if (this.terrain() === id) return false;
    const turns = this.durationFor(this.dex.condition(id), source) ?? 5;
    this.state.field.terrain = { id, turns };
    const event: Extract<BattleEvent, { type: 'terrain_start' }> = {
      type: 'terrain_start',
      terrain: id,
      turns,
    };
    if (source) event.source = ref(source);
    this.log(event);
    return true;
  }

  /** Feldeffekt an- bzw. (wenn schon aktiv) wieder ausschalten. */
  toggleField(id: string): boolean {
    const effects = { ...this.state.field.effects };
    if (id in effects) {
      Reflect.deleteProperty(effects, id);
      this.state.field.effects = effects;
      this.log({ type: 'field_end', field: id });
      return true;
    }
    const turns = this.dex.condition(id).duration ?? 5;
    effects[id] = { turns };
    this.state.field.effects = effects;
    this.log({ type: 'field_start', field: id, turns });
    return true;
  }

  selfHitDamage(mon: Mon): number {
    const attack = applyBoost(mon.stats.atk, mon.boosts.atk);
    const defense = applyBoost(mon.stats.def, mon.boosts.def);
    const base = baseDamage(mon.level, CONFUSION_POWER, Math.max(1, attack), Math.max(1, defense));
    return applyDamageModifiers(base, NEUTRAL_MODIFIERS, this.rng.int(MIN_ROLL, MAX_ROLL));
  }

  // ───────────────────────────── Ablauf ─────────────────────────────

  private syncRng(): void {
    this.state.rng = this.rng.getState();
  }

  private pickCount(side: SideIndex): number {
    return Math.min(this.format.pickCount, this.state.sides[side].preview.length);
  }

  private previewEntry(set: MonsterSet, own: boolean): PreviewEntry {
    const species = this.dex.species(set.species);
    return {
      species: species.id,
      name: own ? (set.nickname ?? species.name) : species.name,
      level: Math.min(set.level ?? this.format.level, this.format.level),
      item: own ? (set.item ?? null) : null,
    };
  }

  private durationFor(condition: ConditionData, source?: Mon): number | undefined {
    if (source?.item && condition.extendedBy === source.item) {
      return condition.extendedDuration ?? condition.duration;
    }
    return condition.duration;
  }

  private positionRequest(side: SideIndex, position: number): PositionRequest | null {
    const mon = this.monAt({ side, position });
    if (!mon) return null;
    const locked = mon.volatiles[ENGINE_CONDITIONS.lockedMove]?.move;
    const moves = mon.moves.map((slot) => {
      const move = this.dex.move(slot.id);
      const disabled =
        locked !== undefined ? slot.id !== locked : slot.pp <= 0 || this.isMoveDisabled(mon, move);
      return { id: slot.id, pp: slot.pp, maxPp: slot.maxPp, target: move.target, disabled };
    });
    const trapped = locked !== undefined || this.isTrapped(mon);
    return {
      mon: mon.index,
      moves,
      struggle: moves.every((move) => move.disabled),
      switchable: trapped ? [] : this.bench(side),
      trapped,
    };
  }

  private isMoveDisabled(mon: Mon, move: MoveData): boolean {
    return this.effectsOf(mon).some(({ hooks }) => hooks.onDisableMove?.(this, mon, move) === true);
  }

  private isTrapped(mon: Mon): boolean {
    return this.effectsOf(mon).some(({ hooks }) => hooks.onTrapMon?.(this, mon) === true);
  }

  /** Kampffähige Monster auf der Bank. */
  private bench(side: SideIndex): number[] {
    return this.state.sides[side].team
      .filter((mon) => mon.position === null && !mon.fainted)
      .map((mon) => mon.index);
  }

  /** Leere Positionen, die (mangels Ersatz eventuell nur teilweise) gefüllt werden müssen. */
  private switchNeeds(side: SideIndex): boolean[] {
    const hasBench = this.bench(side).length > 0;
    return this.state.sides[side].active.map((index) => hasBench && index === null);
  }

  private activeOn(side: SideIndex): Mon[] {
    const result: Mon[] = [];
    for (const index of this.state.sides[side].active) {
      if (index === null) continue;
      const mon = this.state.sides[side].team[index];
      if (mon && !mon.fainted) result.push(mon);
    }
    return result;
  }

  private allActive(): Mon[] {
    return [...this.activeOn(0), ...this.activeOn(1)];
  }

  private validateChoice(side: SideIndex, request: Request, choice: Choice): string | null {
    switch (request.type) {
      case 'wait':
        return 'Gerade wird keine Entscheidung erwartet.';
      case 'teamPreview': {
        if (choice.type !== 'teamPreview') return 'Erwartet: Team-Vorschau.';
        const { order } = choice;
        if (order.length !== request.pick) return `Genau ${request.pick} Monster wählen.`;
        if (new Set(order).size !== order.length) return 'Jedes Monster nur einmal wählen.';
        if (order.some((i) => !Number.isInteger(i) || i < 0 || i >= request.team.length)) {
          return 'Ungültiger Team-Index.';
        }
        return null;
      }
      case 'move': {
        if (choice.type !== 'move') return 'Erwartet: Aktionen für die aktiven Monster.';
        if (choice.actions.length !== request.positions.length) return 'Eine Aktion pro Position.';
        const switching = new Set<number>();
        for (let position = 0; position < request.positions.length; position++) {
          const error = this.validateAction(
            side,
            position,
            request.positions[position] ?? null,
            choice.actions[position],
            switching,
          );
          if (error) return error;
        }
        return null;
      }
      case 'switch': {
        if (choice.type !== 'switch') return 'Erwartet: Ersatz für leere Positionen.';
        if (choice.switches.length !== request.positions.length) return 'Ein Eintrag pro Position.';
        const chosen = new Set<number>();
        let needed = 0;
        for (let position = 0; position < request.positions.length; position++) {
          const needs = request.positions[position] ?? false;
          const pick = choice.switches[position] ?? null;
          if (needs) needed++;
          if (pick === null) continue;
          if (!needs) return `Position ${position} braucht keinen Ersatz.`;
          if (!request.switchable.includes(pick))
            return `Monster ${pick} kann nicht eingewechselt werden.`;
          if (chosen.has(pick)) return 'Ein Monster kann nur einmal eingewechselt werden.';
          chosen.add(pick);
        }
        if (chosen.size !== Math.min(needed, request.switchable.length)) {
          return 'So viele leere Positionen wie möglich besetzen.';
        }
        return null;
      }
    }
  }

  private validateAction(
    side: SideIndex,
    position: number,
    slot: PositionRequest | null,
    action: ActionChoice | undefined,
    switching: Set<number>,
  ): string | null {
    if (!action) return `Position ${position}: Aktion fehlt.`;
    if (!slot)
      return action.type === 'pass' ? null : `Position ${position}: leer, nur „pass“ erlaubt.`;
    switch (action.type) {
      case 'pass':
        return `Position ${position}: muss handeln.`;
      case 'switch':
        if (!slot.switchable.includes(action.mon))
          return `Monster ${action.mon} kann nicht einwechseln.`;
        if (switching.has(action.mon)) return 'Ein Monster kann nur einmal eingewechselt werden.';
        switching.add(action.mon);
        return null;
      case 'move': {
        if (slot.struggle) return null;
        const option = slot.moves[action.move];
        if (!option) return `Position ${position}: Attacke ${action.move} gibt es nicht.`;
        if (option.disabled) return `Position ${position}: ${option.id} ist nicht einsetzbar.`;
        if (action.target && CHOSEN_TARGETS.includes(option.target)) {
          const valid = this.validTargets(side, position, option.target);
          const ok = valid.some(
            (t) => t.side === action.target?.side && t.position === action.target.position,
          );
          if (!ok) return `Position ${position}: ungültiges Ziel.`;
        }
        return null;
      }
    }
  }

  private resolve(): void {
    const choices = this.state.pending;
    this.state.pending = [null, null];
    switch (this.state.phase) {
      case 'teamPreview':
        for (const side of [0, 1] as const) {
          const choice = choices[side];
          if (choice?.type === 'teamPreview') this.applyTeamOrder(side, choice.order);
        }
        this.start();
        break;
      case 'move':
        this.runTurn(choices);
        break;
      case 'switch':
        if (this.state.pivot) this.resolvePivot(choices);
        else this.runForcedSwitches(choices);
        break;
      case 'ended':
        break;
    }
  }

  private applyTeamOrder(side: SideIndex, order: readonly number[]): void {
    const state = this.state.sides[side];
    state.team = order.map((previewIndex, index) => {
      const set = state.preview[previewIndex];
      if (!set) throw new Error(`Team-Index ${previewIndex} fehlt`);
      return createMon(this.dex, this.format, side, index, set);
    });
  }

  private start(): void {
    const entering: Mon[] = [];
    for (const side of this.state.sides) {
      side.active.forEach((_, position) => {
        const mon = side.team[position];
        if (mon) {
          this.placeMon(mon, position);
          entering.push(mon);
        }
      });
    }
    this.runSwitchInEffects(entering);
    this.checkFaints();
    if (!this.ended) this.beginTurn();
  }

  private beginTurn(): void {
    this.state.turn += 1;
    if (this.state.turn > TURN_LIMIT) {
      this.end(null, 'turnLimit');
      return;
    }
    for (const side of this.state.sides) {
      for (const mon of side.team) {
        mon.hurtThisTurn = false;
        mon.movedThisTurn = false;
      }
    }
    this.state.phase = 'move';
    this.log({ type: 'turn_start', turn: this.state.turn });
  }

  /** Welche Attacke ein Monster mit dieser Wahl tatsächlich einsetzt. */
  private plannedMove(mon: Mon, moveIndex: number): { id: string; struggle: boolean } {
    const locked = mon.volatiles[ENGINE_CONDITIONS.lockedMove]?.move;
    if (locked) return { id: locked, struggle: false };
    const usable = mon.moves.some(
      (slot) => slot.pp > 0 && !this.isMoveDisabled(mon, this.dex.move(slot.id)),
    );
    if (!usable) return { id: STRUGGLE_MOVE_ID, struggle: true };
    return { id: mon.moves[moveIndex]?.id ?? STRUGGLE_MOVE_ID, struggle: false };
  }

  private runTurn(choices: readonly (Choice | null)[]): void {
    const queue: QueuedAction[] = [];
    for (const side of [0, 1] as const) {
      const choice = choices[side];
      if (choice?.type !== 'move') continue;
      choice.actions.forEach((action, position) => {
        const mon = this.monAt({ side, position });
        if (!mon) return;
        const base = { mon: ref(mon), entry: mon.entries, tie: this.rng.float() };
        if (action.type === 'switch') {
          queue.push({ ...base, kind: 'switch', priority: 0, incoming: action.mon });
        } else if (action.type === 'move') {
          const planned = this.plannedMove(mon, action.move);
          const entry: QueuedAction = {
            ...base,
            kind: 'move',
            priority: this.priorityOf(mon, this.dex.move(planned.id)),
            moveIndex: action.move,
          };
          if (planned.struggle) entry.struggle = true;
          if (action.target) entry.target = action.target;
          queue.push(entry);
        }
      });
    }
    this.state.queue = queue;
    this.continueTurn();
  }

  /** Arbeitet die Warteschlange ab; pausiert für Wechsel mitten in der Runde. */
  private continueTurn(): void {
    while (this.state.queue.length > 0) {
      // Initiative wird vor jeder Aktion neu bewertet (Änderungen mitten in der Runde zählen sofort).
      this.sortQueue();
      const action = this.state.queue.shift();
      if (!action) break;
      this.lastAttacker.clear();
      if (action.kind === 'switch') this.runSwitchAction(action);
      else this.runMoveAction(action);
      this.checkFaints();
      if (this.ended) return;
      if (this.state.pivot) {
        this.state.phase = 'switch';
        return;
      }
    }
    this.endTurn();
  }

  /** Wechsel zuerst → Priorität → Initiative (Raumverzerrung: langsam zuerst) → Zufall. */
  private sortQueue(): void {
    const trickRoom = ENGINE_CONDITIONS.trickRoom in this.state.field.effects;
    const speeds = new Map<QueuedAction, number>(
      this.state.queue.map((action) => [action, this.getSpeed(this.mon(action.mon))]),
    );
    this.state.queue.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'switch' ? -1 : 1;
      if (a.priority !== b.priority) return b.priority - a.priority;
      const diff = (speeds.get(b) ?? 0) - (speeds.get(a) ?? 0);
      if (diff !== 0) return trickRoom && a.kind === 'move' ? -diff : diff;
      return a.tie - b.tie;
    });
  }

  private priorityOf(mon: Mon, move: MoveData): number {
    let priority = move.priority;
    for (const { hooks } of this.effectsOf(mon)) {
      priority = hooks.onModifyPriority?.(this, mon, move, priority) ?? priority;
    }
    return priority;
  }

  private endTurn(): void {
    // 1) Wetter: herunterzählen, sonst wirken lassen.
    const weather = this.state.field.weather;
    if (weather) {
      weather.turns -= 1;
      if (weather.turns <= 0) {
        this.state.field.weather = null;
        this.log({ type: 'weather_end', weather: weather.id });
      } else {
        const condition = this.dex.condition(weather.id);
        for (const mon of this.bySpeed(this.allActive())) {
          if (mon.hp > 0) condition.onResidual?.(this, mon);
        }
      }
    }
    // 2) Rest-Effekte pro Monster in Initiative-Reihenfolge.
    for (const mon of this.bySpeed(this.allActive())) {
      const effects = this.effectsOf(mon);
      for (const kind of RESIDUAL_ORDER) {
        for (const effect of effects) {
          if (effect.ref.kind !== kind || mon.hp <= 0) continue;
          effect.hooks.onResidual?.(this, mon);
        }
      }
    }
    // 3) Dauern ablaufen lassen.
    this.tickDurations();
    this.checkFaints();
    if (this.ended) return;
    for (const mon of this.allActive()) mon.activeTurns += 1;
    this.log({ type: 'turn_end', turn: this.state.turn });
    if (this.switchNeeds(0).some(Boolean) || this.switchNeeds(1).some(Boolean)) {
      this.state.phase = 'switch';
    } else {
      this.beginTurn();
    }
  }

  private tickDurations(): void {
    for (const mon of this.allActive()) {
      for (const [id, state] of Object.entries(mon.volatiles)) {
        const condition = this.dex.condition(id);
        if (condition.duration === undefined && !condition.durationRange) continue;
        state.turns = (state.turns ?? 1) - 1;
        if (state.turns <= 0) this.removeVolatile(mon, id);
      }
    }
    for (const side of this.state.sides) {
      for (const [id, state] of Object.entries(side.conditions)) {
        if (state.turns === undefined) continue;
        state.turns -= 1;
        if (state.turns <= 0) this.removeSideCondition(side.index, id);
      }
    }
    const terrain = this.state.field.terrain;
    if (terrain) {
      terrain.turns -= 1;
      if (terrain.turns <= 0) {
        this.state.field.terrain = null;
        this.log({ type: 'terrain_end', terrain: terrain.id });
      }
    }
    for (const [id, state] of Object.entries(this.state.field.effects)) {
      state.turns = (state.turns ?? 1) - 1;
      if (state.turns <= 0) this.toggleField(id);
    }
  }

  private runForcedSwitches(choices: readonly (Choice | null)[]): void {
    const entering: Mon[] = [];
    for (const side of [0, 1] as const) {
      const choice = choices[side];
      if (choice?.type !== 'switch') continue;
      choice.switches.forEach((index, position) => {
        if (index === null) return;
        const mon = this.state.sides[side].team[index];
        if (!mon) return;
        this.placeMon(mon, position);
        entering.push(mon);
      });
    }
    this.runSwitchInEffects(entering);
    this.checkFaints();
    if (!this.ended) this.beginTurn();
  }

  private resolvePivot(choices: readonly (Choice | null)[]): void {
    const pivot = this.state.pivot;
    this.state.pivot = null;
    this.state.phase = 'move';
    if (!pivot) return;
    const choice = choices[pivot.side];
    const index = choice?.type === 'switch' ? (choice.switches[pivot.position] ?? null) : null;
    const incoming = index === null ? undefined : this.state.sides[pivot.side].team[index];
    const outgoing = this.monAt(pivot);
    if (incoming && outgoing) {
      this.switchOut(outgoing);
      this.placeMon(incoming, pivot.position);
      this.runSwitchInEffects([incoming]);
      this.checkFaints();
      if (this.ended) return;
    }
    this.continueTurn();
  }

  private runSwitchAction(action: QueuedAction): void {
    const mon = this.mon(action.mon);
    if (mon.fainted || mon.position === null || mon.entries !== action.entry) return;
    const incoming = this.state.sides[mon.side].team[action.incoming ?? -1];
    if (!incoming || incoming.fainted || incoming.position !== null) return;
    const position = mon.position;
    this.switchOut(mon);
    this.placeMon(incoming, position);
    this.runSwitchInEffects([incoming]);
  }

  private switchOut(mon: Mon): void {
    if (mon.position === null) return;
    for (const { hooks } of this.effectsOf(mon)) hooks.onSwitchOut?.(this, mon);
    this.log({ type: 'switch_out', mon: ref(mon), position: mon.position });
    this.leaveField(mon);
  }

  /** Gemeinsames Aufräumen beim Auswechseln und K.O. */
  private leaveField(mon: Mon): void {
    if (mon.position !== null) this.state.sides[mon.side].active[mon.position] = null;
    mon.position = null;
    mon.boosts = emptyBoosts();
    mon.volatiles = {};
    mon.activeTurns = 0;
    mon.protectStreak = 0;
    // Zustände anderer, die an dieses Monster gebunden sind (Bindung, Wechselsperre), enden.
    for (const other of this.allActive()) {
      for (const [id, state] of Object.entries(other.volatiles)) {
        if (state.source?.side !== mon.side || state.source.index !== mon.index) continue;
        if (this.dex.condition(id).endsWithSource) this.removeVolatile(other, id);
      }
    }
  }

  private placeMon(mon: Mon, position: number): void {
    this.state.sides[mon.side].active[position] = mon.index;
    mon.position = position;
    mon.activeTurns = 0;
    mon.entries += 1;
    mon.revealed = true;
    this.log({
      type: 'switch_in',
      mon: ref(mon),
      position,
      species: mon.species,
      name: mon.name,
      level: mon.level,
      hp: mon.hp,
      maxHp: mon.maxHp,
    });
  }

  /** Fallen zuerst (in Einwechsel-Reihenfolge), danach übrige Effekte in Initiative-Reihenfolge. */
  private runSwitchInEffects(mons: readonly Mon[]): void {
    for (const mon of mons) {
      for (const effect of this.effectsOf(mon)) {
        if (effect.ref.kind === 'side' && mon.hp > 0) effect.hooks.onSwitchIn?.(this, mon);
      }
    }
    for (const mon of this.bySpeed(mons)) {
      for (const effect of this.effectsOf(mon)) {
        if (effect.ref.kind === 'side' || mon.hp <= 0 || mon.position === null) continue;
        effect.hooks.onSwitchIn?.(this, mon);
      }
    }
  }

  /** Sortiert nach aktueller Initiative, Gleichstand per Zufall. */
  private bySpeed(mons: readonly Mon[]): Mon[] {
    const keyed = mons.map((mon) => ({ mon, speed: this.getSpeed(mon), tie: this.rng.float() }));
    keyed.sort((a, b) => b.speed - a.speed || a.tie - b.tie);
    return keyed.map((entry) => entry.mon);
  }

  private checkFaints(): void {
    const fainted: Mon[] = [];
    for (const side of this.state.sides) {
      for (const mon of side.team) {
        if (mon.fainted || mon.hp > 0) continue;
        mon.fainted = true;
        mon.hp = 0;
        this.log({ type: 'faint', mon: ref(mon) });
        this.leaveField(mon);
        fainted.push(mon);
      }
    }
    for (const mon of fainted) {
      const source = this.lastAttacker.get(mon);
      if (!source || source.fainted) continue;
      for (const { hooks } of this.effectsOf(source)) hooks.onAfterKO?.(this, source, mon);
    }
    if (fainted.length > 0) this.checkWinner();
  }

  private checkWinner(): void {
    const alive = this.state.sides.map((side) => side.team.some((mon) => !mon.fainted));
    if (!alive[0] && !alive[1]) this.end(null, 'knockout');
    else if (!alive[0]) this.end(1, 'knockout');
    else if (!alive[1]) this.end(0, 'knockout');
  }

  private end(winner: SideIndex | null, reason: EndReason): void {
    if (this.ended) return;
    this.state.winner = winner;
    this.state.phase = 'ended';
    this.state.pending = [null, null];
    this.state.queue = [];
    this.state.pivot = null;
    this.log({ type: 'battle_end', winner, reason });
  }

  // ───────────────────────────── Attacken ─────────────────────────────

  private runMoveAction(action: QueuedAction): void {
    const user = this.mon(action.mon);
    if (user.fainted || user.position === null || user.entries !== action.entry) return;
    user.movedThisTurn = true;
    // Die Wahl gilt so, wie sie getroffen wurde – mitten in der Runde gesperrte Attacken
    // scheitern über ihre Effekte (z. B. Spott), statt still zur Notattacke zu werden.
    const struggle = action.struggle === true;
    let moveId = struggle
      ? STRUGGLE_MOVE_ID
      : (user.moves[action.moveIndex ?? 0]?.id ?? STRUGGLE_MOVE_ID);
    let target = action.target;
    const locked = user.volatiles[ENGINE_CONDITIONS.lockedMove];
    if (locked?.move) {
      moveId = locked.move;
      target = locked.target;
    } else if (!struggle) {
      // Wiederholzwang: statt der gewählten die erzwungene Attacke (falls noch AP übrig).
      const encored = user.volatiles[ENGINE_CONDITIONS.encore]?.move;
      const slot = user.moves.find((move) => move.id === encored);
      if (encored && slot && slot.pp > 0 && encored !== moveId) {
        moveId = encored;
        target = undefined;
      }
    }
    const move = this.activeMove(this.dex.move(moveId), action.priority, false);
    if (!this.runBeforeMove(user, move)) {
      user.protectStreak = 0;
      this.removeVolatile(user, ENGINE_CONDITIONS.lockedMove);
      return;
    }
    if (!struggle && !locked) {
      const slot = user.moves.find((entry) => entry.id === moveId);
      if (slot) slot.pp = Math.max(0, slot.pp - 1);
    }
    user.lastMove = moveId;
    this.useMove(user, move, target);
  }

  private runBeforeMove(user: Mon, move: ActiveMove): boolean {
    const checks = this.effectsOf(user)
      .filter((effect) => effect.hooks.onBeforeMove !== undefined)
      .sort((a, b) => b.order - a.order);
    for (const { hooks } of checks) {
      if (hooks.onBeforeMove?.(this, user, move) === false) return false;
      if (user.hp <= 0) return false;
    }
    return true;
  }

  private activeMove(move: MoveData, priority: number, spreadHit: boolean): ActiveMove {
    return { ...move, activePriority: priority, spreadHit };
  }

  private fail(user: Mon, move: MoveData, reason: 'noTarget' | 'noEffect'): void {
    this.log({ type: 'move_failed', mon: ref(user), move: move.id, reason });
  }

  /** Setzt eine Attacke ein (ohne AP-Abzug). */
  private useMove(user: Mon, move: ActiveMove, chosenTarget?: PositionRef): void {
    // Zwei-Runden-Attacken: erste Runde lädt auf (außer bei passendem Wetter).
    if (move.charge) {
      const locked = user.volatiles[ENGINE_CONDITIONS.lockedMove];
      if (locked?.move === move.id) {
        this.removeVolatile(user, ENGINE_CONDITIONS.lockedMove);
      } else if (!(move.chargeSkipWeather && this.weather() === move.chargeSkipWeather)) {
        this.log({ type: 'charge', mon: ref(user), move: move.id });
        this.addVolatile(user, ENGINE_CONDITIONS.lockedMove, user, {
          move: move.id,
          ...(chosenTarget ? { target: chosenTarget } : {}),
        });
        return;
      }
    }

    const targets = this.resolveTargets(user, move, chosenTarget);
    this.log({ type: 'move_used', mon: ref(user), move: move.id, targets: targets.map(ref) });

    if (move.firstTurnOnly && user.activeTurns > 0) {
      this.fail(user, move, 'noEffect');
      return;
    }
    if (move.requiresWeather && this.weather() !== move.requiresWeather) {
      this.fail(user, move, 'noEffect');
      return;
    }
    if (move.stalling) {
      // Schutz in Folge: Erfolgschance 1 → 1/3 → 1/9 …
      if (!this.rng.chance(1, 3 ** user.protectStreak)) {
        user.protectStreak = 0;
        this.fail(user, move, 'noEffect');
        return;
      }
      user.protectStreak += 1;
    } else {
      user.protectStreak = 0;
    }

    if (FIELD_TARGETS.includes(move.target)) {
      this.applyFieldMove(user, move);
      for (const { hooks } of this.effectsOf(user)) hooks.onAfterMove?.(this, user, move, 0);
      return;
    }
    if (targets.length === 0) {
      this.fail(user, move, 'noTarget');
      return;
    }

    const active = this.activeMove(
      move,
      move.activePriority,
      move.category !== 'status' && targets.length > 1,
    );
    let totalDamage = 0;
    let anyHit = false;
    for (const target of targets) {
      // Während einer Aktion zählen die LP; `fainted` setzt erst checkFaints() nach der Aktion.
      if (user.hp <= 0) break;
      if (target.hp <= 0) continue;
      const result = this.useMoveOn(user, target, active);
      anyHit ||= result.hit;
      totalDamage += result.damage;
    }

    if (user.hp <= 0) return;
    if (anyHit && move.selfBoosts) this.boost(user, move.selfBoosts, user);
    if (move.recoil && totalDamage > 0) {
      const [num, den] = move.recoil;
      let recoil = Math.max(1, Math.floor((totalDamage * num) / den));
      for (const { hooks } of this.effectsOf(user)) {
        recoil = hooks.onModifyRecoil?.(this, user, active, recoil) ?? recoil;
      }
      if (recoil > 0) this.damage(user, recoil, 'recoil');
    }
    if (move.struggleRecoil) this.damage(user, Math.max(1, Math.floor(user.maxHp / 4)), 'recoil');
    if (anyHit && move.clearOwnHazards) this.clearHazards(user.side);
    if (user.hp > 0) {
      for (const { hooks } of this.effectsOf(user))
        hooks.onAfterMove?.(this, user, active, totalDamage);
    }
    if (
      move.pivot &&
      anyHit &&
      user.hp > 0 &&
      user.position !== null &&
      this.bench(user.side).length > 0
    ) {
      this.state.pivot = { side: user.side, position: user.position };
    }
  }

  private applyFieldMove(user: Mon, move: ActiveMove): void {
    let changed = false;
    if (move.sideCondition) {
      const side = move.target === 'foeSide' ? otherSide(user.side) : user.side;
      changed = this.addSideCondition(side, move.sideCondition, user);
    }
    if (move.weather) changed = this.setWeather(move.weather, user) || changed;
    if (move.terrain) changed = this.setTerrain(move.terrain, user) || changed;
    if (move.field) changed = this.toggleField(move.field) || changed;
    if (!changed) this.fail(user, move, 'noEffect');
  }

  private clearHazards(side: SideIndex): void {
    for (const id of Object.keys(this.state.sides[side].conditions)) {
      if (this.dex.condition(id).hazard) this.removeSideCondition(side, id);
    }
  }

  private resolveTargets(user: Mon, move: ActiveMove, chosen?: PositionRef): Mon[] {
    const foes = this.activeFoes(user);
    const allies = this.activeAllies(user);
    switch (move.target) {
      case 'self':
        return [user];
      case 'adjacentAlly': {
        const picked = chosen ? this.monAt(chosen) : null;
        if (picked?.side === user.side && picked !== user && !picked.fainted) return [picked];
        return allies.slice(0, 1);
      }
      case 'normal': {
        let target: Mon | null = null;
        if (chosen) {
          const picked = this.monAt(chosen);
          if (picked && picked !== user && !picked.fainted) target = picked;
          // Partner als Ziel ausgefallen: kein Umlenken auf Gegner.
          else if (chosen.side === user.side) return [];
        }
        // Gewähltes gegnerisches Ziel ausgefallen → auf einen anderen Gegner umleiten.
        target ??= foes.length > 0 ? this.rng.pick(foes) : null;
        if (target && target.side !== user.side) target = this.redirectTarget(user, move) ?? target;
        return target ? [target] : [];
      }
      case 'randomFoe': {
        const target = foes.length > 0 ? this.rng.pick(foes) : null;
        return target ? [this.redirectTarget(user, move) ?? target] : [];
      }
      case 'allAdjacentFoes':
        return foes;
      case 'allAdjacent':
        return [...foes, ...allies];
      case 'allySide':
      case 'foeSide':
      case 'all':
        return [];
    }
  }

  /** Umlenken (z. B. Lockruf): ein Gegner zieht die Ein-Ziel-Attacke auf sich. */
  private redirectTarget(user: Mon, move: ActiveMove): Mon | null {
    for (const foe of this.activeFoes(user)) {
      for (const { hooks } of this.effectsOf(foe)) {
        if (hooks.onRedirectTarget?.(this, foe, user, move) === true) return foe;
      }
    }
    return null;
  }

  private useMoveOn(user: Mon, target: Mon, move: ActiveMove): HitResult {
    if (target !== user) {
      for (const { hooks } of this.effectsOf(target)) {
        if (hooks.onTryHitTaken?.(this, target, user, move) === false) return MISSED;
      }
      for (const ally of this.activeAllies(target)) {
        for (const { hooks } of this.effectsOf(ally)) {
          if (hooks.onAllyTryHitTaken?.(this, ally, target, user, move) === false) return MISSED;
        }
      }
      const immunity = this.immunityEffect(target, user, move);
      if (immunity) {
        this.log({ type: 'immune', target: ref(target), by: immunity.ref });
        immunity.hooks.onImmunityTriggered?.(this, target, user, move);
        return MISSED;
      }
    }

    const eff = this.moveEffectiveness(move, target);
    const statusMoveImmune = move.category === 'status' && move.status !== undefined && eff === 0;
    const powderImmune =
      move.flags.powder === true &&
      target !== user &&
      target.types.some((type) => type === 'flora');
    if ((move.category !== 'status' && eff === 0) || statusMoveImmune || powderImmune) {
      this.log({ type: 'immune', target: ref(target) });
      return MISSED;
    }
    if (!this.rollAccuracy(user, target, move)) {
      this.log({ type: 'miss', mon: ref(user), target: ref(target) });
      return MISSED;
    }
    if (move.category === 'status') return this.applyStatusMove(user, target, move);

    const hits = this.hitCount(user, move);
    let dealt = 0;
    let landed = 0;
    let hitSubstitute = false;
    for (let i = 0; i < hits && target.hp > 0 && user.hp > 0; i++) {
      const crit = this.rollCrit(user, move);
      let damage = this.rollDamage(user, target, move, { crit, effectiveness: eff });
      if (crit) this.log({ type: 'crit', target: ref(target) });
      if (i === 0 && eff !== 1)
        this.log({ type: 'effectiveness', target: ref(target), multiplier: eff });
      landed++;
      const substitute = target.volatiles[ENGINE_CONDITIONS.substitute];
      if (substitute && !move.flags.sound) {
        // Trugbild fängt den Treffer ab.
        hitSubstitute = true;
        const absorbed = Math.min(damage, substitute.hp ?? 0);
        substitute.hp = (substitute.hp ?? 0) - absorbed;
        dealt += absorbed;
        this.log({ type: 'substitute_damage', target: ref(target), amount: absorbed });
        if (substitute.hp <= 0) this.removeVolatile(target, ENGINE_CONDITIONS.substitute);
        continue;
      }
      for (const { hooks } of this.effectsOf(target)) {
        damage = hooks.onBeforeDamageTaken?.(this, target, damage, user, move) ?? damage;
      }
      const applied = this.damage(target, damage, 'move', user);
      dealt += applied;
      for (const { hooks } of this.effectsOf(target)) {
        hooks.onDamagingHitTaken?.(this, target, user, move, applied);
      }
    }
    if (hits > 1) this.log({ type: 'hit_count', target: ref(target), hits: landed });
    if (move.drain && dealt > 0 && user.hp > 0) {
      const [num, den] = move.drain;
      this.heal(user, Math.max(1, Math.floor((dealt * num) / den)), 'drain');
    }
    if (!hitSubstitute) this.applySecondaries(user, target, move);
    return { hit: true, damage: dealt };
  }

  private applyStatusMove(user: Mon, target: Mon, move: ActiveMove): HitResult {
    // Ein Trugbild blockt gegnerische Statusattacken (außer Klang).
    if (
      target.side !== user.side &&
      target.volatiles[ENGINE_CONDITIONS.substitute] &&
      !move.flags.sound
    ) {
      this.fail(user, move, 'noEffect');
      return MISSED;
    }
    let changed = false;
    if (move.boosts) {
      this.boost(target, move.boosts, user);
      changed = true;
    }
    if (move.heal) {
      const [num, den] = move.heal;
      const amount = Math.max(1, Math.floor((target.maxHp * num) / den));
      changed = this.heal(target, amount, 'move') > 0 || changed;
    }
    if (move.status) changed = this.trySetStatus(target, move.status, user) || changed;
    if (move.volatile) changed = this.addVolatile(target, move.volatile, user) || changed;
    if (move.allySwap) changed = this.swapWithAlly(user) || changed;
    if (!changed) this.fail(user, move, 'noEffect');
    return { hit: true, damage: 0 };
  }

  /** Positionstausch mit dem Partner. */
  private swapWithAlly(user: Mon): boolean {
    const side = this.state.sides[user.side];
    if (user.position === null || side.active.length < 2) return false;
    const from = user.position;
    const to = side.active.findIndex((index, position) => position !== from && index !== null);
    if (to < 0) return false;
    const partnerIndex = side.active[to] ?? null;
    const partner = partnerIndex === null ? undefined : side.team[partnerIndex];
    if (!partner) return false;
    side.active[from] = partner.index;
    side.active[to] = user.index;
    partner.position = from;
    user.position = to;
    this.log({
      type: 'swap',
      side: user.side,
      positions: [from, to],
      mons: [ref(user), ref(partner)],
    });
    return true;
  }

  private applySecondaries(user: Mon, target: Mon, move: ActiveMove): void {
    for (const secondary of move.secondaries ?? []) {
      if (secondary.chance < 100 && !this.rng.chance(secondary.chance, 100)) continue;
      if (target.hp > 0) {
        if (secondary.boosts) this.boost(target, secondary.boosts, user);
        if (secondary.status) this.trySetStatus(target, secondary.status, user);
        if (secondary.volatile) this.addVolatile(target, secondary.volatile, user);
      }
      if (secondary.selfBoosts && user.hp > 0) this.boost(user, secondary.selfBoosts, user);
    }
  }

  private moveEffectiveness(move: MoveData, target: Mon): number {
    return move.typeless ? 1 : this.effectiveness(move.type, target);
  }

  private immunityEffect(target: Mon, attacker: Mon, move: ActiveMove): ActiveEffect | null {
    if (target === attacker) return null;
    for (const effect of this.effectsOf(target)) {
      if (effect.hooks.onCheckImmunity?.(this, target, attacker, move) === true) return effect;
    }
    return null;
  }

  private rollAccuracy(user: Mon, target: Mon, move: MoveData): boolean {
    if (move.accuracy === true || target === user) return true;
    const [num, den] = accuracyFraction(user.boosts.accuracy - target.boosts.evasion);
    const accuracy = Math.floor((move.accuracy * num) / den);
    return this.rng.int(1, 100) <= accuracy;
  }

  private hitCount(user: Mon, move: ActiveMove): number {
    if (move.multihit === undefined) return 1;
    let hits: number;
    if (typeof move.multihit === 'number') {
      hits = move.multihit;
    } else {
      const [min, max] = move.multihit;
      if (min === 2 && max === 5) {
        // Klassische Verteilung: 2 und 3 Treffer je 35 %, 4 und 5 je 15 %.
        const roll = this.rng.int(1, 100);
        hits = roll <= 35 ? 2 : roll <= 70 ? 3 : roll <= 85 ? 4 : 5;
      } else {
        hits = this.rng.int(min, max);
      }
    }
    for (const { hooks } of this.effectsOf(user)) {
      hits = hooks.onModifyHitCount?.(this, user, move, hits) ?? hits;
    }
    return hits;
  }

  private rollCrit(user: Mon, move: ActiveMove): boolean {
    if (move.fixedDamage !== undefined) return false;
    let stage = move.critStage ?? 0;
    for (const { hooks } of this.effectsOf(user)) {
      stage = hooks.onModifyCritStage?.(this, user, move, stage) ?? stage;
    }
    return this.rng.int(1, critDenominator(stage)) === 1;
  }

  private rollDamage(
    user: Mon,
    target: Mon,
    move: ActiveMove,
    options: { crit: boolean; effectiveness: number },
  ): number {
    if (move.fixedDamage !== undefined) {
      return move.fixedDamage === 'level' ? user.level : move.fixedDamage;
    }
    const { base, mods } = this.damageInputs(user, target, move, options);
    return applyDamageModifiers(base, mods, this.rng.int(MIN_ROLL, MAX_ROLL));
  }

  /** Grundschaden und Modifikatoren – ohne Zufall, ohne Seiteneffekte. */
  private damageInputs(
    user: Mon,
    target: Mon,
    move: ActiveMove,
    options: { crit: boolean; effectiveness: number },
  ): { base: number; mods: DamageModifiers } {
    const physical = move.category === 'physical';
    const attackStat = physical ? 'atk' : 'spa';
    const defenseStat = physical ? 'def' : 'spd';
    // Volltreffer ignorieren eigene negative und gegnerische positive Stufen.
    let attackBoost = user.boosts[attackStat];
    let defenseBoost = target.boosts[defenseStat];
    if (options.crit) {
      attackBoost = Math.max(0, attackBoost);
      defenseBoost = Math.min(0, defenseBoost);
    }
    const attack = modify(
      applyBoost(user.stats[attackStat], attackBoost),
      this.chain(user, (e) => e.onModifyAttackStat?.(this, user, target, move)),
    );
    const defense = modify(
      applyBoost(target.stats[defenseStat], defenseBoost),
      this.chain(target, (e) => e.onModifyDefenseStat?.(this, target, user, move)),
    );
    let power = move.power;
    if (move.revenge && user.hurtThisTurn) power *= 2;
    const basePower = power;
    power = Math.max(
      1,
      modify(
        power,
        this.chain(user, (e) => e.onModifyBasePower?.(this, user, target, move, basePower)),
      ),
    );

    let stab = MOD_ONE;
    if (!move.typeless && user.types.includes(move.type)) {
      let factor = MOD_STAB / MOD_ONE;
      for (const { hooks } of this.effectsOf(user)) {
        factor = hooks.onModifyStab?.(this, user, move, factor) ?? factor;
      }
      stab = toMod(factor);
    }

    const weather = this.weather();
    const weatherFactor = weather ? (this.dex.condition(weather).weatherDamage?.(move) ?? 1) : 1;
    const burn =
      physical && user.status === 'brn' && !this.dex.ability(user.ability).ignoresBurnPenalty;

    const allyMods = this.activeAllies(target).map((ally) =>
      this.chain(ally, (e) => e.onAllyModifyDamageTaken?.(this, ally, target, user, move)),
    );
    const final = chainMods([
      this.chain(user, (e) =>
        e.onModifyDamageDealt?.(this, user, target, move, options.effectiveness),
      ),
      this.chain(target, (e) =>
        e.onModifyDamageTaken?.(this, target, user, move, options.effectiveness),
      ),
      ...allyMods,
    ]);
    return {
      base: baseDamage(user.level, power, Math.max(1, attack), Math.max(1, defense)),
      mods: {
        spread: move.spreadHit,
        weather: toMod(weatherFactor),
        crit: options.crit,
        stab,
        effectiveness: options.effectiveness,
        burn,
        screen: this.screenMod(target, move),
        final,
      },
    };
  }

  /** Schutzwände auf der Seite des Ziels: im Doppel 2/3, im Einzel 1/2 (Volltreffer ignorieren sie). */
  private screenMod(target: Mon, move: MoveData): number {
    for (const id of Object.keys(this.state.sides[target.side].conditions)) {
      const screen = this.dex.condition(id).screen;
      if (screen === 'both' || screen === move.category) {
        return this.format.activePerSide > 1 ? MOD_SCREEN_DOUBLES : MOD_SCREEN_SINGLES;
      }
    }
    return MOD_ONE;
  }

  // ───────────────────────────── Effekte ─────────────────────────────

  /** Alle Effekte, die gerade auf ein Monster wirken. */
  private effectsOf(mon: Mon): ActiveEffect[] {
    const effects: ActiveEffect[] = [];
    const add = (hooks: EffectHooks, kind: EffectKind, id: string, order = 0): void => {
      effects.push({ hooks, ref: { kind, id }, order });
    };
    if (mon.status) {
      const condition = this.dex.condition(mon.status);
      add(condition, 'status', mon.status, condition.beforeMoveOrder);
    }
    for (const id of Object.keys(mon.volatiles)) {
      const condition = this.dex.condition(id);
      add(condition, 'volatile', id, condition.beforeMoveOrder);
    }
    add(this.dex.ability(mon.ability), 'ability', mon.ability);
    if (mon.item) add(this.dex.item(mon.item), 'item', mon.item);
    for (const id of Object.keys(this.state.sides[mon.side].conditions)) {
      add(this.dex.condition(id), 'side', id);
    }
    const { weather, terrain } = this.state.field;
    if (weather) add(this.dex.condition(weather.id), 'weather', weather.id);
    if (terrain) add(this.dex.condition(terrain.id), 'terrain', terrain.id);
    for (const id of Object.keys(this.state.field.effects))
      add(this.dex.condition(id), 'field', id);
    return effects;
  }

  /** Verkettet die Faktoren aller Effekte eines Monsters für einen Modifikator-Hook. */
  private chain(mon: Mon, read: (hooks: EffectHooks) => number | undefined): number {
    const mods: number[] = [];
    for (const { hooks } of this.effectsOf(mon)) {
      const factor = read(hooks);
      if (factor !== undefined) mods.push(toMod(factor));
    }
    return mods.length === 0 ? MOD_ONE : chainMods(mods);
  }
}
