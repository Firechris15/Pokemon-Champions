# ARENA – Monster-Doppelkampf

Ein eigenständiger, kompetitiver **Monster-Doppelkampf-Simulator im HD-2D-Look**: Pixel-Sprites in einer
beleuchteten 3D-Szene, Doppelkämpfe 2 gegen 2, alles sofort verfügbar – Team bauen, kämpfen, Replay ansehen,
Team verbessern. Läuft im Browser auf iPad und PC und lässt sich als App installieren (offline spielbar).

Alle Monster, Typen, Attacken, Grafiken und Sounds sind eigene Inhalte und werden per Code erzeugt.

**Live:** <https://firechris15.github.io/Pokemon-Champions/>

## Auf dem iPad installieren

1. Die Live-URL in **Safari** öffnen.
2. Auf **Teilen** (Quadrat mit Pfeil) tippen → **Zum Home-Bildschirm**.
3. ARENA vom Home-Bildschirm starten – läuft dann im Vollbild und auch ohne Internet.

Neue Versionen meldet die App selbst („Neue Version verfügbar – Aktualisieren“).

## Stand

| Phase | Inhalt                                                                    | Status |
| ----- | ------------------------------------------------------------------------- | ------ |
| 0     | Projekt-Setup, PWA, CI/Deploy, Titelbildschirm, Systemcheck, 3D-Testszene | ✅     |
| 1     | Engine-Kern (RNG, Formeln, Typen, Doppelkampf-Ablauf, ~15 Monster)        | –      |
| 2     | Alle Kampfmechaniken, Fähigkeiten, Items, 1000-Kampf-Simulator            | –      |
| 3     | Prozedurale Sprites, Sprite-Galerie, alle 60 Monster                      | –      |
| 4     | Kampf-Bildschirm (2D), Kampf-UI, Kampflog, Team-Vorschau                  | –      |
| 5     | Teambuilder, Hauptmenü, Einstellungen, Speichern                          | –      |
| 6     | HD-2D-Kampfszene                                                          | –      |
| 7     | KI-Stufen, Replays, Schadensrechner, Kompendium, Audio, Feinschliff       | –      |
| 8     | Online (optional)                                                         | –      |

## Entwicklung

Voraussetzung: Node ≥ 22.18.

```bash
npm install
npm run dev          # Entwicklungsserver
npm run check        # Format, Lint, Typen, Tests (wie CI)
npm run build        # Produktions-Build nach dist/
```

Technik: Vite · TypeScript (strict) · Svelte 5 · Three.js · Vitest · ESLint/Prettier · vite-plugin-pwa.
Jeder Push wird von GitHub Actions geprüft; Pushes auf `main` werden automatisch auf GitHub Pages veröffentlicht.

Weitere Dokumente: [`SPEC.md`](SPEC.md) (Projektbeschreibung) · [`CLAUDE.md`](CLAUDE.md) (Konventionen) ·
[`DECISIONS.md`](DECISIONS.md) (Entscheidungen).
