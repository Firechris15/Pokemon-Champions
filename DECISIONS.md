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

## Phase 1 – Engine-Kern

### D-015 · Eigene Essenzen und eigene Wirkungstabelle

18 Essenzen (Typen) mit eigenen Namen und Farben (`src/data/typechart.ts`, Hintergrund in `LORE.md`).
Die Tabelle folgt bekannten, intuitiven Element-Beziehungen, setzt aber bewusst eigene Akzente
(z. B. Funke → Metall stark, Kristall immun gegen Funke und stark gegen Spuk, Gift → Wild stark,
Wind → Gift stark, Psi → Wyrm stark). Balance-Kriterien sind als Test festgeschrieben:
jede Essenz mit Stärke, Schwäche und Resistenz, höchstens 5 Schwächen, mehrere Immunitäten.

### D-016 · Werte-Namen und Kategorien

LP, Angriff, Verteidigung, **Fokus** (Sp.-Angriff), **Wille** (Sp.-Verteidigung), Initiative.
Intern heißen sie `hp/atk/def/spa/spd/spe`. Attacken-Kategorien bleiben „Physisch/Speziell/Status“
(so steht es auch in der SPEC und es ist allgemein verständlich).

### D-017 · Kampfzustand als reine Daten, Dex wird übergeben

`BattleState` enthält nur einfache Daten (inkl. Zufallsgenerator-Zustand). Die `Battle`-Klasse arbeitet
darauf. Dadurch: Klonen für die KI-Vorausschau, JSON-Speichern, Fortsetzen auf einem Server.
Inhalte kommen über einen `Dex` herein (Standard: `STANDARD_DEX`), Tests nutzen eigene Mini-Daten.
Ereignisse enthalten IDs statt Texten; Texte entstehen in der UI (`src/ui/battleLog.ts`) über i18n.

### D-018 · Hook-System schon in Phase 1

Laut Plan gehört das Hook-System zu Phase 2. Es ist aber das Fundament für Fähigkeiten, Items, Status und
Felder – ein späterer Umbau wäre teuer. Deshalb steht es jetzt (`src/engine/effects.ts`), validiert mit
12 Fähigkeiten und 4 Items. Konvention: `holder` ist das Monster mit dem Effekt; Modifikator-Hooks liefern
einen Faktor. Immunitäts-Prüfungen sind seiteneffektfrei (`onCheckImmunity`), damit KI und Schadensrechner
sie gefahrlos fragen können; Reaktionen laufen in `onImmunityTriggered`.

### D-019 · 4096er-Festkomma für Modifikatoren

Wie im Vorbild werden Faktoren als 4096-basierte Ganzzahlen verkettet und „bei ,5 abrunden“ angewendet.
Das macht Ergebnisse exakt reproduzierbar (keine Gleitkomma-Drift) und deckt sich mit bekannten
Schadensrechnern. Volltreffer ignorieren Schutzwände (wie üblich; die SPEC sagt dazu nichts).

### D-020 · Dynamische Initiative und Gleichstände

Vor jeder einzelnen Aktion wird die verbleibende Warteschlange nach aktueller Initiative neu sortiert
(Änderungen mitten in der Runde wirken sofort). Die Priorität wird bei der Auswahl festgelegt.
Gleichstände entscheidet ein pro Aktion einmal gezogener Zufallswert – stabil innerhalb der Runde.

### D-021 · Ziele sind Positionen

Attacken zielen auf Feldpositionen, nicht auf bestimmte Monster: Wird gewechselt, trifft die Attacke den
Neuen. Fällt ein gewählter **Gegner** vorher aus, wird auf einen anderen Gegner umgeleitet. Fällt der gewählte
**Partner** aus, schlägt die Attacke fehl (kein ungewolltes Umlenken auf Gegner). Ohne gewähltes Ziel nimmt
eine Ein-Ziel-Attacke einen zufälligen Gegner. Der Flächenfaktor 0,75 gilt, wenn beim Ausführen mehr als ein
Ziel übrig ist.

### D-022 · Kampfende-Sonderfälle

Sind beide Seiten gleichzeitig besiegt (z. B. durch Rückstoß), endet der Kampf unentschieden.
Ein Rundenlimit von 300 verhindert Endloskämpfe (ebenfalls unentschieden). Ohne AP setzen Monster die
Notattacke „Verzweifler“ ein (ohne Essenz, Rückstoß 1/4 der max. LP).

### D-023 · Level des Formats als Obergrenze

Alle Monster kämpfen höchstens mit dem Format-Level (Standard 50); höhere Sets werden heruntergesetzt,
niedrigere bleiben (bewusst schwächer).

### D-024 · Inhaltstexte in den Datenzeilen, UI-Vokabular in i18n

Namen und Beschreibungen von Monstern, Attacken, Fähigkeiten und Items stehen (deutsch) direkt in den
Datenzeilen – so bleibt jeder neue Inhalt eine einzige Zeile. Englische Inhaltstexte kommen später als
Übersetzungs-Datei je ID hinzu (Fallback: Deutsch). Wiederkehrendes UI-Vokabular (Essenzen, Werte,
Kampflog-Sätze) liegt in den i18n-Dateien.

### D-025 · Replays = Seed + Teams + Entscheidungen

`battle.toReplay()` liefert nur Format, Seed, Teams und die angenommenen Entscheidungen;
`Battle.replay()` spielt exakt nach (getestet, auch nach JSON-Rundreise und Klonen).

### D-026 · Einfache KI, Zufallsteams und Simulator schon jetzt

Der Headless-Kampf (Abnahmekriterium von Phase 1) braucht Teams und Gegner. Deshalb gibt es bereits die KI
„Leicht“ (`src/ai/easy.ts`), sinnvolle Zufallsteams (`src/teams/random.ts`) und eine Basis-Validierung
(`src/teams/validate.ts`, Fehler als Codes für i18n). `npm run simulate` lässt beliebig viele Kämpfe laufen
und gibt Siegraten pro Monster und Attacken-Nutzung aus; CI lässt bei jedem Push 1000 Kämpfe laufen.

### D-027 · Vorläufiges Entwicklermenü mit Engine-Test

Damit Phase 1 auf dem iPad prüfbar ist, führt der Titelbildschirm in ein vorläufiges Entwicklermenü mit
„Engine-Test“ (KI gegen KI im Browser, Textlog und Statistik) und dem Systemcheck. Das echte Hauptmenü
ersetzt es in Phase 5; die Sprite-Galerie (Phase 3) kommt in dieses Menü.
