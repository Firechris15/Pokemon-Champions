# LORE – Die Welt von ARENA

Alle Namen, Wesen und Texte sind eigene Erfindungen. Diese Datei hält Welt und Namenslogik konsistent.
Neue Inhalte (Monster, Attacken, Orte) sollen sich hier einfügen.

## Die Welt: Valmaren

Valmaren ist ein Archipel aus Vulkaninseln, Gletscherhochländern, Mooren und Kristallgebirgen.
Überall stehen uralte **Arenen** – Ringe aus Stein, älter als jede Chronik. Niemand weiß, wer sie gebaut hat,
aber Monster und Menschen kommen seit jeher dorthin, um sich im **Arena-Doppel** zu messen:
zwei gegen zwei, Seite an Seite mit einem Partner. Gekämpft wird nicht bis zum Tod, sondern bis zur
Erschöpfung – ein besiegtes Monster ist nur „außer Gefecht“.

Wichtige Regionen (tauchen in Kompendium-Texten und Arenen auf):

| Region            | Charakter                                         |
| ----------------- | ------------------------------------------------- |
| Kaldera           | Vulkanschlote, Ascheebenen, glühende Höhlen       |
| Perlküste         | Brandung, Riffe, Klippen                          |
| Gletscherhochland | Eisfelder mit den alten Gletscherbibliotheken     |
| Gipfelklöster     | Sturmumtoste Bergklöster, Heimat der Kampfkünste  |
| Schattenmoore     | Nebel, Sümpfe, Dämmerlicht                        |
| Schmiedeberge     | Erzadern, Minen, Schmieden                        |
| Kristallhöhlen    | Leuchtende Drusen tief unter dem Gebirge          |
| Sternenwälder     | Uralte Wälder, in denen nachts Sternenstaub fällt |

## Monster und Essenzen

Gelehrte nennen Monster **Essenzträger**: Jedes trägt eine oder zwei **Essenzen** in sich (im Spiel „Typ“).
Essenzen bestimmen, welche Attacken besonders kraftvoll sind (Gleicher-Typ-Bonus) und wie gut ein Monster
Angriffe übersteht.

| ID        | Name     | Farbe     | Wesen der Essenz                       |
| --------- | -------- | --------- | -------------------------------------- |
| `wild`    | Wild     | `#b8a57a` | Rohe Tierkraft und Instinkt            |
| `ember`   | Glut     | `#e8643a` | Feuer, Hitze, Asche                    |
| `tide`    | Flut     | `#3a8ee8` | Wasser, Meer, Gezeiten                 |
| `flora`   | Flora    | `#4fb04a` | Pflanzen, Wachstum, Sporen             |
| `spark`   | Funke    | `#f2c230` | Blitz und Elektrizität                 |
| `frost`   | Frost    | `#7fd8f0` | Eis, Kälte, Schnee                     |
| `brawl`   | Faust    | `#c4473a` | Kampfkunst und Disziplin               |
| `venom`   | Gift     | `#9b4fc4` | Gifte, Säuren, Fäulnis                 |
| `earth`   | Erde     | `#c9934a` | Boden, Sand, Lehm                      |
| `gale`    | Wind     | `#8fb3e8` | Luft, Sturm, Flug                      |
| `psi`     | Psi      | `#e85a9b` | Geisteskraft, Telekinese               |
| `swarm`   | Schwarm  | `#a3b83a` | Insekten und Kollektive                |
| `crystal` | Kristall | `#5fc9b8` | Gestein, Edelsteine, gebrochenes Licht |
| `haunt`   | Spuk     | `#6a5aa8` | Geister, Erscheinungen, Seelenlicht    |
| `wyrm`    | Wyrm     | `#5a4fe0` | Uralte Drachenmacht                    |
| `shadow`  | Schatten | `#4a3f4f` | Dunkelheit, List, Hinterhalt           |
| `metal`   | Metall   | `#9aa8b8` | Erz, Stahl, Panzerung                  |
| `astral`  | Astral   | `#f0a8e0` | Sternenlicht und Magie                 |

### Gedanken hinter der Wirkungstabelle

Die Tabelle (`src/data/typechart.ts`) folgt einer erzählerischen Logik:

- **Elemente im Kreis:** Glut verbrennt Flora, Flora trinkt Flut, Flut löscht Glut. Erde erdet Funke,
  Funke durchschlägt Flut und Wind, Erde-Attacken erreichen fliegende Wind-Wesen nicht (immun).
- **Eigene Akzente:** Funke ist stark gegen Metall (Leitfähigkeit), Kristall isoliert vollständig gegen Funke
  und bannt Spuk (Kristalle binden Geister). Gift wirkt stark gegen Wild (Tiere sind anfällig), Wind verweht
  Gift. Psi zähmt den Wyrm. Wild schlägt Psi (Instinkt schlägt Grübeln) und frisst Schwärme.
