import { de } from './de.ts';
import { en } from './en.ts';
import { translate } from './translate.ts';
import type { Locale, MessageKey, MessageParams, Messages } from './types.ts';

const dictionaries: Record<Locale, Messages> = { de, en };

// Deutsch ist laut SPEC die Standardsprache; Persistenz folgt mit der Speicherschicht (Phase 5).
let current = $state<Locale>('de');

/** Reaktiv: In Svelte-Templates aufgerufen, aktualisiert sich der Text beim Sprachwechsel. */
export function t(key: MessageKey, params?: MessageParams): string {
  return translate(dictionaries[current], key, params);
}

export function getLocale(): Locale {
  return current;
}

export function setLocale(locale: Locale): void {
  current = locale;
  document.documentElement.lang = locale;
}
