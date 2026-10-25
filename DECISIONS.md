# DECISIONS – Entscheidungsprotokoll

Hier stehen Entscheidungen, die die SPEC offenlässt oder bewusst anders umsetzt – jeweils mit Begründung.
Neueste Einträge unten. Format: **Entscheidung** – Begründung.

## Phase 0 – Projekt-Setup

### D-001 · UI-Framework: Svelte 5

**Svelte 5 (Runes)** für alle Menüs, den Teambuilder und das Kampf-Overlay.
Svelte kompiliert zu kleinem, schnellem JavaScript ohne virtuelles DOM (wichtig neben einer
Three.js-Szene auf dem iPad), hat erstklassige TypeScript-Unterstützung und eingebaute Übergangsanimationen.
Reaktive Logik außerhalb von Komponenten liegt in `*.svelte.ts`-Modulen.

### D-002 · TypeScript 6.0 statt 7.0

TypeScript 7 (nativer Compiler) ist erschienen, aber `svelte-check` und `typescript-eslint` unterstützen
offiziell nur bis 6.x. Wir bleiben bei `~6.0.3` und wechseln, sobald die Werkzeuge nachziehen.

### D-003 · Headless-Grenze technisch erzwungen

Die SPEC verlangt eine Engine ohne DOM und Three.js. Das wird nicht nur per Konvention, sondern technisch abgesichert:

- `tsconfig.headless.json` prüft `engine`, `data`, `ai` und `teams` **ohne DOM-Typen** – `window`/`document`
  führen dort zu Compilerfehlern.
- ESLint verbietet dort Imports von Three.js, Svelte und Browser-Schichten sowie `Math.random`,
  `Date.now` und `new Date` (Determinismus: gleicher Seed → gleicher Kampf).

### D-004 · Imports mit `.ts`-Endung, nur „erasable“ TypeScript

Alle Imports tragen ihre Dateiendung, und `erasableSyntaxOnly` ist aktiv (keine `enum`s/`namespace`s).
Dadurch läuft Headless-Code direkt mit `node datei.ts` (Type Stripping in Node ≥ 22.18) – ohne Bundler.
Das braucht der Headless-Simulator (Phase 2) und der spätere Online-Server mit derselben Engine (Phase 8).

### D-005 · Strengere Compiler-Optionen als „strict“

Zusätzlich aktiv: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`,
`noImplicitReturns`, `noUnused*`. Gerade in der Engine (Arrays von Monstern, optionale Effekte)
verhindert das ganze Fehlerklassen. ESLint läuft mit `strictTypeChecked`.

### D-006 · i18n als typisierte TS-Dateien statt JSON

`src/i18n/de.ts` ist die Referenz; `en.ts` muss dieselbe Struktur haben (Compilerfehler, wenn nicht).
`t('bereich.schluessel')` akzeptiert nur existierende Schlüssel (Autovervollständigung). Ein Test prüft
zusätzlich gleiche Schlüssel und Platzhalter. Deutsch ist Standard; die Sprachwahl wird ab Phase 5 gespeichert.

### D-007 · PWA: vite-plugin-pwa mit „Update auf Nachfrage“

Service Worker per Workbox (`generateSW`), alle Assets werden vorab gecacht → offline spielbar.
`registerType: 'prompt'`: Bei einer neuen Version erscheint „Neue Version verfügbar – Aktualisieren“,
statt die Seite automatisch neu zu laden (würde sonst mitten im Kampf passieren). Installierte PWAs
fragen stündlich und beim Zurückkehren in die App nach Updates.

### D-008 · Manifest aus der Vite-Konfiguration statt Datei in `/public`

Die SPEC nennt `/public` für das Manifest. Wir lassen es von vite-plugin-pwa erzeugen, weil Pfade
(`start_url`, `scope`, `id`) vom `BASE_PATH` abhängen (GitHub Pages: `/Pokemon-Champions/`, lokal `/`).
Die Icons liegen weiterhin in `public/icons/`.

### D-009 · App-Icons prozedural erzeugt und eingecheckt

`npm run icons` (`scripts/generate-icons.ts`) zeichnet die Icons als 32×32-Pixel-Art (goldenes „A“ der
eigenen Pixelschrift über einer Arena) und skaliert ganzzahlig hoch. Ein eigener, getesteter
Mini-PNG-Encoder vermeidet zusätzliche Abhängigkeiten. Die PNGs werden eingecheckt, damit CI keine
Grafik-Erzeugung braucht.

### D-010 · Anzeige-Modus `standalone`, Querformat-Hinweis statt Sperre

iPadOS unterstützt `display: fullscreen` und `orientation` im Manifest nicht verlässlich. Wir nutzen
`standalone` mit `black-translucent`-Statusleiste und Safe-Area-Abständen. Im Hochformat auf
Touch-Geräten erscheint ein „Bitte drehen“-Hinweis.

### D-011 · Three.js lazy geladen und als eigener Chunk

Three.js (~135 kB gzip) wird erst nach dem ersten Rendern der UI nachgeladen und liegt in einem eigenen
Chunk (`codeSplitting`-Gruppe in Rolldown). Updates der App müssen so den Three.js-Chunk nicht neu laden.
Pixel-Ratio ist vorerst auf 2 begrenzt; Qualitätsstufen folgen in Phase 6.

### D-012 · Phase-0-Vorschauszene als Geräte-Test

Phase 0 verlangt nur eine leere App. Wir liefern zusätzlich eine kleine HD-2D-Vorschauszene
(Pixel-Texturen mit `NearestFilter`, Billboard-Sprites, Fackel-Punktlichter, Nebel, Partikel, Parallax-Kulisse)
und einen **Systemcheck** (WebGL, FPS, App-Modus, Offline-Status, Speicher, Display).
So lässt sich schon jetzt prüfen, ob das iPad die Grundtechnik flüssig schafft.
Die Platzhalter-Monster werden in Phase 3 durch die echten prozeduralen Sprites ersetzt.

### D-013 · Ein Workflow für Prüfen und Deployen

`.github/workflows/ci.yml` prüft jeden Push und jeden PR (Format, Lint, Typen, Tests, Build).
Nur Pushes auf `main` werden nach GitHub Pages deployt. Gearbeitet wird auf einem Feature-Branch;
nach jeder abgeschlossenen Phase wird `main` per Fast-Forward nachgezogen (vom Nutzer so freigegeben).

### D-014 · Arbeitstitel „ARENA“ und Logo in eigener Pixelschrift

Bis ein finaler Name feststeht, heißt das Spiel „ARENA“ (SPEC-Arbeitstitel). Logo und Icons nutzen eine
eigene 5×7-Pixelschrift (`src/sprites/pixelFont.ts`), die als SVG mit `crispEdges` gerendert wird –
scharf in jeder Auflösung und ohne externe Schriftdateien.
