<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { STANDARD_DEX } from '../../data/index.ts';
  import type { PositionRef } from '../../engine/model.ts';
  import { t } from '../../i18n/i18n.svelte.ts';
  import BattleLogPanel from '../battle/BattleLogPanel.svelte';
  import BattleScene from '../battle/BattleScene.svelte';
  import BattleSettings from '../battle/BattleSettings.svelte';
  import CommandPanel from '../battle/CommandPanel.svelte';
  import { CommandInput } from '../battle/commandInput.svelte.ts';
  import { toSetup, type BattleConfig } from '../battle/config.ts';
  import FieldStatus from '../battle/FieldStatus.svelte';
  import ResultOverlay from '../battle/ResultOverlay.svelte';
  import { BattleSession } from '../battle/session.svelte.ts';
  import TeamPreview from '../battle/TeamPreview.svelte';
  import { saveSettings, settings } from '../settings.svelte.ts';
  import { moveFocus } from '../spatialNav.ts';
  import { monsterImages, type MonsterImages } from '../spriteImages.ts';

  interface Props {
    config: BattleConfig;
    onRematch: () => void;
    onNewBattle: () => void;
    onMenu: () => void;
  }

  const { config, onRematch, onNewBattle, onMenu }: Props = $props();

  const dex = STANDARD_DEX;
  const session = new BattleSession(
    toSetup(
      dex,
      untrack(() => config),
      [
        t('battle.you'),
        t('battleSetup.aiName', {
          level: t(
            untrack(() => config.agent) === 'easy' ? 'battleSetup.easy' : 'battleSetup.normal',
          ),
        }),
      ],
    ),
  );
  const input = new CommandInput(session);

  let images = $state<Record<string, MonsterImages>>({});
  let logOpen = $state(settings.logOpen);
  let settingsOpen = $state(false);
  let confirmForfeit = $state(false);
  let resultHidden = $state(false);
  let bottom = $state<HTMLElement>();

  const phase = $derived(session.phase);
  const request = $derived(session.request);
  const targets = $derived(input.targets);

  onMount(() => {
    // Erst die Monster des Kampfes erzeugen (dringend), dann geht es los.
    for (const team of untrack(() => config.teams)) {
      for (const set of team) {
        void monsterImages(set.species, true).then((result) => {
          images[set.species] = result;
        });
      }
    }
    session.start();
    return () => {
      session.dispose();
    };
  });

  $effect(() => {
    const current = phase === 'command' ? request : null;
    untrack(() => {
      input.reset(current);
    });
  });

  function toggleLog(): void {
    logOpen = !logOpen;
    settings.logOpen = logOpen;
    saveSettings();
  }

  async function copyReplay(): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(JSON.stringify(session.controller.battle.toReplay()));
      return true;
    } catch {
      return false;
    }
  }

  function forfeit(): void {
    confirmForfeit = false;
    session.forfeit();
  }

  function pressKey(key: string): boolean {
    const button = bottom?.querySelector<HTMLButtonElement>(`button[data-key="${key}"]`);
    if (!button || button.disabled) return false;
    button.click();
    return true;
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented) return;
    if (confirmForfeit || settingsOpen) {
      if (event.key === 'Escape') {
        event.preventDefault();
        confirmForfeit = false;
        settingsOpen = false;
      }
      return;
    }
    if (phase === 'preview') return;
    if (phase === 'playing') {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        session.skipCurrent();
      }
      return;
    }
    if (phase !== 'command') return;
    if (/^[1-9]$/.test(event.key) && pressKey(event.key)) {
      event.preventDefault();
      return;
    }
    if (event.key === 'Escape' && input.canGoBack) {
      event.preventDefault();
      input.back();
      return;
    }
    if (moveFocus(bottom, event.key)) event.preventDefault();
  }
</script>

<svelte:window onkeydown={onKeydown} />

