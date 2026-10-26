/**
 * Öffentliche Sicht auf einen Kampf aus der Perspektive einer Seite: das eigene Team vollständig,
 * vom Gegner nur, was ein Spieler sieht (Spezies, Essenzen, LP-Anteil, Status, Stufen).
 * Grundlage für die KI-Stufen – keine versteckten Informationen (SPEC 7).
 */
import type { Battle } from '../engine/battle.ts';
import type {
  BoostTable,
  MonRef,
  SideIndex,
  StatTable,
  StatusId,
  TypeId,
} from '../engine/model.ts';
import { otherSide } from '../engine/model.ts';
import type { MoveSlot } from '../engine/state.ts';

export interface PublicMon {
  readonly ref: MonRef;
  /** Aktive Position oder `null` (Bank/besiegt). */
  readonly position: number | null;
  readonly species: string;
  readonly types: readonly TypeId[];
  readonly level: number;
  /** LP-Anteil 0–1 (beim Gegner gerundet wie in der Anzeige). */
  readonly hpFraction: number;
  readonly status: StatusId | null;
  readonly boosts: Readonly<BoostTable>;
  readonly fainted: boolean;
  /** Flüchtige Zustände, die man sieht (Trugbild, Schutz, Verwirrung …). */
  readonly volatiles: readonly string[];
}

export interface OwnMon extends PublicMon {
  readonly hp: number;
  readonly maxHp: number;
  readonly stats: Readonly<StatTable>;
  readonly moves: readonly MoveSlot[];
  readonly ability: string;
  readonly item: string | null;
}

export interface PublicView {
  readonly side: SideIndex;
  readonly turn: number;
  /** Eigenes Kampfteam (Index = MonRef.index). */
  readonly own: readonly OwnMon[];
  /** Bereits gesehene Gegner. */
  readonly foes: readonly PublicMon[];
  readonly weather: string | null;
  readonly terrain: string | null;
  readonly fieldEffects: readonly string[];
  /** Seiteneffekte je Seite (Index = SideIndex). */
  readonly sideConditions: readonly [readonly string[], readonly string[]];
}

export function publicView(battle: Battle, side: SideIndex): PublicView {
  const state = battle.state;
  const own = state.sides[side].team.map((mon): OwnMon => ({
    ref: { side: mon.side, index: mon.index },
    position: mon.position,
    species: mon.species,
    types: [...mon.types],
    level: mon.level,
    hpFraction: mon.hp / mon.maxHp,
    status: mon.status,
    boosts: { ...mon.boosts },
    fainted: mon.fainted,
    volatiles: Object.keys(mon.volatiles),
    hp: mon.hp,
    maxHp: mon.maxHp,
    stats: { ...mon.stats },
    moves: mon.moves.map((slot) => ({ ...slot })),
    ability: mon.ability,
    item: mon.item,
  }));
  const foes = state.sides[otherSide(side)].team
    .filter((mon) => mon.revealed)
    .map((mon): PublicMon => ({
      ref: { side: mon.side, index: mon.index },
      position: mon.position,
      species: mon.species,
      types: [...mon.types],
      level: mon.level,
      // Wie die Anzeige: ganze Prozent.
      hpFraction: Math.ceil((mon.hp / mon.maxHp) * 100) / 100,
      status: mon.status,
      boosts: { ...mon.boosts },
      fainted: mon.fainted,
      volatiles: Object.keys(mon.volatiles),
    }));
  return {
    side,
    turn: state.turn,
    own,
    foes,
    weather: state.field.weather?.id ?? null,
    terrain: state.field.terrain?.id ?? null,
    fieldEffects: Object.keys(state.field.effects),
    sideConditions: [
      Object.keys(state.sides[0].conditions),
      Object.keys(state.sides[1].conditions),
    ],
  };
}
