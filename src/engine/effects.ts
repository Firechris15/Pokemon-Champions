/**
 * Hook-System: Fähigkeiten, Items, Statusprobleme, flüchtige Zustände, Seiteneffekte, Wetter,
 * Felder und Feldeffekte hängen sich an benannte Stellen im Kampfablauf. Neue Effekte brauchen so
 * keinen Umbau der Engine.
 *
 * Konvention: `holder` ist das Monster, auf das der Effekt gerade wirkt – bei Fähigkeit, Item, Status
 * und flüchtigem Zustand sein Träger, bei Seiteneffekten jedes Monster dieser Seite, bei Wetter und
 * Feldern jedes Monster auf dem Feld. Modifikator-Hooks geben einen Faktor zurück (z. B. 1.5) oder
 * `undefined` für „keine Änderung“. Hooks, die KI und Schadensrechner aufrufen (alle `onModify…`
 * und `onCheckImmunity`), müssen frei von Seiteneffekten sein.
 */
import type { ConditionState } from './state.ts';
import type { Dex, MoveData } from './dex.ts';
import type { BattleEvent, DamageCause, EffectRef, HealCause } from './events.ts';
import type { BoostTable, SideIndex, StatusId, TypeId } from './model.ts';
import type { Rng } from './rng.ts';
import type { BattleState, Mon } from './state.ts';

/** Eine Attacke während ihrer Ausführung (bzw. Vorschau) mit den Werten dieser Ausführung. */
export interface ActiveMove extends MoveData {
  /** Priorität dieser Ausführung (nach Effekten). */
  readonly activePriority: number;
  /** Trifft beim Ausführen mehr als ein Ziel (Flächenfaktor 0,75). */
  readonly spreadHit: boolean;
}

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
  /** Darf das Monster gerade eine Beere essen (z. B. nicht bei „Beerenbann“ eines Gegners)? */
  canUseBerry(mon: Mon): boolean;
  activeFoes(mon: Mon): Mon[];
  activeAllies(mon: Mon): Mon[];
  effectiveness(moveType: TypeId, target: Mon): number;
  /** Am Boden (nicht Wind-Essenz, nicht schwebend) – für Felder und Fallen. */
  isGrounded(mon: Mon): boolean;

  trySetStatus(target: Mon, status: StatusId, source?: Mon): boolean;
  cureStatus(target: Mon): void;
  addVolatile(target: Mon, id: string, source?: Mon, data?: Partial<ConditionState>): boolean;
  removeVolatile(target: Mon, id: string): void;
  addSideCondition(side: SideIndex, id: string, source?: Mon): boolean;
  removeSideCondition(side: SideIndex, id: string): void;
  sideCondition(side: SideIndex, id: string): ConditionState | undefined;
  setWeather(id: string, source?: Mon): boolean;
  setTerrain(id: string, source?: Mon): boolean;
  weather(): string | null;
  terrain(): string | null;
  /** Schaden, den sich ein verwirrtes Monster selbst zufügt (Stärke 40, physisch, ohne Essenz). */
  selfHitDamage(mon: Mon): number;
}

export interface EffectHooks {
  // ── Ein- und Auswechseln, Rundenende ──
  /** Nach dem Einwechseln (Fallen zuerst, dann Fähigkeiten in Initiative-Reihenfolge). */
  onSwitchIn?(ctx: BattleContext, holder: Mon): void;
  /** Kurz bevor das Monster das Feld verlässt. */
  onSwitchOut?(ctx: BattleContext, holder: Mon): void;
  /** Rundenende, aktive Monster in Initiative-Reihenfolge. */
  onResidual?(ctx: BattleContext, holder: Mon): void;

  // ── Auswahl ──
  /** `true` = diese Attacke ist gesperrt (Wahl-Item, Spott, Wiederholzwang …). */
  onDisableMove?(ctx: BattleContext, holder: Mon, move: MoveData): boolean | undefined;
  /** `true` = das Monster kann nicht ausgewechselt werden. */
  onTrapMon?(ctx: BattleContext, holder: Mon): boolean | undefined;
  /** Neue Priorität der Attacke (statt Faktor). */
  onModifyPriority?(
    ctx: BattleContext,
    holder: Mon,
    move: MoveData,
    priority: number,
  ): number | undefined;

