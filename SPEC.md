# SPEC – Monster-Doppelkampf-Simulator (Arbeitstitel: „ARENA“)

> Diese Datei ist die vollständige Projektbeschreibung. Lies sie komplett, bevor du Code schreibst.
> Arbeite die Phasen der Reihe nach ab. Triff bei offenen Detailfragen selbst sinnvolle Entscheidungen
> und dokumentiere sie in `DECISIONS.md`, statt mich zu fragen. Frag nur, wenn eine Entscheidung
> später sehr teuer rückgängig zu machen wäre.

---

## 1. Vision

Ein eigenständiges Monster-Kampfspiel im **HD-2D-Look** (Pixel-Sprites in einer beleuchteten 3D-Szene,
Tiefenunschärfe, Bloom, Partikel), mit Schwerpunkt auf **kompetitiven Doppelkämpfen** (2 gegen 2 auf dem Feld).

**Vorbild Spielgefühl:** moderne offizielle Doppelkampf-Ranglistenspiele.
**Vorbild Zugänglichkeit:** Showdown-artige Simulatoren. Das heißt:
- **Alles ist sofort verfügbar.** Kein Fangen, kein Leveln, kein Freischalten, keine Währung.
- Jedes Monster, jede Attacke, jede Fähigkeit, jedes Item ist im Teambuilder frei wählbar (sofern legal für das Monster).
- Freie Werteverteilung (EVs, IVs, Wesen), Teams als Text importier- und exportierbar.
- Der Fokus liegt auf: Team bauen → kämpfen → Replay anschauen → Team verbessern.

**Rechtlich wichtig – komplett eigene Inhalte:**
- Keine Namen, Designs, Sprites, Sounds, Musik oder Texte aus Pokémon oder anderen Spielen.
- Mechaniken (Typen, Statuswerte, Doppelkampf, Wetter …) sind erlaubt, bekommen aber **eigene Namen**.
- Alle Monster, Typen, Attacken, Fähigkeiten und Items werden **neu erfunden**.

---

## 2. Plattform & Technik

- **Ziel:** läuft im Browser auf **iPad (Safari, Querformat, Touch)** und **PC (Chrome/Firefox/Edge, Maus + Tastatur)**.
- **PWA:** installierbar auf dem Homescreen, offline spielbar (Service Worker, alle Assets gecacht).
- **Stack:**
  - Vite + TypeScript (strict)
  - **Three.js** für die Kampfszene (HD-2D), mit Postprocessing (Bloom, Tiefenunschärfe/Tilt-Shift, Vignette, Farbkorrektur)
  - UI (Menüs, Teambuilder, Kampf-Overlay): **Svelte** (oder ein vergleichbar leichtes Framework – Entscheidung dokumentieren)
  - Tests: **Vitest**
  - Speichern: IndexedDB (mit localStorage-Fallback, alle Zugriffe in try/catch)
- **Deployment:** GitHub Actions → GitHub Pages bei jedem Push auf `main`, damit ich sofort auf dem iPad testen kann.
- **Performance-Ziel:** stabile 60 FPS auf einem iPad der letzten 4 Jahre. Grafikqualitäts-Stufen in den Einstellungen (Niedrig/Mittel/Hoch).

### Ordnerstruktur
```
/src
  /engine      Reine Kampflogik in TypeScript. KEIN DOM, KEIN Three.js. Deterministisch.
  /data        Monster, Attacken, Fähigkeiten, Items, Typen, Formate (typisierte TS-Dateien)
  /ai          KI-Gegner
  /teams       Team-Validierung, Import/Export-Textformat, Zufallsteams
  /render      Three.js-Kampfszene, Kamera, Licht, Partikel, Animationen
  /sprites     Prozeduraler Sprite-Generator + Sprite-Definitionen
  /audio       Prozedurale Musik/SFX über WebAudio
  /ui          Alle Bildschirme und Komponenten
  /storage     Speicherschicht (Teams, Replays, Einstellungen)
/tests         Vitest-Tests, vor allem für /engine
/public        Icons, Manifest
```

---

## 3. Kampf-Engine (`/src/engine`) – das Herzstück

