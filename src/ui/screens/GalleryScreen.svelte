<script lang="ts">
  import { onMount } from 'svelte';
  import { STANDARD_DEX, TYPE_IDS } from '../../data/index.ts';
  import { STAT_IDS, STATUS_IDS } from '../../engine/model.ts';
  import { t } from '../../i18n/i18n.svelte.ts';
  import MonsterSprite from '../components/MonsterSprite.svelte';
  import TypeBadge from '../components/TypeBadge.svelte';
  import {
    itemIconUrl,
    monsterImages,
    statusIconUrl,
    typeIconUrl,
    type MonsterImages,
  } from '../spriteImages.ts';

  interface Props {
    onBack: () => void;
  }

  const { onBack }: Props = $props();

  type Tab = 'monsters' | 'symbols' | 'items';
  type View = 'front' | 'back' | 'silhouette';

  const dex = STANDARD_DEX;
  const species = dex.data.species;
  const STAT_MAX = 150;

  let tab = $state<Tab>('monsters');
  let view = $state<View>('front');
  let animate = $state(true);
  let images = $state<Record<string, MonsterImages>>({});
  let selected = $state<string | null>(null);
  let detailView = $state<'front' | 'back'>('front');
  let pose = $state<'idle' | 'attack'>('idle');
  let effect = $state<'none' | 'flash' | 'faint'>('none');
  let effectTimer: ReturnType<typeof setTimeout> | undefined;

  const loaded = $derived(Object.keys(images).length);
  const detail = $derived(selected ? dex.species(selected) : null);
  const detailImages = $derived(selected ? images[selected] : undefined);

  onMount(() => {
    let alive = true;
    for (const entry of species) {
      void monsterImages(entry.id).then((result) => {
        if (alive) images[entry.id] = result;
      });
    }
    return () => {
      alive = false;
      clearTimeout(effectTimer);
    };
  });

  function open(id: string): void {
    selected = id;
    detailView = 'front';
    pose = 'idle';
    effect = 'none';
    void monsterImages(id, true).then((result) => {
      images[id] = result;
    });
  }

  function play(next: 'attack' | 'flash' | 'faint'): void {
    clearTimeout(effectTimer);
    pose = 'idle';
    effect = 'none';
    // Ein Bild später setzen, damit eine laufende CSS-Animation neu startet.
    requestAnimationFrame(() => {
      if (next === 'attack') pose = 'attack';
      else effect = next;
      effectTimer = setTimeout(
        () => {
          pose = 'idle';
          effect = 'none';
        },
        next === 'faint' ? 1500 : 600,
      );
    });
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    if (selected) selected = null;
    else onBack();
  }

  const number = (index: number): string => `#${String(index + 1).padStart(3, '0')}`;
  const total = (id: string): number => {
    const stats = dex.species(id).baseStats;
    return STAT_IDS.reduce((sum, stat) => sum + stats[stat], 0);
  };
</script>

<svelte:window onkeydown={onKeydown} />

