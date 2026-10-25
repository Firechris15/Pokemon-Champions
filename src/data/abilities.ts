import type { AbilityData } from '../engine/dex.ts';
import type { BattleContext, EffectHooks } from '../engine/effects.ts';
import type { MonRef, StatusId, TypeId } from '../engine/model.ts';
import type { Mon } from '../engine/state.ts';

/** Fähigkeiten (SPEC 3.6). Hooks siehe `src/engine/effects.ts`, Namenslogik siehe LORE.md. */

const ref = (mon: Mon): MonRef => ({ side: mon.side, index: mon.index });

/** Notlage-Verstärker: Attacken einer Essenz ×1,5, solange die LP bei höchstens 1/3 liegen. */
function pinchBoost(id: string, name: string, type: TypeId, typeName: string): AbilityData {
  return {
    id,
    name,
    description: `Bei höchstens 1/3 der LP sind ${typeName}-Attacken 1,5-mal so stark.`,
    onModifyAttackStat(_ctx, holder, _target, move) {
      return move.type === type && holder.hp * 3 <= holder.maxHp ? 1.5 : undefined;
    },
  };
}

/** Immunität gegen Schadensattacken einer Essenz. */
function typeImmunity(type: TypeId): NonNullable<EffectHooks['onCheckImmunity']> {
  return (_ctx, _holder, _attacker, move) =>
    move.type === type && move.category !== 'status' ? true : undefined;
}

/** Setzt beim Einwechseln ein Wetter. */
function weatherSetter(
  id: string,
  name: string,
  weather: string,
  weatherName: string,
): AbilityData {
  return {
    id,
    name,
    description: `Beim Einwechseln beginnt ${weatherName}.`,
    onSwitchIn(ctx, holder) {
      if (ctx.weather() === weather) return;
      ctx.showAbility(holder);
      ctx.setWeather(weather, holder);
    },
  };
}

/** Setzt beim Einwechseln ein Feld. */
function terrainSetter(
  id: string,
  name: string,
  terrain: string,
  terrainName: string,
): AbilityData {
  return {
    id,
    name,
    description: `Beim Einwechseln entsteht ein ${terrainName}.`,
    onSwitchIn(ctx, holder) {
      if (ctx.terrain() === terrain) return;
      ctx.showAbility(holder);
      ctx.setTerrain(terrain, holder);
    },
  };
}

/** Verdoppelt die Initiative bei einem Wetter. */
function weatherRunner(
  id: string,
  name: string,
  weather: string,
  description: string,
): AbilityData {
  return {
    id,
    name,
    description,
    onModifySpeed(ctx) {
      return ctx.weather() === weather ? 2 : undefined;
    },
  };
}

/** Verstärkt Attacken mit einer Eigenschaft (Schlag, Biss, Puls). */
function flagBoost(
  id: string,
  name: string,
  flag: 'punch' | 'bite' | 'pulse',
  factor: number,
  description: string,
): AbilityData {
  return {
    id,
    name,
    description,
    onModifyBasePower(_ctx, _holder, _target, move) {
      return move.flags[flag] ? factor : undefined;
    },
  };
}

/** Bei Kontakt mit 30 % Wahrscheinlichkeit ein Statusproblem beim Angreifer. */
function contactStatus(
  id: string,
  name: string,
  status: StatusId,
  statusName: string,
): AbilityData {
  return {
    id,
    name,
    description: `Wer mit Kontakt angreift, bekommt mit 30 % Chance ${statusName}.`,
    onDamagingHitTaken(ctx, holder, attacker, move) {
      if (!move.flags.contact || attacker.hp <= 0 || attacker.status !== null) return;
      if (!ctx.rng.chance(3, 10)) return;
      ctx.showAbility(holder);
      ctx.trySetStatus(attacker, status, holder);
    },
  };
}

