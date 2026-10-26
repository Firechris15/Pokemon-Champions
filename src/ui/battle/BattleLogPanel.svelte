<script lang="ts">
  import { tick } from 'svelte';
  import { t } from '../../i18n/i18n.svelte.ts';
  import type { LogLine } from '../battleLog.ts';

  interface Props {
    lines: readonly LogLine[];
    onClose: () => void;
  }

  const { lines, onClose }: Props = $props();

  let list = $state<HTMLElement>();
  let pinned = true;

  function onScroll(): void {
    if (!list) return;
    pinned = list.scrollHeight - list.scrollTop - list.clientHeight < 40;
  }

  $effect(() => {
    // Neue Zeilen: nach unten mitlaufen, solange der Nutzer nicht zurückgescrollt hat.
    if (lines.length === 0) return;
    void tick().then(() => {
      if (list && pinned) list.scrollTop = list.scrollHeight;
    });
  });
</script>

<aside class="log pixel-panel" aria-labelledby="log-heading">
  <header>
    <h2 id="log-heading">{t('battle.log')}</h2>
    <button class="pixel-button close" onclick={onClose} aria-label={t('battle.close')}>✕</button>
  </header>
  <ol bind:this={list} onscroll={onScroll} aria-live="off">
    {#each lines as line, index (index)}
      <li class={line.kind}>{line.text}</li>
    {:else}
      <li class="empty">{t('battle.logEmpty')}</li>
    {/each}
  </ol>
</aside>

<style>
  .log {
    display: flex;
    flex-direction: column;
    min-height: 0;
    padding: 0.6rem 0.4rem 0.6rem 0.8rem;
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-right: 0.4rem;
  }

  h2 {
    margin: 0;
    color: var(--frame-light);
    font-size: 1rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .close {
    padding: 0;
  }

  ol {
    flex: 1;
    min-height: 0;
    margin: 0.4rem 0 0;
    padding: 0 0.4rem 0 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    touch-action: pan-y;
    -webkit-overflow-scrolling: touch;
    list-style: none;
    font-size: 0.88rem;
    user-select: text;
    -webkit-user-select: text;
  }

  .turn {
    margin-top: 0.6rem;
    padding: 0.15rem 0.45rem;
    background: rgba(201, 162, 74, 0.15);
    color: var(--frame-light);
    font-weight: 800;
  }

  .action {
    margin-top: 0.25rem;
    font-weight: 600;
  }

  .detail {
    padding-left: 0.9rem;
    color: var(--text-muted);
  }

  .result {
    margin-top: 0.6rem;
    color: var(--accent);
    font-weight: 800;
  }

  .empty {
    color: var(--text-muted);
  }
</style>