### 3.1 Grundprinzipien
- **Komplett von Rendering und UI getrennt.** Die Engine nimmt Entscheidungen entgegen und gibt eine Liste von **Ereignissen** aus
  (z. B. `move_used`, `damage`, `faint`, `switch_in`, `weather_start`, `stat_change`, `miss`, `crit`, `effectiveness`).
  Renderer und Kampflog spielen diese Ereignisse nur ab.
- **Deterministisch:** eigener Zufallsgenerator mit Seed. Gleicher Seed + gleiche Entscheidungen = exakt gleicher Kampf.
  Dadurch funktionieren Replays, Tests und später Online-Kämpfe.
- **Ereignis-/Hook-System** ähnlich wie bei Showdown: Fähigkeiten, Items, Felder und Statuseffekte registrieren sich auf Hooks
  (`onSwitchIn`, `onBeforeMove`, `onModifyPriority`, `onModifyAtk`, `onModifyDamage`, `onDamagingHit`, `onResidual`,
  `onTryHit`, `onRedirectTarget`, `onFaint`, `onTurnEnd` …). Neue Effekte sollen sich hinzufügen lassen, ohne die Engine umzubauen.

### 3.2 Kampfablauf Doppelkampf
- Format-Standard: **6 Monster mitbringen, 4 auswählen** (Team-Vorschau mit beiden Teams sichtbar), 2 starten auf dem Feld.
- Pro Runde: beide Spieler wählen für jedes aktive Monster eine Aktion (Attacke + Ziel, oder Wechsel).
  Vor dem endgültigen Bestätigen kann man die Auswahl zurücknehmen.
- **Reihenfolge:** Wechsel zuerst → dann nach Priorität → innerhalb einer Priorität nach Initiative (inkl. Modifikatoren) →
  Gleichstand per Zufall. Initiative wird **dynamisch** neu berechnet, wenn sie sich mitten in der Runde ändert.
- **Zielarten:** ein angrenzendes Ziel, beide Gegner, alle anderen (inkl. Partner), Partner, selbst, eigene Seite,
  gegnerische Seite, ganzes Feld, zufälliger Gegner.
- Fällt das Ziel vorher aus, wird bei Ein-Ziel-Attacken auf den anderen Gegner umgeleitet (wenn sinnvoll).
- **Flächenattacken** (mehrere Ziele) machen 0,75× Schaden.
- Besiegte Monster werden **am Rundenende** ersetzt (Spieler wählt Ersatz).
- Kampfende: Eine Seite hat keine kampffähigen Monster mehr. Optional: Aufgabe-Button.
- Optionaler Rundentimer (Format-Einstellung).

### 3.3 Statuswerte & Formeln
- 6 Werte: KP, Angriff, Verteidigung, Sp.-Angriff, Sp.-Verteidigung, Initiative (eigene Bezeichnungen erlaubt, aber diese Funktion).
- Standard-Level 50 (pro Format einstellbar).
- **EVs:** 0–252 pro Wert, max. 510 gesamt. **IVs:** 0–31. **Wesen:** 25 Stück (+10 % / −10 %, 5 neutrale), eigene Namen.
- Klassische Werteformel (KP-Formel getrennt).
- **Stat-Stufen:** −6 bis +6, inkl. Genauigkeit/Ausweichen mit eigener Tabelle.
- **Schadensformel:** klassische Formel mit Modifikatoren in fester Reihenfolge:
  Flächenfaktor 0,75 → Wetter → Volltreffer 1,5 → Zufall 0,85–1,00 → Gleicher-Typ-Bonus 1,5 → Typeffektivität →
  Verbrennung 0,5 (physisch) → Schutzwände (im Doppelkampf 2/3 statt 1/2) → Items/Fähigkeiten.
- Volltreffer-Stufen (Basis 1/24, Stufe 1: 1/8, Stufe 2: 1/2, Stufe 3+: immer), ignorieren negative eigene / positive gegnerische Stufen.
- Physisch/Speziell/Status-Aufteilung pro Attacke.

### 3.4 Typen
- **18 eigene Typen** mit eigenen Namen, Farben und Icons. Erfinde eine stimmige Typentabelle (0×, 0,5×, 1×, 2×).
  Sie soll ausbalanciert sein: Jeder Typ braucht Stärken, Schwächen und mindestens eine Immunität im System soll es geben.
- Doppeltypen multiplizieren.
- Typentabelle als Daten, nicht hart im Code.

