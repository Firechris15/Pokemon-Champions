<script lang="ts">
  import { t } from '../../i18n/i18n.svelte.ts';
  import { saveSettings, settings, TEXT_SPEEDS } from '../settings.svelte.ts';

  interface Props {
    onClose: () => void;
  }

  const { onClose }: Props = $props();
</script>

<div class="backdrop" role="presentation" onclick={onClose}>
  <div
    class="dialog pixel-panel"
    role="dialog"
    aria-modal="true"
    aria-labelledby="settings-heading"
    tabindex="-1"
    onclick={(event) => {
      event.stopPropagation();
    }}
    onkeydown={(event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    }}
  >
    <h2 id="settings-heading">{t('battle.settings')}</h2>
    <fieldset>
      <legend>{t('battle.textSpeed')}</legend>
      <div class="options">
        {#each TEXT_SPEEDS as speed (speed)}
          <button
            class="pixel-button"
            aria-pressed={settings.textSpeed === speed}
            onclick={() => {
              settings.textSpeed = speed;
              saveSettings();
            }}>{t(`battle.speeds.${speed}`)}</button
          >
        {/each}
      </div>
    </fieldset>
    <fieldset>
      <legend>{t('battle.hints')}</legend>
      <div class="options">
        {#each [true, false] as value (value)}
          <button
            class="pixel-button"
            aria-pressed={settings.effectivenessHints === value}
            onclick={() => {
              settings.effectivenessHints = value;
              saveSettings();
            }}>{t(value ? 'battle.on' : 'battle.off')}</button
          >
        {/each}
      </div>
    </fieldset>
    <button class="pixel-button done" onclick={onClose}>{t('battle.close')}</button>
  </div>
</div>

<style>
  .backdrop {
    position: absolute;
    inset: 0;
    z-index: 40;
    display: grid;
    place-items: center;
    padding: 1rem;
    background: rgba(5, 6, 13, 0.55);
  }

  .dialog {
    width: min(460px, 100%);
    padding: 1rem 1.25rem;
  }

  h2 {
    margin: 0 0 0.5rem;
    color: var(--frame-light);
    font-size: 1.2rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  fieldset {
    margin: 0 0 0.8rem;
    padding: 0;
    border: none;
  }

  legend {
    margin-bottom: 0.35rem;
    color: var(--text-muted);
    font-weight: 700;
  }

  .options {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .options .pixel-button {
    padding-inline: 0.8rem;
    font-size: 0.85rem;
  }

  .done {
    width: 100%;
  }
</style>
