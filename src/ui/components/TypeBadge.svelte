<script lang="ts">
  import { TYPE_COLORS } from '../../data/index.ts';
  import type { TypeId } from '../../engine/model.ts';
  import { t } from '../../i18n/i18n.svelte.ts';
  import { typeIconUrl } from '../spriteImages.ts';

  interface Props {
    type: TypeId;
    /** Nur das Symbol ohne Namen. */
    compact?: boolean;
  }

  const { type, compact = false }: Props = $props();
</script>

<span class="badge" class:compact style:--type-color={TYPE_COLORS[type]} title={t(`types.${type}`)}>
  <img src={typeIconUrl(type, 16)} alt="" width="16" height="16" />
  {#if !compact}<span>{t(`types.${type}`)}</span>{/if}
</span>

<style>
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.1rem 0.5rem 0.1rem 0.15rem;
    border-radius: 999px;
    background: color-mix(in srgb, var(--type-color) 70%, #10101a);
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.45);
    color: #fffaf0;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.03em;
    text-shadow: 0 1px 0 rgba(0, 0, 0, 0.6);
    white-space: nowrap;
  }

  .compact {
    padding: 0;
    background: none;
    box-shadow: none;
  }

  img {
    width: 16px;
    height: 16px;
    image-rendering: pixelated;
  }
</style>
