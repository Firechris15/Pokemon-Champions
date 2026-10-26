/**
 * Sichtmodell des Kampf-Bildschirms: was der Spieler gerade sieht. Es wird Ereignis für Ereignis
 * fortgeschrieben (so laufen LP-Balken, Wechsel und K.O. im Takt der Textbox) und an Entscheidungs-
 * punkten mit dem Engine-Zustand abgeglichen. Gegner erscheinen erst, wenn sie aufs Feld kommen.
 * Rein funktional über einfache Daten (kein DOM) – testbar in Node.
 */
import type { Battle } from '../../engine/battle.ts';
import type { Dex } from '../../engine/dex.ts';
import type { BattleEvent } from '../../engine/events.ts';
import type { BoostId, MonRef, SideIndex, TypeId } from '../../engine/model.ts';

export interface ViewMon {
  readonly index: number;
  species: string;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  types: TypeId[];
  status: string | null;
  /** Nur Stufen ≠ 0. */
  boosts: Partial<Record<BoostId, number>>;
  volatiles: string[];
  fainted: boolean;
  /** Item, falls bekannt (eigenes Team) – sonst `null`. */
  item: string | null;
}

export interface ConditionView {
  turns?: number;
  layers?: number;
}

export interface ViewSide {
  readonly index: SideIndex;
  /** Team-Index pro Position, `null` = leer. */
  active: (number | null)[];
  /** Bekannte Monster nach Team-Index. */
  mons: Record<number, ViewMon>;
  /** Größe des Kampfteams (für die Anzeige der verbleibenden Monster). */
  teamSize: number;
  conditions: Record<string, ConditionView>;
}

export interface BattleView {
  readonly perspective: SideIndex;
  turn: number;
  sides: [ViewSide, ViewSide];
  weather: { id: string; turns?: number } | null;
  terrain: { id: string; turns?: number } | null;
  fields: Record<string, ConditionView>;
  ended: boolean;
  winner: SideIndex | null | undefined;
}

export function emptyView(perspective: SideIndex, activePerSide: number): BattleView {
  const side = (index: SideIndex): ViewSide => ({
    index,
    active: Array.from({ length: activePerSide }, () => null),
    mons: {},
    teamSize: 0,
    conditions: {},
  });
  return {
    perspective,
    turn: 0,
    sides: [side(0), side(1)],
    weather: null,
    terrain: null,
    fields: {},
    ended: false,
    winner: undefined,
  };
}

export function viewMon(view: BattleView, ref: MonRef): ViewMon | undefined {
  return view.sides[ref.side].mons[ref.index];
}

/** Monster an einer Position (sichtbar, auch wenn gerade besiegt). */
export function monAt(view: BattleView, side: SideIndex, position: number): ViewMon | undefined {
  const index = view.sides[side].active[position];
  return index === null || index === undefined ? undefined : view.sides[side].mons[index];
}

