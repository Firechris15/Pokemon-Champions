<script lang="ts">
  import { fade } from 'svelte/transition';
  import type { SceneStats } from '../render/previewScene.ts';
  import RotateHint from './components/RotateHint.svelte';
  import SceneCanvas from './components/SceneCanvas.svelte';
  import UpdateToast from './components/UpdateToast.svelte';
  import SystemScreen from './screens/SystemScreen.svelte';
  import TitleScreen from './screens/TitleScreen.svelte';

  type Screen = 'title' | 'system';

  let screen = $state<Screen>('title');
  let stats = $state<SceneStats | null>(null);
  let webglFailed = $state(false);
</script>

<main>
  <SceneCanvas bind:stats bind:failed={webglFailed} />

  {#key screen}
    <div class="layer" in:fade={{ duration: 260 }} out:fade={{ duration: 160 }}>
      {#if screen === 'title'}
        <TitleScreen
          onStart={() => {
            screen = 'system';
          }}
        />
      {:else}
        <SystemScreen
          {stats}
          {webglFailed}
          onBack={() => {
            screen = 'title';
          }}
        />
      {/if}
    </div>
  {/key}

  <UpdateToast />
  <RotateHint />
</main>

<style>
  main {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }

  .layer {
    position: absolute;
    inset: 0;
  }
</style>
