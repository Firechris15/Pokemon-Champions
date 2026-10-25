<script lang="ts">
  import { easyAgent } from '../../ai/easy.ts';
  import { runHeadlessBattle } from '../../ai/runner.ts';
  import { simulateMany } from '../../ai/simulate.ts';
  import type { SimulationReport } from '../../ai/simulate.ts';
  import { STANDARD_DEX } from '../../data/index.ts';
  import type { Battle } from '../../engine/battle.ts';
  import type { SideIndex } from '../../engine/model.ts';
  import { t } from '../../i18n/i18n.svelte.ts';
  import { formatEvent } from '../battleLog.ts';
  import type { LogContext, LogLine } from '../battleLog.ts';

  interface Props {
    onBack: () => void;
  }

  const { onBack }: Props = $props();

  const FORMAT = 'doubles-standard';
  const SIM_COUNT = 100;

  let running = $state(false);
  let report = $state<{ data: SimulationReport; ms: number; seed: string } | null>(null);
  let log = $state<{ seed: string; lines: LogLine[] } | null>(null);

  const species = $derived(
    report
      ? Object.entries(report.data.species)
          .map(([id, entry]) => ({
            name: STANDARD_DEX.species(id).name,
            played: entry.played,
            rate: entry.played > 0 ? Math.round((100 * entry.won) / entry.played) : 0,
          }))
          .sort((a, b) => b.rate - a.rate)
      : [],
  );

  function newSeed(): string {
    const values = new Uint32Array(2);
    crypto.getRandomValues(values);
    return Array.from(values, (value) => value.toString(36)).join('');
  }

  /** Gibt dem Browser kurz Zeit, „Läuft …“ anzuzeigen, bevor die Rechnung den Thread belegt. */
  function nextFrame(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 30));
  }

  async function simulate(): Promise<void> {
    running = true;
    log = null;
    await nextFrame();
    const seed = newSeed();
    const started = performance.now();
    const data = simulateMany({
      dex: STANDARD_DEX,
      formatId: FORMAT,
      battles: SIM_COUNT,
      seedPrefix: seed,
      agents: [easyAgent, easyAgent],
    });
    report = { data, ms: Math.round(performance.now() - started), seed };
    running = false;
  }

  async function watch(): Promise<void> {
    running = true;
    report = null;
    await nextFrame();
    const seed = newSeed();
    const { battle } = runHeadlessBattle({
      dex: STANDARD_DEX,
      formatId: FORMAT,
      seed,
      agents: [easyAgent, easyAgent],
    });
    log = { seed, lines: toLines(battle) };
    running = false;
  }

  function toLines(battle: Battle): LogLine[] {
    const team = (side: SideIndex) => t(side === 0 ? 'engineTest.shortA' : 'engineTest.shortB');
    const context: LogContext = {
      t,
      monName: (mon) =>
        t('engineTest.monLabel', { name: battle.mon(mon).name, team: team(mon.side) }),
      sideName: (side) => t(side === 0 ? 'engineTest.teamA' : 'engineTest.teamB'),
      moveName: (id) => STANDARD_DEX.move(id).name,
      effectName: (effect) =>
        effect.kind === 'ability'
          ? STANDARD_DEX.ability(effect.id).name
          : STANDARD_DEX.item(effect.id).name,
    };
    return battle.events.flatMap((event) => formatEvent(event, context) ?? []);
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      onBack();
    }
  }
</script>

<svelte:window onkeydown={onKeydown} />

