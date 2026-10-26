import * as THREE from 'three';
import { MONSTER_SPRITES } from '../sprites/monsters/index.ts';
import { FRAME_MARGIN, FRAME_SIZE } from '../sprites/raster.ts';
import { IDLE_FRAMES, spriteSheet } from '../sprites/sheet.ts';
import { setSheetFrame, sheetTexture } from './spriteTexture.ts';

/**
 * Kleine HD-2D-Vorschauszene für Titelbildschirm und Systemcheck.
 * Prüft auf dem Zielgerät: WebGL, Pixel-Texturen (NearestFilter), Billboard-Sprites (echte Monster),
 * Licht, Nebel, Partikel und die erreichte Bildrate. Die echte Kampfszene folgt in Phase 6.
 */

export interface SceneStats {
  fps: number;
  gpu: string;
}

type Rgb = readonly [number, number, number];

/** Deterministisches Pixel-Rauschen, damit die Texturen bei jedem Start gleich aussehen. */
function hash(x: number, y: number, seed: number): number {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function hex(color: string): Rgb {
  const value = Number.parseInt(color.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function pixelTexture(
  width: number,
  height: number,
  paint: (x: number, y: number) => Rgb | null,
): THREE.DataTexture {
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const color = paint(x, y);
      // DataTexture-Zeile 0 liegt unten: Zeilen spiegeln, damit `paint` von oben nach unten denkt.
      const i = ((height - 1 - y) * width + x) * 4;
      if (color) {
        data[i] = color[0];
        data[i + 1] = color[1];
        data[i + 2] = color[2];
        data[i + 3] = 255;
      }
    }
  }
  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function grassTexture(): THREE.DataTexture {
  const tones = ['#2f4a2a', '#385a2f', '#426836', '#2a3f27'].map(hex);
  const flowers = ['#e8c547', '#e07a8f'].map(hex);
  const texture = pixelTexture(32, 32, (x, y) => {
    const n = hash(x, y, 7);
    if (n > 0.985) return flowers[Math.floor(hash(x, y, 9) * flowers.length)] ?? null;
    return tones[Math.floor(n * tones.length)] ?? null;
  });
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(28, 28);
  return texture;
}

function stoneTexture(repeat: number): THREE.DataTexture {
  const tones = ['#8c8172', '#9a8f7f', '#7d7364'].map(hex);
  const mortar = hex('#4f473e');
  const texture = pixelTexture(32, 32, (x, y) => {
    const row = Math.floor(y / 8);
    const shifted = (x + (row % 2) * 8) % 16;
    if (y % 8 === 0 || shifted === 0) return mortar;
    const n = hash(Math.floor((x + (row % 2) * 8) / 16), row, 3) * 0.6 + hash(x, y, 5) * 0.4;
    return tones[Math.floor(n * tones.length)] ?? null;
  });
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat, repeat);
  return texture;
}

/** Himmel als gestufter Pixel-Verlauf (Sonnenuntergang). */
function skyTexture(): THREE.DataTexture {
  const bands = [
    '#151233',
    '#24194a',
    '#3b2358',
    '#5e2f61',
    '#8a3f5f',
    '#b9585a',
    '#e0814f',
    '#f2a85a',
  ];
  const colors = bands.map(hex);
  return pixelTexture(1, colors.length, (_x, y) => colors[y] ?? null);
}

/** Baum-Silhouetten für die Parallax-Kulisse. */
function treelineTexture(color: string, seed: number): THREE.DataTexture {
  const rgb = hex(color);
  const width = 128;
  const height = 32;
  const heights: number[] = [];
  for (let x = 0; x < width; x++) {
    const tree = Math.floor(x / 8);
    const local = Math.abs((x % 8) - 3.5);
    const peak = 10 + hash(tree, 0, seed) * 16;
    heights.push(Math.max(4, peak - local * (1.6 + hash(tree, 1, seed))));
  }
  const texture = pixelTexture(width, height, (x, y) =>
    height - y <= (heights[x] ?? 0) ? rgb : null,
  );
  texture.wrapS = THREE.RepeatWrapping;
  texture.repeat.set(3, 1);
  return texture;
}

function blobShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createRadialGradient(32, 32, 4, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(0,0,0,0.55)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
  }
  return new THREE.CanvasTexture(canvas);
}

interface Actor {
  sprite: THREE.Sprite;
  view: 'front' | 'back';
  texture: THREE.Texture | null;
  phase: number;
}

interface Torch {
  light: THREE.PointLight;
  flame: THREE.Sprite;
  base: number;
  phase: number;
}

export class PreviewScene {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(32, 1, 0.1, 120);
  private readonly cameraTarget = new THREE.Vector3(0, 1.6, -2.5);
  private readonly actors: Actor[] = [];
  private readonly torches: Torch[] = [];
  private readonly particles: THREE.Points;
  private readonly particleSpeeds: Float32Array;
  private readonly resizeObserver: ResizeObserver;
  private readonly container: HTMLElement;
  private readonly onStats: (stats: SceneStats) => void;
  private gpu: string | undefined;
  private frames = 0;
  private fpsWindowStart = 0;
  private lastTime = 0;
  private running = false;

