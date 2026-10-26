# CLAUDE.md – Arbeitsanleitung für ARENA

**ARENA** ist ein eigenständiger Monster-Doppelkampf-Simulator im HD-2D-Look (Browser + PWA, iPad zuerst).
Die verbindliche Projektbeschreibung ist [`SPEC.md`](SPEC.md). Getroffene Entscheidungen stehen in
[`DECISIONS.md`](DECISIONS.md). Welt, Essenzen (Typen) und Namenslogik stehen in [`LORE.md`](LORE.md).

## Befehle

| Befehl              | Zweck                                                                        |
| ------------------- | ---------------------------------------------------------------------------- |
| `npm run dev`       | Entwicklungsserver (Service Worker ist im Dev-Modus aus)                     |
| `npm run build`     | Produktions-Build nach `dist/` (`BASE_PATH=/Pokemon-Champions/` wie in CI)   |
| `npm run preview`   | Build lokal ausliefern (mit gleichem `BASE_PATH` wie beim Build starten)     |
| `npm test`          | Vitest einmalig; `npm run test:watch` im Watch-Modus                         |
| `npm run typecheck` | svelte-check (App) + tsc für Headless-Code, Tests und Skripte                |
| `npm run lint`      | ESLint (typbewusst, inkl. Svelte)                                            |
| `npm run format`    | Prettier schreibt; `format:check` prüft nur                                  |
| `npm run check`     | Alles, was CI prüft: Format, Lint, Typen, Tests                              |
| `npm run icons`     | App-Icons prozedural neu erzeugen (`public/icons/`)                          |
| `npm run simulate`  | KI-gegen-KI-Kämpfe ohne Grafik (`-- --battles 1000`), Balancing-Statistik    |
| `npm run sprites`   | Kontaktabzug der Sprites als PNG (`-- <ordner> [id,id]`), Qualitätskontrolle |

Node ≥ 22.18 (siehe `.nvmrc`): Skripte in `scripts/` laufen direkt mit `node datei.ts` (Type Stripping).

## Ordnerstruktur

```
src/
  engine/    Reine Kampflogik. KEIN DOM, KEIN Three.js, KEIN Math.random/Date. Deterministisch.
             battle.ts (Ablauf), damage.ts/stats.ts/typechart.ts (Formeln), effects.ts (Hooks),
             events.ts (Ereignisse), choices.ts (Anfragen/Entscheidungen), state.ts, rng.ts, dex.ts (Schema)
  data/      Monster, Attacken, Fähigkeiten, Items, Typen, Formate – nur Datenzeilen.
             conditions.ts: Statusprobleme, flüchtige Zustände, Seiteneffekte, Wetter, Felder, Feldeffekte.
  ai/        KI-Gegner (nutzt die Engine wie ein Spieler), Headless-Runner, Simulator-Statistik.
  teams/     Validierung, Import/Export-Text, Zufallsteams.
  render/    Three.js-Szenen (Kampf, Titel), Kamera, Licht, Partikel.
  sprites/   Prozedurale Pixel-Grafik, rein rechnend (kein DOM): model.ts (Formen-Bausteine),
             raster.ts (Licht, Linien), sheet.ts (Spritesheets, Icons), monsters/ (60 Definitionen),
             icons.ts (Essenzen, Status, Items), pixelFont.ts.
  audio/     Prozedurale Musik/SFX (WebAudio).
  ui/        Svelte-Bildschirme und -Komponenten, globale Styles, PWA-Zustand.
  storage/   IndexedDB mit localStorage-Fallback.
  i18n/      UI-Texte: de.ts (Referenz), en.ts, t()-Funktion.
tests/       Vitest-Tests (Node-Umgebung).
scripts/     Node-Skripte (Icon-Generator, Headless-Simulator).
public/      Statische Dateien (Icons). Das Manifest erzeugt vite-plugin-pwa.
```

## Konventionen

- **TypeScript strict** inkl. `noUncheckedIndexedAccess` und `exactOptionalPropertyTypes`. Kein `any`
  (ESLint-Fehler). Nur „erasable“ Syntax: keine `enum`s, `namespace`s oder Parameter-Properties.
- **Imports mit Dateiendung** (`./rng.ts`, `./App.svelte`). So läuft Headless-Code ohne Build direkt in Node.
- **Headless-Grenze** (`engine`, `data`, `ai`, `teams`): eigenes `tsconfig.headless.json` ohne DOM-Typen;
  ESLint verbietet dort Three.js-, Svelte- und Browser-Schicht-Imports sowie `Math.random`, `Date.now`, `new Date`.
  Zufall nur über den Seed-RNG der Engine.
- **Engine-Funktionen ohne Seiteneffekte**, wo möglich. Die Engine erzeugt Ereignisse; Renderer und Log spielen sie ab.
- **UI-Texte nie hart im Code** – immer `t('bereich.schluessel')` aus `src/i18n/`. Neue Schlüssel zuerst in
  `de.ts`, dann `en.ts` (Typsystem und Test erzwingen Gleichstand).
- **Svelte 5 mit Runes** (`$state`, `$derived`, `$props`). Reaktive Module heißen `*.svelte.ts`.
- **Sprache:** Bezeichner auf Englisch; Kommentare, Doku, Commit-Nachrichten und UI (Referenz) auf Deutsch.
- **Touch zuerst:** Bedienelemente mind. 44 px (`--touch`), alles auch per Tastatur (Pfeile, Enter, Esc, 1–4).
  Querformat 1024×768 bis 2560×1440; Safe-Area-Insets (`--safe-*`) beachten.