/** Prioritäts-Blocker für sich und den Partner. */
function blocksPriority(
  ctx: BattleContext,
  holder: Mon,
  target: Mon,
  attacker: Mon,
  priority: number,
): boolean {
  if (attacker.side === holder.side || priority <= 0) return false;
  ctx.showAbility(holder);
  ctx.log({ type: 'protected', target: ref(target), by: { kind: 'ability', id: 'hoheit' } });
  return true;
}

export const ABILITIES: readonly AbilityData[] = [
  // ── Schadensverstärker ──
  pinchBoost('glutherz', 'Glutherz', 'ember', 'Glut'),
  pinchBoost('tiefenzorn', 'Tiefenzorn', 'tide', 'Flut'),
  pinchBoost('wildwuchs', 'Wildwuchs', 'flora', 'Flora'),
  {
    id: 'wucht',
    name: 'Wucht',
    description: 'Attacken mit Stärke 60 oder weniger sind 1,5-mal so stark.',
    onModifyBasePower(_ctx, _holder, _target, _move, power) {
      return power <= 60 ? 1.5 : undefined;
    },
  },
  flagBoost('schlagkraft', 'Schlagkraft', 'punch', 1.2, 'Schlag-Attacken sind 1,2-mal so stark.'),
  flagBoost('reisszahn', 'Reißzahn', 'bite', 1.5, 'Biss-Attacken sind 1,5-mal so stark.'),
  flagBoost('pulsar', 'Pulsar', 'pulse', 1.5, 'Puls-Attacken sind 1,5-mal so stark.'),
  {
    id: 'urkraft',
    name: 'Urkraft',
    description: 'Der Gleicher-Typ-Bonus beträgt 2 statt 1,5.',
    onModifyStab() {
      return 2;
    },
  },
  {
    id: 'scharfsinn',
    name: 'Scharfsinn',
    description: 'Erkennt Schwachstellen: Volltreffer-Stufe +1.',
    onModifyCritStage(_ctx, _holder, _move, stage) {
      return stage + 1;
    },
  },
  {
    id: 'kettenlaeufer',
    name: 'Kettenläufer',
    description: 'Mehrfachangriffe treffen immer so oft wie möglich.',
    onModifyHitCount(_ctx, _holder, move, hits) {
      return typeof move.multihit === 'object' ? move.multihit[1] : hits;
    },
  },
  {
    id: 'trotzkraft',
    name: 'Trotzkraft',
    description:
      'Mit Statusproblem steigt der Angriff um 50 %; Brandmal halbiert den Schaden nicht.',
    ignoresBurnPenalty: true,
    onModifyAttackStat(_ctx, holder, _target, move) {
      return holder.status !== null && move.category === 'physical' ? 1.5 : undefined;
    },
  },

  // ── Einwechseln: Werte, Wetter, Felder ──
  {
    id: 'drohkulisse',
    name: 'Drohkulisse',
    description: 'Beim Einwechseln sinkt der Angriff aller Gegner um eine Stufe.',
    onSwitchIn(ctx, holder) {
      const foes = ctx.activeFoes(holder);
      if (foes.length === 0) return;
      ctx.showAbility(holder);
      for (const foe of foes) ctx.boost(foe, { atk: -1 }, holder);
    },
  },
  weatherSetter('sonnenkind', 'Sonnenkind', 'gleisssonne', 'die Gleißsonne'),
  weatherSetter('regenbringer', 'Regenbringer', 'sturmregen', 'der Sturmregen'),
  weatherSetter('staubwirbler', 'Staubwirbler', 'staubsturm', 'ein Staubsturm'),
  weatherSetter('frostatem', 'Frostatem', 'eisgestoeber', 'ein Eisgestöber'),
  terrainSetter('funkenaura', 'Funkenaura', 'funkenfeld', 'Funkenfeld'),
  terrainSetter('bluetenaura', 'Blütenaura', 'bluetenfeld', 'Blütenfeld'),
  terrainSetter('sternenaura', 'Sternenaura', 'sternenfeld', 'Sternenfeld'),
  terrainSetter('psiaura', 'Psiaura', 'psifeld', 'Psifeld'),

  // ── Initiative im Wetter ──
  weatherRunner(
    'lichtsprinter',
    'Lichtsprinter',
    'gleisssonne',
    'Doppelte Initiative in der Gleißsonne.',
  ),
  weatherRunner('wellenreiter', 'Wellenreiter', 'sturmregen', 'Doppelte Initiative im Sturmregen.'),
  weatherRunner(
    'sandlaeufer',
    'Sandläufer',
    'staubsturm',
    'Doppelte Initiative im Staubsturm; erleidet keinen Schaden durch ihn.',
  ),
  weatherRunner(
    'schneelaeufer',
    'Schneeläufer',
    'eisgestoeber',
    'Doppelte Initiative im Eisgestöber; erleidet keinen Wetterschaden.',
  ),

  // ── Immunitäten (mit Bonus) ──
  {
    id: 'schwebend',
    name: 'Schwebend',
    description:
      'Schwebt über dem Boden: immun gegen Erde-Attacken; Fallen und Felder wirken nicht.',
    floating: true,
    onCheckImmunity: typeImmunity('earth'),
  },
  {
    id: 'blitzfaenger',
    name: 'Blitzfänger',
    description:
      'Zieht gegnerische Funke-Attacken auf sich, ist immun dagegen und erhöht dabei den eigenen Fokus.',
    onCheckImmunity: typeImmunity('spark'),
    onImmunityTriggered(ctx, holder) {
      ctx.boost(holder, { spa: 1 }, holder);
    },
    onRedirectTarget(_ctx, _holder, _attacker, move) {
      return move.type === 'spark' && move.category !== 'status' ? true : undefined;
    },
  },
  {
    id: 'wasserschlucker',
    name: 'Wasserschlucker',
    description: 'Immun gegen Flut-Attacken und heilt dabei 1/4 der LP.',
    onCheckImmunity: typeImmunity('tide'),
    onImmunityTriggered(ctx, holder) {
      ctx.heal(holder, Math.floor(holder.maxHp / 4), 'effect', {
        kind: 'ability',
        id: 'wasserschlucker',
      });
    },
  },
  {
    id: 'feuerfaenger',
    name: 'Feuerfänger',
    description: 'Immun gegen Glut-Attacken; danach sind eigene Glut-Attacken 1,5-mal so stark.',
    onCheckImmunity: typeImmunity('ember'),
    onImmunityTriggered(ctx, holder) {
      ctx.addVolatile(holder, 'gluthunger', holder);
    },
  },
  {
    id: 'saftfresser',
    name: 'Saftfresser',
    description: 'Immun gegen Flora-Attacken; erhöht dabei den eigenen Angriff.',
    onCheckImmunity: typeImmunity('flora'),
    onImmunityTriggered(ctx, holder) {
      ctx.boost(holder, { atk: 1 }, holder);
    },
  },
  {
    id: 'schalldaempfer',
    name: 'Schalldämpfer',
    description: 'Immun gegen Klang-Attacken.',
    onCheckImmunity(_ctx, _holder, _attacker, move) {
      return move.flags.sound ? true : undefined;
    },
  },

  // ── Schutz ──
  {
    id: 'dickhaut',
    name: 'Dickhaut',
    description: 'Sehr effektive Attacken richten nur 3/4 des Schadens an.',
    onModifyDamageTaken(_ctx, _holder, _attacker, _move, effectiveness) {
      return effectiveness > 1 ? 0.75 : undefined;
    },
  },
  {
    id: 'schutzgeist',
    name: 'Schutzgeist',
    description: 'Der Partner erleidet nur 3/4 des Schadens.',
    onAllyModifyDamageTaken() {
      return 0.75;
    },
  },
  {
    id: 'hoheit',
    name: 'Hoheit',
    description:
      'Gegnerische Attacken mit erhöhter Priorität wirken weder gegen sich noch gegen den Partner.',
    onTryHitTaken(ctx, holder, attacker, move) {
      return blocksPriority(ctx, holder, holder, attacker, move.activePriority) ? false : undefined;
    },
    onAllyTryHitTaken(ctx, holder, target, attacker, move) {
      return blocksPriority(ctx, holder, target, attacker, move.activePriority) ? false : undefined;
    },
  },
  {
    id: 'unbeugsam',
    name: 'Unbeugsam',
    description: 'Gegner können die eigenen Werte nicht senken.',
    onTryBoost(ctx, holder, boosts, source) {
      if (!source || source.side === holder.side) return;
      let blocked = false;
      for (const [stat, delta] of Object.entries(boosts)) {
        if (delta < 0) {
          Reflect.deleteProperty(boosts, stat);
          blocked = true;
        }
      }
      if (blocked) ctx.showAbility(holder);
    },
  },
  {
    id: 'trotzreaktion',
    name: 'Trotzreaktion',
    description: 'Senkt ein Gegner einen eigenen Wert, steigt der Angriff um zwei Stufen.',
    onAfterBoost(ctx, holder, changes, source) {
      if (!source || source.side === holder.side) return;
      if (!Object.values(changes).some((delta) => delta < 0)) return;
      ctx.showAbility(holder);
      ctx.boost(holder, { atk: 2 }, holder);
    },
  },
  {
    id: 'eisern',
    name: 'Eisern',
    description: 'Schreckt nie zurück und lässt sich von Drohkulisse nicht beeindrucken.',
    onTryAddVolatile(_ctx, _holder, id) {
      return id === 'flinch' ? false : undefined;
    },
    onTryBoost(_ctx, holder, boosts, source) {
      if (source && source.side !== holder.side && source.ability === 'drohkulisse') {
        Reflect.deleteProperty(boosts, 'atk');
      }
    },
  },
  {
    id: 'wachsam',
    name: 'Wachsam',
    description: 'Schläft nie ein.',
    onSetStatus(_ctx, _holder, status) {
      return status === 'slp' ? false : undefined;
    },
  },
  {
    id: 'rueckstossfrei',
    name: 'Rückstoßfrei',
    description: 'Erleidet keinen Rückstoß durch eigene Attacken.',
    onModifyRecoil() {
      return 0;
    },
  },
  {
    id: 'haeutung',
    name: 'Häutung',
    description: 'Am Rundenende 30 % Chance, ein Statusproblem abzustreifen.',
    onResidual(ctx, holder) {
      if (holder.status === null || !ctx.rng.chance(3, 10)) return;
      ctx.showAbility(holder);
      ctx.cureStatus(holder);
    },
  },

  // ── Kontakt ──
  contactStatus('glutpanzer', 'Glutpanzer', 'brn', 'ein Brandmal'),
  contactStatus('statikfell', 'Statikfell', 'par', 'Starre'),
  contactStatus('giftdorn', 'Giftdorn', 'psn', 'Toxin'),
  {
    id: 'rauhaut',
    name: 'Rauhaut',
    description: 'Wer mit Kontakt angreift, verliert 1/8 seiner LP.',
    onDamagingHitTaken(ctx, holder, attacker, move) {
      if (!move.flags.contact || attacker.hp <= 0) return;
      ctx.showAbility(holder);
      ctx.damage(attacker, Math.max(1, Math.floor(attacker.maxHp / 8)), 'effect', undefined, {
        kind: 'ability',
        id: 'rauhaut',
      });
    },
  },

  // ── Gegner und Kampfverlauf ──
  {
    id: 'beerenbann',
    name: 'Beerenbann',
    description: 'Solange dieses Monster auf dem Feld steht, können Gegner keine Beeren essen.',
    preventsBerries: true,
  },
  {
    id: 'siegesrausch',
    name: 'Siegesrausch',
    description: 'Nach jedem besiegten Monster steigt der eigene Angriff um eine Stufe.',
    onAfterKO(ctx, holder) {
      ctx.showAbility(holder);
      ctx.boost(holder, { atk: 1 }, holder);
    },
  },
];
