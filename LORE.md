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
| Sonnenwüste       | Dünenmeer mit versunkenen Ruinen alter Arenen     |

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

## Monster (Stand Phase 3: 60)

Die Kompendium-Nummer folgt der Reihenfolge in `src/data/species.ts`. ★ = Legende (nur im freien Format).
Kompendium-Texte stehen in den Datenzeilen (`lore`).

| Nr.  | Monster       | Essenzen           | Heimat            | Rolle                                            | Fähigkeiten                                 |
| ---- | ------------- | ------------------ | ----------------- | ------------------------------------------------ | ------------------------------------------- |
| #001 | Pyrrax        | Glut / Wyrm        | Kaldera           | spez. Angreifer, Wetter                          | Glutherz, Sonnenkind, Lichtsprinter         |
| #002 | Gischtel      | Flut               | Perlküste         | phys. Angreifer, Priorität                       | Regenbringer, Wellenreiter, Wasserschlucker |
| #003 | Moosbock      | Flora / Erde       | Sternenwälder     | Tank, Unterstützer                               | Wildwuchs, Drohkulisse, Blütenaura          |
| #004 | Voltrabe      | Funke / Wind       | Gipfelklöster     | spez. Angreifer, Initiative-Kontrolle            | Blitzfänger, Funkenaura, Statikfell         |
| #005 | Frostkauz     | Frost / Psi        | Gletscherhochland | spez. Angreifer                                  | Frostatem, Schneeläufer, Wachsam            |
| #006 | Bruxor        | Faust / Metall     | Perlküste         | phys. Angreifer, Priorität, Tank                 | Schlagkraft, Rückstoßfrei, Eisern           |
| #007 | Nesselnatter  | Gift / Schatten    | Schattenmoore     | Mischangreifer, Unterstützer                     | Giftdorn, Beerenbann, Siegesrausch          |
| #008 | Grabbler      | Erde               | Schmiedeberge     | phys. Angreifer                                  | Sandläufer, Reißzahn, Rauhaut               |
| #009 | Böenreiter    | Wind / Faust       | Gipfelklöster     | phys. Angreifer, Priorität                       | Scharfsinn, Trotzreaktion, Wucht            |
| #010 | Psylumen      | Psi / Astral       | Sternenwälder     | spez. Angreifer, Unterstützer                    | Psiaura, Schwebend, Schutzgeist             |
| #011 | Kolonix       | Schwarm / Kristall | Kristallhöhlen    | Tank, phys. Angreifer                            | Kettenläufer, Staubwirbler, Häutung         |
| #012 | Geodax        | Kristall / Erde    | Kristallhöhlen    | Tank, phys. Angreifer                            | Unbeugsam, Rückstoßfrei, Kettenläufer       |
| #013 | Laternix      | Spuk / Glut        | Schattenmoore     | spez. Angreifer                                  | Feuerfänger, Glutpanzer, Schwebend          |
| #014 | Ferrox        | Metall / Wild      | Schmiedeberge     | Tank, Raumverzerrung, Unterstützer               | Trotzkraft, Dickhaut, Schalldämpfer         |
| #015 | Astrahirsch   | Astral / Flora     | Sternenwälder     | Unterstützer, Mischangreifer                     | Sternenaura, Saftfresser, Wildwuchs         |
| #016 | Umbrax        | Schatten / Wyrm    | Schattenmoore     | Mischangreifer, phys. Angreifer                  | Hoheit, Urkraft, Pulsar                     |
| #017 | Aschwolf      | Glut / Schatten    | Kaldera           | phys. Angreifer, Priorität                       | Reißzahn, Drohkulisse, Siegesrausch         |
| #018 | Schmelzkröte  | Glut / Erde        | Kaldera           | Wetter, Raumverzerrung, Tank                     | Sonnenkind, Dickhaut, Glutpanzer            |
| #019 | Funkenfalter  | Glut / Schwarm     | Kaldera           | spez. Angreifer, Wetter, Verstärker              | Sonnenkind, Feuerfänger, Häutung            |
| #020 | Solarix ★     | Glut / Astral      | Kaldera           | spez. Angreifer, Wetter                          | Sonnenkind, Urkraft                         |
| #021 | Riffhai       | Flut / Schatten    | Perlküste         | phys. Angreifer                                  | Reißzahn, Wellenreiter, Siegesrausch        |
| #022 | Perlenhüter   | Flut / Kristall    | Perlküste         | Tank, Unterstützer, Raumverzerrung               | Dickhaut, Unbeugsam, Wasserschlucker        |
| #023 | Abyssax       | Flut / Wyrm        | Perlküste         | Mischangreifer, Wetter                           | Tiefenzorn, Urkraft, Regenbringer           |
| #024 | Nebelqualle   | Flut / Spuk        | Schattenmoore     | Unterstützer                                     | Wasserschlucker, Schwebend, Häutung         |
| #025 | Teichling     | Flut / Flora       | Sternenwälder     | Wetter, Unterstützer, spez. Angreifer            | Regenbringer, Wellenreiter, Saftfresser     |
| #026 | Dornfaust     | Flora / Faust      | Gipfelklöster     | phys. Angreifer, Tank                            | Rauhaut, Schlagkraft, Wildwuchs             |
| #027 | Pilzling      | Flora / Gift       | Schattenmoore     | Unterstützer, Umlenker                           | Häutung, Giftdorn, Beerenbann               |
| #028 | Schlingwurz   | Flora / Spuk       | Schattenmoore     | Mischangreifer, Unterstützer                     | Wildwuchs, Saftfresser, Häutung             |
| #029 | Blütenschwirr | Flora / Wind       | Sternenwälder     | spez. Angreifer, Initiative-Kontrolle            | Blütenaura, Saftfresser, Lichtsprinter      |
| #030 | Dünenwurm     | Erde / Wyrm        | Sonnenwüste       | phys. Angreifer, Wetter                          | Staubwirbler, Sandläufer, Reißzahn          |
| #031 | Tonhüter      | Erde / Psi         | Sonnenwüste       | Raumverzerrung, Tank, Mischangreifer             | Psiaura, Unbeugsam, Dickhaut                |
| #032 | Blitzmarder   | Funke / Wild       | Gipfelklöster     | phys. Angreifer, Priorität                       | Statikfell, Blitzfänger, Wucht              |
| #033 | Voltaal       | Funke / Flut       | Perlküste         | spez. Angreifer                                  | Blitzfänger, Wasserschlucker, Statikfell    |
| #034 | Spulwerk      | Funke / Metall     | Schmiedeberge     | Unterstützer, Tank                               | Funkenaura, Eisern, Rückstoßfrei            |
| #035 | Fulgurax ★    | Funke / Wyrm       | Gipfelklöster     | Mischangreifer                                   | Funkenaura, Urkraft                         |
| #036 | Quarzigel     | Kristall / Funke   | Kristallhöhlen    | Unterstützer, Initiative-Kontrolle               | Rauhaut, Statikfell, Unbeugsam              |
| #037 | Firnmammut    | Frost / Erde       | Gletscherhochland | Wetter, phys. Angreifer, Tank                    | Frostatem, Dickhaut, Schneeläufer           |
| #038 | Firnhase      | Frost / Wild       | Gletscherhochland | phys. Angreifer, Priorität                       | Schneeläufer, Wucht, Wachsam                |
| #039 | Raureifel     | Frost / Astral     | Gletscherhochland | Unterstützer                                     | Frostatem, Schutzgeist, Wachsam             |
| #040 | Packeiswal    | Frost / Flut       | Gletscherhochland | Tank, Mischangreifer                             | Frostatem, Dickhaut, Wasserschlucker        |
| #041 | Firnseele     | Frost / Spuk       | Gletscherhochland | spez. Angreifer                                  | Schwebend, Schneeläufer, Wachsam            |
| #042 | Mantira       | Psi / Schwarm      | Gipfelklöster     | phys. Angreifer, Mischangreifer                  | Scharfsinn, Hoheit, Trotzreaktion           |
| #043 | Klosteraffe   | Psi / Faust        | Gipfelklöster     | Unterstützer, Mischangreifer                     | Schutzgeist, Psiaura, Schlagkraft           |
| #044 | Speculix      | Psi / Metall       | Sonnenwüste       | Raumverzerrung, Unterstützer                     | Eisern, Unbeugsam, Schwebend                |
| #045 | Steppenboxer  | Faust / Wild       | Sternenwälder     | phys. Angreifer, Priorität                       | Schlagkraft, Trotzreaktion, Wucht           |
| #046 | Nachtkralle   | Schatten / Faust   | Schattenmoore     | phys. Angreifer, Priorität                       | Scharfsinn, Wucht, Siegesrausch             |
| #047 | Klingenfalke  | Metall / Wind      | Schmiedeberge     | phys. Angreifer, Initiative-Kontrolle, Priorität | Scharfsinn, Eisern, Unbeugsam               |
| #048 | Rüstgeist     | Metall / Spuk      | Schmiedeberge     | Tank, Raumverzerrung, phys. Angreifer            | Eisern, Rauhaut, Trotzkraft                 |
| #049 | Schmiedekäfer | Metall / Schwarm   | Schmiedeberge     | phys. Angreifer, Tank                            | Kettenläufer, Trotzkraft, Eisern            |
| #050 | Moormolch     | Gift / Flut        | Schattenmoore     | Mischangreifer, Unterstützer                     | Giftdorn, Wellenreiter, Häutung             |
| #051 | Stachelwespe  | Gift / Schwarm     | Schattenmoore     | phys. Angreifer                                  | Scharfsinn, Giftdorn, Siegesrausch          |
| #052 | Dünenskorpion | Gift / Erde        | Sonnenwüste       | phys. Angreifer, Tank                            | Giftdorn, Sandläufer, Rauhaut               |
| #053 | Moorflatterer | Schatten / Wind    | Schattenmoore     | Unterstützer, Initiative-Kontrolle               | Schalldämpfer, Beerenbann, Wachsam          |
| #054 | Mondfuchs     | Astral / Wild      | Sternenwälder     | Unterstützer, Umlenker, spez. Angreifer          | Sternenaura, Schutzgeist, Wachsam           |
| #055 | Astrolabix    | Astral / Metall    | Sonnenwüste       | Unterstützer, Tank, Raumverzerrung               | Sternenaura, Eisern, Unbeugsam              |
| #056 | Hügelbauer    | Schwarm / Erde     | Sonnenwüste       | Tank, Raumverzerrung, Wetter                     | Staubwirbler, Kettenläufer, Dickhaut        |
| #057 | Terrax ★      | Flora / Kristall   | Kristallhöhlen    | Tank, Unterstützer                               | Blütenaura, Dickhaut                        |
| #058 | Granitringer  | Kristall / Faust   | Kristallhöhlen    | phys. Angreifer, Tank                            | Trotzkraft, Schlagkraft, Unbeugsam          |
| #059 | Gruftkatze    | Spuk / Wild        | Schattenmoore     | phys. Angreifer, Unterstützer                    | Scharfsinn, Wachsam, Beerenbann             |
| #060 | Wolkenschaf   | Wind / Astral      | Gipfelklöster     | Unterstützer, Wetter                             | Regenbringer, Schutzgeist, Wachsam          |

### Legenden

Drei Wesen gelten als älter als die Arenen selbst:

- **Solarix** (Glut / Astral) – der Sonnenvogel, der die erste Sonne über Valmaren entzündet haben soll.
  Alle hundert Jahre verbrennt er und steigt aus der Asche neu empor.
- **Fulgurax** (Funke / Wyrm) – der Blitzwyrm; sein Brüllen ist der Donner über den Gipfelklöstern.
- **Terrax** (Flora / Kristall) – eine Schildkröte, auf deren Panzer ein Kristallberg mit einem uralten
  Wald steht. Wenn sie erwacht, wandern Gebirge.

### Aussehen und Stil

Jede Essenz hat eine erkennbare Bildsprache: Glut-Monster tragen warme Rot- und Orangetöne und glühende
Teile, Flut-Monster Blau mit Schaumkronen, Spuk-Monster halbtransparente Schleier, Kristall-Monster
facettierte, glänzende Flächen, Astral-Monster Sterne und Mondsicheln. Die Sprites entstehen per Code
(`src/sprites/monsters/`), jedes Monster hat eine eigene, als Schattenriss erkennbare Silhouette.

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
