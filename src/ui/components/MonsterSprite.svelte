<script lang="ts">
  import type { MonsterImages } from '../spriteImages.ts';

  interface Props {
    images: MonsterImages | undefined;
    view?: 'front' | 'back';
    /** Vergrößerung (ganze Zahlen halten die Pixel scharf). */
    scale?: number;
    animate?: boolean;
    pose?: 'idle' | 'attack';
    silhouette?: boolean;
    /** Kurzer Effekt: Treffer-Blinken oder K.O.-Absinken. */
    effect?: 'none' | 'flash' | 'faint';
    label?: string;
  }

  const {
    images,
    view = 'front',
    scale = 2,
    animate = true,
    pose = 'idle',
    silhouette = false,
    effect = 'none',
    label,
  }: Props = $props();

  const size = $derived((images?.frameSize ?? 64) * scale);
  const row = $derived(view === 'front' ? 0 : 1);
  const column = $derived(pose === 'attack' ? (images?.columns ?? 5) - 1 : 0);
</script>

<div class="frame" style:width="{size}px" style:height="{size}px" role="img" aria-label={label}>
  {#if images}
    <div
      class="sprite"
      class:animate={animate && pose === 'idle'}
      class:silhouette
      class:flash={effect === 'flash'}
      class:faint={effect === 'faint'}
      style:--size="{size}px"
      style:--columns={images.columns}
      style:background-image="url({images.sheet})"
      style:background-size="{size * images.columns}px {size * 2}px"
      style:background-position="{-column * size}px {-row * size}px"
    ></div>
  {:else}
    <div class="placeholder"></div>
  {/if}
</div>

<style>
  .frame {
    position: relative;
    flex: none;
  }

  .sprite {
    position: absolute;
    inset: 0;
    background-repeat: no-repeat;
    image-rendering: pixelated;
  }

  .animate {
    animation: idle 0.95s steps(4) infinite;
  }

  @keyframes idle {
    from {
      background-position-x: 0;
    }
    to {
      background-position-x: calc(var(--size) * -4);
    }
  }

  .silhouette {
    filter: brightness(0);
  }

  .flash {
    animation: flash 0.6s steps(1) 1;
  }

  @keyframes flash {
    0%,
    34%,
    68% {
      filter: brightness(0) invert(1);
    }
    17%,
    51%,
    85% {
      filter: none;
    }
  }

  .faint {
    animation: faint 0.9s ease-in forwards;
  }

  @keyframes faint {
    from {
      transform: translateY(0);
      opacity: 1;
    }
    to {
      transform: translateY(35%);
      opacity: 0;
      clip-path: inset(0 0 35% 0);
    }
  }

  .placeholder {
    position: absolute;
    inset: 25%;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.06);
    animation: pulse 1.2s ease-in-out infinite;
  }

  @keyframes pulse {
    50% {
      opacity: 0.4;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .animate {
      animation: none;
    }
  }
</style>
