<script lang="ts">
  import { onMount } from 'svelte';
  import { getLocale, setLocale, t } from '../../i18n/i18n.svelte.ts';
  import { LOCALES } from '../../i18n/types.ts';
  import type { MessageKey } from '../../i18n/types.ts';
  import type { SceneStats } from '../../render/previewScene.ts';
  import { hasTouch, isStandalone, isStoragePersistent } from '../device.ts';
  import { pwa } from '../pwa.svelte.ts';

  interface Props {
    stats: SceneStats | null;
    webglFailed: boolean;
    onBack: () => void;
  }

  const { stats, webglFailed, onBack }: Props = $props();

  type Status = 'ok' | 'warn' | 'bad' | 'info';
  interface Row {
    label: MessageKey;
    value: string;
    status: Status;
  }

  let innerWidth = $state(0);
  let innerHeight = $state(0);
  let persistent = $state<boolean | null>(null);
  const standalone = isStandalone();
  const touch = hasTouch();

  onMount(() => {
    void isStoragePersistent().then((value) => {
      persistent = value;
    });
  });

  const offlineText: Record<typeof pwa.offline, MessageKey> = {
    ready: 'system.offlineReady',
    pending: 'system.offlinePending',
    unsupported: 'system.offlineUnsupported',
    dev: 'system.offlineDev',
  };

  const rows = $derived.by((): Row[] => {
    const dpr = Math.round(window.devicePixelRatio * 100) / 100;
    const landscape = innerWidth >= innerHeight;
    const fps = stats?.fps ?? 0;
    return [
      { label: 'system.version', value: `v${__APP_VERSION__}`, status: 'info' },
      { label: 'system.build', value: __BUILD_SHA__, status: 'info' },
      {
        label: 'system.builtAt',
        value: new Date(__BUILD_TIME__).toLocaleString(getLocale()),
        status: 'info',
      },
      {
        label: 'system.display',
        value: t('system.displayValue', { width: innerWidth, height: innerHeight, dpr }),
        status: 'info',
      },
      {
        label: 'system.orientation',
        value: t(landscape ? 'system.landscape' : 'system.portrait'),
        status: landscape ? 'ok' : 'warn',
      },
      { label: 'system.input', value: t(touch ? 'system.touch' : 'system.mouse'), status: 'info' },
      {
        label: 'system.webgl',
        value: webglFailed ? t('system.webglMissing') : (stats?.gpu ?? '…'),
        status: webglFailed ? 'bad' : stats ? 'ok' : 'info',
      },
      {
        label: 'system.fps',
        value: stats ? t('system.fpsValue', { fps }) : '…',
        status: !stats ? 'info' : fps >= 55 ? 'ok' : fps >= 30 ? 'warn' : 'bad',
      },
      {
        label: 'system.appMode',
        value: t(standalone ? 'system.installed' : 'system.browser'),
        status: standalone ? 'ok' : 'info',
      },
      {
        label: 'system.offline',
        value: t(offlineText[pwa.offline]),
        status: pwa.offline === 'ready' ? 'ok' : pwa.offline === 'unsupported' ? 'bad' : 'warn',
      },
      {
        label: 'system.storage',
        value:
          persistent === null
            ? '–'
            : t(persistent ? 'system.storagePersistent' : 'system.storageBestEffort'),
        status: persistent ? 'ok' : 'info',
      },
    ];
  });

  function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' || event.key === 'Backspace') {
      event.preventDefault();
      onBack();
    }
  }
</script>

<svelte:window bind:innerWidth bind:innerHeight onkeydown={onKeydown} />

<div class="screen">
  <section class="panel pixel-panel" aria-labelledby="system-heading">
    <header>
      <h1 id="system-heading">{t('system.heading')}</h1>
      <p>{t('system.intro')}</p>
    </header>

    <dl>
      {#each rows as row (row.label)}
        <div class="row">
          <dt>{t(row.label)}</dt>
          <dd>
            <span class="dot {row.status}" aria-hidden="true"></span>
            <span class="value">{row.value}</span>
          </dd>
        </div>
      {/each}
    </dl>

    {#if !standalone && touch}
      <p class="hint">{t('system.installHint')}</p>
    {/if}

    <footer>
      <div class="language" role="group" aria-label={t('system.language')}>
        <span>{t('system.language')}</span>
        {#each LOCALES as locale (locale)}
          <button
            class="pixel-button"
            aria-pressed={getLocale() === locale}
            onclick={() => {
              setLocale(locale);
            }}>{locale.toUpperCase()}</button
          >
        {/each}
      </div>
      <button class="pixel-button" onclick={onBack}>{t('system.back')}</button>
    </footer>
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
    background: rgba(5, 6, 13, 0.35);
  }

  .panel {
    width: min(920px, 100%);
    max-height: 100%;
    overflow: auto;
    padding: 1.25rem 1.5rem;
    -webkit-overflow-scrolling: touch;
  }

  header h1 {
    margin: 0;
    font-size: 1.5rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--frame-light);
  }

  header p {
    margin: 0.25rem 0 1rem;
    color: var(--text-muted);
  }

  dl {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.35rem 1.5rem;
    margin: 0;
  }

  .row {
    display: grid;
    grid-template-columns: 8rem 1fr;
    align-items: center;
    min-height: 2rem;
    padding: 0.2rem 0;
    border-bottom: 1px solid rgba(201, 162, 74, 0.18);
  }

  dt {
    color: var(--text-muted);
    font-size: 0.9rem;
  }

  dd {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0;
    min-width: 0;
    font-weight: 600;
  }

  .value {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .dot {
    flex: none;
    width: 10px;
    height: 10px;
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.5);
  }

  .dot.ok {
    background: var(--ok);
  }

  .dot.warn {
    background: var(--warn);
  }

  .dot.bad {
    background: var(--danger);
  }

  .dot.info {
    background: var(--text-muted);
  }

  .hint {
    margin: 1rem 0 0;
    padding: 0.6rem 0.8rem;
    border-left: 4px solid var(--accent);
    background: rgba(86, 214, 200, 0.08);
  }

  footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 1.25rem;
  }

  .language {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .language span {
    margin-right: 0.25rem;
    color: var(--text-muted);
  }

  @media (max-width: 720px) {
    dl {
      grid-template-columns: 1fr;
    }
  }
</style>
