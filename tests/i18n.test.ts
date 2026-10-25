import { describe, expect, it } from 'vitest';
import { de } from '../src/i18n/de.ts';
import { en } from '../src/i18n/en.ts';
import { collectKeys, translate } from '../src/i18n/translate.ts';

describe('i18n', () => {
  it('Englisch hat exakt dieselben Schlüssel wie Deutsch', () => {
    expect(collectKeys(en).sort()).toEqual(collectKeys(de).sort());
  });

  it('kein Text ist leer', () => {
    for (const dict of [de, en]) {
      for (const key of collectKeys(dict)) {
        expect(translate(dict, key as Parameters<typeof translate>[1]).trim(), key).not.toBe('');
      }
    }
  });

  it('beide Sprachen verwenden dieselben Platzhalter', () => {
    const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    for (const key of collectKeys(de)) {
      const k = key as Parameters<typeof translate>[1];
      expect(placeholders(translate(en, k)), key).toEqual(placeholders(translate(de, k)));
    }
  });

  it('ersetzt Platzhalter und lässt unbekannte stehen', () => {
    expect(translate(de, 'system.fpsValue', { fps: 60 })).toBe('60 FPS');
    expect(translate(de, 'system.fpsValue')).toBe('{fps} FPS');
  });

  it('liefert bei unbekanntem Schlüssel den Schlüssel selbst', () => {
    expect(translate(de, 'gibt.es.nicht' as Parameters<typeof translate>[1])).toBe('gibt.es.nicht');
  });
});
