/** Geräte-Eigenschaften für Systemcheck und spätere Bedienungs-Anpassungen. */

export function isStandalone(): boolean {
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return iosStandalone || window.matchMedia('(display-mode: standalone)').matches;
}

export function hasTouch(): boolean {
  return window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
}

export async function isStoragePersistent(): Promise<boolean | null> {
  if (!('storage' in navigator)) return null;
  try {
    return await navigator.storage.persisted();
  } catch {
    return null;
  }
}