  constructor(container: HTMLElement, onStats: (stats: SceneStats) => void) {
    this.container = container;
    this.onStats = onStats;
    this.renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.domElement.classList.add('scene-canvas');
    container.appendChild(this.renderer.domElement);

    this.buildWorld();
    this.particleSpeeds = new Float32Array(160);
    this.particles = this.buildParticles(this.particleSpeeds);
    this.scene.add(this.particles);

    this.resizeObserver = new ResizeObserver(() => {
      this.resize();
    });
    this.resizeObserver.observe(container);
    this.resize();
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  /** Name der Grafikeinheit (falls der Browser ihn verrät), sonst „WebGL 2“. */
  gpuName(): string {
    if (this.gpu === undefined) {
      const gl = this.renderer.getContext();
      const info = gl.getExtension('WEBGL_debug_renderer_info');
      const name: unknown = info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : null;
      this.gpu = typeof name === 'string' && name.length > 0 ? name : 'WebGL 2';
    }
    return this.gpu;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.fpsWindowStart = performance.now();
    this.frames = 0;
    this.renderer.setAnimationLoop((time) => {
      this.frame(time / 1000);
    });
  }

  stop(): void {
    this.running = false;
    this.renderer.setAnimationLoop(null);
  }

  dispose(): void {
    this.stop();
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.resizeObserver.disconnect();
    this.scene.traverse((object) => {
      if (
        object instanceof THREE.Mesh ||
        object instanceof THREE.Points ||
        object instanceof THREE.Sprite
      ) {
        const renderable = object as THREE.Object3D & {
          geometry: THREE.BufferGeometry;
          material: THREE.Material | THREE.Material[];
        };
        renderable.geometry.dispose();
        const materials = Array.isArray(renderable.material)
          ? renderable.material
          : [renderable.material];
        for (const material of materials) {
          for (const value of Object.values(material)) {
            if (value instanceof THREE.Texture) value.dispose();
          }
          material.dispose();
        }
      }
    });
    if (this.scene.background instanceof THREE.Texture) this.scene.background.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private readonly onVisibilityChange = (): void => {
    if (document.visibilityState === 'hidden') this.renderer.setAnimationLoop(null);
    else if (this.running) {
      this.fpsWindowStart = performance.now();
      this.frames = 0;
      this.renderer.setAnimationLoop((time) => {
        this.frame(time / 1000);
      });
    }
  };

  private resize(): void {
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  private buildWorld(): void {
    const scene = this.scene;
    scene.background = skyTexture();
    scene.fog = new THREE.Fog(0x7a3d5c, 20, 62);

    scene.add(new THREE.HemisphereLight(0xffc89a, 0x1d2240, 1.1));
    const sun = new THREE.DirectionalLight(0xffb070, 2.2);
    sun.position.set(-8, 6, -10);
    scene.add(sun);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(90, 90),
      new THREE.MeshLambertMaterial({ map: grassTexture() }),
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(5.6, 6, 0.35, 12),
      new THREE.MeshLambertMaterial({ map: stoneTexture(3.5), flatShading: true }),
    );
    platform.position.y = 0.17;
    scene.add(platform);

    // Kulisse in zwei Parallax-Ebenen.
    const layers: [string, number, number, number][] = [
      ['#3a2045', -30, 12, 1],
      ['#1f1530', -20, 8, 2],
    ];
    for (const [color, z, height, seed] of layers) {
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(160, height),
        new THREE.MeshBasicMaterial({ map: treelineTexture(color, seed), transparent: true }),
      );
      plane.position.set(0, height / 2 - 0.5, z);
      scene.add(plane);
    }

    const shadowTexture = blobShadowTexture();
    const flameTexture = pixelTexture(4, 6, (x, y) => {
      const ramp = ['#fff3b0', '#ffd25e', '#f29b38', '#d2552b'].map(hex);
      if ((y < 2 && (x === 0 || x === 3)) || (y === 0 && x === 2)) return null;
      return ramp[Math.min(3, Math.floor((y + Math.abs(x - 1.5)) / 2))] ?? null;
    });
    const pillarGeometry = new THREE.CylinderGeometry(0.32, 0.42, 2.6, 6);
    const pillarMaterial = new THREE.MeshLambertMaterial({
      map: stoneTexture(1),
      flatShading: true,
    });
    const pillarSpots: [number, number][] = [
      [-6.6, -3.6],
      [6.6, -3.6],
      [-6.6, 3.8],
      [6.6, 3.8],
    ];
    pillarSpots.forEach(([x, z], index) => {
      const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
      pillar.position.set(x, 1.3, z);
      scene.add(pillar);
      const flame = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: flameTexture,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      flame.center.set(0.5, 0);
      flame.scale.set(0.4, 0.6, 1);
      flame.position.set(x, 2.6, z);
      scene.add(flame);
      const light = new THREE.PointLight(0xff9a4a, 6, 9, 1.6);
      light.position.set(x, 3, z);
      scene.add(light);
      this.torches.push({ light, flame, base: 6, phase: index * 1.7 });
    });

    // Doppelkampf-Aufstellung: eigene Seite vorne (Rückenansicht), Gegner hinten (Frontansicht).
    const slots: { x: number; z: number; facing: 'front' | 'back'; size: number }[] = [
      { x: -1.9, z: 2.2, facing: 'back', size: 3.6 },
      { x: 1.9, z: 2.2, facing: 'back', size: 3.6 },
      { x: -1.6, z: -2.4, facing: 'front', size: 3.2 },
      { x: 1.6, z: -2.4, facing: 'front', size: 3.2 },
    ];
    // Bei jedem Start andere Monster (nur Darstellung, kein Einfluss auf Kämpfe).
    const ids = Object.keys(MONSTER_SPRITES)
      .map((id) => ({ id, order: Math.random() }))
      .sort((a, b) => a.order - b.order)
      .slice(0, slots.length)
      .map((entry) => entry.id);
    slots.forEach((slot, index) => {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ color: 0xffe6d0, transparent: true, opacity: 0 }),
      );
      // Füße stehen etwa 2 Einheiten über dem unteren Rand des Entwurfsrasters.
      sprite.center.set(0.5, (FRAME_MARGIN + 2) / FRAME_SIZE);
      sprite.scale.set(slot.size, slot.size, 1);
      sprite.position.set(slot.x, 0.35, slot.z);
      scene.add(sprite);
      const actor: Actor = { sprite, view: slot.facing, texture: null, phase: index * 0.9 };
      this.actors.push(actor);
      // Sprites nacheinander erzeugen, damit der erste Frame nicht wartet.
      const id = ids[index];
      const def = id === undefined ? undefined : MONSTER_SPRITES[id];
      if (id !== undefined && def) {
        setTimeout(
          () => {
            const texture = sheetTexture(spriteSheet(id, def));
            setSheetFrame(texture, slot.facing, 0);
            sprite.material.map = texture;
            sprite.material.opacity = 1;
            sprite.material.needsUpdate = true;
            actor.texture = texture;
          },
          60 * (index + 1),
        );
      }

      const shadow = new THREE.Mesh(
        new THREE.CircleGeometry(slot.size * 0.36, 16),
        new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false }),
      );
      shadow.rotation.x = -Math.PI / 2;
      shadow.scale.y = 0.55;
      shadow.position.set(slot.x, 0.36, slot.z);
      scene.add(shadow);
    });
  }

  private buildParticles(speeds: Float32Array): THREE.Points {
    const count = speeds.length;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (hash(i, 0, 11) - 0.5) * 26;
      positions[i * 3 + 1] = hash(i, 1, 11) * 7;
      positions[i * 3 + 2] = (hash(i, 2, 11) - 0.5) * 18 - 2;
      speeds[i] = 0.15 + hash(i, 3, 11) * 0.35;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        color: 0xffd27a,
        size: 0.09,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
  }

  private frame(time: number): void {
    const delta = this.lastTime === 0 ? 0 : Math.min(0.1, time - this.lastTime);
    this.lastTime = time;

    // Langsamer Kameraschwenk erzeugt Parallax zwischen Arena und Kulisse.
    this.camera.position.set(Math.sin(time * 0.17) * 1.6, 6.6 + Math.sin(time * 0.11) * 0.25, 15.5);
    this.camera.lookAt(this.cameraTarget);

    for (const actor of this.actors) {
      if (actor.texture) {
        const column = Math.floor(time * 4.2 + actor.phase * 3) % IDLE_FRAMES;
        setSheetFrame(actor.texture, actor.view, column);
      }
    }
    for (const torch of this.torches) {
      const flicker =
        Math.sin(time * 9 + torch.phase) * 0.6 + Math.sin(time * 23 + torch.phase) * 0.4;
      torch.light.intensity = torch.base + flicker * 1.2;
      torch.flame.scale.y = 0.6 + flicker * 0.06;
    }

    const attribute = this.particles.geometry.getAttribute('position');
    if (attribute instanceof THREE.BufferAttribute) {
      const positions = attribute.array as Float32Array;
      for (let i = 0; i < this.particleSpeeds.length; i++) {
        const y = (positions[i * 3 + 1] ?? 0) + (this.particleSpeeds[i] ?? 0) * delta;
        positions[i * 3 + 1] = y > 7 ? 0 : y;
        positions[i * 3] = (positions[i * 3] ?? 0) + Math.sin(time + i) * 0.12 * delta;
      }
      attribute.needsUpdate = true;
    }

    this.renderer.render(this.scene, this.camera);

    this.frames++;
    const now = performance.now();
    const elapsed = now - this.fpsWindowStart;
    if (elapsed >= 500) {
      this.onStats({ fps: Math.round((this.frames * 1000) / elapsed), gpu: this.gpuName() });
      this.frames = 0;
      this.fpsWindowStart = now;
    }
  }
}
