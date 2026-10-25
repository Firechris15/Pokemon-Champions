import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string;
};

/** Kurzer Commit-Hash für die Build-Anzeige (CI liefert GITHUB_SHA, lokal git). */
function buildSha(): string {
  const fromCi = process.env['GITHUB_SHA'];
  if (fromCi) return fromCi.slice(0, 7);
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return 'dev';
  }
}

// GitHub Pages liefert die App unter /<repo>/ aus; der Workflow setzt BASE_PATH entsprechend.
const base = process.env['BASE_PATH'] ?? '/';
const themeColor = '#0b0e1a';

export default defineConfig({
  base,
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_SHA__: JSON.stringify(buildSha()),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    svelte(),
    VitePWA({
      // Kein automatisches Neuladen mitten im Kampf: die App fragt, bevor sie aktualisiert.
      registerType: 'prompt',
      injectRegister: null,
      manifest: {
        id: base,
        name: 'ARENA – Monster-Doppelkampf',
        short_name: 'ARENA',
        description: 'Kompetitiver Monster-Doppelkampf-Simulator im HD-2D-Look.',
        lang: 'de',
        dir: 'ltr',
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'landscape',
        background_color: themeColor,
        theme_color: themeColor,
        categories: ['games'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,webmanifest,woff2}'],
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
      },
    }),
  ],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 900,
    rolldownOptions: {
      output: {
        // Three.js ändert sich selten: eigener Chunk, damit Updates der App klein bleiben.
        codeSplitting: { groups: [{ name: 'three', test: /node_modules[\\/]three[\\/]/ }] },
      },
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
