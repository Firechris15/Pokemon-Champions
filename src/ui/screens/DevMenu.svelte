<script lang="ts">
  import { t } from '../../i18n/i18n.svelte.ts';
  import type { MessageKey } from '../../i18n/types.ts';

  interface Props {
    onOpen: (screen: MenuTarget) => void;
    onBack: () => void;
  }

  type MenuTarget = 'battleSetup' | 'system' | 'engine' | 'gallery';

  const { onOpen, onBack }: Props = $props();

  const entries: {
    screen: MenuTarget;
    label: MessageKey;
    hint: MessageKey;
  }[] = [
    { screen: 'battleSetup', label: 'menu.battle', hint: 'menu.battleHint' },
    { screen: 'gallery', label: 'menu.gallery', hint: 'menu.galleryHint' },
    { screen: 'engine', label: 'menu.engineTest', hint: 'menu.engineTestHint' },
    { screen: 'system', label: 'menu.systemCheck', hint: 'menu.systemCheckHint' },
  ];
  let buttons: HTMLButtonElement[] = $state([]);

  function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      onBack();
      return;
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const index = buttons.findIndex((button) => button === document.activeElement);
    const step = event.key === 'ArrowDown' ? 1 : -1;
    buttons[(index + step + buttons.length) % buttons.length]?.focus();
  }
</script>

<svelte:window onkeydown={onKeydown} />

<div class="screen">
  <nav class="panel pixel-panel" aria-labelledby="menu-heading">
    <h1 id="menu-heading">{t('menu.heading')}</h1>
    <p class="note">{t('menu.note')}</p>
    <ul>
      {#each entries as entry, index (entry.screen)}
        <li>
          <button
            class="entry pixel-button"
            bind:this={buttons[index]}
            onclick={() => {
              onOpen(entry.screen);
            }}
          >
            <span class="label">{t(entry.label)}</span>
            <span class="hint">{t(entry.hint)}</span>
          </button>
        </li>
      {/each}
    </ul>
    <button class="pixel-button back" onclick={onBack}>{t('menu.back')}</button>
  </nav>
</div>

<style>
  .screen {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    padding: calc(1rem + var(--safe-top)) calc(1rem + var(--safe-right))
      calc(1rem + var(--safe-bottom)) calc(1rem + var(--safe-left));
    background: rgba(5, 6, 13, 0.35);
  }

  .panel {
    width: min(520px, 100%);
    padding: 1.25rem 1.5rem;
  }

  h1 {
    margin: 0;
    font-size: 1.5rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--frame-light);
  }

  .note {
    margin: 0.25rem 0 1rem;
    color: var(--text-muted);
  }

  ul {
    display: grid;
    gap: 0.75rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .entry {
    display: grid;
    width: 100%;
    gap: 0.15rem;
    padding: 0.75rem 1rem;
    text-align: left;
  }

  .label {
    font-size: 1.1rem;
  }

  .hint {
    color: var(--text-muted);
    font-size: 0.85rem;
    font-weight: 500;
    letter-spacing: 0;
    text-transform: none;
  }

  .back {
    margin-top: 1.25rem;
  }
</style>
