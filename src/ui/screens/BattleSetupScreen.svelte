<script lang="ts">
  import { onMount } from 'svelte';
  import { isAgentId, type AgentId } from '../../ai/agents.ts';
  import { STANDARD_DEX } from '../../data/index.ts';
  import type { MonsterSet } from '../../engine/model.ts';
  import { t } from '../../i18n/i18n.svelte.ts';
  import { loadJson, saveJson } from '../../storage/index.ts';
  import { validateTeam } from '../../teams/validate.ts';
  import { createConfig, makeTeam, newSeed, type BattleConfig } from '../battle/config.ts';
  import { ARENAS, type ArenaId } from '../battle/layout.ts';
  import MonIcon from '../components/MonIcon.svelte';
  import TypeBadge from '../components/TypeBadge.svelte';
  import { moveFocus } from '../spatialNav.ts';
  import { monsterImages, type MonsterImages } from '../spriteImages.ts';

  interface Props {
    /** Zuletzt gespieltes Team (bleibt beim Zurückkehren erhalten). */
    lastTeam?: readonly MonsterSet[] | undefined;
    onStart: (config: BattleConfig) => void;
    onBack: () => void;
  }

  const { lastTeam, onStart, onBack }: Props = $props();

  const dex = STANDARD_DEX;
  const formats = dex.data.formats;

  interface Stored {
    formatId?: string;
    agent?: string;
    arena?: string;
  }

  const stored = loadJson<Stored>('battleSetup', {});
  let formatId = $state(
    formats.some((format) => format.id === stored.formatId)
      ? (stored.formatId ?? 'doubles-standard')
      : 'doubles-standard',
  );
  let agent = $state<AgentId>(
    stored.agent !== undefined && isAgentId(stored.agent) ? stored.agent : 'normal',
  );
  let arena = $state<ArenaId | 'random'>(
    (ARENAS as readonly string[]).includes(stored.arena ?? '')
      ? (stored.arena as ArenaId)
      : 'random',
  );
  let team = $state.raw<readonly MonsterSet[]>([]);
  let images = $state<Record<string, MonsterImages>>({});
  let panel = $state<HTMLElement>();

  const format = $derived(dex.format(formatId));

  function legal(set: readonly MonsterSet[]): boolean {
    return set.length > 0 && validateTeam(dex, format, set).length === 0;
  }

  function reroll(): void {
    team = makeTeam(dex, formatId, newSeed());
  }

  onMount(() => {
    team = lastTeam && legal(lastTeam) ? [...lastTeam] : makeTeam(dex, formatId, newSeed());
  });

  $effect(() => {
    for (const set of team) {
      if (images[set.species]) continue;
      void monsterImages(set.species, true).then((result) => {
        images[set.species] = result;
      });
    }
  });

  function selectFormat(id: string): void {
    formatId = id;
    if (!legal(team)) reroll();
  }

  function start(): void {
    saveJson('battleSetup', { formatId, agent, arena });
    onStart(createConfig(dex, { formatId, agent, arena, team }));
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      onBack();
      return;
    }
    if (moveFocus(panel, event.key)) event.preventDefault();
  }
</script>

<svelte:window onkeydown={onKeydown} />

