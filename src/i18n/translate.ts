import type { MessageKey, MessageParams, Messages } from './types.ts';

/**
 * Schlägt einen Text nach und ersetzt `{platzhalter}`.
 * Unbekannte Schlüssel liefern den Schlüssel selbst zurück, damit Fehler sichtbar statt leer sind.
 */
export function translate(messages: Messages, key: MessageKey, params?: MessageParams): string {
  let node: unknown = messages;
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null) return key;
    node = (node as Record<string, unknown>)[part];
  }
  if (typeof node !== 'string') return key;
  if (!params) return node;
  return node.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name];
    return value === undefined ? match : String(value);
  });
}

/** Alle Blatt-Schlüssel eines Text-Objekts (für Tests und Vollständigkeitsprüfungen). */
export function collectKeys(node: unknown, prefix = ''): string[] {
  if (typeof node !== 'object' || node === null) return [];
  const keys: string[] = [];
  for (const [name, value] of Object.entries(node)) {
    const path = prefix + name;
    if (typeof value === 'string') keys.push(path);
    else keys.push(...collectKeys(value, `${path}.`));
  }
  return keys;
}