### 3.5 Effekte, die die Engine beherrschen muss
**Statusprobleme (dauerhaft):** Verbrennung, Paralyse, Vergiftung, schwere Vergiftung, Schlaf (1–3 Runden), Einfrieren – eigene Namen.
**Flüchtige Zustände:** Verwirrung, Zurückschrecken, Verhöhnung, Zugabe/Wiederholzwang, Delegator/Ersatzpuppe, Fokussieren,
Auflade-/Zwei-Runden-Attacken, Festhalten/Bindung, Fluch-artige Effekte, Wechselsperre.
**Schutz-Mechanik:** Schutz-Attacken, Erfolgschance halbiert sich bei Wiederholung (1 → 1/3 → 1/9 …). Varianten, die nur Seite oder Flächenattacken schützen.
**Doppelkampf-Spezialitäten:** Umlenken (Ziel-Magnet), Partner-Unterstützung (Helfer: +50 %), Erstrunden-Attacke mit Zurückschrecken,
Initiative-Kontrolle, Partner-Heilung, Positionstausch.
**Wetter (4 Arten, 5 Runden, Items verlängern auf 8):** Sonnen-, Regen-, Sand- und Hagel/Schnee-Äquivalent mit eigenen Namen und Effekten.
**Felder (4 Arten, 5 Runden):** eigene Namen, verstärken je einen Typ und haben einen Nebeneffekt.
**Feldeffekte:** Raumverzerrung/Umkehr der Zugreihenfolge (5 Runden), Rückenwind (4 Runden, Initiative ×2), Schutzwände physisch/speziell/beides (5 Runden),
Fallen/Eintrittsschaden auf der gegnerischen Seite.
**Attacken-Eigenschaften:** Mehrfachtreffer, Rückstoß, Absorbieren/Heilen, Kontakt, Klang, Schlag, Biss, Puls, Prioritätsstufen −7 bis +5,
Wechsel-nach-Treffer, garantiertes Treffen, Statuswert-Änderungen bei sich/Ziel mit Wahrscheinlichkeit, feste Schadenswerte, OHKO **nicht** einbauen.
**Optional: eigener Kampf-Gimmick** (einmal pro Kampf, z. B. Typwechsel oder Verstärkung) – eigenes Konzept erfinden, als Format-Option abschaltbar.

### 3.6 Fähigkeiten & Items
- Mindestens **40 Fähigkeiten** zum Start, darunter: Wetter/Feld beim Einwechseln setzen, Angriff-senken beim Einwechseln,
  Typ-Immunitäten mit Bonus, Schadensverstärker, Gegner-Item-Effekte, Initiative-Verdopplung im Wetter, Partner-Schutz,
  Prioritäts-Blocker, Statuswerte-Erhöhung nach K.O.
- Mindestens **30 Items**, darunter: Wahl-Items (Angriff/Sp.-Angriff/Initiative ×1,5, nur eine Attacke), Leben-Item (×1,3, 10 % Rückstoß),
  Fokus-Item (überlebt mit 1 KP bei vollen KP), Heilbeeren, Typ-Resist-Beeren, Überreste-Heilung, Wetter-Verlängerer,
  Sturzhelm-Item (Kontakt-Rückstoß), Schutzbrillen-Item, Offensiv-Weste. Alles mit eigenen Namen.
- **Item-Klausel** als Format-Option: jedes Item nur einmal pro Team.

### 3.7 Tests (Pflicht)
- Jede Mechanik bekommt Vitest-Tests: Formeln, Zugreihenfolge, Ziel-Umleitung, Flächenschaden, Schutz-Wiederholungschance,
  Wetter-/Feld-Dauer, Fähigkeiten-Hooks, Items, K.O.-Ersatz, Replay-Determinismus (gleicher Seed → gleiches Ergebnis).
- Ein **Headless-Simulator**: lässt 1000 KI-gegen-KI-Kämpfe ohne Grafik laufen und prüft, dass keine Exceptions/Endlosschleifen auftreten.
  Gibt eine Statistik aus (Siegrate pro Monster, Nutzungsrate von Attacken) → hilft beim Balancing.

---

## 4. Inhalte (`/src/data`)