<div class="screen">
  <section class="panel pixel-panel" bind:this={panel} aria-labelledby="setup-heading">
    <header>
      <h1 id="setup-heading">{t('battleSetup.heading')}</h1>
      <p>{t('battleSetup.intro')}</p>
    </header>

    <div class="content">
      <fieldset>
        <legend>{t('battleSetup.format')}</legend>
        <div class="formats">
          {#each formats as entry (entry.id)}
            <button
              class="pixel-button option"
              aria-pressed={formatId === entry.id}
              onclick={() => {
                selectFormat(entry.id);
              }}
            >
              <span class="label">{entry.name}</span>
              <span class="hint">{entry.description}</span>
            </button>
          {/each}
        </div>
      </fieldset>

      <div class="row">
        <fieldset>
          <legend>{t('battleSetup.difficulty')}</legend>
          <div class="pair">
            {#each [{ id: 'easy', label: 'battleSetup.easy', hint: 'battleSetup.easyHint' }, { id: 'normal', label: 'battleSetup.normal', hint: 'battleSetup.normalHint' }] as const as entry (entry.id)}
              <button
                class="pixel-button option"
                aria-pressed={agent === entry.id}
                onclick={() => {
                  agent = entry.id;
                }}
              >
                <span class="label">{t(entry.label)}</span>
                <span class="hint">{t(entry.hint)}</span>
              </button>
            {/each}
          </div>
        </fieldset>

        <fieldset>
          <legend>{t('battleSetup.arena')}</legend>
          <div class="arenas">
            {#each ['random', ...ARENAS] as const as id (id)}
              <button
                class="pixel-button small arena-{id}"
                aria-pressed={arena === id}
                onclick={() => {
                  arena = id;
                }}>{t(`battleSetup.arenas.${id}`)}</button
              >
            {/each}
          </div>
        </fieldset>
      </div>

      <fieldset>
        <legend>{t('battleSetup.team')}</legend>
        {#if format.randomTeams}
          <p class="note">{t('battleSetup.randomNote')}</p>
        {:else}
          <div class="team">
            {#each team as set, index (index)}
              {@const species = dex.species(set.species)}
              <div class="mon">
                <MonIcon images={images[set.species]} scale={1.5} />
                <span class="mon-text">
                  <span class="mon-name">{set.nickname ?? species.name}</span>
                  <span class="mon-types">
                    {#each species.types as type (type)}<TypeBadge {type} compact />{/each}
                  </span>
                </span>
              </div>
            {/each}
            <button class="pixel-button small reroll" onclick={reroll}>
              {t('battleSetup.reroll')}
            </button>
          </div>
        {/if}
      </fieldset>
    </div>

    <footer>
      <button class="pixel-button" onclick={onBack}>{t('battleSetup.back')}</button>
      <button class="pixel-button start" disabled={!legal(team)} onclick={start}>
        {t('battleSetup.start')}
      </button>
    </footer>
  </section>
</div>

<style>
  .screen {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: calc(1rem + var(--safe-top)) calc(1rem + var(--safe-right))
      calc(1rem + var(--safe-bottom)) calc(1rem + var(--safe-left));
    background: rgba(5, 6, 13, 0.45);
  }

  .panel {
    display: flex;
    flex-direction: column;
    flex: 0 1 auto;
    width: min(980px, 100%);
    min-height: 0;
    max-height: 100%;
    padding: 1rem 1.25rem;
  }

  h1 {
    margin: 0;
    color: var(--frame-light);
    font-size: 1.4rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  header p {
    margin: 0.2rem 0 0.6rem;
    color: var(--text-muted);
  }

  .content {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    touch-action: pan-y;
  }

  fieldset {
    margin: 0 0 0.8rem;
    padding: 0;
    border: none;
    min-width: 0;
  }

  legend {
    margin-bottom: 0.35rem;
    color: var(--frame-light);
    font-weight: 800;
  }

  .formats {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }

  .row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .pair {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }

  .option {
    display: grid;
    align-content: start;
    gap: 0.15rem;
    text-align: left;
  }

  .label {
    font-size: 1rem;
  }

  .hint {
    color: var(--text-muted);
    font-size: 0.78rem;
    font-weight: 500;
    letter-spacing: 0;
    text-transform: none;
  }

  .arenas {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .small {
    padding: 0.4rem 0.8rem;
    font-size: 0.85rem;
  }

  .team {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(10.5rem, 1fr));
    gap: 0.5rem;
  }

  .mon {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.2rem 0.5rem 0.2rem 0.2rem;
    border: 2px solid var(--frame-dark);
    background: rgba(255, 255, 255, 0.04);
  }

  .mon-text {
    display: grid;
    gap: 0.15rem;
    min-width: 0;
  }

  .mon-name {
    overflow: hidden;
    font-weight: 800;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mon-types {
    display: flex;
    gap: 0.1rem;
  }

  .reroll {
    min-height: 3.2rem;
  }

  .note {
    margin: 0;
    color: var(--text-muted);
  }

  footer {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    margin-top: 0.6rem;
  }

  .start {
    min-width: 12rem;
    background: linear-gradient(#3d7f7a, #23504d);
  }

  .start:disabled {
    opacity: 0.45;
  }
</style>