- **Licht und Dunkel:** Astral vertreibt Spuk und Schatten; Schatten verschlingt Astral und Psi.
  Spuk und Wild können einander nicht berühren.
- **Balance:** Jede Essenz hat mindestens eine Stärke, eine Schwäche und eine Resistenz; keine Essenz hat
  mehr als fünf Schwächen. Das prüft ein Test (`tests/engine/typechart.test.ts`).

## Statuswerte

| Wert         | Kürzel | Bedeutung                       |
| ------------ | ------ | ------------------------------- |
| LP           | LP     | Lebenspunkte                    |
| Angriff      | ANG    | Stärke physischer Attacken      |
| Verteidigung | VER    | Schutz gegen physische Attacken |
| Fokus        | FOK    | Stärke spezieller Attacken      |
| Wille        | WIL    | Schutz gegen spezielle Attacken |
| Initiative   | INI    | Wer zuerst handelt              |

## Wesen

Jedes Monster hat ein **Wesen**, das einen Wert um 10 % hebt und einen anderen um 10 % senkt.
Fünf Wesen sind ausgeglichen (Ausgeglichen, Gelassen, Verträumt, Stoisch, Launisch).

| + \ −    | Angriff     | Verteidigung | Fokus     | Wille      | Initiative |
| -------- | ----------- | ------------ | --------- | ---------- | ---------- |
| Angriff  | –           | Ungestüm     | Verbissen | Grimmig    | Wuchtig    |
| Verteid. | Besonnen    | –            | Standhaft | Stur       | Träge      |
| Fokus    | Grüblerisch | Waghalsig    | –         | Feurig     | Bedacht    |
| Wille    | Gütig       | Feinfühlig   | Fromm     | –          | Würdevoll  |
| Initiat. | Flink       | Rastlos      | Verspielt | Ungeduldig | –          |

## Namenslogik

- **Monster:** deutsche Wortbilder, die man laut aussprechen kann.
  - _Uralte oder mächtige Wesen_ enden auf **-ax / -ox / -ix**: Pyrrax, Geodax, Ferrox, Umbrax, Kolonix, Laternix.
  - _Gewöhnliche Wildtiere_ heißen nach Lebensraum + Tier: Moosbock, Frostkauz, Nesselnatter, Voltrabe,
    Astrahirsch, Böenreiter, Grabbler.
  - _Verspielte oder kleine Wesen_ tragen Verkleinerungsendungen (-el, -ling): Gischtel.
  - _Mystische Wesen_ nutzen lateinisch klingende Wurzeln: Psylumen.
- **Attacken:** beschreibende Komposita aus Element + Handlung (Glutstoß, Rankenpeitsche, Splitterhagel).
- **Fähigkeiten:** Eigenschaftswörter oder Haltungen (Drohkulisse, Dickhaut, Scharfsinn, Kettenläufer).
- **Items:** Material + Gegenstand (Lebenskristall, Moosherz, Ankerband, Rotbeere).
- Keine Namen, die bekannten Spielen entlehnt sind. Im Zweifel einen neuen Namen wählen.

## Monster (Stand Phase 1)

| Monster      | Essenzen           | Heimat            | Rolle                           |
| ------------ | ------------------ | ----------------- | ------------------------------- |
| Pyrrax       | Glut / Wyrm        | Kaldera           | Schneller Spezialangreifer      |
| Gischtel     | Flut               | Perlküste         | Physischer Angreifer, Priorität |
| Moosbock     | Flora / Erde       | Sternenwälder     | Tank, Unterstützer              |
| Voltrabe     | Funke / Wind       | Gipfelklöster     | Schneller Spezialangreifer      |
| Frostkauz    | Frost / Psi        | Gletscherhochland | Spezialangreifer                |
| Bruxor       | Faust / Metall     | Perlküste         | Physischer Angreifer, Tank      |
| Nesselnatter | Gift / Schatten    | Schattenmoore     | Mischangreifer                  |
| Grabbler     | Erde               | Schmiedeberge     | Physischer Angreifer            |
| Böenreiter   | Wind / Faust       | Gipfelklöster     | Schneller physischer Angreifer  |
| Psylumen     | Psi / Astral       | Sternenwälder     | Spezialangreifer, Unterstützer  |
| Kolonix      | Schwarm / Kristall | Kristallhöhlen    | Tank                            |
| Geodax       | Kristall / Erde    | Kristallhöhlen    | Langsamer Tank                  |
| Laternix     | Spuk / Glut        | Schattenmoore     | Spezialangreifer                |
| Ferrox       | Metall / Wild      | Schmiedeberge     | Langsamer Tank                  |
| Astrahirsch  | Astral / Flora     | Sternenwälder     | Unterstützer                    |
| Umbrax       | Schatten / Wyrm    | Schattenmoore     | Mischangreifer                  |
