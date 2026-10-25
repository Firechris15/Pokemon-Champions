<script lang="ts">
  import { fade } from 'svelte/transition';
  import type { SceneStats } from '../render/previewScene.ts';
  import RotateHint from './components/RotateHint.svelte';
  import SceneCanvas from './components/SceneCanvas.svelte';
  import UpdateToast from './components/UpdateToast.svelte';
  import DevMenu from './screens/DevMenu.svelte';
  import EngineTestScreen from './screens/EngineTestScreen.svelte';
  import SystemScreen from './screens/SystemScreen.svelte';
  import TitleScreen from './screens/TitleScreen.svelte';

  type Screen = 'title' | 'menu' | 'system' | 'engine';

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
            screen = 'menu';
          }}
        />
      {:else if screen === 'menu'}
        <DevMenu
          onOpen={(next: Screen) => {
            screen = next;
          }}
          onBack={() => {
            screen = 'title';
          }}
        />
      {:else if screen === 'system'}
        <SystemScreen
          {stats}
          {webglFailed}
          onBack={() => {
            screen = 'menu';
          }}
        />
      {:else}
        <EngineTestScreen
          onBack={() => {
            screen = 'menu';
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
