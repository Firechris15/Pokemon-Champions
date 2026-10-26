/**
 * Kleine Schlüssel-Wert-Ablage auf localStorage – für Einstellungen und Ähnliches.
 * Jeder Zugriff in try/catch: privater Modus, volle Ablage oder gesperrter Speicher dürfen
 * nie zum Absturz führen. Teams und Replays kommen in Phase 5 nach IndexedDB.
 */
const PREFIX = 'arena.';

export function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = globalThis.localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function saveJson(key: string, value: unknown): boolean {
  try {
    globalThis.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
