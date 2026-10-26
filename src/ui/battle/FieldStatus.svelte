<script lang="ts">
  import { STANDARD_DEX } from '../../data/index.ts';
  import type { SideIndex } from '../../engine/model.ts';
  import { t } from '../../i18n/i18n.svelte.ts';
  import type { BattleView, ConditionView } from './viewModel.ts';

  interface Props {
    view: BattleView;
  }

  const { view }: Props = $props();

  const dex = STANDARD_DEX;

  function balls(side: SideIndex): ('ok' | 'hurt' | 'down' | 'unknown')[] {
    const data = view.sides[side];
    return Array.from({ length: data.teamSize }, (_, index) => {
      const mon = data.mons[index];
      if (!mon) return 'unknown';
      if (mon.fainted) return 'down';
      return mon.status || mon.hp < mon.maxHp ? 'hurt' : 'ok';
    });
  }

  function remaining(side: SideIndex): number {
    return balls(side).filter((state) => state !== 'down').length;
  }

  function extra(condition: ConditionView): string {
    if (condition.layers !== undefined && condition.layers > 1) {
      return t('battle.layers', { layers: condition.layers });
    }
    return condition.turns === undefined ? '' : t('battle.turns', { turns: condition.turns });
  }

  const sideChips = $derived(
    ([0, 1] as const).flatMap((side) =>
      Object.entries(view.sides[side].conditions).map(([id, condition]) => ({
        key: `${side}:${id}`,
        side,
        name: dex.condition(id).name,
        hazard: dex.condition(id).hazard === true,
        extra: extra(condition),
      })),
    ),
  );
</script>

<div class="status">
  <span
    class="balls own"
    role="img"
    aria-label="{t('battle.yourSide')}: {t('battle.remaining', {
      count: remaining(0),
      total: view.sides[0].teamSize,
    })}"
  >
    {#each balls(0) as state, index (index)}<span class="ball {state}"></span>{/each}
  </span>

  {#if view.turn > 0}<span class="turn">{t('battle.turn', { turn: view.turn })}</span>{/if}

  <span class="chips">
    {#if view.weather}
      <span class="chip weather" title={t('battle.weather')}>
        {dex.condition(view.weather.id).name}
        {#if view.weather.turns !== undefined}<small
            >{t('battle.turns', { turns: view.weather.turns })}</small
          >{/if}
      </span>
    {/if}
    {#if view.terrain}
      <span class="chip terrain" title={t('battle.terrain')}>
        {dex.condition(view.terrain.id).name}
        {#if view.terrain.turns !== undefined}<small
            >{t('battle.turns', { turns: view.terrain.turns })}</small
          >{/if}
      </span>
    {/if}
    {#each Object.entries(view.fields) as [id, field] (id)}
      <span class="chip field">
        {dex.condition(id).name}
        {#if field.turns !== undefined}<small>{t('battle.turns', { turns: field.turns })}</small
          >{/if}
      </span>
    {/each}
    {#each sideChips as chip (chip.key)}
      <span
        class="chip side-{chip.side}"
        class:hazard={chip.hazard}
        title={chip.side === 0 ? t('battle.yourSide') : t('battle.foeSide')}
      >
        <span class="side-mark">{chip.side === 0 ? '◀' : '▶'}</span>
        {chip.name}
        {#if chip.extra}<small>{chip.extra}</small>{/if}
      </span>
    {/each}
  </span>

  <span
    class="balls foe"
    role="img"
    aria-label="{t('battle.foeSide')}: {t('battle.remaining', {
      count: remaining(1),
      total: view.sides[1].teamSize,
    })}"
  >
    {#each balls(1) as state, index (index)}<span class="ball {state}"></span>{/each}
  </span>
</div>

<style>
  .status {
    display: flex;
    flex: 1;
    align-items: center;
    gap: 0.6rem;
    min-width: 0;
  }

  .turn {
    padding: 0.1rem 0.6rem;
    border: 2px solid var(--frame-dark);
    background: rgba(201, 162, 74, 0.18);
    color: var(--frame-light);
    font-weight: 800;
    white-space: nowrap;
  }

  .chips {
    display: flex;
    flex: 1;
    gap: 0.35rem;
    min-width: 0;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .chip {
    display: inline-flex;
    flex: none;
    align-items: center;
    gap: 0.3rem;
    padding: 0.1rem 0.5rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.1);
    font-size: 0.8rem;
    font-weight: 700;
    white-space: nowrap;
  }

  .chip small {
    color: var(--text-muted);
    font-size: 0.72rem;
  }

  .weather {
    background: rgba(240, 200, 90, 0.22);
  }

  .terrain {
    background: rgba(120, 220, 140, 0.2);
  }

  .field {
    background: rgba(230, 120, 220, 0.22);
  }

  .side-0 {
    background: rgba(86, 214, 200, 0.18);
  }

  .side-1 {
    background: rgba(224, 90, 71, 0.2);
  }

  .hazard {
    box-shadow: inset 0 0 0 1px rgba(255, 180, 90, 0.7);
  }

  .side-mark {
    font-size: 0.6rem;
    opacity: 0.7;
  }

  .balls {
    display: flex;
    flex: none;
    gap: 0.2rem;
  }

  .ball {
    width: 0.8rem;
    height: 0.8rem;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 35%, #fff 0 15%, #e8d27a 30%, #b08a2a);
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.6);
  }

  .ball.hurt {
    background: radial-gradient(circle at 35% 35%, #fff 0 15%, #e8a05a 30%, #a05a1a);
  }

  .ball.down {
    background: #2a2a34;
  }

  .ball.unknown {
    background: rgba(255, 255, 255, 0.15);
  }
</style>
