/** Tiefe Kopie einfacher Daten (Kampfzustand, Teams, Entscheidungen). */

// structuredClone gibt es in allen Zielumgebungen (Browser, Node ≥ 17), aber nicht in der ES-Bibliothek
// ohne DOM-Typen, die der Headless-Code verwendet.
const native = (globalThis as { structuredClone?: <T>(value: T) => T }).structuredClone;

export function deepClone<T>(value: T): T {
  return native ? native(value) : (JSON.parse(JSON.stringify(value)) as T);
}