  // ── Vor und während der Attacke ──
  /** `false` = das Monster kann nicht handeln (Schlaf, Starre …). Der Effekt meldet das selbst. */
  onBeforeMove?(ctx: BattleContext, holder: Mon, move: ActiveMove): boolean | undefined;
  /** Gegner des Angreifers: `true` = zieht die Ein-Ziel-Attacke auf sich (Umlenken). */
  onRedirectTarget?(
    ctx: BattleContext,
    holder: Mon,
    attacker: Mon,
    move: ActiveMove,
  ): boolean | undefined;
  /** Ziel: `false` blockt die Attacke (z. B. Schutz). Der Effekt meldet das selbst. */
  onTryHitTaken?(
    ctx: BattleContext,
    holder: Mon,
    attacker: Mon,
    move: ActiveMove,
  ): boolean | undefined;
  /** Partner des Ziels: `false` blockt die Attacke (z. B. Prioritäts-Blocker). */
  onAllyTryHitTaken?(
    ctx: BattleContext,
    holder: Mon,
    target: Mon,
    attacker: Mon,
    move: ActiveMove,
  ): boolean | undefined;
  /** Ziel: `true` = immun gegen diese Attacke (seiteneffektfrei!). */
  onCheckImmunity?(
    ctx: BattleContext,
    holder: Mon,
    attacker: Mon,
    move: ActiveMove,
  ): boolean | undefined;
  /** Ziel: nachdem die eigene Immunität eine Attacke abgefangen hat (z. B. Wert erhöhen). */
  onImmunityTriggered?(ctx: BattleContext, holder: Mon, attacker: Mon, move: ActiveMove): void;
  /** Ziel: Schaden vor dem Abzug anpassen (z. B. mit 1 LP überleben). */
  onBeforeDamageTaken?(
    ctx: BattleContext,
    holder: Mon,
    damage: number,
    attacker: Mon,
    move: ActiveMove,
  ): number | undefined;
  /** Ziel: nach jedem Treffer einer Schadensattacke (Kontakt-Effekte, Beeren). */
  onDamagingHitTaken?(
    ctx: BattleContext,
    holder: Mon,
    attacker: Mon,
    move: ActiveMove,
    damage: number,
  ): void;
  /** Ziel: nach jedem LP-Verlust (z. B. Heilbeeren). */
  onAfterDamageTaken?(ctx: BattleContext, holder: Mon, amount: number, cause: DamageCause): void;
  /** Anwender: nach seiner Attacke mit dem insgesamt verursachten Schaden. */
  onAfterMove?(ctx: BattleContext, holder: Mon, move: ActiveMove, damageDealt: number): void;
  /** Anwender: nachdem er ein Monster besiegt hat. */
  onAfterKO?(ctx: BattleContext, holder: Mon, fainted: Mon): void;

  // ── Modifikatoren (seiteneffektfrei) ──
  /** Angreifer: Faktor auf den Angriffs-/Fokuswert. */
  onModifyAttackStat?(
    ctx: BattleContext,
    holder: Mon,
    target: Mon,
    move: ActiveMove,
  ): number | undefined;
  /** Verteidiger: Faktor auf den Verteidigungs-/Willenswert. */
  onModifyDefenseStat?(
    ctx: BattleContext,
    holder: Mon,
    attacker: Mon,
    move: ActiveMove,
  ): number | undefined;
  /** Angreifer: Faktor auf die Stärke der Attacke. */
  onModifyBasePower?(
    ctx: BattleContext,
    holder: Mon,
    target: Mon,
    move: ActiveMove,
    power: number,
  ): number | undefined;
  /** Angreifer: neuer Gleicher-Typ-Faktor (Standard 1,5). */
  onModifyStab?(
    ctx: BattleContext,
    holder: Mon,
    move: ActiveMove,
    stab: number,
  ): number | undefined;
  /** Angreifer: Faktor auf den Endschaden (Items/Fähigkeiten). */
  onModifyDamageDealt?(
    ctx: BattleContext,
    holder: Mon,
    target: Mon,
    move: ActiveMove,
    effectiveness: number,
  ): number | undefined;
  /** Verteidiger: Faktor auf den erlittenen Endschaden. */
  onModifyDamageTaken?(
    ctx: BattleContext,
    holder: Mon,
    attacker: Mon,
    move: ActiveMove,
    effectiveness: number,
  ): number | undefined;
  /** Partner des Verteidigers: Faktor auf dessen erlittenen Schaden (Partner-Schutz). */
  onAllyModifyDamageTaken?(
    ctx: BattleContext,
    holder: Mon,
    target: Mon,
    attacker: Mon,
    move: ActiveMove,
  ): number | undefined;
  /** Faktor auf die Initiative. */
  onModifySpeed?(ctx: BattleContext, holder: Mon): number | undefined;
  /** Neue Volltreffer-Stufe. */
  onModifyCritStage?(
    ctx: BattleContext,
    holder: Mon,
    move: ActiveMove,
    stage: number,
  ): number | undefined;
  /** Neue Trefferzahl bei Mehrfachangriffen. */
  onModifyHitCount?(
    ctx: BattleContext,
    holder: Mon,
    move: ActiveMove,
    hits: number,
  ): number | undefined;
  /** Neuer Rückstoßschaden. */
  onModifyRecoil?(
    ctx: BattleContext,
    holder: Mon,
    move: ActiveMove,
    recoil: number,
  ): number | undefined;

  // ── Zustände und Werte ──
  /** `false` verhindert ein Statusproblem (z. B. Felder, Fähigkeiten). */
  onSetStatus?(
    ctx: BattleContext,
    holder: Mon,
    status: StatusId,
    source: Mon | undefined,
  ): boolean | undefined;
  /** Nachdem ein Statusproblem gesetzt wurde (z. B. Heilbeere). */
  onAfterSetStatus?(
    ctx: BattleContext,
    holder: Mon,
    status: StatusId,
    source: Mon | undefined,
  ): void;
  /** `false` verhindert einen flüchtigen Zustand (z. B. Zurückschrecken). */
  onTryAddVolatile?(
    ctx: BattleContext,
    holder: Mon,
    id: string,
    source: Mon | undefined,
  ): boolean | undefined;
  /** Darf Stufenänderungen vor dem Anwenden verändern (`boosts` ist veränderbar). */
  onTryBoost?(
    ctx: BattleContext,
    holder: Mon,
    boosts: Partial<BoostTable>,
    source: Mon | undefined,
  ): void;
  /** Nach angewendeten Stufenänderungen (nur tatsächliche Änderungen). */
  onAfterBoost?(
    ctx: BattleContext,
    holder: Mon,
    changes: Partial<BoostTable>,
    source: Mon | undefined,
  ): void;
}
