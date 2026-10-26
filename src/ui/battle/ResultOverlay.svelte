<script lang="ts">
  import type { SideIndex } from '../../engine/model.ts';
  import { t } from '../../i18n/i18n.svelte.ts';
  import { PLAYER } from './controller.ts';

  interface Props {
    winner: SideIndex | null | undefined;
    turns: number;
    onRematch: () => void;
    onNewBattle: () => void;
    onCopyReplay: () => Promise<boolean>;
    onMenu: () => void;
    onShowField: () => void;
  }

  const { winner, turns, onRematch, onNewBattle, onCopyReplay, onMenu, onShowField }: Props =
    $props();

  const outcome = $derived(winner === PLAYER ? 'win' : winner === null ? 'draw' : 'loss');
  let copied = $state<'idle' | 'ok' | 'failed'>('idle');

  async function copy(): Promise<void> {
    copied = (await onCopyReplay()) ? 'ok' : 'failed';
  }

  let first = $state<HTMLButtonElement>();
  $effect(() => {
    first?.focus();
  });
</script>

<div class="overlay">
  <div class="panel pixel-panel {outcome}" role="dialog" aria-labelledby="result-heading">
    <h2 id="result-heading">{t(`battle.result.${outcome}`)}</h2>
    <p class="turns">{t('battle.result.turns', { turns })}</p>
    <div class="actions">
      <button class="pixel-button primary" bind:this={first} onclick={onRematch}>
        {t('battle.result.rematch')}
      </button>
      <button class="pixel-button" onclick={onNewBattle}>{t('battle.result.newBattle')}</button>
      <button class="pixel-button" onclick={copy}>
        {copied === 'ok'
          ? t('battle.result.copied')
          : copied === 'failed'
            ? t('battle.result.copyFailed')
            : t('battle.result.copyReplay')}
      </button>
      <button class="pixel-button" onclick={onShowField}>{t('battle.result.showField')}</button>
      <button class="pixel-button" onclick={onMenu}>{t('battle.result.menu')}</button>
    </div>
  </div>
</div>

<style>
  .overlay {
    position: absolute;
    inset: 0;
    z-index: 35;
    display: grid;
    place-items: center;
    padding: 1rem;
    background: rgba(5, 6, 13, 0.55);
    animation: appear 300ms ease-out;
  }

  @keyframes appear {
    from {
      opacity: 0;
    }
  }

  .panel {
    width: min(520px, 100%);
    padding: 1.25rem 1.5rem;
    text-align: center;
  }

  h2 {
    margin: 0;
    font-size: 2.4rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    text-shadow: 3px 3px 0 #000;
  }

  .win h2 {
    color: var(--frame-light);
  }

  .loss h2 {
    color: #ff8a78;
  }

  .draw h2 {
    color: var(--text);
  }

  .turns {
    margin: 0.2rem 0 1rem;
    color: var(--text-muted);
  }

  .actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.6rem;
  }

  .primary {
    grid-column: 1 / -1;
    background: linear-gradient(#3d7f7a, #23504d);
  }
</style>
