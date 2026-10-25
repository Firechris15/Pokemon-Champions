/**
 * Hook-System: Fähigkeiten, Items (und ab Phase 2 Status, Felder, Wetter) hängen sich an
 * benannte Stellen im Kampfablauf. Neue Effekte brauchen so keinen Umbau der Engine.
 *
 * Konvention: `holder` ist immer das Monster, das den Effekt trägt. Modifikator-Hooks geben einen
 * Faktor zurück (z. B. 1.5) oder `undefined` für „keine Änderung“.
 */
import type { Dex, MoveData } from './dex.ts';
import type { DamageCause, EffectRef, HealCause, BattleEvent } from './events.ts';
import type { BoostTable, TypeId } from './model.ts';
import type { Rng } from './rng.ts';
import type { BattleState, Mon } from './state.ts';

/** Was Effekte während eines Kampfes tun dürfen. */
export interface BattleContext {
  readonly dex: Dex;
  readonly rng: Rng;
  readonly state: BattleState;
  log(event: BattleEvent): void;
  damage(target: Mon, amount: number, cause: DamageCause, source?: Mon, effect?: EffectRef): number;
  heal(target: Mon, amount: number, cause: HealCause, effect?: EffectRef): number;
  boost(target: Mon, boosts: Partial<BoostTable>, source?: Mon): void;
  /** Meldet die Aktivierung der Fähigkeit des Monsters. */
  showAbility(mon: Mon): void;
  /** Meldet die Aktivierung des Items; `consume` entfernt es. */
  useItem(mon: Mon, consume: boolean): void;
  activeFoes(mon: Mon): Mon[];
  activeAllies(mon: Mon): Mon[];
  effectiveness(moveType: TypeId, target: Mon): number;
}

export interface EffectHooks {
  /** Nach dem Einwechseln (beim Kampfstart in Initiative-Reihenfolge). */
  onSwitchIn?(ctx: BattleContext, holder: Mon): void;
  /** Rundenende, aktive Monster in Initiative-Reihenfolge. */
  onResidual?(ctx: BattleContext, holder: Mon): void;

  /** Angreifer: Faktor auf den Angriffs-/Fokuswert. */
  onModifyAttackStat?(
    ctx: BattleContext,
    holder: Mon,
    target: Mon,
    move: MoveData,
  ): number | undefined;
  /** Verteidiger: Faktor auf den Verteidigungs-/Willenswert. */
  onModifyDefenseStat?(
    ctx: BattleContext,
    holder: Mon,
    attacker: Mon,
    move: MoveData,
  ): number | undefined;
  /** Angreifer: Faktor auf die Stärke der Attacke. */
  onModifyBasePower?(
    ctx: BattleContext,
    holder: Mon,
    target: Mon,
    move: MoveData,
    power: number,
  ): number | undefined;
  /** Angreifer: Faktor auf den Endschaden (Items/Fähigkeiten). */
  onModifyDamageDealt?(
    ctx: BattleContext,
    holder: Mon,
    target: Mon,
    move: MoveData,
    effectiveness: number,
  ): number | undefined;
  /** Verteidiger: Faktor auf den erlittenen Endschaden. */
  onModifyDamageTaken?(
    ctx: BattleContext,
    holder: Mon,
    attacker: Mon,
    move: MoveData,
    effectiveness: number,
  ): number | undefined;
  /** Faktor auf die Initiative. */
  onModifySpeed?(ctx: BattleContext, holder: Mon): number | undefined;
  /** Neue Priorität der Attacke (statt Faktor). */
  onModifyPriority?(
    ctx: BattleContext,
    holder: Mon,
    move: MoveData,
    priority: number,
  ): number | undefined;
  /** Neue Volltreffer-Stufe. */
  onModifyCritStage?(
    ctx: BattleContext,
    holder: Mon,
    move: MoveData,
    stage: number,
  ): number | undefined;
  /** Neue Trefferzahl bei Mehrfachangriffen. */
  onModifyHitCount?(
    ctx: BattleContext,
    holder: Mon,
    move: MoveData,
    hits: number,
  ): number | undefined;
  /** Neuer Rückstoßschaden. */
  onModifyRecoil?(
    ctx: BattleContext,
    holder: Mon,
    move: MoveData,
    recoil: number,
  ): number | undefined;

  /** Ziel: `false` blockt die Attacke (z. B. Schutz). Der Effekt meldet das selbst. */
  onTryHitTaken?(
    ctx: BattleContext,
    holder: Mon,
    attacker: Mon,
    move: MoveData,
  ): boolean | undefined;
  /**
   * Ziel: `true` = immun gegen diese Attacke. Muss frei von Seiteneffekten sein, weil KI und
   * Schadensrechner sie ebenfalls fragen; Reaktionen gehören in `onImmunityTriggered`.
   */
  onCheckImmunity?(
    ctx: BattleContext,
    holder: Mon,
    attacker: Mon,
    move: MoveData,
  ): boolean | undefined;
  /** Ziel: nachdem die eigene Immunität eine Attacke abgefangen hat (z. B. Wert erhöhen). */
  onImmunityTriggered?(ctx: BattleContext, holder: Mon, attacker: Mon, move: MoveData): void;
  /** Ziel: Schaden vor dem Abzug anpassen (z. B. mit 1 LP überleben). */
  onBeforeDamageTaken?(
    ctx: BattleContext,
    holder: Mon,
    damage: number,
    attacker: Mon,
    move: MoveData,
  ): number | undefined;
  /** Ziel: nach jedem LP-Verlust (z. B. Heilbeeren). */
  onAfterDamageTaken?(ctx: BattleContext, holder: Mon, amount: number, cause: DamageCause): void;
  /** Anwender: nach seiner Attacke mit dem insgesamt verursachten Schaden. */
  onAfterMove?(ctx: BattleContext, holder: Mon, move: MoveData, damageDealt: number): void;
  /** Anwender: nachdem er ein Monster besiegt hat. */
  onAfterKO?(ctx: BattleContext, holder: Mon, fainted: Mon): void;
}
