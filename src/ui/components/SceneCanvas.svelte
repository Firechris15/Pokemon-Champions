<script lang="ts">
  import { onMount } from 'svelte';
  import type { SceneStats } from '../../render/previewScene.ts';

  interface Props {
    /** Wird laufend mit Bildrate und GPU-Name aktualisiert; `null`, falls WebGL fehlt. */
    stats?: SceneStats | null;
    failed?: boolean;
    /** Szene anhalten (z. B. hinter rechenintensiven Bildschirmen); das letzte Bild bleibt stehen. */
    paused?: boolean;
  }

  let { stats = $bindable(null), failed = $bindable(false), paused = false }: Props = $props();
  let host: HTMLDivElement;
  let scene = $state<{ start: () => void; stop: () => void } | null>(null);

  $effect(() => {
    if (!scene) return;
    if (paused) scene.stop();
    else scene.start();
  });

  onMount(() => {
    let disposed = false;
    let dispose: (() => void) | undefined;
    // Three.js wird nachgeladen, damit Titel und Menüs sofort erscheinen.
    void import('../../render/previewScene.ts')
      .then(({ PreviewScene }) => {
        if (disposed) return;
        const preview = new PreviewScene(host, (next) => {
          stats = next;
        });
        scene = preview;
        dispose = () => {
          preview.dispose();
        };
      })
      .catch((error: unknown) => {
        console.warn('3D-Szene nicht verfügbar:', error);
        failed = true;
      });
    return () => {
      disposed = true;
      dispose?.();
    };
  });
</script>

<div class="scene" bind:this={host} aria-hidden="true"></div>

<style>
  .scene {
    position: absolute;
    inset: 0;
    background: linear-gradient(#151233, #5e2f61 55%, #f2a85a);
  }

  .scene :global(.scene-canvas) {
    display: block;
    width: 100%;
    height: 100%;
    touch-action: none;
  }
</style>
