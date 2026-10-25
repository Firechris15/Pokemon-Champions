<script lang="ts">
  import { t } from '../../i18n/i18n.svelte.ts';
  import { applyUpdate, dismissOfflineReady, dismissUpdate, pwa } from '../pwa.svelte.ts';

  $effect(() => {
    if (!pwa.showOfflineReady) return;
    const timer = setTimeout(dismissOfflineReady, 4000);
    return () => {
      clearTimeout(timer);
    };
  });
</script>

{#if pwa.needRefresh}
  <div class="toast pixel-panel" role="status">
    <span>{t('update.available')}</span>
    <button class="pixel-button" onclick={applyUpdate}>{t('update.reload')}</button>
    <button class="pixel-button" onclick={dismissUpdate}>{t('update.later')}</button>
  </div>
{:else if pwa.showOfflineReady}
  <div class="toast pixel-panel" role="status">
    <span>{t('update.offlineReady')}</span>
    <button class="pixel-button" onclick={dismissOfflineReady}>{t('common.ok')}</button>
  </div>
{/if}

<style>
  .toast {
    position: fixed;
    right: calc(1rem + var(--safe-right));
    bottom: calc(1rem + var(--safe-bottom));
    z-index: 50;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.6rem 0.8rem 0.6rem 1rem;
    max-width: calc(100vw - 2rem);
  }
</style>
