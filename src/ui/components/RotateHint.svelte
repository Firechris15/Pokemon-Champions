<script lang="ts">
  import { t } from '../../i18n/i18n.svelte.ts';
</script>

<div class="rotate" role="alert">
  <div class="device" aria-hidden="true"></div>
  <p>{t('rotate.hint')}</p>
</div>

<style>
  .rotate {
    display: none;
  }

  /* Nur auf Touch-Geräten im Hochformat: ARENA ist fürs Querformat gebaut. */
  @media (orientation: portrait) and (pointer: coarse) {
    .rotate {
      position: fixed;
      inset: 0;
      z-index: 100;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1.5rem;
      background: var(--bg-deep);
      text-align: center;
      padding: 2rem;
      font-size: 1.2rem;
    }
  }

  .device {
    width: 64px;
    height: 100px;
    border: 4px solid var(--frame);
    border-radius: 8px;
    box-shadow: 0 0 0 3px var(--frame-dark);
    animation: turn 2.4s ease-in-out infinite;
  }

  @keyframes turn {
    0%,
    30% {
      transform: rotate(0deg);
    }
    60%,
    100% {
      transform: rotate(-90deg);
    }
  }
</style>
