import { describe, expect, it } from 'vitest';
import { STANDARD_DEX } from '../../src/data/index.ts';
import type { MonsterSet } from '../../src/engine/model.ts';
import { validateTeam } from '../../src/teams/validate.ts';

const format = STANDARD_DEX.format('doubles-standard');
const base = (species: string, item?: string): MonsterSet => {
  const data = STANDARD_DEX.species(species);
  return {
    species,
    ability: data.abilities[0] ?? '',
    moves: data.learnset.slice(0, 4),
    nature: 'ausgeglichen',
    evs: { hp: 252, atk: 252, spe: 4 },
    ivs: {},
    ...(item ? { item } : {}),
  };
};
const legalTeam = (): MonsterSet[] =>
  ['pyrrax', 'gischtel', 'moosbock', 'voltrabe'].map((s, i) =>
    base(s, ['lebenskristall', 'moosherz', 'ankerband', 'rotbeere'][i]),
  );
const codes = (team: MonsterSet[]) => validateTeam(STANDARD_DEX, format, team).map((p) => p.code);

describe('Team-Validierung', () => {
  it('akzeptiert ein legales Team', () => {
    expect(codes(legalTeam())).toEqual([]);
  });

  it('erkennt Teamgröße', () => {
    expect(codes(legalTeam().slice(0, 3))).toContain('teamTooSmall');
    const big = [...legalTeam(), base('frostkauz'), base('bruxor'), base('grabbler')];
    expect(codes(big)).toContain('teamTooLarge');
  });

  it('erkennt illegale Attacken, Fähigkeiten und doppelte Attacken', () => {
    const team = legalTeam();
    team[0] = { ...base('pyrrax'), moves: ['wasserpeitsche', 'glutstoss', 'glutstoss'] };
    team[1] = { ...base('gischtel'), ability: 'drohkulisse' };
    expect(codes(team)).toEqual(
      expect.arrayContaining(['illegalMove', 'duplicateMove', 'illegalAbility']),
    );
  });

  it('prüft EV- und IV-Grenzen', () => {
    const team = legalTeam();
    team[0] = { ...base('pyrrax'), evs: { atk: 253 } };
    team[1] = { ...base('gischtel'), evs: { hp: 252, atk: 252, def: 252 } };
    team[2] = { ...base('moosbock'), ivs: { spe: 32 } };
    expect(codes(team)).toEqual(
      expect.arrayContaining(['evOutOfRange', 'evTotalTooHigh', 'ivOutOfRange']),
    );
  });

  it('Spezies- und Item-Klausel', () => {
    const team = legalTeam();
    team[1] = base('pyrrax', 'lebenskristall');
    expect(codes(team)).toEqual(expect.arrayContaining(['speciesClause', 'itemClause']));
    expect(validateTeam(STANDARD_DEX, STANDARD_DEX.format('doubles-free'), team)).toEqual([]);
  });

  it('meldet unbekannte Einträge mit Monster-Position', () => {
    const team = legalTeam();
    team[2] = { ...base('moosbock'), item: 'gibtsnicht' };
    const problems = validateTeam(STANDARD_DEX, format, team);
    expect(problems).toEqual([{ code: 'unknownItem', slot: 2, params: { item: 'gibtsnicht' } }]);
  });
});
