import type { NatureData } from '../engine/dex.ts';

/**
 * Die 25 Wesen: +10 % auf einen Wert, −10 % auf einen anderen; 5 sind neutral.
 * Eigene Namen (siehe LORE.md). Reihenfolge: Zeile = erhöhter Wert, Spalte = gesenkter Wert.
 */
export const NATURES: readonly NatureData[] = [
  { id: 'ausgeglichen', name: 'Ausgeglichen', plus: null, minus: null },
  { id: 'ungestuem', name: 'Ungestüm', plus: 'atk', minus: 'def' },
  { id: 'verbissen', name: 'Verbissen', plus: 'atk', minus: 'spa' },
  { id: 'grimmig', name: 'Grimmig', plus: 'atk', minus: 'spd' },
  { id: 'wuchtig', name: 'Wuchtig', plus: 'atk', minus: 'spe' },

  { id: 'besonnen', name: 'Besonnen', plus: 'def', minus: 'atk' },
  { id: 'gelassen', name: 'Gelassen', plus: null, minus: null },
  { id: 'standhaft', name: 'Standhaft', plus: 'def', minus: 'spa' },
  { id: 'stur', name: 'Stur', plus: 'def', minus: 'spd' },
  { id: 'traege', name: 'Träge', plus: 'def', minus: 'spe' },

  { id: 'gruebler', name: 'Grüblerisch', plus: 'spa', minus: 'atk' },
  { id: 'waghalsig', name: 'Waghalsig', plus: 'spa', minus: 'def' },
  { id: 'vertraeumt', name: 'Verträumt', plus: null, minus: null },
  { id: 'feurig', name: 'Feurig', plus: 'spa', minus: 'spd' },
  { id: 'bedacht', name: 'Bedacht', plus: 'spa', minus: 'spe' },

  { id: 'guetig', name: 'Gütig', plus: 'spd', minus: 'atk' },
  { id: 'feinfuehlig', name: 'Feinfühlig', plus: 'spd', minus: 'def' },
  { id: 'fromm', name: 'Fromm', plus: 'spd', minus: 'spa' },
  { id: 'stoisch', name: 'Stoisch', plus: null, minus: null },
  { id: 'wuerdevoll', name: 'Würdevoll', plus: 'spd', minus: 'spe' },

  { id: 'flink', name: 'Flink', plus: 'spe', minus: 'atk' },
  { id: 'rastlos', name: 'Rastlos', plus: 'spe', minus: 'def' },
  { id: 'verspielt', name: 'Verspielt', plus: 'spe', minus: 'spa' },
  { id: 'ungeduldig', name: 'Ungeduldig', plus: 'spe', minus: 'spd' },
  { id: 'launisch', name: 'Launisch', plus: null, minus: null },
];
