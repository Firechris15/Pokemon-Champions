/**
 * Ein laufender Kampf auf dem Bildschirm: spielt die Engine-Ereignisse nacheinander ab (Textbox,
 * LP-Balken, Animationen), fragt dann den Spieler und gibt seine Entscheidung an die Engine.
 * Die eigentliche Ablaufsteuerung steckt im testbaren `BattleController`.
 */
import type { Choice, Request } from '../../engine/choices.ts';
import type { AnimationPreset } from '../../engine/dex.ts';
import type { BattleEvent } from '../../engine/events.ts';
import type { MonRef, PositionRef, SideIndex } from '../../engine/model.ts';
import { TYPE_COLORS } from '../../data/index.ts';
import { t } from '../../i18n/i18n.svelte.ts';
import { dexNames, formatEvent, type LogContext, type LogLine } from '../battleLog.ts';
import { settings, speedFactor } from '../settings.svelte.ts';
import { BattleController, PLAYER, type BattleSetup } from './controller.ts';
import { applyEvent, emptyView, syncView, viewMon, type BattleView } from './viewModel.ts';

export type SessionPhase = 'playing' | 'preview' | 'command' | 'ended';

/** Animationszustand eines Platzes auf dem Feld. */
export interface SlotFx {
  attack: boolean;
  hit: boolean;
  faint: boolean;
  entering: boolean;
  leaving: boolean;
  stat: 'up' | 'down' | null;
}

/** Eine Attacken-Animation (Vorlage + Farbe) von einem Platz zu Zielplätzen. */
export interface MoveFx {
  readonly id: number;
  readonly preset: AnimationPreset;
  readonly color: string;
  readonly from: PositionRef;
  readonly to: readonly PositionRef[];
}

export const slotKey = (side: SideIndex, position: number): string => `${side}:${position}`;

const EMPTY_FX: SlotFx = {
  attack: false,
  hit: false,
  faint: false,
  entering: false,
  leaving: false,
  stat: null,
};

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => {
        resolve();
      });
    } else setTimeout(resolve, 16);
  });
}

export class BattleSession {
  readonly controller: BattleController;
  readonly setup: BattleSetup;
  view = $state<BattleView>(emptyView(PLAYER, 2));
  phase = $state<SessionPhase>('playing');
  request = $state.raw<Request | null>(null);
  message = $state<string | null>(null);
  log = $state<LogLine[]>([]);
  fx = $state<Record<string, SlotFx>>({});
  effects = $state<MoveFx[]>([]);
  /** Bis zur nächsten Entscheidung im Schnelldurchlauf. */
  turbo = $state(false);
  error = $state<string | null>(null);

  private readonly logContext: LogContext;
  private skip: (() => void) | null = null;
  private effectId = 0;
  private disposed = false;
  private pumping = false;

  constructor(setup: BattleSetup) {
    this.setup = setup;
    this.controller = new BattleController(setup);
    this.view = emptyView(PLAYER, setup.dex.format(setup.formatId).activePerSide);
    this.logContext = {
      t,
      monName: (mon) => this.monName(mon),
      plainName: (mon) => viewMon(this.view, mon)?.name ?? '?',
      sideName: (side) => t(side === PLAYER ? 'battle.you' : 'battle.opponent'),
      ...dexNames(setup.dex),
      perspective: PLAYER,
    };
  }

  get activePerSide(): number {
    return this.setup.dex.format(this.setup.formatId).activePerSide;
  }

  monName(ref: MonRef): string {
    const name = viewMon(this.view, ref)?.name ?? '?';
    return ref.side === PLAYER ? name : t('battle.foeName', { name });
  }

  fxAt(side: SideIndex, position: number): SlotFx {
    return this.fx[slotKey(side, position)] ?? EMPTY_FX;
  }

  start(): void {
    void this.pump();
  }

  dispose(): void {
    this.disposed = true;
    this.skip?.();
  }

  /** Aktuelle Wartezeit überspringen (Antippen der Textbox). */
  skipCurrent(): void {
    this.skip?.();
  }

  /** Schnelldurchlauf bis zur nächsten Entscheidung. */
  fastForward(): void {
    this.turbo = true;
    this.skip?.();
  }

  submit(choice: Choice): void {
    if (this.phase !== 'command' && this.phase !== 'preview') return;
    // Eingaben stammen oft aus reaktivem Zustand (Proxys) – die Engine bekommt reine Daten.
    const result = this.controller.submit($state.snapshot(choice));
    if (!result.ok) {
      this.error = result.error;
      return;
    }
    this.error = null;
    this.request = null;
    void this.pump();
  }

  forfeit(): void {
    this.request = null;
    this.controller.forfeit();
    void this.pump();
  }