- **Start-Umfang:** mindestens **60 Monster**, **150 Attacken**, **40 Fähigkeiten**, **30 Items**, **18 Typen**.
- Später erweiterbar – Daten so strukturieren, dass neue Einträge nur Datenzeilen sind.
- **Monster-Datensatz:** ID, Name, Typ(en), Basiswerte (Summe ca. 300–600, Rollen-gerecht), 1–3 mögliche Fähigkeiten,
  Attackenpool (lernbare Attacken, 15–40 pro Monster), Gewicht, Größe, Kompendium-Text (eigener, kurzer Lore-Text),
  Sprite-Definition, Farbpalette, optionale Entwicklungslinie (nur Lore, kein Leveln).
- **Rollenvielfalt:** schnelle Angreifer, langsame Tanks, Unterstützer (Umlenken, Rückenwind, Schutzwände), Wetter-Setzer,
  Raumverzerrungs-Setzer, Mischangreifer, Prioritäts-Nutzer. Jeder Typ soll mehrere sinnvolle Monster haben.
- **Balancing:** keine Monster, die in allem besser sind als ein anderes. Ein paar starke „Legenden“ sind erlaubt, aber nur im freien Format.
- **Attacken-Datensatz:** ID, Name, Typ, Kategorie, Stärke, Genauigkeit, AP, Priorität, Ziel, Flags (Kontakt, Klang …),
  Nebeneffekt + Chance, Beschreibung, Animations-Preset.

### Formate (`/src/data/formats.ts`)
- **Doppel Standard:** 6 mitnehmen, 4 wählen, Level 50, Spezies-Klausel (jedes Monster nur einmal), Item-Klausel, keine Legenden.
- **Doppel Frei:** alles erlaubt.
- **Einzel Standard:** 1 gegen 1 auf dem Feld, 6 gegen 6 (als Bonus, Engine soll das ohne Sonderlogik können).
- **Zufallskampf Doppel:** beide Seiten bekommen automatisch generierte, sinnvolle Zufallsteams.
- Formate sind Daten → neue Regelwerke ohne Code-Änderung.

---

## 5. Grafik: HD-2D (`/src/render`, `/src/sprites`)

### 5.1 Kampfszene
- Three.js-Szene: **3D-Arena aus Low-Poly-Geometrie** mit Pixel-Texturen (Boden, Ränder, Hintergrundkulisse mit Parallax-Ebenen).
- Monster als **Billboard-Sprites** (immer zur Kamera gedreht), Texturfilter `NearestFilter` für scharfe Pixel.
- Kamera leicht von oben geneigt (ca. 30–40°), perspektivisch. Eigene Seite vorne (Rückenansicht der Sprites), Gegner hinten (Frontansicht).
- **Licht:** Richtungslicht + Umgebungslicht + Punktlichter für Attacken-Effekte. Weiche Schatten unter den Sprites (Blob- oder Echtzeit-Schatten).
- **Postprocessing:** Bloom, Tiefenunschärfe/Tilt-Shift (Vorder- und Hintergrund leicht unscharf), Vignette, leichte Farbkorrektur, optional Film-Grain.
- **Mehrere Arenen** (mind. 4): z. B. Wald bei Sonnenuntergang, Kristallhöhle, Wüstenruine, Stadion bei Nacht. Wetter und Felder ändern die Szene sichtbar
  (Regenpartikel, Sandsturm, Lichtfarbe, Bodenschimmer).
- **Kamerafahrten:** kurzer Zoom/Schwenk beim Angriff, Wackeln bei starken Treffern, langsamer Zoom beim K.O. Einstellbar: Animationsgeschwindigkeit 1×/2×/Aus.
- **Attacken-Effekte:** Partikel-System mit Presets pro Typ/Kategorie (Projektil, Strahl, Explosion, Aura, Welle, Nahkampf-Stoß, Statusänderung auf/ab).
  Jede Attacke verweist auf ein Preset + Farbe, damit 150+ Attacken nicht einzeln animiert werden müssen.

### 5.2 Prozedurale Sprites (Claude erstellt alle Grafiken per Code)
- **Jedes Monster wird im Code definiert und generiert** – keine externen Bilddateien nötig.
- Ansatz: Sprite-Definition pro Monster aus **Palette + Pixel-Raster als Strings** (z. B. 64×64 oder 96×96) **oder** aus geschichteten Grundformen
  (Körper, Kopf, Augen, Gliedmaßen, Schwanz, Muster), die zu Pixel-Art gerastert werden. Wähle, was bessere Qualität liefert, und dokumentiere es.
