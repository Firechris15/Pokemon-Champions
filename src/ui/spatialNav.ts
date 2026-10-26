/**
 * Pfeiltasten-Navigation über die sichtbare Anordnung: springt zum nächstgelegenen Button in
 * Pfeilrichtung (funktioniert für Raster, Listen und gemischte Panels ohne eigene Tabellen).
 */
const DIRECTIONS: Readonly<Record<string, readonly [number, number]>> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

export function moveFocus(container: HTMLElement | undefined, key: string): boolean {
  const direction = DIRECTIONS[key];
  if (!container || !direction) return false;
  const buttons = [...container.querySelectorAll<HTMLButtonElement>('button:not([disabled])')];
  if (buttons.length === 0) return false;
  const current = document.activeElement;
  const from = buttons.find((button) => button === current);
  if (!from) {
    buttons[0]?.focus();
    return true;
  }
  const origin = from.getBoundingClientRect();
  const ox = origin.left + origin.width / 2;
  const oy = origin.top + origin.height / 2;
  const [dx, dy] = direction;
  let best: HTMLButtonElement | null = null;
  let bestScore = Infinity;
  for (const button of buttons) {
    if (button === from) continue;
    const rect = button.getBoundingClientRect();
    const x = rect.left + rect.width / 2 - ox;
    const y = rect.top + rect.height / 2 - oy;
    const along = x * dx + y * dy;
    if (along <= 1) continue;
    // Abweichung quer zur Richtung zählt doppelt.
    const across = Math.abs(x * dy - y * dx);
    const score = along + across * 2;
    if (score < bestScore) {
      bestScore = score;
      best = button;
    }
  }
  best?.focus();
  return best !== null;
}