  /** Ereignisse abspielen, bis der Spieler entscheiden muss oder der Kampf endet. */
  private async pump(): Promise<void> {
    if (this.pumping) return;
    this.pumping = true;
    this.phase = 'playing';
    try {
      for (;;) {
        const request = this.controller.request();
        const events = this.controller.takeEvents();
        if (events.length > 0) {
          for (const event of events) {
            if (this.disposed) return;
            await this.present(event);
          }
          continue;
        }
        syncView(this.view, this.controller.battle);
        this.fx = {};
        this.turbo = false;
        if (this.controller.ended) {
          this.phase = 'ended';
          return;
        }
        this.request = request;
        this.message = null;
        this.phase = request.type === 'teamPreview' ? 'preview' : 'command';
        return;
      }
    } finally {
      this.pumping = false;
    }
  }

  private positionOf(ref: MonRef): number {
    return this.view.sides[ref.side].active.indexOf(ref.index);
  }

  private setFx(ref: MonRef, patch: Partial<SlotFx>): void {
    const position = this.positionOf(ref);
    if (position < 0) return;
    const key = slotKey(ref.side, position);
    this.fx[key] = { ...(this.fx[key] ?? EMPTY_FX), ...patch };
  }

  private wait(ms: number): Promise<void> {
    const factor = this.turbo ? 0.05 : speedFactor(settings.textSpeed);
    return new Promise((resolve) => {
      const done = (): void => {
        clearTimeout(timer);
        this.skip = null;
        resolve();
      };
      const timer = setTimeout(done, Math.round(ms * factor));
      this.skip = done;
    });
  }

  private async present(event: BattleEvent): Promise<void> {
    const dex = this.setup.dex;
    // Beim Einwechseln braucht der Text schon den neuen Namen.
    const applyFirst = event.type === 'switch_in' || event.type === 'swap';
    if (applyFirst) applyEvent(this.view, event, dex);
    const line = formatEvent(event, this.logContext);
    if (line) this.log.push(line);

    let visual = 0;
    let cleanup: (() => void) | null = null;
    switch (event.type) {
      case 'move_used': {
        const move = dex.move(event.move);
        const from = { side: event.mon.side, position: this.positionOf(event.mon) };
        const to = event.targets
          .map((ref) => ({ side: ref.side, position: this.positionOf(ref) }))
          .filter((ref) => ref.position >= 0);
        const fx: MoveFx = {
          id: ++this.effectId,
          preset: move.animation.preset,
          color: move.animation.color ?? TYPE_COLORS[move.type],
          from,
          to,
        };
        this.setFx(event.mon, { attack: true });
        if (from.position >= 0) this.effects = [...this.effects, fx];
        visual = 620;
        cleanup = () => {
          this.setFx(event.mon, { attack: false });
          this.effects = this.effects.filter((entry) => entry.id !== fx.id);
        };
        break;
      }
      case 'damage':
        if (event.cause !== 'confusion') this.setFx(event.target, { hit: true });
        visual = 520;
        cleanup = () => {
          this.setFx(event.target, { hit: false });
        };
        break;
      case 'heal':
        visual = 420;
        break;
      case 'faint':
        this.setFx(event.mon, { faint: true });
        visual = 900;
        break;
      case 'switch_out':
        this.setFx(event.mon, { leaving: true });
        visual = 420;
        cleanup = () => {
          const position = this.positionOf(event.mon);
          applyEvent(this.view, event, dex);
          if (position >= 0) Reflect.deleteProperty(this.fx, slotKey(event.mon.side, position));
        };
        break;
      case 'switch_in': {
        const key = slotKey(event.mon.side, event.position);
        this.fx[key] = { ...EMPTY_FX, entering: true };
        visual = 520;
        cleanup = () => {
          this.fx[key] = { ...EMPTY_FX };
        };
        break;
      }
      case 'stat_change':
        if (event.change !== 0)
          this.setFx(event.target, { stat: event.change > 0 ? 'up' : 'down' });
        visual = 520;
        cleanup = () => {
          this.setFx(event.target, { stat: null });
        };
        break;
      default:
        break;
    }
    if (!applyFirst && event.type !== 'switch_out') applyEvent(this.view, event, dex);

    let reading = 0;
    if (line) {
      if (line.kind === 'turn') reading = 450;
      else if (line.kind === 'result') reading = 1400;
      else reading = line.kind === 'action' ? 950 : 750;
      if (line.kind !== 'turn' || this.message === null) this.message = line.text;
    }
    const duration = Math.max(visual, reading);
    if (duration > 0) await this.wait(duration);
    cleanup?.();
    // Ein Bild Pause, damit gleiche Animationen (z. B. Mehrfachtreffer) neu starten.
    if (duration > 0) await nextFrame();
  }
}
