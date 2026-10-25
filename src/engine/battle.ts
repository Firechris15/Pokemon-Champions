/**
 * Der Kampf: nimmt Entscheidungen entgegen, löst Runden auf und schreibt Ereignisse.
 * Deterministisch: gleicher Seed + gleiche Entscheidungen = exakt gleicher Kampf.
 */
import type {
  ActionChoice,
  Choice,
  ChoiceResult,
  PositionRequest,
  PreviewEntry,
  Request,
} from './choices.ts';
import {
  MAX_ROLL,
  MIN_ROLL,
  MOD_ONE,
  MOD_STAB,
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
import type { Dex, FormatData, MoveData, MoveTarget } from './dex.ts';
import type { BattleContext, EffectHooks } from './effects.ts';
import type { BattleEvent, DamageCause, EffectRef, EndReason, HealCause } from './events.ts';
import { BOOST_IDS, emptyBoosts, otherSide } from './model.ts';
import type { BoostTable, MonRef, MonsterSet, PositionRef, SideIndex, TypeId } from './model.ts';
import { deepClone } from './clone.ts';
import { Rng } from './rng.ts';
import type { BattleState, InputRecord, Mon, SideState } from './state.ts';
import { accuracyFraction, applyBoost, calcStats, clampBoost } from './stats.ts';
import { effectiveness } from './typechart.ts';

/** Notattacke, wenn keine Attacke mehr AP hat. */
export const STRUGGLE_MOVE_ID = 'verzweifler';
/** Schutz vor Endloskämpfen. */
export const TURN_LIMIT = 300;

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

interface MoveAction {
  kind: 'move';
  mon: Mon;
  position: number;
  moveIndex: number;
  moveId: string;
  struggle: boolean;
  target: PositionRef | undefined;
  priority: number;
  tie: number;
}

interface SwitchAction {
  kind: 'switch';
  mon: Mon;
  position: number;
  incoming: number;
  tie: number;
}

type Action = MoveAction | SwitchAction;

interface ActiveEffect {
  hooks: EffectHooks;
  ref: EffectRef;
}

interface HitResult {
  hit: boolean;
  damage: number;
}

const MISSED: HitResult = { hit: false, damage: 0 };
const FIELD_TARGETS: readonly MoveTarget[] = ['allySide', 'foeSide', 'all'];

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
    });
    const state: BattleState = {
      formatId,
      seed,
      rng: Rng.fromSeed(seed).getState(),
      turn: 0,
      phase: 'teamPreview',
      sides: [makeSide(0, sides[0]), makeSide(1, sides[1])],
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
    if (target === 'normal') {
      return [...this.activeFoes(user), ...this.activeAllies(user)].map((mon) => ({
        side: mon.side,
        position: mon.position ?? 0,
      }));
    }
    if (target === 'adjacentAlly') {
      return this.activeAllies(user).map((mon) => ({
        side: mon.side,
        position: mon.position ?? 0,
      }));
    }
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
    const eff = this.moveEffectiveness(move, defender);
    const immune = eff === 0 || this.immunityEffect(defender, attacker, move) !== null;
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
    const { base, mods } = this.damageInputs(attacker, defender, move, {
      spread: options.spread ?? false,
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
    if (source && cause === 'move') this.lastAttacker.set(target, source);
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

  boost(target: Mon, boosts: Partial<BoostTable>, _source?: Mon): void {
    if (target.fainted || target.hp <= 0) return;
    for (const stat of BOOST_IDS) {
      const delta = boosts[stat];
      if (!delta) continue;
      const current = target.boosts[stat];
      const next = clampBoost(current + delta);
      target.boosts[stat] = next;
      this.log({
        type: 'stat_change',
        target: ref(target),
        stat,
        change: next - current,
        attempted: delta,
        stage: next,
      });
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

  private positionRequest(side: SideIndex, position: number): PositionRequest | null {
    const mon = this.monAt({ side, position });
    if (!mon) return null;
    const moves = mon.moves.map((slot) => ({
      id: slot.id,
      pp: slot.pp,
      maxPp: slot.maxPp,
      target: this.dex.move(slot.id).target,
      disabled: slot.pp <= 0,
    }));
    return {
      mon: mon.index,
      moves,
      struggle: moves.every((move) => move.disabled),
      switchable: this.bench(side),
    };
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
        if (choice.type !== 'switch') return 'Erwartet: Ersatz für besiegte Monster.';
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
        if (option.disabled) return `Position ${position}: ${option.id} hat keine AP mehr.`;
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
        this.runForcedSwitches(choices);
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
    this.state.phase = 'move';
    this.log({ type: 'turn_start', turn: this.state.turn });
  }

  private runTurn(choices: readonly (Choice | null)[]): void {
    const queue: Action[] = [];
    for (const side of [0, 1] as const) {
      const choice = choices[side];
      if (choice?.type !== 'move') continue;
      choice.actions.forEach((action, position) => {
        const mon = this.monAt({ side, position });
        if (!mon) return;
        if (action.type === 'switch') {
          queue.push({
            kind: 'switch',
            mon,
            position,
            incoming: action.mon,
            tie: this.rng.float(),
          });
        } else if (action.type === 'move') {
          const struggle = mon.moves.every((slot) => slot.pp <= 0);
          const moveId = struggle
            ? STRUGGLE_MOVE_ID
            : (mon.moves[action.move]?.id ?? STRUGGLE_MOVE_ID);
          queue.push({
            kind: 'move',
            mon,
            position,
            moveIndex: action.move,
            moveId,
            struggle,
            target: action.target,
            priority: this.priorityOf(mon, this.dex.move(moveId)),
            tie: this.rng.float(),
          });
        }
      });
    }

    while (queue.length > 0) {
      // Initiative wird vor jeder Aktion neu bewertet (Änderungen mitten in der Runde zählen sofort).
      this.sortActions(queue);
      const action = queue.shift();
      if (!action) break;
      this.lastAttacker.clear();
      if (action.kind === 'switch') this.runSwitchAction(action);
      else this.runMoveAction(action);
      this.checkFaints();
      if (this.ended) return;
    }
    this.endTurn();
  }

  /** Wechsel zuerst → Priorität → Initiative → Zufall. */
  private sortActions(queue: Action[]): void {
    const speeds = new Map<Action, number>(
      queue.map((action) => [action, this.getSpeed(action.mon)]),
    );
    queue.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'switch' ? -1 : 1;
      const priority = (b.kind === 'move' ? b.priority : 0) - (a.kind === 'move' ? a.priority : 0);
      if (priority !== 0) return priority;
      const speed = (speeds.get(b) ?? 0) - (speeds.get(a) ?? 0);
      if (speed !== 0) return speed;
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
    for (const mon of this.bySpeed(this.allActive())) {
      if (mon.hp <= 0) continue;
      for (const { hooks } of this.effectsOf(mon)) hooks.onResidual?.(this, mon);
    }
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

  private runSwitchAction(action: SwitchAction): void {
    const { mon } = action;
    if (mon.fainted || mon.position !== action.position) return;
    const incoming = this.state.sides[mon.side].team[action.incoming];
    if (!incoming || incoming.fainted || incoming.position !== null) return;
    this.switchOut(mon);
    this.placeMon(incoming, action.position);
    this.runSwitchInEffects([incoming]);
  }

  private switchOut(mon: Mon): void {
    if (mon.position === null) return;
    this.log({ type: 'switch_out', mon: ref(mon), position: mon.position });
    this.state.sides[mon.side].active[mon.position] = null;
    mon.position = null;
    mon.boosts = emptyBoosts();
    mon.activeTurns = 0;
  }

  private placeMon(mon: Mon, position: number): void {
    this.state.sides[mon.side].active[position] = mon.index;
    mon.position = position;
    mon.activeTurns = 0;
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

  private runSwitchInEffects(mons: readonly Mon[]): void {
    for (const mon of this.bySpeed(mons)) {
      if (mon.hp <= 0 || mon.position === null) continue;
      for (const { hooks } of this.effectsOf(mon)) hooks.onSwitchIn?.(this, mon);
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
        if (mon.position !== null) {
          side.active[mon.position] = null;
          mon.position = null;
        }
        this.log({ type: 'faint', mon: ref(mon) });
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
    this.log({ type: 'battle_end', winner, reason });
  }

  // ───────────────────────────── Attacken ─────────────────────────────

  private runMoveAction(action: MoveAction): void {
    const user = action.mon;
    if (user.fainted || user.position !== action.position) return;
    const move = this.dex.move(action.moveId);
    if (!action.struggle) {
      const slot = user.moves[action.moveIndex];
      if (slot) slot.pp = Math.max(0, slot.pp - 1);
    }
    user.lastMove = move.id;
    this.useMove(user, move, action.target);
  }

  /** Setzt eine Attacke ein (ohne AP-Abzug). */
  useMove(user: Mon, move: MoveData, chosenTarget?: PositionRef): void {
    const targets = this.resolveTargets(user, move, chosenTarget);
    this.log({ type: 'move_used', mon: ref(user), move: move.id, targets: targets.map(ref) });
    if (FIELD_TARGETS.includes(move.target)) {
      // Seiten- und Feldeffekte folgen in Phase 2.
      this.log({ type: 'move_failed', mon: ref(user), move: move.id, reason: 'noEffect' });
      return;
    }
    if (targets.length === 0) {
      this.log({ type: 'move_failed', mon: ref(user), move: move.id, reason: 'noTarget' });
      return;
    }

    const spread = move.category !== 'status' && targets.length > 1;
    let totalDamage = 0;
    let anyHit = false;
    for (const target of targets) {
      // Während einer Aktion zählen die LP; `fainted` setzt erst checkFaints() nach der Aktion.
      if (user.hp <= 0) break;
      if (target.hp <= 0) continue;
      const result = this.useMoveOn(user, target, move, spread);
      anyHit ||= result.hit;
      totalDamage += result.damage;
    }

    if (user.hp <= 0) return;
    if (anyHit && move.selfBoosts) this.boost(user, move.selfBoosts, user);
    if (move.recoil && totalDamage > 0) {
      const [num, den] = move.recoil;
      let recoil = Math.max(1, Math.floor((totalDamage * num) / den));
      for (const { hooks } of this.effectsOf(user)) {
        recoil = hooks.onModifyRecoil?.(this, user, move, recoil) ?? recoil;
      }
      if (recoil > 0) this.damage(user, recoil, 'recoil');
    }
    if (move.struggleRecoil) this.damage(user, Math.max(1, Math.floor(user.maxHp / 4)), 'recoil');
    if (user.hp > 0) {
      for (const { hooks } of this.effectsOf(user))
        hooks.onAfterMove?.(this, user, move, totalDamage);
    }
  }

  private resolveTargets(user: Mon, move: MoveData, chosen?: PositionRef): Mon[] {
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
        if (chosen) {
          const picked = this.monAt(chosen);
          if (picked && picked !== user && !picked.fainted) return [picked];
          // Partner als Ziel ausgefallen: kein Umlenken auf Gegner.
          if (chosen.side === user.side) return [];
        }
        // Gewähltes gegnerisches Ziel ausgefallen → auf einen anderen Gegner umleiten.
        return foes.length > 0 ? [this.rng.pick(foes)] : [];
      }
      case 'randomFoe':
        return foes.length > 0 ? [this.rng.pick(foes)] : [];
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

  private useMoveOn(user: Mon, target: Mon, move: MoveData, spread: boolean): HitResult {
    if (target !== user) {
      for (const { hooks } of this.effectsOf(target)) {
        if (hooks.onTryHitTaken?.(this, target, user, move) === false) return MISSED;
      }
      const immunity = this.immunityEffect(target, user, move);
      if (immunity) {
        this.log({ type: 'immune', target: ref(target), by: immunity.ref });
        immunity.hooks.onImmunityTriggered?.(this, target, user, move);
        return MISSED;
      }
    }

    const eff = this.moveEffectiveness(move, target);
    if (move.category !== 'status' && eff === 0) {
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
    for (let i = 0; i < hits && target.hp > 0 && user.hp > 0; i++) {
      const crit = this.rollCrit(user, move);
      let damage = this.rollDamage(user, target, move, { spread, crit, effectiveness: eff });
      for (const { hooks } of this.effectsOf(target)) {
        damage = hooks.onBeforeDamageTaken?.(this, target, damage, user, move) ?? damage;
      }
      if (crit) this.log({ type: 'crit', target: ref(target) });
      if (i === 0 && eff !== 1)
        this.log({ type: 'effectiveness', target: ref(target), multiplier: eff });
      dealt += this.damage(target, damage, 'move', user);
      landed++;
    }
    if (hits > 1) this.log({ type: 'hit_count', target: ref(target), hits: landed });
    if (move.drain && dealt > 0) {
      const [num, den] = move.drain;
      this.heal(user, Math.max(1, Math.floor((dealt * num) / den)), 'drain');
    }
    this.applySecondaries(user, target, move);
    return { hit: true, damage: dealt };
  }

  private applyStatusMove(user: Mon, target: Mon, move: MoveData): HitResult {
    let changed = false;
    if (move.boosts) {
      this.boost(target, move.boosts, user);
      changed = true;
    }
    if (move.heal) {
      const [num, den] = move.heal;
      changed =
        this.heal(target, Math.max(1, Math.floor((target.maxHp * num) / den)), 'move') > 0 ||
        changed;
    }
    if (!changed)
      this.log({ type: 'move_failed', mon: ref(user), move: move.id, reason: 'noEffect' });
    return { hit: true, damage: 0 };
  }

  private applySecondaries(user: Mon, target: Mon, move: MoveData): void {
    for (const secondary of move.secondaries ?? []) {
      if (secondary.chance < 100 && !this.rng.chance(secondary.chance, 100)) continue;
      if (secondary.boosts && target.hp > 0) this.boost(target, secondary.boosts, user);
      if (secondary.selfBoosts && user.hp > 0) this.boost(user, secondary.selfBoosts, user);
    }
  }

  private moveEffectiveness(move: MoveData, target: Mon): number {
    return move.typeless ? 1 : this.effectiveness(move.type, target);
  }

  private immunityEffect(target: Mon, attacker: Mon, move: MoveData): ActiveEffect | null {
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

  private hitCount(user: Mon, move: MoveData): number {
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

  private rollCrit(user: Mon, move: MoveData): boolean {
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
    move: MoveData,
    options: { spread: boolean; crit: boolean; effectiveness: number },
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
    move: MoveData,
    options: { spread: boolean; crit: boolean; effectiveness: number },
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
    const power = Math.max(
      1,
      modify(
        move.power,
        this.chain(user, (e) => e.onModifyBasePower?.(this, user, target, move, move.power)),
      ),
    );
    const final = chainMods([
      this.chain(user, (e) =>
        e.onModifyDamageDealt?.(this, user, target, move, options.effectiveness),
      ),
      this.chain(target, (e) =>
        e.onModifyDamageTaken?.(this, target, user, move, options.effectiveness),
      ),
    ]);
    return {
      base: baseDamage(user.level, power, Math.max(1, attack), Math.max(1, defense)),
      mods: {
        spread: options.spread,
        weather: MOD_ONE,
        crit: options.crit,
        stab: !move.typeless && user.types.includes(move.type) ? MOD_STAB : MOD_ONE,
        effectiveness: options.effectiveness,
        burn: false,
        screen: MOD_ONE,
        final,
      },
    };
  }

  // ───────────────────────────── Effekte ─────────────────────────────

  private effectsOf(mon: Mon): ActiveEffect[] {
    const effects: ActiveEffect[] = [
      { hooks: this.dex.ability(mon.ability), ref: { kind: 'ability', id: mon.ability } },
    ];
    if (mon.item)
      effects.push({ hooks: this.dex.item(mon.item), ref: { kind: 'item', id: mon.item } });
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
