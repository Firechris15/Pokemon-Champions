<script lang="ts">
  import { STANDARD_DEX } from '../../data/index.ts';
  import { BOOST_IDS } from '../../engine/model.ts';
  import { t } from '../../i18n/i18n.svelte.ts';
  import TypeBadge from '../components/TypeBadge.svelte';
  import { statusIconUrl } from '../spriteImages.ts';
  import { hpColor, hpPercent, SHOWN_VOLATILES } from './layout.ts';
  import type { ViewMon } from './viewModel.ts';

  interface Props {
    mon: ViewMon;
    /** Eigenes Monster: genaue LP statt Prozent. */
    own: boolean;
    /** Gerade am Zug bei der Befehlseingabe. */
    current?: boolean;
  }

  const { mon, own, current = false }: Props = $props();

  const fraction = $derived(mon.maxHp > 0 ? Math.max(0, mon.hp) / mon.maxHp : 0);
  const percent = $derived(hpPercent(mon.hp, mon.maxHp));
  const boosts = $derived(
    BOOST_IDS.flatMap((stat) => {
      const stage = mon.boosts[stat] ?? 0;
      return stage === 0 ? [] : [{ stat, stage }];
    }),
  );
  const volatiles = $derived(mon.volatiles.filter((id) => SHOWN_VOLATILES.includes(id)));
</script>

<div class="info" class:current class:own>
  <div class="head">
    <span class="name">{mon.name}</span>
    {#if mon.status}
      <img
        class="status"
        src={statusIconUrl(mon.status, 16)}
        alt={STANDARD_DEX.condition(mon.status).name}
        title={STANDARD_DEX.condition(mon.status).name}
        width="16"
        height="16"
      />
    {/if}
    <span class="types">
      {#each mon.types as type (type)}<TypeBadge {type} compact />{/each}
    </span>
    <span class="level">{t('battle.level', { level: mon.level })}</span>
  </div>
  <div
    class="bar"
    role="meter"
    aria-label={t('stats.hp')}
    aria-valuemin="0"
    aria-valuemax="100"
    aria-valuenow={percent}
  >
    <span class="hp-label">{t('stats.hp')}</span>
    <span class="track">
      <span class="fill {hpColor(fraction)}" style:width="{fraction * 100}%"></span>
    </span>
  </div>
  <div class="foot">
    <span class="numbers">
      {#if own}{Math.max(0, mon.hp)}/{mon.maxHp}{:else}{t('battle.hpPercent', {
          value: percent,
        })}{/if}
    </span>
    {#each boosts as boost (boost.stat)}
      <span class="chip" class:up={boost.stage > 0} class:down={boost.stage < 0}>
        {t(`statsShort.${boost.stat}`)}
        {boost.stage > 0 ? '+' : ''}{boost.stage}
      </span>
    {/each}
    {#each volatiles as id (id)}
      <span class="chip volatile">{STANDARD_DEX.condition(id).name}</span>
    {/each}
  </div>
</div>

<style>
  .info {
    display: grid;
    gap: 0.2rem;
    width: 100%;
    padding: 0.35rem 0.6rem 0.4rem;
    background: rgba(12, 14, 30, 0.86);
    border: 2px solid var(--frame-dark);
    border-radius: var(--radius);
    box-shadow:
      0 0 0 2px rgba(0, 0, 0, 0.5),
      4px 4px 0 rgba(0, 0, 0, 0.35);
    transition:
      border-color 150ms,
      transform 150ms;
  }

  .current {
    border-color: var(--frame-light);
    transform: translateY(-2px);
  }

  .head {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    min-width: 0;
  }

  .name {
    overflow: hidden;
    font-weight: 800;
    letter-spacing: 0.02em;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .status {
    flex: none;
  }

  .types {
    display: inline-flex;
    gap: 0.1rem;
  }

  .level {
    margin-left: auto;
    color: var(--text-muted);
    font-size: 0.8rem;
    font-weight: 700;
    white-space: nowrap;
  }

  .bar {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .hp-label {
    color: var(--frame-light);
    font-size: 0.7rem;
    font-weight: 800;
  }

  .track {
    position: relative;
    flex: 1;
    height: 9px;
    overflow: hidden;
    background: #26283a;
    box-shadow:
      inset 0 0 0 1px rgba(0, 0, 0, 0.6),
      0 0 0 1px rgba(255, 255, 255, 0.12);
  }

  .fill {
    position: absolute;
    inset: 0 auto 0 0;
    transition:
      width 480ms ease-out,
      background-color 300ms;
    box-shadow: inset 0 2px 0 rgba(255, 255, 255, 0.3);
  }

  .high {
    background-color: #52c95a;
  }

  .mid {
    background-color: #e8c23a;
  }

  .low {
    background-color: #e0503c;
  }

  .foot {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.25rem;
    min-height: 1.1rem;
    font-size: 0.75rem;
  }

  .numbers {
    margin-right: 0.25rem;
    font-family: var(--font-mono);
    font-weight: 700;
  }

  .chip {
    padding: 0 0.3rem;
    border-radius: 3px;
    background: rgba(255, 255, 255, 0.1);
    font-weight: 700;
    white-space: nowrap;
  }

  .up {
    background: rgba(86, 214, 120, 0.25);
    color: #9ff0a8;
  }

  .down {
    background: rgba(224, 90, 71, 0.25);
    color: #ffaa9c;
  }

  .volatile {
    background: rgba(160, 120, 230, 0.25);
    color: #d8c4ff;
  }
</style>