- Qualitätsanspruch:
  - Klare, unverwechselbare **Silhouetten** – jedes Monster muss auch als schwarzer Schatten erkennbar sein.
  - Begrenzte Paletten (8–16 Farben pro Monster), Umrisslinie (Outline), Schattierung mit 2–3 Tönen, Lichtkante (Highlight).
  - Stil passend zum Typ (Feuer-Monster warme Paletten, Geister-Monster halbtransparente Teile usw.).
- **Pro Monster:** Frontansicht, Rückansicht, Icon (32×32 für Menüs). Leerlauf-Animation (2–4 Frames „Atmen“/Schweben),
  Angriffs-Pose, Treffer-Blinken (Shader), K.O.-Animation (Ausblenden/Absinken).
- Sprites werden beim Build (oder beim ersten Start, dann gecacht) zu **Spritesheets** gerendert.
- Zusätzlich prozedural: Typ-Icons, Status-Icons, Item-Icons, UI-Rahmen, Arena-Texturen.
- **Sprite-Galerie-Seite** (Entwickler-Menü), die alle Monster nebeneinander zeigt, damit ich die Qualität beurteilen und Feedback geben kann.

---

## 6. Menüs & Bildschirme (`/src/ui`)

Durchgehend: **touch-freundlich** (Buttons mind. 44 px), auch per Tastatur bedienbar (Pfeiltasten, Enter, Esc, Zahlentasten 1–4 für Attacken),
Querformat optimiert (1024×768 bis 2560×1440), saubere Übergangsanimationen, einheitliches Design im Pixel-/HD-2D-Stil.

### 6.1 Titelbildschirm
- Animierter Hintergrund (HD-2D-Szene mit vorbeiziehenden Monstern), Logo, „Tippen zum Starten“.

### 6.2 Hauptmenü
- **Kampf** → Untermenü:
  - Gegen KI (Format wählen, Team wählen, Schwierigkeit wählen, Arena wählen oder Zufall)
  - Lokal 2 Spieler (Hotseat auf einem Gerät, Auswahl wird verdeckt)
  - Zufallskampf (sofort los mit Zufallsteams)
  - Online (Platzhalter „Bald verfügbar“, siehe Phase 8)
- **Teambuilder**
- **Kompendium** (alle Monster, Attacken, Fähigkeiten, Items, Typentabelle)
- **Replays**
- **Schadensrechner**
- **Einstellungen**
- **Credits**

### 6.3 Teambuilder (Showdown-Niveau)
- **Team-Übersicht:** Liste aller Teams, Ordner, Suchen, Duplizieren, Umbenennen, Löschen, Sortieren. Format pro Team festlegbar.
- **Team-Ansicht:** 6 Slots mit Sprite, Name, Item, Fähigkeit, Attacken auf einen Blick. Drag & Drop zum Umsortieren.
- **Monster-Auswahl:** durchsuchbare Liste mit Filtern (Typ, Fähigkeit, Attacke lernbar, Basiswerte sortierbar, Rolle), Mini-Statuswert-Balken.
- **Monster-Editor:**
  - Spitzname, Level, Geschlecht (optional, rein kosmetisch), Schillernd-Variante (alternative Palette, kosmetisch)
  - Fähigkeit (Dropdown mit Beschreibung)
  - Item (durchsuchbar, mit Beschreibung)
  - 4 Attacken: Suche mit Filter nach Typ/Kategorie/Stärke, nur legale Attacken, Beschreibung + Werte sichtbar
  - **EV-Schieberegler** mit Restpunkte-Anzeige, Schnell-Buttons (0/252), **IV-Felder**, **Wesen**-Auswahl (zeigt +/− farbig)
  - **Live-Werte-Anzeige:** berechnete Endwerte, Balkendiagramm, Initiative-Vergleich mit bekannten Werten
  - Vorschläge: „Beliebte Sets“ (von dir vordefiniert pro Monster, 1–3 Stück)
- **Validierung** nach Format (Spezies-/Item-Klausel, Legenden-Sperre, illegale Attacken) mit klaren Fehlermeldungen.
- **Import/Export:** Team als lesbarer Text (eigenes Format, ähnlich Showdown-Paste), in Zwischenablage kopieren / einfügen.
  Zusätzlich Teilen per Kurz-Code (Base64 in der URL).
