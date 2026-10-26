<script lang="ts">
  import type { MonsterImages } from '../spriteImages.ts';

  interface Props {
    images: MonsterImages | undefined;
    scale?: number;
    animate?: boolean;
    dim?: boolean;
  }

  const { images, scale = 2, animate = false, dim = false }: Props = $props();

  const size = $derived((images?.iconSize ?? 32) * scale);
</script>

<span class="icon" class:dim style:width="{size}px" style:height="{size}px" aria-hidden="true">
  {#if images}
    <span
      class="sheet"
      class:animate
      style:--size="{size}px"
      style:background-image="url({images.icon})"
      style:background-size="{size * images.iconFrames}px {size}px"
    ></span>
  {/if}
</span>

<style>
  .icon {
    position: relative;
    display: inline-block;
    flex: none;
  }

  .sheet {
    position: absolute;
    inset: 0;
    background-repeat: no-repeat;
    background-position: 0 0;
    image-rendering: pixelated;
  }

  .animate {
    animation: bob 0.7s steps(2) infinite;
  }

  @keyframes bob {
    from {
      background-position-x: 0;
    }
    to {
      background-position-x: calc(var(--size) * -2);
    }
  }

  .dim {
    filter: grayscale(1) brightness(0.55);
  }
</style>
