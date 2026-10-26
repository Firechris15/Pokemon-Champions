<script lang="ts">
  import type { PositionRef, SideIndex } from '../../engine/model.ts';
  import MonsterSprite from '../components/MonsterSprite.svelte';
  import type { MonsterImages } from '../spriteImages.ts';
  import { settings, speedFactor } from '../settings.svelte.ts';
  import MonInfo from './MonInfo.svelte';
  import { slotCenter, slotPoint, spriteScales, type ArenaId, type SlotPoint } from './layout.ts';
  import type { BattleSession, MoveFx } from './session.svelte.ts';
  import { monAt } from './viewModel.ts';

  interface Props {
    session: BattleSession;
    images: Record<string, MonsterImages>;
    arena: ArenaId;
    /** Wählbare Ziele (Zielauswahl aktiv). */
    targets?: readonly PositionRef[];
    /** Position, für die gerade ein Befehl gewählt wird. */
    current?: number | null;
    onTarget?: (target: PositionRef) => void;
  }

  const { session, images, arena, targets = [], current = null, onTarget }: Props = $props();

  let width = $state(1024);
  let height = $state(500);

  const view = $derived(session.view);
  const perSide = $derived(session.activePerSide);
  const scales = $derived(spriteScales(width, height));
  /** Sichtbare Sprite-Höhe in % der Arena (für Effekt-Mittelpunkte). */
  const spriteHeights = $derived<[number, number]>([
    ((80 * scales[0] * 0.7) / Math.max(1, height)) * 100,
    ((80 * scales[1] * 0.7) / Math.max(1, height)) * 100,
  ]);
  const speed = $derived(session.turbo ? 0.05 : speedFactor(settings.textSpeed));

  // Gegner zuerst zeichnen (hinten), eigene Monster davor.
  const slots = $derived(
    ([1, 0] as const).flatMap((side) =>
      Array.from({ length: perSide }, (_, position) => ({
        side,
        position,
        key: `${side}:${position}`,
        point: slotPoint(side, position, perSide),
      })),
    ),
  );

  function isTarget(side: SideIndex, position: number): boolean {
    return targets.some((target) => target.side === side && target.position === position);
  }

  function center(ref: PositionRef): SlotPoint {
    return slotCenter(ref, perSide, spriteHeights);
  }

  function endpoints(effect: MoveFx): SlotPoint[] {
    return effect.to.length > 0 ? effect.to.map(center) : [center(effect.from)];
  }
</script>

<div
  class="arena theme-{arena}"
  bind:clientWidth={width}
  bind:clientHeight={height}
  style:--speed={speed}