- **Zufallsteam generieren** (sinnvolle Sets, nicht komplett zufällig).
- **Team-Analyse:** Typ-Schwächen-Übersicht des ganzen Teams, Initiative-Rangliste, Rollenabdeckung.

### 6.4 Kampf-Bildschirm
- **Team-Vorschau** vor dem Kampf: beide Teams sichtbar, 4 aus 6 auswählen, Reihenfolge = die ersten 2 starten.
- Oben/unten: **Info-Panels** pro aktivem Monster: Name, Level, KP-Balken (animiert, farbig grün/gelb/rot), eigene KP als Zahl,
  gegnerische als Prozent, Statussymbol, Stat-Stufen als Tooltip/Antippen.
- **Aktionsauswahl** für Monster 1, dann Monster 2:
  - 4 Attacken-Buttons in Typfarbe mit Name, AP, Kategorie-Icon. Lange drücken/Hover = Details.
  - Optional (Einstellung): Effektivitäts-Hinweis („sehr effektiv“) auf den Buttons.
  - **Zielauswahl** im Doppelkampf durch Antippen der Monster in der Szene oder Buttons.
  - Wechseln-Menü mit Bank-Monstern und ihren KP/Status.
  - Gimmick-Button, falls Format es erlaubt.
  - „Zurück“ zum Rücknehmen.
- **Feldanzeige:** aktive Wetter/Felder/Schutzwände/Rückenwind mit verbleibenden Runden als Icons.
- **Kampflog** (ausklappbares Seitenpanel wie bei Showdown): alle Ereignisse als Text, Rundenüberschriften, Schadensprozente.
- Textbox unten für die aktuelle Aktion („X setzt Y ein!“), Textgeschwindigkeit einstellbar, antippen zum Beschleunigen.
- Nach dem Kampf: Ergebnisbildschirm, **Replay speichern**, Revanche, zurück zum Teambuilder.

### 6.5 Kompendium
- Monster-Liste mit Sprite (animiert), Typen, Basiswerten, Fähigkeiten, lernbaren Attacken, Lore-Text.
- Attacken-, Fähigkeiten-, Item-Listen mit Suche/Filter.
- Interaktive Typentabelle.

### 6.6 Replays
- Gespeichert als Seed + Teams + Entscheidungen (klein!). Abspielen mit Play/Pause, Runde vor/zurück, Geschwindigkeit, Kampflog.
- Export/Import als Text.

### 6.7 Schadensrechner
- Angreifer + Verteidiger mit allen Einstellungen (EVs, Wesen, Items, Stufen, Wetter, Feld, Schutzwände, Flächenattacke ja/nein, Helfer).
- Ausgabe: Schadensbereich in KP und %, Chance auf 1HKO/2HKO. Benutzt **dieselbe Formel wie die Engine** (kein doppelter Code).
- Monster direkt aus eigenen Teams laden.

### 6.8 Einstellungen
- Lautstärke Musik/SFX, Text- und Animationsgeschwindigkeit, Grafikqualität, Effektivitäts-Hinweise an/aus,
  Kampflog standardmäßig offen/zu, Farbenblind-Modus (Typen zusätzlich mit Symbolen), Sprache (Deutsch zuerst, Englisch vorbereitet via i18n-Dateien),
  Daten exportieren/importieren/zurücksetzen.

---

## 7. KI-Gegner (`/src/ai`)

- Benutzt die Engine nur über dieselbe Schnittstelle wie ein Spieler (keine versteckten Infos, außer bei „Unfair“).
- **Leicht:** zufällige legale Aktionen, bevorzugt Schadensattacken.
- **Normal:** wählt Attacke mit höchstem erwartetem Schaden, beachtet Typen und Immunitäten, wechselt bei sehr schlechtem Matchup.
- **Schwer:** simuliert Schaden mit dem Schadensrechner, erkennt K.O.-Chancen, nutzt Schutz sinnvoll, fokussiert Ziele mit beiden Monstern,
  setzt Unterstützungsattacken (Rückenwind, Umlenken, Schutzwände) im richtigen Moment, trifft keinen eigenen Partner mit Flächenattacken
  (außer bei Immunität), wählt Team-Vorschau-Auswahl passend zum Gegnerteam.
