<script lang="ts">
  import { STANDARD_DEX, TYPE_COLORS } from '../../data/index.ts';
  import { STRUGGLE_MOVE_ID } from '../../engine/battle.ts';
  import type { MoveOption } from '../../engine/choices.ts';
  import type { MoveData } from '../../engine/dex.ts';
  import type { PositionRef } from '../../engine/model.ts';
  import { effectiveness } from '../../engine/typechart.ts';
  import { t } from '../../i18n/i18n.svelte.ts';
  import MonIcon from '../components/MonIcon.svelte';
  import TypeBadge from '../components/TypeBadge.svelte';
  import { settings } from '../settings.svelte.ts';
  import { categoryIconUrl, statusIconUrl, type MonsterImages } from '../spriteImages.ts';
  import type { CommandInput, CommandStep } from './commandInput.svelte.ts';
  import { effectClass, effectLabel, hpColor } from './layout.ts';
  import type { BattleSession } from './session.svelte.ts';
  import { monAt } from './viewModel.ts';

  interface Props {
    session: BattleSession;
    input: CommandInput;
    images: Record<string, MonsterImages>;
    onForfeit: () => void;
  }

  const { session, input, images, onForfeit }: Props = $props();

  const dex = STANDARD_DEX;
  const view = $derived(session.view);
  const step = $derived(input.step);
  const position = $derived(input.position);
  const slot = $derived(position === null ? null : input.slot(position));
  const activeMon = $derived(position === null ? undefined : monAt(view, 0, position));
  const foes = $derived(
    Array.from({ length: session.activePerSide }, (_, index) => monAt(view, 1, index)).filter(
      (mon) => mon !== undefined && !mon.fainted,
    ),
  );

  /** Details gelten nur für den Schritt, in dem sie geöffnet wurden. */
  let shown = $state<{ step: CommandStep; move: MoveData } | null>(null);
  const detail = $derived(shown?.step === step ? shown.move : null);
  let pressTimer: ReturnType<typeof setTimeout> | null = null;
  let suppressClick = false;

  function showDetail(move: MoveData | null): void {
    shown = move ? { step, move } : null;
  }

  function factorsFor(move: MoveData): { name: string; factor: number }[] {
    if (!settings.effectivenessHints || move.category === 'status' || move.typeless) return [];
    return foes.flatMap((foe) =>
      foe ? [{ name: foe.name, factor: effectiveness(dex.typeChart, move.type, foe.types) }] : [],
    );
  }

  function startPress(event: PointerEvent, move: MoveData): void {
    if (event.pointerType === 'mouse') return;
    cancelPress();
    pressTimer = setTimeout(() => {
      showDetail(move);
      suppressClick = true;
    }, 450);
  }

  function cancelPress(): void {
    if (pressTimer !== null) clearTimeout(pressTimer);
    pressTimer = null;
  }

  function pickMove(index: number): void {
    cancelPress();
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    input.chooseMove(index);
  }

  /** Per Lang-Drücken geöffnete Details schließt die nächste Berührung. */
  function closeTouchDetail(event: PointerEvent): void {
    if (event.pointerType !== 'mouse') showDetail(null);
  }

  function hover(event: PointerEvent, move: MoveData | null): void {
    if (event.pointerType === 'mouse') showDetail(move);
  }

  function focusDetail(event: FocusEvent, move: MoveData): void {
    const target = event.currentTarget;
    if (target instanceof HTMLElement && target.matches(':focus-visible')) showDetail(move);
  }

  function targetLabel(ref: PositionRef): { name: string; side: string } {
    const mon = monAt(view, ref.side, ref.position);
    return {
      name: mon?.name ?? '?',
      side: t(ref.side === 0 ? 'battle.ally' : 'battle.foe'),
    };
  }

  function moveOf(option: MoveOption): MoveData {
    return dex.move(option.id);
  }

  const targetMove = $derived(
    step.kind === 'target' && slot ? dex.move(slot.moves[step.move]?.id ?? STRUGGLE_MOVE_ID) : null,
  );

  const header = $derived.by(() => {
    const name = activeMon?.name ?? '';
    switch (step.kind) {
      case 'action':
        return t('battle.whatWill', { name });
      case 'target':
        return t('battle.chooseTarget', { move: targetMove?.name ?? '' });
      case 'switch':
        return t('battle.chooseSwitch', { name });
      case 'replace': {
        const fainted = activeMon;
        if (fainted) return t('battle.chooseReplacement', { name: fainted.name });
        if (session.activePerSide === 1) return t('battle.chooseNext');
        return t('battle.chooseReplacementSlot', {
          slot: t(step.position === 0 ? 'battle.slotLeft' : 'battle.slotRight'),
        });
      }
      case 'idle':
        return '';
    }
  });
