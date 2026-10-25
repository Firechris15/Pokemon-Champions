<script lang="ts">
  import { t } from '../../i18n/i18n.svelte.ts';
  import PixelText from '../components/PixelText.svelte';
  import { hasTouch } from '../device.ts';

  interface Props {
    onStart: () => void;
  }

  const { onStart }: Props = $props();
  const touch = hasTouch();

  function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onStart();
    }
  }
</script>

<svelte:window onkeydown={onKeydown} />

<button class="title" onclick={onStart} aria-label={t('title.tapToStart')}>
  <span class="logo">
    <PixelText text={t('app.name')} />
  </span>
  <span class="tagline">{t('app.tagline')}</span>
  <span class="start">{touch ? t('title.tapToStart') : t('title.pressToStart')}</span>
  <span class="footer">
    {t('title.phase', { phase: 1 })} · v{__APP_VERSION__} · {__BUILD_SHA__}
  </span>
</button>

<style>
  .title {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    width: 100%;
    padding: calc(2rem + var(--safe-top)) calc(2rem + var(--safe-right))
      calc(2rem + var(--safe-bottom)) calc(2rem + var(--safe-left));
    border: 0;
    background: radial-gradient(ellipse at center, rgba(5, 6, 13, 0.35), rgba(5, 6, 13, 0.7));
    cursor: pointer;
  }

  .title:focus-visible {
    outline: none;
  }

  .logo {
    display: block;
    width: min(70vw, 88vh, 760px);
    filter: drop-shadow(0 0 24px rgba(255, 180, 90, 0.35));
    animation: float 4s ease-in-out infinite;
  }

  .tagline {
    font-size: clamp(1rem, 2.4vw, 1.6rem);
    font-weight: 700;
    letter-spacing: 0.35em;
    text-transform: uppercase;
    color: var(--frame-light);
    text-shadow: 3px 3px 0 rgba(0, 0, 0, 0.6);
  }

  .start {
    margin-top: 2.5rem;
    font-size: clamp(1rem, 2vw, 1.3rem);
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.7);
    animation: blink 1.6s steps(2, jump-none) infinite;
  }

  .footer {
    position: absolute;
    bottom: calc(0.75rem + var(--safe-bottom));
    font-family: var(--font-mono);
    font-size: 0.8rem;
    color: var(--text-muted);
    text-shadow: 1px 1px 0 #000;
  }

  @keyframes float {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-8px);
    }
  }

  @keyframes blink {
    0% {
      opacity: 1;
    }
    100% {
      opacity: 0.25;
    }
  }
</style>
