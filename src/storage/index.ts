/**
 * Speicherschicht: IndexedDB mit localStorage-Fallback (Teams, Replays, Einstellungen).
 * Bisher: kleine JSON-Ablage für Einstellungen; Teams und Replays folgen in Phase 5.
 */
export { loadJson, saveJson } from './local.ts';
