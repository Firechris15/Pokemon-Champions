<script lang="ts">
  import { dilate, rasterizeText, toRuns } from '../../sprites/pixelFont.ts';

  interface Props {
    text: string;
    /** Farbverlauf von oben nach unten. */
    colors?: readonly string[];
    outline?: string;
    shadow?: string;
    label?: string;
  }

  const {
    text,
    colors = ['#fff6c8', '#ffd25e', '#f29b38', '#c45a23'],
    outline = '#2a1406',
    shadow = 'rgba(0, 0, 0, 0.55)',
    label,
  }: Props = $props();

  const gradientId = $props.id();
  const glyphs = $derived(rasterizeText(text));
  const border = $derived(dilate(glyphs, 1));
  // Rand (1 px) + Schlagschatten (1 px nach rechts unten).
  const width = $derived(border.width + 1);
  const height = $derived(border.height + 1);
</script>

<svg
  class="pixel"
  viewBox="0 0 {width} {height}"
  role="img"
  aria-label={label ?? text}
  shape-rendering="crispEdges"
>
  <defs>
    <linearGradient
      id={gradientId}
      x1="0"
      y1="1"
      x2="0"
      y2={glyphs.height + 1}
      gradientUnits="userSpaceOnUse"
    >
      {#each colors as color, index (index)}
        <stop offset={index / Math.max(1, colors.length - 1)} stop-color={color} />
      {/each}
    </linearGradient>
  </defs>
  {#each toRuns(border) as run (`s${run.x}-${run.y}`)}
    <rect x={run.x + 1} y={run.y + 1} width={run.length} height="1" fill={shadow} />
  {/each}
  {#each toRuns(border) as run (`o${run.x}-${run.y}`)}
    <rect x={run.x} y={run.y} width={run.length} height="1" fill={outline} />
  {/each}
  {#each toRuns(glyphs) as run (`g${run.x}-${run.y}`)}
    <rect x={run.x + 1} y={run.y + 1} width={run.length} height="1" fill="url(#{gradientId})" />
  {/each}
</svg>

<style>
  svg {
    display: block;
    width: 100%;
    height: auto;
  }
</style>