</script>

<svelte:window onpointerdown={closeTouchDetail} />

<div class="commands" data-step={step.kind}>
  <div class="header">
    <span class="prompt">{header}</span>
    {#if session.error}<span class="error">{t('battle.error', { message: session.error })}</span
      >{/if}
  </div>

  {#if step.kind === 'action' && slot}
    <div class="body">
      {#if slot.struggle}
        {@const move = dex.move(STRUGGLE_MOVE_ID)}
        <div class="moves single">
          <button
            class="move"
            data-key="1"
            style:--type-color={TYPE_COLORS[move.type]}
            onclick={() => {
              input.chooseMove(0);
            }}
          >
            <span class="move-name">{move.name}</span>
          </button>
        </div>
      {:else}
        <div class="moves">
          {#each slot.moves as option, index (option.id)}
            {@const move = moveOf(option)}
            {@const factors = factorsFor(move)}
            <button
              class="move"
              data-key={index + 1}
              disabled={option.disabled}
              style:--type-color={TYPE_COLORS[move.type]}
              onclick={() => {
                pickMove(index);
              }}
              onpointerdown={(event) => {
                startPress(event, move);
              }}
              onpointerup={cancelPress}
              onpointerleave={(event) => {
                cancelPress();
                hover(event, null);
              }}
              onpointerenter={(event) => {
                hover(event, move);
              }}
              onfocus={(event) => {
                focusDetail(event, move);
              }}
              oncontextmenu={(event) => {
                event.preventDefault();
              }}
            >
              <span class="key">{index + 1}</span>
              <span class="move-name">{move.name}</span>
              <span class="move-meta">
                <TypeBadge type={move.type} compact />
                <img
                  src={categoryIconUrl(move.category, 16)}
                  alt={t(`battle.categories.${move.category}`)}
                  width="16"
                  height="16"
                />
                <span class="pp" class:low={option.pp <= Math.ceil(option.maxPp / 4)}>
                  {t('battle.pp', { pp: option.pp, max: option.maxPp })}
                </span>
              </span>
              {#if factors.length > 0}
                <span class="factors">
                  {#each factors as entry, foeIndex (foeIndex)}
                    <span
                      class="factor {effectClass(entry.factor)}"
                      title={t('battle.effectAgainst', {
                        effect: t(`battle.effect.${effectClass(entry.factor)}`),
                        name: entry.name,
                      })}>{effectLabel(entry.factor)}</span
                    >
                  {/each}
                </span>
              {/if}
            </button>
          {/each}
        </div>
      {/if}
      <div class="side-actions">
        <button
          class="pixel-button"
          disabled={!input.canSwitch}
          onclick={() => {
            input.openSwitch();
          }}
        >
          {t('battle.switch')}
        </button>
        {#if input.canGoBack}
          <button
            class="pixel-button"
            onclick={() => {
              input.back();
            }}>{t('battle.back')}</button
          >
        {:else}
          <button class="pixel-button subtle" onclick={onForfeit}>{t('battle.forfeit')}</button>
        {/if}
      </div>
      {#if slot.trapped && activeMon}
        <p class="note">{t('battle.trapped', { name: activeMon.name })}</p>
      {/if}
    </div>
  {:else if step.kind === 'target'}
    <div class="body">
      <div class="targets">
        {#each input.targets as target, index (`${target.side}:${target.position}`)}
          {@const label = targetLabel(target)}
          {@const mon = monAt(view, target.side, target.position)}
          {@const factor =
            targetMove && mon && target.side === 1 && targetMove.category !== 'status'
              ? effectiveness(dex.typeChart, targetMove.type, mon.types)
              : null}
          <button
            class="target pixel-button"
            class:foe={target.side === 1}
            data-key={index + 1}
            onclick={() => {
              input.chooseTarget(target);
            }}
          >
            <span class="key">{index + 1}</span>
            <span class="target-name">{label.name}</span>
            <span class="target-side">{label.side}</span>
            {#if factor !== null && settings.effectivenessHints}
              <span class="factor {effectClass(factor)}">{effectLabel(factor)}</span>
            {/if}
          </button>
        {/each}
      </div>
      <div class="side-actions">
        <button
          class="pixel-button"
          onclick={() => {
            input.back();
          }}>{t('battle.back')}</button
        >
      </div>
    </div>
  {:else if step.kind === 'switch' || step.kind === 'replace'}
    <div class="body">
      <div class="bench">
        {#each input.switchList as index, order (index)}
          {@const mon = view.sides[0].mons[index]}
          {#if mon}
            <button
              class="bench-mon"
              data-key={order + 1}
              onclick={() => {
                input.chooseSwitch(index);
              }}
            >
              <MonIcon images={images[mon.species]} scale={1.5} />
              <span class="bench-text">
                <span class="bench-name">
                  {mon.name}
                  {#if mon.status}
                    <img src={statusIconUrl(mon.status, 16)} alt="" width="16" height="16" />
                  {/if}
                </span>
                <span class="mini-bar">
                  <span
                    class="mini-fill {hpColor(mon.hp / mon.maxHp)}"
                    style:width="{(mon.hp / mon.maxHp) * 100}%"
                  ></span>
                </span>
                <span class="bench-hp">{mon.hp}/{mon.maxHp}</span>
              </span>
              <span class="bench-types">
                {#each mon.types as type (type)}<TypeBadge {type} compact />{/each}
              </span>
            </button>
          {/if}
        {:else}
          <p class="note">{t('battle.noSwitch')}</p>
        {/each}
      </div>
      <div class="side-actions">
        {#if input.canGoBack}
          <button
            class="pixel-button"
            onclick={() => {
              input.back();
            }}>{t('battle.back')}</button
          >
        {/if}
      </div>
    </div>
  {/if}

  {#if detail}
    <div class="detail pixel-panel" role="tooltip">
      <div class="detail-head">
        <strong>{detail.name}</strong>
        <TypeBadge type={detail.type} />
        <span class="detail-cat">
          <img src={categoryIconUrl(detail.category, 16)} alt="" width="16" height="16" />
          {t(`battle.categories.${detail.category}`)}
        </span>
      </div>
      <dl>
        <dt>{t('battle.power')}</dt>
        <dd>{detail.power > 0 ? detail.power : '—'}</dd>
        <dt>{t('battle.accuracy')}</dt>
        <dd>{detail.accuracy === true ? t('battle.alwaysHits') : `${detail.accuracy} %`}</dd>
        <dt>{t('battle.target')}</dt>
        <dd>{t(`battle.targets.${detail.target}`)}</dd>
        {#if detail.priority !== 0}
          <dt>{t('battle.priority')}</dt>
          <dd>{detail.priority > 0 ? '+' : ''}{detail.priority}</dd>
        {/if}
      </dl>
      <p>{detail.description}</p>
    </div>
  {/if}
</div>

<style>
  .commands {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    height: 100%;
    min-height: 0;
  }

  .header {
    display: flex;
    align-items: baseline;
    gap: 1rem;
    min-height: 1.5rem;
  }

  .prompt {
    font-size: 1.05rem;
    font-weight: 800;
    color: var(--frame-light);
  }

  .error {
    color: var(--danger);
    font-size: 0.85rem;
  }

  .body {
    display: flex;
    flex: 1;
    gap: 0.6rem;
    min-height: 0;
  }

  .moves {
    display: grid;
    flex: 1;
    grid-template-columns: 1fr 1fr;
    grid-auto-rows: minmax(var(--touch), 1fr);
    gap: 0.5rem;
  }

  .moves.single {
    grid-template-columns: 1fr;
  }

  .move {
    position: relative;
    display: grid;
    grid-template-columns: 1fr auto;
    grid-template-rows: auto auto;
    align-content: center;
    gap: 0.15rem 0.5rem;
    min-height: 3.6rem;
    padding: 0.35rem 0.7rem 0.35rem 1.6rem;
    border: 3px solid color-mix(in srgb, var(--type-color) 55%, #000);
    border-radius: var(--radius);
    background: linear-gradient(
      color-mix(in srgb, var(--type-color) 62%, #1a1a2a),
      color-mix(in srgb, var(--type-color) 38%, #10101a)
    );
    box-shadow:
      inset 0 2px 0 rgba(255, 255, 255, 0.18),
      inset 0 -3px 0 rgba(0, 0, 0, 0.3),
      3px 3px 0 rgba(0, 0, 0, 0.45);
    color: #fffaf0;
    text-align: left;
    text-shadow: 0 1px 0 rgba(0, 0, 0, 0.7);
    cursor: pointer;
    -webkit-touch-callout: none;
    transition:
      transform 80ms,
      filter 120ms;
  }

  .move:hover:not(:disabled) {
    filter: brightness(1.12);
  }

  .move:active:not(:disabled) {
    transform: translate(2px, 2px);
  }

  .move:disabled {
    filter: grayscale(0.85) brightness(0.6);
    cursor: not-allowed;
  }

  .key {
    position: absolute;
    left: 0.45rem;
    top: 0.3rem;
    color: rgba(255, 255, 255, 0.55);
    font-size: 0.7rem;
    font-weight: 800;
  }

  .move-name {
    grid-column: 1;
    overflow: hidden;
    font-size: 1.02rem;
    font-weight: 800;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .move-meta {
    display: flex;
    grid-column: 1;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.75rem;
  }

  .move-meta img {
    image-rendering: pixelated;
  }

  .pp {
    font-family: var(--font-mono);
    font-weight: 700;
  }

  .pp.low {
    color: #ffb0a0;
  }

  .factors {
    display: flex;
    grid-column: 2;
    grid-row: 1 / span 2;
    flex-direction: column;
    gap: 0.15rem;
    justify-content: center;
  }

  .factor {
    min-width: 2.1rem;
    padding: 0 0.3rem;
    border-radius: 3px;
    font-size: 0.75rem;
    font-weight: 800;
    text-align: center;
    text-shadow: none;
  }

  .factor.strong {
    background: #62d25a;
    color: #0c2a0a;
  }

  .factor.neutral {
    background: rgba(255, 255, 255, 0.25);
    color: #fff;
  }

  .factor.weak {
    background: #e0963a;
    color: #2a1404;
  }

  .factor.immune {
    background: #2a2a34;
    color: #a0a0b0;
  }

  .side-actions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 9.5rem;
  }

  .side-actions .pixel-button {
    flex: 1;
    max-height: 4.2rem;
  }

  .side-actions .subtle {
    background: linear-gradient(#3a2430, #24161e);
    font-size: 0.85rem;
  }

  button:disabled {
    cursor: not-allowed;
  }

  .pixel-button:disabled {
    opacity: 0.45;
  }

  .note {
    position: absolute;
    bottom: -0.2rem;
    left: 0;
    margin: 0;
    color: var(--text-muted);
    font-size: 0.8rem;
  }

  .targets {
    display: grid;
    flex: 1;
    grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
    grid-auto-rows: minmax(var(--touch), 4.2rem);
    gap: 0.5rem;
  }

  .target {
    position: relative;
    display: grid;
    grid-template-columns: 1fr auto;
    align-content: center;
    padding-left: 1.6rem;
    text-align: left;
    text-transform: none;
  }

  .target.foe {
    background: linear-gradient(#5a2a30, #36181c);
  }

  .target-name {
    font-size: 1.05rem;
  }

  .target-side {
    grid-column: 1;
    color: var(--text-muted);
    font-size: 0.75rem;
    font-weight: 600;
  }

  .target .factor {
    grid-column: 2;
    grid-row: 1 / span 2;
    align-self: center;
  }

  .bench {
    display: grid;
    flex: 1;
    grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
    grid-auto-rows: minmax(var(--touch), auto);
    align-content: start;
    gap: 0.45rem;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    touch-action: pan-y;
  }

  .bench-mon {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.3rem 0.6rem 0.3rem 0.3rem;
    border: 3px solid var(--frame-dark);
    border-radius: var(--radius);
    background: linear-gradient(#262b50, #191c38);
    box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.45);
    text-align: left;
    cursor: pointer;
  }

  .bench-mon:hover {
    border-color: var(--frame);
  }

  .bench-text {
    display: grid;
    flex: 1;
    gap: 0.15rem;
    min-width: 0;
  }

  .bench-name {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    overflow: hidden;
    font-weight: 800;
    white-space: nowrap;
  }

  .mini-bar {
    position: relative;
    height: 6px;
    background: #26283a;
  }

  .mini-fill {
    position: absolute;
    inset: 0 auto 0 0;
  }

  .mini-fill.high {
    background: #52c95a;
  }

  .mini-fill.mid {
    background: #e8c23a;
  }

  .mini-fill.low {
    background: #e0503c;
  }

  .bench-hp {
    color: var(--text-muted);
    font-family: var(--font-mono);
    font-size: 0.75rem;
  }

  .bench-types {
    display: flex;
    gap: 0.1rem;
  }

  .detail {
    position: absolute;
    bottom: calc(100% + 0.6rem);
    left: 0;
    z-index: 20;
    width: min(26rem, 100%);
    padding: 0.6rem 0.8rem;
    pointer-events: none;
  }

  .detail-head {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .detail-cat {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    color: var(--text-muted);
    font-size: 0.8rem;
  }

  dl {
    display: grid;
    grid-template-columns: auto 1fr auto 1fr;
    gap: 0.1rem 0.6rem;
    margin: 0.4rem 0;
    font-size: 0.85rem;
  }

  dt {
    color: var(--text-muted);
  }

  dd {
    margin: 0;
    font-weight: 700;
  }

  .detail p {
    margin: 0;
    font-size: 0.85rem;
  }
</style>
