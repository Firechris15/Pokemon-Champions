<script lang="ts">
  import { fade } from 'svelte/transition';
  import type { SceneStats } from '../render/previewScene.ts';
  import type { BattleConfig } from './battle/config.ts';
  import { rematch } from './battle/config.ts';
  import RotateHint from './components/RotateHint.svelte';
  import SceneCanvas from './components/SceneCanvas.svelte';
  import UpdateToast from './components/UpdateToast.svelte';
  import BattleScreen from './screens/BattleScreen.svelte';
  import BattleSetupScreen from './screens/BattleSetupScreen.svelte';
  import DevMenu from './screens/DevMenu.svelte';
  import EngineTestScreen from './screens/EngineTestScreen.svelte';
  import GalleryScreen from './screens/GalleryScreen.svelte';
  import SystemScreen from './screens/SystemScreen.svelte';
  import TitleScreen from './screens/TitleScreen.svelte';

  type Screen = 'title' | 'menu' | 'system' | 'engine' | 'gallery' | 'battleSetup' | 'battle';

  let screen = $state<Screen>('title');
  let battle = $state.raw<BattleConfig | null>(null);
  /** Zählt Kämpfe, damit eine Revanche den Bildschirm neu aufbaut. */
  let battleRun = $state(0);

  function startBattle(config: BattleConfig): void {
    battle = config;
    battleRun++;
    screen = 'battle';
  }
  let stats = $state<SceneStats | null>(null);
  let webglFailed = $state(false);
</script>

<main>
  <SceneCanvas
    bind:stats
    bind:failed={webglFailed}
    paused={screen === 'gallery' || screen === 'battle'}
  />

  {#key `${screen}:${screen === 'battle' ? battleRun : 0}`}
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
      {:else if screen === 'battleSetup'}
        <BattleSetupScreen
          lastTeam={battle?.teams[0]}
          onStart={startBattle}
          onBack={() => {
            screen = 'menu';
          }}
        />
      {:else if screen === 'battle' && battle}
        {@const config = battle}
        <BattleScreen
          {config}
          onRematch={() => {
            startBattle(rematch(config));
          }}
          onNewBattle={() => {
            screen = 'battleSetup';
          }}
          onMenu={() => {
            screen = 'menu';
          }}
        />
      {:else if screen === 'gallery'}
        <GalleryScreen
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