<div class="battle" class:log-open={logOpen}>
  <header class="topbar">
    <FieldStatus view={session.view} />
    <div class="tools">
      <button
        class="pixel-button tool"
        aria-pressed={logOpen}
        onclick={toggleLog}
        title={t('battle.log')}>{t('battle.log')}</button
      >
      <button
        class="pixel-button tool"
        onclick={() => {
          settingsOpen = true;
        }}
        aria-label={t('battle.settings')}
        title={t('battle.settings')}>⚙</button
      >
    </div>
  </header>

  <div class="arena-wrap">
    <BattleScene
      {session}
      {images}
      arena={config.arena}
      {targets}
      current={phase === 'command' ? input.position : null}
      onTarget={(target: PositionRef) => {
        input.chooseTarget(target);
      }}
    />
  </div>

  <section class="bottom pixel-panel" bind:this={bottom}>
    {#if phase === 'command'}
      <CommandPanel
        {session}
        {input}
        {images}
        onForfeit={() => {
          confirmForfeit = true;
        }}
      />
    {:else}
      <div class="textbox">
        <button
          class="message"
          onclick={() => {
            session.skipCurrent();
          }}
          aria-label={t('battle.skip')}
        >
          <span aria-live="polite">{session.message ?? (phase === 'preview' ? '' : '…')}</span>
          {#if phase === 'playing'}<span class="more" aria-hidden="true">▼</span>{/if}
        </button>
        {#if phase === 'playing'}
          <button
            class="pixel-button ff"
            onclick={() => {
              session.fastForward();
            }}
            aria-pressed={session.turbo}>{t('battle.fastForward')} »</button
          >
        {:else if phase === 'ended' && resultHidden}
          <button
            class="pixel-button ff"
            onclick={() => {
              resultHidden = false;
            }}>{t('battle.result.rematch')} / {t('battle.result.menu')}</button
          >
        {/if}
      </div>
    {/if}
  </section>

  {#if logOpen}
    <div class="log-column">
      <BattleLogPanel lines={session.log} onClose={toggleLog} />
    </div>
  {/if}

  {#if phase === 'preview' && request?.type === 'teamPreview'}
    <TeamPreview
      {request}
      {images}
      activePerSide={session.activePerSide}
      onSubmit={(order: number[]) => {
        session.submit({ type: 'teamPreview', order });
      }}
    />
  {/if}

  {#if phase === 'ended' && !resultHidden}
    <ResultOverlay
      winner={session.controller.battle.winner}
      turns={session.view.turn}
      {onRematch}
      {onNewBattle}
      onCopyReplay={copyReplay}
      {onMenu}
      onShowField={() => {
        resultHidden = true;
      }}
    />
  {/if}

  {#if settingsOpen}
    <BattleSettings
      onClose={() => {
        settingsOpen = false;
      }}
    />
  {/if}

  {#if confirmForfeit}
    <div class="confirm-backdrop" role="presentation">
      <div class="confirm pixel-panel" role="alertdialog" aria-labelledby="forfeit-text">
        <p id="forfeit-text">{t('battle.forfeitConfirm')}</p>
        <div class="confirm-actions">
          <button class="pixel-button danger" onclick={forfeit}>{t('battle.forfeit')}</button>
          <button
            class="pixel-button"
            onclick={() => {
              confirmForfeit = false;
            }}>{t('battle.back')}</button
          >
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .battle {
    position: absolute;
    inset: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-rows: auto minmax(0, 1fr) auto;
    background: var(--bg-deep);
  }

  .topbar {
    display: flex;
    grid-column: 1 / -1;
    align-items: center;
    gap: 0.75rem;
    min-height: calc(var(--touch) + 0.5rem);
    padding: calc(0.25rem + var(--safe-top)) calc(0.6rem + var(--safe-right)) 0.25rem
      calc(0.6rem + var(--safe-left));
    background: linear-gradient(#141833, #0c0f22);
    border-bottom: 3px solid var(--frame-dark);
  }

  .tools {
    display: flex;
    flex: none;
    gap: 0.4rem;
  }

  .tool {
    padding: 0.3rem 0.7rem;
    font-size: 0.8rem;
  }

  .arena-wrap {
    position: relative;
    grid-row: 2;
    grid-column: 1;
    min-height: 0;
    overflow: hidden;
  }

  .bottom {
    grid-row: 3;
    grid-column: 1 / -1;
    height: clamp(11.5rem, 27vh, 16rem);
    margin: 0 calc(0.5rem + var(--safe-right)) calc(0.5rem + var(--safe-bottom))
      calc(0.5rem + var(--safe-left));
    padding: 0.6rem 0.75rem;
  }

  .textbox {
    display: flex;
    gap: 0.75rem;
    height: 100%;
  }

  .message {
    position: relative;
    flex: 1;
    padding: 0.6rem 2.2rem 0.6rem 0.8rem;
    border: none;
    background: none;
    font-size: 1.3rem;
    font-weight: 700;
    line-height: 1.45;
    text-align: left;
    text-shadow: 0 2px 0 rgba(0, 0, 0, 0.6);
    cursor: pointer;
  }

  .message span:first-child {
    position: absolute;
    inset: 0.6rem 2.2rem auto 0.8rem;
  }

  .more {
    position: absolute;
    right: 0.6rem;
    bottom: 0.4rem;
    color: var(--frame-light);
    animation: blink 0.8s steps(2) infinite;
  }

  @keyframes blink {
    50% {
      opacity: 0;
    }
  }

  .ff {
    align-self: flex-end;
    min-width: 9rem;
  }

  /* Das Log ist eine eigene Spalte neben der Arena – es verdeckt nie Monster oder Infofelder. */
  .log-column {
    display: flex;
    grid-row: 2;
    grid-column: 2;
    flex-direction: column;
    width: clamp(240px, 26vw, 340px);
    min-height: 0;
    padding: 0.5rem calc(0.5rem + var(--safe-right)) 0.5rem 0;
  }

  .log-column :global(.log) {
    flex: 1;
  }

  .confirm-backdrop {
    position: absolute;
    inset: 0;
    z-index: 45;
    display: grid;
    place-items: center;
    padding: 1rem;
    background: rgba(5, 6, 13, 0.55);
  }

  .confirm {
    width: min(440px, 100%);
    padding: 1rem 1.25rem;
  }

  .confirm p {
    margin: 0 0 1rem;
    font-size: 1.05rem;
  }

  .confirm-actions {
    display: flex;
    gap: 0.6rem;
  }

  .confirm-actions .pixel-button {
    flex: 1;
  }

  .danger {
    background: linear-gradient(#7a2a2a, #4a1818);
  }
</style>
