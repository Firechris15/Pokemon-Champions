/**
 * Einstellungen (reaktiv, im Browser gespeichert). Der Einstellungs-Bildschirm folgt in Phase 5;
 * bis dahin lassen sich die Kampf-Einstellungen direkt im Kampf ändern.
 */
import { loadJson, saveJson } from '../storage/index.ts';

export const TEXT_SPEEDS = ['slow', 'normal', 'fast', 'instant'] as const;
export type TextSpeed = (typeof TEXT_SPEEDS)[number];

export interface Settings {
  textSpeed: TextSpeed;
  /** Effektivitäts-Hinweise auf den Attacken-Buttons. */
  effectivenessHints: boolean;
  /** Kampflog zu Beginn geöffnet. */
  logOpen: boolean;
}

const DEFAULTS: Settings = { textSpeed: 'normal', effectivenessHints: true, logOpen: false };

function load(): Settings {
  const stored = loadJson<Partial<Settings>>('settings', {});
  return {
    textSpeed: TEXT_SPEEDS.find((speed) => speed === stored.textSpeed) ?? DEFAULTS.textSpeed,
    effectivenessHints:
      typeof stored.effectivenessHints === 'boolean'
        ? stored.effectivenessHints
        : DEFAULTS.effectivenessHints,
    logOpen: typeof stored.logOpen === 'boolean' ? stored.logOpen : DEFAULTS.logOpen,
  };
}

export const settings = $state<Settings>(load());

export function saveSettings(): void {
  saveJson('settings', $state.snapshot(settings));
}

/** Faktor für Wartezeiten beim Abspielen. */
export function speedFactor(speed: TextSpeed): number {
  switch (speed) {
    case 'slow':
      return 1.5;
    case 'normal':
      return 1;
    case 'fast':
      return 0.55;
    case 'instant':
      return 0.12;
  }
}
