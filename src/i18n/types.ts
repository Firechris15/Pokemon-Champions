import type { de } from './de.ts';

/** Struktur aller UI-Texte; abgeleitet von der deutschen Referenzdatei. */
export type Messages = typeof de;

export const LOCALES = ['de', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

/** Alle gültigen Schlüssel in Punkt-Notation, z. B. `'title.tapToStart'`. */
export type MessageKey = LeafPaths<Messages>;

type LeafPaths<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : LeafPaths<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

export type MessageParams = Readonly<Record<string, string | number>>;
