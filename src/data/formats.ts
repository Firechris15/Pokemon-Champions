import type { FormatData } from '../engine/dex.ts';

/** Formate sind Daten: neue Regelwerke brauchen keine Code-Änderung. */
export const FORMATS: readonly FormatData[] = [
  {
    id: 'doubles-standard',
    name: 'Doppel Standard',
    description:
      '6 mitbringen, 4 wählen, Level 50. Jedes Monster und jedes Item nur einmal, keine Legenden.',
    gameType: 'doubles',
    activePerSide: 2,
    minTeamSize: 4,
    maxTeamSize: 6,
    pickCount: 4,
    level: 50,
    teamPreview: true,
    rules: { speciesClause: true, itemClause: true, noLegendary: true },
  },
  {
    id: 'doubles-free',
    name: 'Doppel Frei',
    description: '6 mitbringen, 4 wählen, Level 50. Alles erlaubt.',
    gameType: 'doubles',
    activePerSide: 2,
    minTeamSize: 1,
    maxTeamSize: 6,
    pickCount: 4,
    level: 50,
    teamPreview: true,
    rules: { speciesClause: false, itemClause: false, noLegendary: false },
  },
  {
    id: 'singles-standard',
    name: 'Einzel Standard',
    description:
      '1 gegen 1 auf dem Feld, 6 gegen 6, Level 50. Jedes Monster nur einmal, keine Legenden.',
    gameType: 'singles',
    activePerSide: 1,
    minTeamSize: 1,
    maxTeamSize: 6,
    pickCount: 6,
    level: 50,
    teamPreview: true,
    rules: { speciesClause: true, itemClause: false, noLegendary: true },
  },
  {
    id: 'random-doubles',
    name: 'Zufallskampf Doppel',
    description:
      'Beide Seiten bekommen automatisch generierte, sinnvolle Teams. 6 mitbringen, 4 wählen.',
    gameType: 'doubles',
    activePerSide: 2,
    minTeamSize: 6,
    maxTeamSize: 6,
    pickCount: 4,
    level: 50,
    teamPreview: true,
    rules: { speciesClause: true, itemClause: true, noLegendary: true },
    randomTeams: true,
  },
];