>
  <div class="sky"></div>
  <div class="ground"></div>
  <div class="platform foe" class:doubles={perSide > 1}></div>
  <div class="platform own" class:doubles={perSide > 1}></div>
  {#if view.terrain}<div class="terrain terrain-{view.terrain.id}"></div>{/if}
  {#if view.fields.raumverzerrung}<div class="trickroom"></div>{/if}

  {#each slots as slot (slot.key)}
    {@const mon = monAt(view, slot.side, slot.position)}
    {@const fx = session.fxAt(slot.side, slot.position)}
    {@const targetable = isTarget(slot.side, slot.position)}
    {#if mon && (!mon.fainted || fx.faint)}
      <button
        class="slot side-{slot.side}"
        class:targetable
        class:current={slot.side === 0 && current === slot.position}
        class:lunge={fx.attack}
        class:shake={fx.hit}
        class:enter={fx.entering}
        class:leave={fx.leaving}
        style:left="{slot.point.x}%"
        style:top="{slot.point.y}%"
        style:z-index={slot.side === 0 ? 3 + slot.position : 1 + slot.position}
        disabled={!targetable}
        tabindex={targetable ? 0 : -1}
        aria-label={mon.name}
        onclick={() => onTarget?.({ side: slot.side, position: slot.position })}
      >
        <span class="shadow" style:width="{34 * scales[slot.side]}px"></span>
        <MonsterSprite
          images={images[mon.species]}
          view={slot.side === 0 ? 'back' : 'front'}
          scale={scales[slot.side]}
          pose={fx.attack ? 'attack' : 'idle'}
          effect={fx.faint ? 'faint' : fx.hit ? 'flash' : 'none'}
          label={mon.name}
        />
        {#if fx.stat}<span class="stat-fx {fx.stat}"></span>{/if}
        {#if mon.volatiles.includes('substitute')}<span class="substitute"></span>{/if}
      </button>
    {/if}
  {/each}

  {#if view.weather}<div class="weather weather-{view.weather.id}"></div>{/if}

  <div class="effects" aria-hidden="true">
    {#each session.effects as effect (effect.id)}
      {@const from = center(effect.from)}
      {#each endpoints(effect) as to, index (index)}
        <div
          class="fx fx-{effect.preset}"
          style:--color={effect.color}
          style:--x0="{from.x}%"
          style:--y0="{from.y}%"
          style:--x1="{to.x}%"
          style:--y1="{to.y}%"
        >
          {#if effect.preset === 'beam'}
            <svg viewBox="0 0 100 100" preserveAspectRatio="none">
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={effect.color}
                vector-effect="non-scaling-stroke"
              />
            </svg>
          {/if}
          <span class="a"></span><span class="b"></span><span class="c"></span>
        </div>
      {/each}
    {/each}
  </div>

  <div class="infos foe-infos">
    {#each Array.from({ length: perSide }, (_, position) => position) as position (position)}
      {@const mon = monAt(view, 1, position)}
      {#if mon && !mon.fainted}<MonInfo {mon} own={false} />{/if}
    {/each}
  </div>
  <div class="infos own-infos">
    {#each Array.from({ length: perSide }, (_, position) => position) as position (position)}
      {@const mon = monAt(view, 0, position)}
      {#if mon && !mon.fainted}<MonInfo {mon} own current={current === position} />{/if}
    {/each}
  </div>
</div>

<style>
  .arena {
    --sky-top: #3a6f8f;
    --sky-bottom: #a9d3c4;
    --ground-top: #5f9a4a;
    --ground-bottom: #2f5a2c;
    --platform: #7bb35a;
    --platform-edge: #3d6a2d;
    position: relative;
    overflow: hidden;
    width: 100%;
    height: 100%;
    container-type: size;
  }

  .theme-kristall {
    --sky-top: #120c2a;
    --sky-bottom: #3b2a6a;
    --ground-top: #3a2f5e;
    --ground-bottom: #1a1433;
    --platform: #6a58a8;
    --platform-edge: #2e2456;
  }

  .theme-wueste {
    --sky-top: #e08a4a;
    --sky-bottom: #f6d49a;
    --ground-top: #d8a85c;
    --ground-bottom: #9a6a32;
    --platform: #e6c27a;
    --platform-edge: #a07438;
  }

  .theme-stadion {
    --sky-top: #0c1430;
    --sky-bottom: #26365e;
    --ground-top: #3c5a6a;
    --ground-bottom: #1e2e3a;
    --platform: #5a8a9a;
    --platform-edge: #2a4652;
  }

  .sky {
    position: absolute;
    inset: 0 0 45% 0;
    background:
      radial-gradient(ellipse 30% 40% at 80% 20%, rgba(255, 255, 255, 0.18), transparent 70%),
      linear-gradient(var(--sky-top), var(--sky-bottom));
  }

  .theme-wald .sky::after,
  .theme-kristall .sky::after,
  .theme-wueste .sky::after,
  .theme-stadion .sky::after {
    content: '';
    position: absolute;
    inset: auto 0 0 0;
    height: 45%;
  }

  /* Ferne Kulisse je Arena – einfache Formen, bis Phase 6 die HD-2D-Szene bringt. */
  .theme-wald .sky::after {
    background:
      radial-gradient(circle at 8% 100%, #2c5a3a 0 22%, transparent 23%),
      radial-gradient(circle at 22% 100%, #376a42 0 28%, transparent 29%),
      radial-gradient(circle at 40% 100%, #2c5a3a 0 20%, transparent 21%),
      radial-gradient(circle at 63% 100%, #376a42 0 26%, transparent 27%),
      radial-gradient(circle at 85% 100%, #2c5a3a 0 30%, transparent 31%);
  }

  .theme-kristall .sky::after {
    background:
      linear-gradient(60deg, transparent 46%, #8a6ae0 47% 53%, transparent 54%) 10% 100% / 12% 90%
        no-repeat,
      linear-gradient(120deg, transparent 46%, #5ad0e0 47% 53%, transparent 54%) 30% 100% / 9% 70%
        no-repeat,
      linear-gradient(75deg, transparent 46%, #c070e0 47% 53%, transparent 54%) 78% 100% / 14% 95%
        no-repeat,
      linear-gradient(105deg, transparent 46%, #6a8ae8 47% 53%, transparent 54%) 92% 100% / 8% 60%
        no-repeat;
    filter: drop-shadow(0 0 10px rgba(160, 120, 255, 0.6));
  }

  .theme-wueste .sky::after {
    background:
      radial-gradient(ellipse 40% 60% at 20% 100%, #c88a48 0 98%, transparent 100%),
      radial-gradient(ellipse 50% 45% at 75% 100%, #b87a3c 0 98%, transparent 100%);
  }

  .theme-stadion .sky::after {
    background:
      repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.08) 0 2px, transparent 2px 28px),
      linear-gradient(#1a2648, #2c3c64);
    border-top: 4px solid #4a5a8a;
  }

  .ground {
    position: absolute;
    inset: 55% 0 0 0;
    background:
      repeating-linear-gradient(0deg, transparent 0 22px, rgba(0, 0, 0, 0.06) 22px 24px),
      linear-gradient(var(--ground-top), var(--ground-bottom));
  }

  .theme-stadion .ground {
    background:
      linear-gradient(
        90deg,
        transparent 49.7%,
        rgba(255, 255, 255, 0.35) 49.7% 50.3%,
        transparent 50.3%
      ),
      radial-gradient(
        ellipse 14% 18% at 50% 55%,
        transparent 90%,
        rgba(255, 255, 255, 0.35) 92% 96%,
        transparent 98%
      ),
      linear-gradient(var(--ground-top), var(--ground-bottom));
  }

  .platform {
    position: absolute;
    border-radius: 50%;
    background: radial-gradient(ellipse at 50% 40%, var(--platform), var(--platform-edge));
    box-shadow: 0 6px 0 rgba(0, 0, 0, 0.25);
  }

  .platform.foe {
    left: 52%;
    top: 44%;
    width: 38%;
    height: 14%;
  }

  .platform.own {
    left: -4%;
    top: 86%;
    width: 64%;
    height: 22%;
  }

  .platform.foe:not(.doubles) {
    left: 56%;
    width: 30%;
  }

  .platform.own:not(.doubles) {
    left: 4%;
    width: 46%;
  }

  .terrain {
    position: absolute;
    inset: 55% 0 0 0;
    mix-blend-mode: screen;
    opacity: 0.45;
    animation: shimmer calc(2.4s) ease-in-out infinite alternate;
  }

  .terrain-funkenfeld {
    background: linear-gradient(transparent, #f0d040);
  }

  .terrain-bluetenfeld {
    background: linear-gradient(transparent, #60d070);
  }

  .terrain-sternenfeld {
    background: linear-gradient(transparent, #f070c0);
  }

  .terrain-psifeld {
    background: linear-gradient(transparent, #b060f0);
  }

  @keyframes shimmer {
    from {
      opacity: 0.3;
    }
    to {
      opacity: 0.55;
    }
  }

  .trickroom {
    position: absolute;
    inset: 0;
    background:
      repeating-linear-gradient(90deg, rgba(240, 120, 220, 0.18) 0 2px, transparent 2px 60px),
      repeating-linear-gradient(0deg, rgba(240, 120, 220, 0.18) 0 2px, transparent 2px 60px);
    pointer-events: none;
  }

  .weather {
    position: absolute;
    inset: 0;
    z-index: 6;
    pointer-events: none;
  }

  .weather-gleisssonne {
    background: radial-gradient(circle at 85% 0%, rgba(255, 220, 120, 0.55), transparent 55%);
    mix-blend-mode: screen;
  }

  .weather-sturmregen {
    background: repeating-linear-gradient(
      105deg,
      transparent 0 18px,
      rgba(170, 200, 255, 0.35) 18px 20px
    );
    background-size: 140px 140px;
    animation: rain 0.45s linear infinite;
  }

  .weather-staubsturm {
    background:
      repeating-linear-gradient(10deg, transparent 0 30px, rgba(230, 180, 110, 0.25) 30px 34px),
      rgba(200, 150, 80, 0.18);
    background-size: 220px 220px;
    animation: sand 0.8s linear infinite;
  }

  .weather-eisgestoeber {
    background:
      radial-gradient(circle, rgba(255, 255, 255, 0.85) 0 2px, transparent 3px) 0 0 / 60px 60px,
      radial-gradient(circle, rgba(255, 255, 255, 0.6) 0 1.5px, transparent 2.5px) 30px 20px / 45px
        45px,
      rgba(200, 230, 255, 0.12);
    animation: snow 3s linear infinite;
  }

  @keyframes rain {
    to {
      background-position: -40px 140px;
    }
  }

  @keyframes sand {
    to {
      background-position: 220px 30px;
    }
  }

  @keyframes snow {
    to {
      background-position:
        -30px 60px,
        0 65px,
        0 0;
    }
  }

  /* ───────── Plätze ───────── */

  .slot {
    position: absolute;
    padding: 0;
    border: none;
    background: none;
    /* Fußpunkt (y ≈ 85 % des Frames) auf den Platz setzen. */
    transform: translate(-50%, -85%);
    cursor: default;
  }

  .slot:disabled {
    opacity: 1;
  }

  .shadow {
    position: absolute;
    left: 50%;
    top: 85%;
    height: 12%;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.3);
    transform: translate(-50%, -50%);
  }

  .targetable {
    cursor: pointer;
  }

  .targetable .shadow {
    background: rgba(255, 230, 120, 0.4);
    box-shadow: 0 0 0 3px var(--frame-light);
    animation: pulse 0.8s ease-in-out infinite alternate;
  }

  .targetable::after {
    content: '▼';
    position: absolute;
    left: 50%;
    top: 0;
    color: var(--frame-light);
    font-size: 1.4rem;
    text-shadow: 0 2px 0 #000;
    transform: translateX(-50%);
    animation: bounce 0.6s ease-in-out infinite alternate;
  }

  .current::before {
    content: '';
    position: absolute;
    left: 50%;
    top: 85%;
    width: 60%;
    height: 14%;
    border: 3px solid var(--accent);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    animation: pulse 0.9s ease-in-out infinite alternate;
  }

  @keyframes pulse {
    from {
      opacity: 0.55;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes bounce {
    to {
      transform: translate(-50%, 8px);
    }
  }

  .lunge.side-0 {
    animation: lunge-own calc(420ms * var(--speed)) ease-out;
  }

  .lunge.side-1 {
    animation: lunge-foe calc(420ms * var(--speed)) ease-out;
  }

  @keyframes lunge-own {
    40% {
      transform: translate(-42%, -88%);
    }
  }

  @keyframes lunge-foe {
    40% {
      transform: translate(-58%, -82%);
    }
  }

  .shake {
    animation: shake calc(420ms * var(--speed)) steps(6);
  }

  @keyframes shake {
    25% {
      transform: translate(-46%, -85%);
    }
    50% {
      transform: translate(-54%, -85%);
    }
    75% {
      transform: translate(-48%, -85%);
    }
  }

  .enter {
    animation: enter calc(480ms * var(--speed)) ease-out;
  }

  @keyframes enter {
    from {
      transform: translate(-50%, -85%) scale(0.15);
      filter: brightness(3);
      opacity: 0;
    }
    60% {
      filter: brightness(1.8);
      opacity: 1;
    }
  }

  .leave {
    animation: leave calc(400ms * var(--speed)) ease-in forwards;
  }

  @keyframes leave {
    to {
      transform: translate(-50%, -85%) scale(0.15);
      filter: brightness(3);
      opacity: 0;
    }
  }

  .stat-fx {
    position: absolute;
    inset: 10% 15% 15%;
    pointer-events: none;
    mix-blend-mode: screen;
  }

  .stat-fx.up {
    background: repeating-linear-gradient(
      0deg,
      transparent 0 14px,
      rgba(255, 120, 80, 0.55) 14px 18px
    );
    animation: rise calc(500ms * var(--speed)) linear;
  }

  .stat-fx.down {
    background: repeating-linear-gradient(
      0deg,
      transparent 0 14px,
      rgba(80, 150, 255, 0.55) 14px 18px
    );
    animation: fall calc(500ms * var(--speed)) linear;
  }

  @keyframes rise {
    from {
      background-position-y: 0;
      opacity: 0.2;
    }
    50% {
      opacity: 1;
    }
    to {
      background-position-y: -54px;
      opacity: 0;
    }
  }

  @keyframes fall {
    from {
      background-position-y: 0;
      opacity: 0.2;
    }
    50% {
      opacity: 1;
    }
    to {
      background-position-y: 54px;
      opacity: 0;
    }
  }

  .substitute {
    position: absolute;
    left: 50%;
    bottom: 12%;
    width: 30%;
    height: 32%;
    border: 3px solid rgba(255, 255, 255, 0.75);
    border-radius: 40% 40% 10% 10%;
    background: rgba(200, 220, 255, 0.25);
    transform: translateX(-50%);
  }

  /* ───────── Attacken-Effekte ───────── */

  .effects {
    position: absolute;
    inset: 0;
    z-index: 7;
    pointer-events: none;
  }

  .fx {
    position: absolute;
    inset: 0;
  }

  .fx span {
    position: absolute;
    width: 0;
    height: 0;
  }

  .fx svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  .fx line {
    stroke-linecap: round;
    stroke-width: 0;
    filter: drop-shadow(0 0 6px var(--color));
    animation: beam calc(520ms * var(--speed)) ease-out forwards;
  }

  @keyframes beam {
    15% {
      stroke-width: 14px;
    }
    70% {
      stroke-width: 10px;
      opacity: 1;
    }
    to {
      stroke-width: 2px;
      opacity: 0;
    }
  }

  /* Leuchtkugel: Grundbaustein der meisten Vorlagen. */
  .fx span::before {
    content: '';
    position: absolute;
    width: 3.2rem;
    height: 3.2rem;
    border-radius: 50%;
    background: radial-gradient(circle, #fff 0 18%, var(--color) 40%, transparent 70%);
    transform: translate(-50%, -50%) scale(0);
  }

  .fx-projectile .a {
    left: var(--x0);
    top: var(--y0);
    animation: fly calc(400ms * var(--speed)) ease-in forwards;
  }

  .fx-projectile .a::before {
    transform: translate(-50%, -50%) scale(0.8);
  }

  .fx-projectile .b,
  .fx-beam .b,
  .fx-explosion .a,
  .fx-melee .a,
  .fx-multi .a,
  .fx-multi .b,
  .fx-multi .c {
    left: var(--x1);
    top: var(--y1);
  }

  .fx-projectile .b::before {
    animation: burst calc(300ms * var(--speed)) ease-out calc(380ms * var(--speed)) forwards;
  }

  .fx-beam .b::before {
    animation: burst calc(420ms * var(--speed)) ease-out calc(100ms * var(--speed)) forwards;
  }

  @keyframes fly {
    to {
      left: var(--x1);
      top: var(--y1);
    }
  }

  @keyframes burst {
    from {
      transform: translate(-50%, -50%) scale(0.3);
      opacity: 1;
    }
    to {
      transform: translate(-50%, -50%) scale(2.4);
      opacity: 0;
    }
  }

  .fx-explosion .a::before {
    width: 6rem;
    height: 6rem;
    animation: burst calc(560ms * var(--speed)) ease-out forwards;
  }

  .fx-explosion .b {
    left: var(--x1);
    top: var(--y1);
  }

  .fx-explosion .b::before {
    width: 4rem;
    height: 4rem;
    animation: burst calc(400ms * var(--speed)) ease-out calc(160ms * var(--speed)) forwards;
  }

  .fx-melee .a::before,
  .fx-melee .a::after {
    content: '';
    position: absolute;
    width: 5rem;
    height: 0.45rem;
    border-radius: 999px;
    background: linear-gradient(90deg, transparent, #fff 40%, var(--color));
    transform: translate(-50%, -50%) rotate(-35deg) scaleX(0);
    animation: slash calc(320ms * var(--speed)) ease-out forwards;
  }

  .fx-melee .a::after {
    transform: translate(-50%, -50%) rotate(35deg) scaleX(0);
    animation-name: slash-b;
    animation-delay: calc(120ms * var(--speed));
  }

  @keyframes slash {
    50% {
      transform: translate(-50%, -50%) rotate(-35deg) scaleX(1);
      opacity: 1;
    }
    to {
      transform: translate(-50%, -50%) rotate(-35deg) scaleX(1.1);
      opacity: 0;
    }
  }

  @keyframes slash-b {
    50% {
      transform: translate(-50%, -50%) rotate(35deg) scaleX(1);
      opacity: 1;
    }
    to {
      transform: translate(-50%, -50%) rotate(35deg) scaleX(1.1);
      opacity: 0;
    }
  }

  .fx-multi .a::before {
    animation: burst calc(260ms * var(--speed)) ease-out forwards;
  }

  .fx-multi .b {
    margin: -1.5rem 0 0 1.5rem;
  }

  .fx-multi .b::before {
    animation: burst calc(260ms * var(--speed)) ease-out calc(140ms * var(--speed)) forwards;
  }

  .fx-multi .c {
    margin: 1rem 0 0 -1.5rem;
  }

  .fx-multi .c::before {
    animation: burst calc(260ms * var(--speed)) ease-out calc(280ms * var(--speed)) forwards;
  }

  .fx-aura .a,
  .fx-wave .a,
  .fx-statUp .a,
  .fx-statDown .a,
  .fx-heal .a {
    left: var(--x0);
    top: var(--y0);
  }

  .fx-statUp .a,
  .fx-statDown .a,
  .fx-heal .a {
    left: var(--x1);
    top: var(--y1);
  }

  .fx-aura .a::before {
    width: 9rem;
    height: 9rem;
    background: radial-gradient(circle, transparent 35%, var(--color) 55%, transparent 72%);
    animation: burst calc(600ms * var(--speed)) ease-out forwards;
  }

  .fx-wave .a::before {
    width: 12rem;
    height: 6rem;
    background: radial-gradient(ellipse, transparent 50%, var(--color) 62%, transparent 72%);
    animation: wave calc(600ms * var(--speed)) ease-out forwards;
  }

  @keyframes wave {
    from {
      transform: translate(-50%, -50%) scale(0.2);
      opacity: 1;
    }
    to {
      transform: translate(-50%, -50%) scale(5);
      opacity: 0;
    }
  }

  .fx-statUp .a::before,
  .fx-statDown .a::before,
  .fx-heal .a::before {
    width: 7rem;
    height: 9rem;
    border-radius: 30%;
    background: repeating-linear-gradient(0deg, transparent 0 12px, var(--color) 12px 16px);
    opacity: 0.8;
    mix-blend-mode: screen;
    transform: translate(-50%, -50%);
    animation: rise calc(560ms * var(--speed)) linear forwards;
  }

  .fx-statDown .a::before {
    animation-name: fall;
  }

  .fx-heal .a::before {
    background:
      radial-gradient(circle, #fff 0 2px, transparent 3px) 0 0 / 22px 22px,
      radial-gradient(circle, var(--color) 0 3px, transparent 4px) 11px 11px / 22px 22px;
  }

  .fx-field {
    background: var(--color);
    mix-blend-mode: screen;
    opacity: 0;
    animation: flash-field calc(600ms * var(--speed)) ease-out forwards;
  }

  @keyframes flash-field {
    30% {
      opacity: 0.45;
    }
    to {
      opacity: 0;
    }
  }

  /* ───────── Infofelder ───────── */

  .infos {
    position: absolute;
    z-index: 8;
    display: grid;
    gap: 0.4rem;
    width: min(300px, 34%);
  }

  .foe-infos {
    top: 0.6rem;
    left: 0.75rem;
  }

  .own-infos {
    right: 0.75rem;
    bottom: 0.6rem;
  }
</style>