/** Ändert das Sichtmodell gemäß einem Ereignis. */
export function applyEvent(view: BattleView, event: BattleEvent, dex: Dex): void {
  switch (event.type) {
    case 'turn_start':
      view.turn = event.turn;
      return;
    case 'switch_in': {
      const side = view.sides[event.mon.side];
      const known = side.mons[event.mon.index];
      side.mons[event.mon.index] = {
        index: event.mon.index,
        species: event.species,
        name: event.name,
        level: event.level,
        hp: event.hp,
        maxHp: event.maxHp,
        types: [...dex.species(event.species).types],
        status: known?.status ?? null,
        boosts: {},
        volatiles: [],
        fainted: false,
        item: known?.item ?? null,
      };
      side.active[event.position] = event.mon.index;
      return;
    }
    case 'switch_out': {
      const side = view.sides[event.mon.side];
      const mon = side.mons[event.mon.index];
      if (mon) {
        mon.boosts = {};
        mon.volatiles = [];
      }
      if (side.active[event.position] === event.mon.index) side.active[event.position] = null;
      return;
    }
    case 'damage':
    case 'heal': {
      const mon = viewMon(view, event.target);
      if (mon) {
        mon.hp = event.hp;
        mon.maxHp = event.maxHp;
      }
      return;
    }
    case 'faint': {
      const mon = viewMon(view, event.mon);
      if (mon) {
        mon.hp = 0;
        mon.fainted = true;
        mon.boosts = {};
        mon.volatiles = [];
      }
      return;
    }
    case 'stat_change': {
      const mon = viewMon(view, event.target);
      if (!mon) return;
      if (event.stage === 0) Reflect.deleteProperty(mon.boosts, event.stat);
      else mon.boosts[event.stat] = event.stage;
      return;
    }
    case 'status_set': {
      const mon = viewMon(view, event.mon);
      if (mon) mon.status = event.status;
      return;
    }
    case 'status_cure': {
      const mon = viewMon(view, event.mon);
      if (mon) mon.status = null;
      return;
    }
    case 'volatile_start': {
      const mon = viewMon(view, event.mon);
      if (mon && !mon.volatiles.includes(event.volatile)) mon.volatiles.push(event.volatile);
      return;
    }
    case 'volatile_end': {
      const mon = viewMon(view, event.mon);
      if (mon) mon.volatiles = mon.volatiles.filter((id) => id !== event.volatile);
      return;
    }
    case 'item': {
      const mon = viewMon(view, event.mon);
      if (mon && event.consumed) mon.item = null;
      return;
    }
    case 'side_start': {
      const duration = dex.condition(event.condition).duration;
      view.sides[event.side].conditions[event.condition] = {
        ...(duration === undefined ? {} : { turns: duration }),
        ...(event.layers === undefined ? {} : { layers: event.layers }),
      };
      return;
    }
    case 'side_end':
      Reflect.deleteProperty(view.sides[event.side].conditions, event.condition);
      return;
    case 'weather_start':
      view.weather = { id: event.weather, turns: event.turns };
      return;
    case 'weather_end':
      view.weather = null;
      return;
    case 'terrain_start':
      view.terrain = { id: event.terrain, turns: event.turns };
      return;
    case 'terrain_end':
      view.terrain = null;
      return;
    case 'field_start':
      view.fields[event.field] = { turns: event.turns };
      return;
    case 'field_end':
      Reflect.deleteProperty(view.fields, event.field);
      return;
    case 'swap': {
      const side = view.sides[event.side];
      const [a, b] = event.positions;
      const first = side.active[a] ?? null;
      side.active[a] = side.active[b] ?? null;
      side.active[b] = first;
      return;
    }
    case 'battle_end':
      view.ended = true;
      view.winner = event.winner;
      return;
    default:
      return;
  }
}

/** Gleicht das Sichtmodell mit dem Engine-Zustand ab (an Entscheidungspunkten). */
export function syncView(view: BattleView, battle: Battle): void {
  const state = battle.state;
  view.turn = state.turn;
  for (const side of state.sides) {
    const target = view.sides[side.index];
    const own = side.index === view.perspective;
    target.teamSize = side.team.length;
    target.active = [...side.active];
    for (const mon of side.team) {
      // Gegner nur, wenn sie schon zu sehen waren.
      if (!own && !mon.revealed) continue;
      const boosts: Partial<Record<BoostId, number>> = {};
      for (const [stat, stage] of Object.entries(mon.boosts) as [BoostId, number][]) {
        if (stage !== 0) boosts[stat] = stage;
      }
      target.mons[mon.index] = {
        index: mon.index,
        species: mon.species,
        name: mon.name,
        level: mon.level,
        hp: mon.hp,
        maxHp: mon.maxHp,
        types: [...mon.types],
        status: mon.status,
        boosts,
        volatiles: mon.fainted ? [] : Object.keys(mon.volatiles),
        fainted: mon.fainted,
        item: own ? mon.item : null,
      };
    }
    const conditions: Record<string, ConditionView> = {};
    for (const [id, data] of Object.entries(side.conditions)) {
      conditions[id] = {
        ...(data.turns === undefined ? {} : { turns: data.turns }),
        ...(data.layers === undefined ? {} : { layers: data.layers }),
      };
    }
    target.conditions = conditions;
  }
  view.weather = state.field.weather ? { ...state.field.weather } : null;
  view.terrain = state.field.terrain ? { ...state.field.terrain } : null;
  const fields: Record<string, ConditionView> = {};
  for (const [id, data] of Object.entries(state.field.effects)) {
    fields[id] = data.turns === undefined ? {} : { turns: data.turns };
  }
  view.fields = fields;
  view.ended = battle.ended;
  view.winner = battle.winner;
}