- **Scroll-Bereiche:** Bildschirm als Flex-Spalte, Panel `flex: 1 1 auto; min-height: 0`, Scroll-Bereich
  `overflow-y: auto; min-height: 0`. Nie `height: 100%` in einer Grid-Zelle – dann scrollt Touch nicht
  (D-046). Touch-Scrollen in Playwright mit `Input.dispatchTouchEvent` prüfen, nicht nur mit dem Mausrad.
- **Keine fremden Inhalte:** keine Namen, Grafiken, Sounds oder Texte aus Pokémon oder anderen Spielen.
  Alle Grafiken entstehen per Code.
- **Tests:** Jede Engine-Mechanik bekommt Vitest-Tests. Tests liegen in `tests/` und spiegeln die `src/`-Struktur.
- **Speicherzugriffe** (IndexedDB/localStorage) immer in `try/catch`.
- **Neue Inhalte** sind Datenzeilen in `src/data/` (Namen nach `LORE.md`). Ein Integritätstest prüft
  Referenzen, Werte-Summen (300–600), Lernsets (15–40) und gültige Zufallsteams.
- **Neue Effekte** (Fähigkeit/Item) nutzen die Hooks aus `src/engine/effects.ts`; fehlt ein Hook, wird er dort
  ergänzt und in `battle.ts` an genau einer Stelle aufgerufen. Während einer Aktion `hp <= 0` prüfen –
  `fainted` setzt erst `checkFaints()` nach der Aktion.
- **Neue Zustände** (Status, Wetter, Feld, Seiteneffekt …) sind `ConditionData`-Zeilen in
  `src/data/conditions.ts` mit denselben Hooks. Dauer über `duration`/`durationRange` (Startrunde zählt mit),
  Laufzeitdaten nur in `ConditionState` (bleibt serialisierbar). Neue Ereignisse brauchen Kampflog-Texte in
  `src/ui/battleLog.ts` und den i18n-Dateien.
- **Kampftests** nutzen die Hilfen in `tests/helpers.ts` und kontrollierte Test-Monster/-Attacken (`t_*`) aus
  `tests/engine/fixtures.ts`. Zufallsabhängiges über viele Seeds prüfen, nicht über einen Glücks-Seed.
- **Neues Monster:** Datenzeile in `src/data/species.ts` (Namen nach `LORE.md`, keine Werte-Dominanz),
  Sprite-Definition in `src/sprites/monsters/` (Front schaut nach links, Boden bei y ≈ 60, Gesicht mit
  `view: 'front'`), Zeile in `LORE.md`. Mit `npm run sprites -- <ordner> <id>` ansehen; die Tests prüfen
  Palette (8–16 Farben), Bildrand, Silhouetten-Abstand und Außenlinie.
- **Fuzzing** (`tests/ai/fuzz.test.ts`): zufällige Sets und Aktionen; jede erlernbare Attacke muss dabei
  vorkommen. Findet Abstürze in Effekten, die die KI selten wählt.

## Ablauf pro Phase (SPEC Abschnitt 9)

1. Phase umsetzen, kleine logische Commits auf dem Arbeitsbranch.
2. `npm run check` grün, `npm run build` ohne Warnungen, keine Konsolenfehler, Layout in 1024×768 und
   1920×1080 geprüft (Playwright-Screenshots).
3. `README.md`, `CLAUDE.md`, `DECISIONS.md` aktualisieren.
4. Arbeitsbranch pushen, dann per Fast-Forward nach `main` pushen (vom Nutzer freigegeben) →
   GitHub Actions deployt nach GitHub Pages: <https://firechris15.github.io/Pokemon-Champions/>.
5. Deployment prüfen, dem Nutzer eine kurze iPad-Testliste geben und auf sein OK warten.

## SPEC in Kürze

- Doppelkampf 2 gegen 2, „6 mitbringen, 4 wählen“, Level 50; alles sofort verfügbar (Showdown-Prinzip).
- Engine: deterministisch (Seed-RNG), ereignisbasiert, Hook-System für Fähigkeiten/Items/Felder/Status.
- Inhalte: ≥ 60 Monster, 150 Attacken, 40 Fähigkeiten, 30 Items, 18 eigene Typen; Formate als Daten.
- Grafik: Three.js-HD-2D (Billboard-Pixel-Sprites, Licht, Bloom, Tilt-Shift), Sprites prozedural.
- UI: Titel, Hauptmenü, Teambuilder (Showdown-Niveau), Kampf, Kompendium, Replays, Schadensrechner, Einstellungen.
- KI: Leicht/Normal/Schwer (+ Unfair). Audio: prozedural über WebAudio.
- Phasen: 0 Setup · 1 Engine-Kern · 2 alle Mechaniken · 3 Sprites + Inhalte · 4 Kampf-UI (2D) ·
  5 Teambuilder/Menüs/Speichern · 6 HD-2D · 7 KI/Replays/Rechner/Kompendium/Audio · 8 Online (optional).

## Stand

| Phase | Status                                                             |
| ----- | ------------------------------------------------------------------ |
| 0     | ✅ Setup, PWA, CI/Deploy, Titel + Systemcheck mit 3D-Vorschauszene |
| 1     | ✅ Engine-Kern, 16 Monster, KI „Leicht“, Simulator, Engine-Test    |
| 2     | ✅ Status, Zustände, Schutz, Wetter, Felder, 45 Fähigk., 31 Items  |
| 3     | ✅ Sprite-Generator, Galerie, 60 Monster, 157 Attacken, Symbole    |
| 4–8   | offen                                                              |
