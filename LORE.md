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
- **Items:** Material + Gegenstand (Lebenskristall, Moosherz, Ankerband, Rotbeere). Beeren heißen nach dem,
  wovor sie schützen oder was sie tun (Kühlbeere gegen Glut, Erdungsbeere gegen Funke, Klarbeere klärt).
- **Zustände:** sprechende Hauptwörter, die den Körper- oder Geisteszustand beschreiben (Brandmal, Starre,
  Schlummer, Wirrsinn). Wetter sind Naturerscheinungen (Gleißsonne, Sturmregen), Felder heißen nach der
  Energie, die den Boden durchzieht (Funkenfeld, Blütenfeld).
- Keine Namen, die bekannten Spielen entlehnt sind. Im Zweifel einen neuen Namen wählen.

## Monster (Stand Phase 2)

| Monster      | Essenzen           | Heimat            | Rolle                           | Fähigkeiten                                 |
| ------------ | ------------------ | ----------------- | ------------------------------- | ------------------------------------------- |
| Pyrrax       | Glut / Wyrm        | Kaldera           | Schneller Spezialangreifer      | Glutherz, Sonnenkind, Lichtsprinter         |
| Gischtel     | Flut               | Perlküste         | Physischer Angreifer, Priorität | Regenbringer, Wellenreiter, Wasserschlucker |
| Moosbock     | Flora / Erde       | Sternenwälder     | Tank, Unterstützer              | Wildwuchs, Drohkulisse, Blütenaura          |
| Voltrabe     | Funke / Wind       | Gipfelklöster     | Schneller Spezialangreifer      | Blitzfänger, Funkenaura, Statikfell         |
| Frostkauz    | Frost / Psi        | Gletscherhochland | Spezialangreifer                | Frostatem, Schneeläufer, Wachsam            |
| Bruxor       | Faust / Metall     | Perlküste         | Physischer Angreifer, Tank      | Schlagkraft, Rückstoßfrei, Eisern           |
| Nesselnatter | Gift / Schatten    | Schattenmoore     | Mischangreifer                  | Giftdorn, Beerenbann, Siegesrausch          |
| Grabbler     | Erde               | Schmiedeberge     | Physischer Angreifer            | Sandläufer, Reißzahn, Rauhaut               |
| Böenreiter   | Wind / Faust       | Gipfelklöster     | Schneller physischer Angreifer  | Scharfsinn, Trotzreaktion, Wucht            |
| Psylumen     | Psi / Astral       | Sternenwälder     | Spezialangreifer, Unterstützer  | Psiaura, Schwebend, Schutzgeist             |
| Kolonix      | Schwarm / Kristall | Kristallhöhlen    | Tank                            | Kettenläufer, Staubwirbler, Häutung         |
| Geodax       | Kristall / Erde    | Kristallhöhlen    | Langsamer Tank                  | Unbeugsam, Rückstoßfrei, Kettenläufer       |
| Laternix     | Spuk / Glut        | Schattenmoore     | Spezialangreifer                | Feuerfänger, Glutpanzer, Schwebend          |
| Ferrox       | Metall / Wild      | Schmiedeberge     | Langsamer Tank                  | Trotzkraft, Dickhaut, Schalldämpfer         |
| Astrahirsch  | Astral / Flora     | Sternenwälder     | Unterstützer                    | Sternenaura, Saftfresser, Wildwuchs         |
| Umbrax       | Schatten / Wyrm    | Schattenmoore     | Mischangreifer                  | Hoheit, Urkraft, Pulsar                     |

## Zustände, Wetter und Felder

### Statusprobleme

Ein Monster trägt höchstens ein Statusproblem; es bleibt auch nach dem Auswechseln.

| Name      | Wirkung                                                         | Immun        |
| --------- | --------------------------------------------------------------- | ------------ |
| Brandmal  | Verliert 1/16 LP pro Runde, physischer Schaden halbiert         | Glut         |
| Starre    | Initiative halbiert, mit 25 % keine Handlung                    | Funke        |
| Toxin     | Verliert 1/8 LP pro Runde                                       | Gift, Metall |
| Fäulnis   | Verliert 1/16, 2/16, 3/16 … LP; setzt sich beim Wechseln zurück | Gift, Metall |
| Schlummer | 1–3 Runden keine Handlung                                       | –            |
| Frostbann | Keine Handlung; taut mit 20 % pro Runde oder durch Glut-Treffer | Frost        |

**Flüchtige Zustände** enden beim Auswechseln: Wirrsinn (Verwirrung), Schreck (Zurückschrecken), Spott,
Echozwang, Trugbild, Schärfeblick, Aufladen, Umklammerung, Seelenfluch, Schattenbann (Wechselsperre),
Lockruf, Beistand, Gluthunger, Fixierung.

### Wetter (5 Runden, mit passendem Stein 8)

Die alten Völker Valmarens glauben, dass starke Essenzträger das Wetter rufen können – Wetterstein-Amulette
aus der Kaldera und von der Perlküste sollen es länger halten.

| Wetter      | Wirkung                                                                     | Stein      |
| ----------- | --------------------------------------------------------------------------- | ---------- |
| Gleißsonne  | Glut ×1,5, Flut ×0,5                                                        | Glutstein  |
| Sturmregen  | Flut ×1,5, Glut ×0,5                                                        | Regenstein |
| Staubsturm  | 1/16 Schaden pro Runde (außer Erde, Kristall, Metall); Kristall: Wille ×1,5 | Staubstein |
| Eisgestöber | 1/16 Schaden pro Runde (außer Frost); Frost: Verteidigung ×1,5              | Froststein |

### Felder (5 Runden, mit Feldkristall 8)

Felder wirken auf Monster am Boden (nicht Wind-Essenz, nicht schwebend) und verstärken eine Essenz um ×1,3.

| Feld        | Essenz | Nebeneffekt                                 |
| ----------- | ------ | ------------------------------------------- |
| Funkenfeld  | Funke  | Niemand schläft ein                         |
| Blütenfeld  | Flora  | Heilt 1/16 LP pro Runde                     |
| Sternenfeld | Astral | Keine neuen Statusprobleme                  |
| Psifeld     | Psi    | Schutz vor gegnerischen Prioritäts-Attacken |

### Seiteneffekte und Feldeffekte

- **Aufwind** (4 Runden): Initiative der eigenen Seite ×2.
- **Prallschild / Ätherschild / Polarschleier** (5 Runden): weniger physischer / spezieller / beider Schaden.
- **Bastion / Vorsichtswall** (1 Runde): schützen die Seite vor Flächen- bzw. Prioritäts-Attacken.
- **Splitterfalle**: Einwechselnde verlieren 1/8 LP, je nach Kristall-Wirkung mehr oder weniger.
- **Dornensaat** (bis 3 Lagen): Einwechselnde am Boden verlieren 1/8, 1/6 bzw. 1/4 LP.
- **Raumverzerrung** (5 Runden): Langsame handeln innerhalb einer Prioritätsstufe zuerst.