- **Unfair (optional):** kennt die Sets des Spielers.
- KI-Teams: pro Schwierigkeit vordefinierte thematische Teams (Wetter-Team, Raumverzerrungs-Team, Rückenwind-Offensive usw.) + Zufallsteams.

---

## 8. Audio (`/src/audio`)

- Alles **prozedural über WebAudio** (keine Fremd-Musik): einfacher Chiptune-/Synth-Sequencer mit 3–4 Stücken
  (Menü, Teambuilder, Kampf, Sieg/Niederlage).
- SFX: Treffer (normal/sehr effektiv/nicht sehr effektiv), Volltreffer, K.O., Menü-Klick, Statuswert hoch/runter, Wechsel, Wetter.
- Audio startet erst nach erster Nutzer-Interaktion (iPad-Vorgabe).

---

## 9. Phasen & Meilensteine

Nach jeder Phase: Tests grün, `README.md` aktualisiert, Commit, Deployment auf GitHub Pages, kurze Zusammenfassung an mich mit dem,
was ich auf dem iPad testen soll.

| Phase | Inhalt | Fertig, wenn … |
|---|---|---|
| **0** | Projekt-Setup: Vite, TS strict, Svelte, Three.js, Vitest, ESLint/Prettier, PWA, GitHub Actions + Pages, `CLAUDE.md` mit Konventionen, `DECISIONS.md` | Leere App ist auf GitHub Pages erreichbar und auf dem iPad installierbar |
| **1** | Engine-Kern: Datenmodelle, RNG, Werteformel, Schadensformel, Typentabelle, Zugreihenfolge, Doppelkampf-Ablauf, Ziele, K.O.-Ersatz, ~15 Monster, ~40 Attacken | Headless-Kampf KI-vs-KI läuft durch, Formel-Tests grün |
| **2** | Alle Mechaniken aus 3.5/3.6: Status, Schutz, Wetter, Felder, Feldeffekte, Hook-System, Fähigkeiten, Items | 1000-Kampf-Simulation ohne Fehler, Tests für jede Mechanik |
| **3** | Prozedurale Sprites + Sprite-Galerie, alle 60 Monster designen und Inhalte auf vollen Umfang bringen | Galerie zeigt 60 unterscheidbare, gut aussehende Monster |
| **4** | Kampf-Bildschirm mit einfacher 2D-Darstellung (noch ohne HD-2D), komplette Kampf-UI, Kampflog, Team-Vorschau | Ich kann auf dem iPad einen ganzen Kampf gegen die KI spielen |
| **5** | Teambuilder komplett inkl. Validierung, Import/Export, Analyse, Zufallsteams; Hauptmenü, Einstellungen, Speichern | Team bauen → speichern → damit kämpfen funktioniert |
| **6** | HD-2D-Kampfszene: Arenen, Licht, Postprocessing, Partikel-Presets, Kamerafahrten, Wetter-Visuals | Kampf sieht aus wie HD-2D, 60 FPS auf iPad |
| **7** | KI-Stufen, Replays, Schadensrechner, Kompendium, Audio, Titelbildschirm, Feinschliff, Balancing mit Simulator-Statistik | Alle Menüpunkte funktionieren |
| **8** | (Optional) Online: Node.js + WebSocket-Server, serverseitig autoritative Engine (gleicher Code!), Räume per Code, Rangliste | Zwei Geräte können gegeneinander kämpfen |

---

## 10. Arbeitsweise & Qualität

- Lege zuerst `CLAUDE.md` an (Konventionen, Befehle, Ordnerstruktur, Kurzfassung dieser SPEC) und halte sie aktuell.
- Kleine, logische Commits mit aussagekräftigen Nachrichten.
- Keine `any`-Typen in der Engine. Engine-Funktionen ohne Seiteneffekte, wo möglich.
- Texte für die UI nie hart im Code, sondern in i18n-Dateien.
- Vor jedem Phasenende selbst prüfen: Build läuft, Tests grün, keine Konsolenfehler, Layout in 1024×768 und 1920×1080 kontrolliert.
- Wenn etwas aus der SPEC technisch schlecht umsetzbar ist: bessere Lösung wählen, in `DECISIONS.md` begründen.
- Wenn du Inhalte erfindest (Namen, Typen, Monster): halte eine konsistente Welt und Namenslogik ein und lege eine `LORE.md` an.