<div class="screen">
  <section class="panel pixel-panel" aria-labelledby="gallery-heading">
    <header>
      <div class="titles">
        <h1 id="gallery-heading">{t('gallery.heading')}</h1>
        <p>{t('gallery.intro', { count: species.length })}</p>
      </div>
      <button class="pixel-button back" onclick={onBack}>{t('gallery.back')}</button>
    </header>

    <div class="toolbar">
      <div class="tabs" role="tablist">
        {#each [['monsters', 'gallery.tabMonsters'], ['symbols', 'gallery.tabSymbols'], ['items', 'gallery.tabItems']] as const as [id, key] (id)}
          <button
            role="tab"
            class="pixel-button tab"
            class:active={tab === id}
            aria-selected={tab === id}
            onclick={() => {
              tab = id;
            }}>{t(key)}</button
          >
        {/each}
      </div>
      {#if tab === 'monsters'}
        <div class="options">
          {#each [['front', 'gallery.front'], ['back', 'gallery.back3'], ['silhouette', 'gallery.silhouette']] as const as [id, key] (id)}
            <button
              class="pixel-button small"
              class:active={view === id}
              aria-pressed={view === id}
              onclick={() => {
                view = id;
              }}>{t(key)}</button
            >
          {/each}
          <button
            class="pixel-button small"
            class:active={animate}
            aria-pressed={animate}
            onclick={() => {
              animate = !animate;
            }}>{t('gallery.animate')}</button
          >
        </div>
      {/if}
    </div>

    <div class="content">
      {#if tab === 'monsters'}
        {#if loaded < species.length}
          <p class="progress">{t('gallery.loading', { done: loaded, total: species.length })}</p>
        {/if}
        <ul class="grid">
          {#each species as entry, index (entry.id)}
            <li>
              <button
                class="card"
                onclick={() => {
                  open(entry.id);
                }}
              >
                <MonsterSprite
                  images={images[entry.id]}
                  view={view === 'back' ? 'back' : 'front'}
                  silhouette={view === 'silhouette'}
                  {animate}
                  scale={2}
                  label={entry.name}
                />
                <span class="number">{number(index)}</span>
                <span class="name">{entry.name}</span>
                <span class="types">
                  {#each entry.types as type (type)}<TypeBadge {type} compact />{/each}
                </span>
                {#if entry.legendary}<span class="legend">{t('gallery.legendary')}</span>{/if}
              </button>
            </li>
          {/each}
        </ul>
      {:else if tab === 'symbols'}
        <h2>{t('gallery.types')}</h2>
        <ul class="symbols">
          {#each TYPE_IDS as type (type)}
            <li>
              <img src={typeIconUrl(type, 32)} alt="" width="32" height="32" />
              <img src={typeIconUrl(type, 16)} alt="" width="16" height="16" class="small" />
              <TypeBadge {type} />
            </li>
          {/each}
        </ul>
        <h2>{t('gallery.status')}</h2>
        <ul class="symbols">
          {#each STATUS_IDS as status (status)}
            <li>
              <img src={statusIconUrl(status, 32)} alt="" width="32" height="32" />
              <img src={statusIconUrl(status, 16)} alt="" width="16" height="16" class="small" />
              <span>{dex.condition(status).name}</span>
            </li>
          {/each}
        </ul>
      {:else}
        <ul class="items">
          {#each dex.data.items as item (item.id)}
            <li>
              <img src={itemIconUrl(item.id, 32)} alt="" width="32" height="32" />
              <div>
                <strong>{item.name}</strong>
                <span>{item.description}</span>
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  </section>

  {#if detail && selected}
    <div
      class="overlay"
      role="presentation"
      onclick={(event) => {
        if (event.target === event.currentTarget) selected = null;
      }}
    >
      <article class="detail pixel-panel" aria-labelledby="detail-heading">
        <div class="stage">
          <div class="spot">
            <MonsterSprite
              images={detailImages}
              view={detailView}
              {pose}
              {effect}
              scale={4}
              label={detail.name}
            />
          </div>
          <div class="controls">
            <button
              class="pixel-button small"
              onclick={() => {
                detailView = detailView === 'front' ? 'back' : 'front';
              }}>{detailView === 'front' ? t('gallery.back3') : t('gallery.front')}</button
            >
            <button
              class="pixel-button small"
              onclick={() => {
                play('attack');
              }}>{t('gallery.attack')}</button
            >
            <button
              class="pixel-button small"
              onclick={() => {
                play('flash');
              }}>{t('gallery.hit')}</button
            >
            <button
              class="pixel-button small"
              onclick={() => {
                play('faint');
              }}>{t('gallery.faint')}</button
            >
          </div>
          {#if detailImages}
            <h3>{t('gallery.sheet')}</h3>
            <img class="sheet" src={detailImages.sheet} alt="" />
            <div class="icons">
              <img
                class="icon"
                src={detailImages.icon}
                alt=""
                style:width="{detailImages.iconSize * detailImages.iconFrames * 2}px"
              />
              <span>{t('gallery.colors', { count: detailImages.colors })}</span>
            </div>
          {/if}
        </div>
        <div class="info">
          <header>
            <h2 id="detail-heading">
              <span class="number">{number(species.findIndex((s) => s.id === selected))}</span>
              {detail.name}
            </h2>
            <button class="pixel-button small" onclick={() => (selected = null)}>
              {t('gallery.close')}
            </button>
          </header>
          <p class="types">
            {#each detail.types as type (type)}<TypeBadge {type} />{/each}
            {#if detail.legendary}<span class="legend">{t('gallery.legendary')}</span>{/if}
          </p>
          <p class="lore">{detail.lore}</p>
          <p class="meta">
            {t('gallery.size', { height: detail.heightM, weight: detail.weightKg })}
          </p>
          <h3>{t('gallery.abilities')}</h3>
          <ul class="abilities">
            {#each detail.abilities as id (id)}
              <li><strong>{dex.ability(id).name}</strong> – {dex.ability(id).description}</li>
            {/each}
          </ul>
          <h3>{t('gallery.baseStats')}</h3>
          <ul class="stats">
            {#each STAT_IDS as stat (stat)}
              <li>
                <span>{t(`statsShort.${stat}`)}</span>
                <span class="value">{detail.baseStats[stat]}</span>
                <span
                  class="bar"
                  style:--fill="{Math.min(100, (100 * detail.baseStats[stat]) / STAT_MAX)}%"
                ></span>
              </li>
            {/each}
            <li class="sum">
              <span>{t('gallery.total')}</span>
              <span class="value">{total(detail.id)}</span>
            </li>
          </ul>
        </div>
      </article>
    </div>
  {/if}
</div>

<style>
  /* Flex-Spalte statt Grid + height: 100 % – Safari löst Prozenthöhen in Grid-Zellen nicht auf,
     dann wäre der Inhalt nicht scrollbar. */
  .screen {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: calc(1rem + var(--safe-top)) calc(1rem + var(--safe-right))
      calc(1rem + var(--safe-bottom)) calc(1rem + var(--safe-left));
    background: rgba(5, 6, 13, 0.55);
  }

  .panel {
    display: flex;
    flex-direction: column;
    width: min(1280px, 100%);
    flex: 1 1 auto;
    min-height: 0;
    padding: 1rem 1.25rem;
  }

  header {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
  }

  .titles {
    flex: 1;
  }

  h1 {
    margin: 0;
    font-size: 1.4rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--frame-light);
  }

  header p {
    margin: 0.2rem 0 0;
    color: var(--text-muted);
  }

  .toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem 1rem;
    margin-top: 0.75rem;
  }

  .tabs,
  .options {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .tab.active,
  .small.active {
    background: var(--frame);
    color: #1a1208;
  }

  .small {
    min-height: var(--touch);
    padding: 0.35rem 0.8rem;
    font-size: 0.85rem;
  }

  .content {
    flex: 1;
    min-height: 0;
    margin-top: 0.75rem;
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
    touch-action: pan-y;
    -webkit-overflow-scrolling: touch;
  }

  .progress {
    margin: 0 0 0.5rem;
    color: var(--text-muted);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(172px, 1fr));
    gap: 0.6rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .card {
    position: relative;
    display: grid;
    justify-items: center;
    gap: 0.15rem;
    width: 100%;
    padding: 0.5rem 0.25rem 0.6rem;
    border: 0;
    border-radius: 6px;
    background: radial-gradient(
      ellipse at 50% 70%,
      rgba(255, 255, 255, 0.1),
      rgba(255, 255, 255, 0.02) 70%
    );
    box-shadow: inset 0 0 0 2px rgba(0, 0, 0, 0.35);
    color: var(--text);
    cursor: pointer;
  }

  .card:hover,
  .card:focus-visible {
    box-shadow:
      inset 0 0 0 2px var(--frame),
      0 0 12px rgba(201, 162, 74, 0.35);
  }

  .number {
    color: var(--text-muted);
    font-family: var(--font-mono);
    font-size: 0.75rem;
  }

  .name {
    font-weight: 700;
  }

  .types {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.3rem;
  }

  .legend {
    position: absolute;
    top: 0.35rem;
    right: 0.35rem;
    padding: 0.05rem 0.4rem;
    border-radius: 999px;
    background: linear-gradient(#ffe48a, #c9922a);
    color: #2a1406;
    font-size: 0.65rem;
    font-weight: 800;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .info .legend {
    position: static;
  }

  h2 {
    margin: 0.75rem 0 0.5rem;
    font-size: 1.05rem;
    color: var(--frame-light);
  }

  h3 {
    margin: 0.75rem 0 0.35rem;
    font-size: 0.9rem;
    color: var(--frame-light);
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .symbols {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
    gap: 0.5rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .symbols li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .symbols img,
  .items img,
  .icon,
  .sheet {
    image-rendering: pixelated;
  }

  .symbols img {
    flex: none;
    width: 48px;
    height: 48px;
  }

  .symbols img.small {
    width: 32px;
    height: 32px;
  }

  .items {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 0.6rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .items li {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .items img {
    flex: none;
    width: 64px;
    height: 64px;
  }

  .items div {
    display: grid;
    gap: 0.1rem;
    font-size: 0.85rem;
  }

  .items span {
    color: var(--text-muted);
  }

  .overlay {
    position: fixed;
    z-index: 10;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: calc(1rem + var(--safe-top)) calc(1rem + var(--safe-right))
      calc(1rem + var(--safe-bottom)) calc(1rem + var(--safe-left));
    background: rgba(5, 6, 13, 0.7);
  }

  .detail {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 1.25rem;
    width: min(1000px, 100%);
    max-height: 100%;
    min-height: 0;
    padding: 1rem 1.25rem;
    overflow-y: auto;
    overscroll-behavior: contain;
    touch-action: pan-y;
    -webkit-overflow-scrolling: touch;
  }

  .stage {
    display: grid;
    justify-items: center;
    align-content: start;
    gap: 0.5rem;
  }

  .spot {
    padding: 0.5rem;
    border-radius: 50%;
    background: radial-gradient(
      ellipse at 50% 80%,
      rgba(255, 220, 160, 0.18),
      rgba(255, 255, 255, 0) 70%
    );
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.4rem;
    max-width: 280px;
  }

  .sheet {
    width: 320px;
    max-width: 100%;
    background: rgba(255, 255, 255, 0.06);
  }

  .icons {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: var(--text-muted);
    font-size: 0.8rem;
  }

  .info header {
    align-items: center;
    justify-content: space-between;
  }

  .info h2 {
    margin: 0;
    font-size: 1.4rem;
  }

  .info .types {
    justify-content: flex-start;
    margin: 0.4rem 0;
  }

  .lore {
    margin: 0.5rem 0;
    font-style: italic;
  }

  .meta {
    margin: 0;
    color: var(--text-muted);
    font-size: 0.85rem;
  }

  .abilities {
    display: grid;
    gap: 0.3rem;
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: 0.85rem;
  }

  .stats {
    display: grid;
    gap: 0.25rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .stats li {
    display: grid;
    grid-template-columns: 2.5rem 2.5rem 1fr;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
  }

  .stats .value {
    font-family: var(--font-mono);
    text-align: right;
  }

  .bar {
    height: 10px;
    background: linear-gradient(
      90deg,
      var(--accent) var(--fill),
      rgba(255, 255, 255, 0.08) var(--fill)
    );
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.4);
  }

  .stats .sum {
    margin-top: 0.2rem;
    font-weight: 700;
  }

  @media (max-width: 760px) {
    .detail {
      grid-template-columns: 1fr;
    }
  }
</style>
