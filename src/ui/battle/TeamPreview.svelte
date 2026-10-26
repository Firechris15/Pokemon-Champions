<script lang="ts">
  import { STANDARD_DEX } from '../../data/index.ts';
  import type { Request } from '../../engine/choices.ts';
  import { t } from '../../i18n/i18n.svelte.ts';
  import MonIcon from '../components/MonIcon.svelte';
  import MonsterSprite from '../components/MonsterSprite.svelte';
  import TypeBadge from '../components/TypeBadge.svelte';
  import { moveFocus } from '../spatialNav.ts';
  import { itemIconUrl, type MonsterImages } from '../spriteImages.ts';

  interface Props {
    request: Extract<Request, { type: 'teamPreview' }>;
    images: Record<string, MonsterImages>;
    activePerSide: number;
    onSubmit: (order: number[]) => void;
  }

  const { request, images, activePerSide, onSubmit }: Props = $props();

  const dex = STANDARD_DEX;
  let order = $state<number[]>([]);
  let panel = $state<HTMLElement>();

  const complete = $derived(order.length === request.pick);

  function toggle(index: number): void {
    const at = order.indexOf(index);
    if (at >= 0) order = order.filter((entry) => entry !== index);
    else if (order.length < request.pick) order = [...order, index];
  }

  function auto(): void {
    order = Array.from({ length: request.pick }, (_, index) => index);
  }

  function start(): void {
    if (complete) onSubmit([...order]);
  }

  function onKeydown(event: KeyboardEvent): void {
    const digit = Number.parseInt(event.key, 10);
    if (digit >= 1 && digit <= request.team.length) {
      event.preventDefault();
      toggle(digit - 1);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      order = [];
      return;
    }
    if (moveFocus(panel, event.key)) event.preventDefault();
  }
</script>

<svelte:window onkeydown={onKeydown} />

<div class="overlay">
  <section class="panel pixel-panel" bind:this={panel} aria-labelledby="preview-heading">
    <header>
      <h2 id="preview-heading">{t('battle.preview.heading')}</h2>
      <p>{t('battle.preview.pick', { pick: request.pick, active: activePerSide })}</p>
    </header>

    <div class="columns">
      <div class="column">
        <h3>{t('battle.preview.yourTeam')}</h3>
        <div class="grid">
          {#each request.team as entry, index (index)}
            {@const species = dex.species(entry.species)}
            {@const rank = order.indexOf(index)}
            <button
              class="card"
              class:picked={rank >= 0}
              class:lead={rank >= 0 && rank < activePerSide}
              aria-pressed={rank >= 0}
              onclick={() => {
                toggle(index);
              }}
            >
              <span class="key">{index + 1}</span>
              <MonIcon images={images[entry.species]} scale={2} animate={rank >= 0} />
              <span class="text">
                <span class="name">{entry.name}</span>
                <span class="types">
                  {#each species.types as type (type)}<TypeBadge {type} compact />{/each}
                </span>
                {#if entry.item}
                  <span class="item">
                    <img src={itemIconUrl(entry.item, 16)} alt="" width="16" height="16" />
                    {dex.item(entry.item).name}
                  </span>
                {/if}
              </span>
              {#if rank >= 0}
                <span class="rank">
                  {rank + 1}{#if rank < activePerSide}<small>{t('battle.preview.lead')}</small>{/if}
                </span>
              {/if}
            </button>
          {/each}
        </div>
      </div>

      <div class="column foe">
        <h3>{t('battle.preview.foeTeam')}</h3>
        <div class="grid">
          {#each request.opponent as entry, index (index)}
            {@const species = dex.species(entry.species)}
            <div class="card static">
              <MonsterSprite images={images[entry.species]} scale={1} animate={false} />
              <span class="text">
                <span class="name">{entry.name}</span>
                <span class="types">
                  {#each species.types as type (type)}<TypeBadge {type} />{/each}
                </span>
              </span>
            </div>
          {/each}
        </div>
      </div>
    </div>

    <footer>
      <span class="count"
        >{t('battle.preview.chosen', { count: order.length, pick: request.pick })}</span
      >
      <button class="pixel-button" onclick={auto}
        >{t('battle.preview.auto', { pick: request.pick })}</button
      >
      <button
        class="pixel-button"
        disabled={order.length === 0}
        onclick={() => {
          order = [];
        }}>{t('battle.preview.reset')}</button
      >
      <button class="pixel-button go" disabled={!complete} onclick={start}>
        {t('battle.preview.start')}
      </button>
    </footer>
  </section>
</div>

<style>
  .overlay {
    position: absolute;
    inset: 0;
    z-index: 30;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: calc(0.75rem + var(--safe-top)) calc(0.75rem + var(--safe-right))
      calc(0.75rem + var(--safe-bottom)) calc(0.75rem + var(--safe-left));
    background: rgba(5, 6, 13, 0.6);
  }

  .panel {
    display: flex;
    flex-direction: column;
    flex: 0 1 auto;
    width: min(1180px, 100%);
    min-height: 0;
    max-height: 100%;
    padding: 1rem 1.25rem;
  }

  header h2 {
    margin: 0;
    color: var(--frame-light);
    font-size: 1.3rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  header p {
    margin: 0.2rem 0 0.6rem;
    color: var(--text-muted);
  }

  .columns {
    display: grid;
    flex: 0 1 auto;
    grid-template-columns: 1.15fr 1fr;
    gap: 1.25rem;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    touch-action: pan-y;
  }

  h3 {
    margin: 0 0 0.4rem;
    font-size: 0.95rem;
    color: var(--frame-light);
  }

  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }

  .card {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 5rem;
    padding: 0.35rem 0.6rem 0.35rem 0.35rem;
    border: 3px solid var(--frame-dark);
    border-radius: var(--radius);
    background: linear-gradient(#22274a, #171a34);
    box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.45);
    text-align: left;
    cursor: pointer;
  }

  .card.static {
    min-height: 4.5rem;
    cursor: default;
  }

  .foe .card {
    background: linear-gradient(#3a2230, #241520);
  }

  .card.picked {
    border-color: var(--frame);
    background: linear-gradient(#2e4a5a, #1c2e3a);
  }

  .card.lead {
    border-color: var(--frame-light);
  }

  .key {
    position: absolute;
    left: 0.35rem;
    top: 0.2rem;
    color: rgba(255, 255, 255, 0.45);
    font-size: 0.7rem;
    font-weight: 800;
  }

  .text {
    display: grid;
    flex: 1;
    gap: 0.2rem;
    min-width: 0;
  }

  .name {
    overflow: hidden;
    font-weight: 800;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .types {
    display: flex;
    flex-wrap: wrap;
    gap: 0.2rem;
  }

  .item {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    overflow: hidden;
    color: var(--text-muted);
    font-size: 0.75rem;
    white-space: nowrap;
  }

  .rank {
    display: grid;
    place-items: center;
    min-width: 2.2rem;
    height: 2.2rem;
    border-radius: 50%;
    background: var(--frame);
    color: #201608;
    font-size: 1.1rem;
    font-weight: 900;
    line-height: 1;
  }

  .rank small {
    font-size: 0.5rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  footer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.6rem;
    margin-top: 0.75rem;
  }

  .count {
    margin-right: auto;
    color: var(--text-muted);
    font-weight: 700;
  }

  .go {
    min-width: 9rem;
    background: linear-gradient(#3d7f7a, #23504d);
  }

  button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
</style>