<div class="screen">
  <section class="panel pixel-panel" aria-labelledby="engine-heading">
    <header>
      <h1 id="engine-heading">{t('engineTest.heading')}</h1>
      <p>{t('engineTest.intro')}</p>
      <div class="actions">
        <button class="pixel-button" disabled={running} onclick={simulate}>
          {t('engineTest.simulate', { count: SIM_COUNT })}
        </button>
        <button class="pixel-button" disabled={running} onclick={watch}
          >{t('engineTest.watch')}</button
        >
        <button class="pixel-button back" onclick={onBack}>{t('menu.back')}</button>
      </div>
    </header>

    <div class="content" aria-live="polite">
      {#if running}
        <p class="status">{t('engineTest.running')}</p>
      {:else if report}
        <p class="status">
          {t('engineTest.summary', {
            battles: report.data.battles,
            ms: report.ms,
            errors: report.data.errors.length,
          })}
        </p>
        <p>
          {t('engineTest.wins', {
            a: report.data.wins[0],
            b: report.data.wins[1],
            ties: report.data.ties,
          })}
        </p>
        <p>
          {t('engineTest.turns', {
            average: report.data.turns.average.toFixed(1),
            min: report.data.turns.min,
            max: report.data.turns.max,
          })}
        </p>
        <h2>{t('engineTest.topSpecies')}</h2>
        <ul class="bars">
          {#each species as entry (entry.name)}
            <li>
              <span class="name">{entry.name}</span>
              <span class="bar" style:--rate="{entry.rate}%"></span>
              <span class="rate"
                >{t('engineTest.winRate', { rate: entry.rate, played: entry.played })}</span
              >
            </li>
          {/each}
        </ul>
        <p class="seed">{t('engineTest.seed', { seed: report.seed })}</p>
      {:else if log}
        <ol class="log">
          {#each log.lines as line, index (index)}
            <li class={line.kind}>{line.text}</li>
          {/each}
        </ol>
        <p class="seed">{t('engineTest.seed', { seed: log.seed })}</p>
      {/if}
    </div>
  </section>
</div>

<style>
  .screen {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    padding: calc(1rem + var(--safe-top)) calc(1rem + var(--safe-right))
      calc(1rem + var(--safe-bottom)) calc(1rem + var(--safe-left));
    background: rgba(5, 6, 13, 0.45);
  }

  .panel {
    display: flex;
    flex-direction: column;
    width: min(960px, 100%);
    height: 100%;
    padding: 1.25rem 1.5rem;
  }

  h1 {
    margin: 0;
    font-size: 1.4rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--frame-light);
  }

  header p {
    margin: 0.25rem 0 0.75rem;
    color: var(--text-muted);
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .back {
    margin-left: auto;
  }

  button:disabled {
    opacity: 0.5;
    cursor: default;
  }

  .content {
    flex: 1;
    min-height: 0;
    margin-top: 1rem;
    overflow: auto;
    -webkit-overflow-scrolling: touch;
    user-select: text;
    -webkit-user-select: text;
  }

  .status {
    font-weight: 700;
  }

  .content p {
    margin: 0.25rem 0;
  }

  h2 {
    margin: 1rem 0 0.5rem;
    font-size: 1rem;
    color: var(--frame-light);
  }

  .bars {
    display: grid;
    gap: 0.3rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .bars li {
    display: grid;
    grid-template-columns: 8.5rem 1fr 11rem;
    align-items: center;
    gap: 0.75rem;
  }

  .bar {
    height: 12px;
    background: linear-gradient(
      90deg,
      var(--accent) var(--rate),
      rgba(255, 255, 255, 0.08) var(--rate)
    );
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.4);
  }

  .rate {
    color: var(--text-muted);
    font-size: 0.85rem;
  }

  .log {
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: 0.95rem;
  }

  .log .turn {
    margin-top: 0.75rem;
    padding: 0.2rem 0.5rem;
    background: rgba(201, 162, 74, 0.15);
    color: var(--frame-light);
    font-weight: 700;
  }

  .log .action {
    margin-top: 0.3rem;
    font-weight: 600;
  }

  .log .detail {
    padding-left: 1.25rem;
    color: var(--text-muted);
  }

  .log .result {
    margin-top: 0.75rem;
    color: var(--accent);
    font-weight: 700;
  }

  .seed {
    margin-top: 1rem !important;
    font-family: var(--font-mono);
    font-size: 0.8rem;
    color: var(--text-muted);
  }
</style>
