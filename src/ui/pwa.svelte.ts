import { registerSW } from 'virtual:pwa-register';

export type OfflineState = 'pending' | 'ready' | 'unsupported' | 'dev';

interface PwaState {
  offline: OfflineState;
  needRefresh: boolean;
  showOfflineReady: boolean;
}

/** Reaktiver PWA-Zustand für Update-Hinweis und Systemcheck. */
export const pwa = $state<PwaState>({
  offline: 'pending',
  needRefresh: false,
  showOfflineReady: false,
});

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;
let updateServiceWorker: ((reloadPage?: boolean) => Promise<void>) | undefined;

export function initPwa(): void {
  if (import.meta.env.DEV) {
    pwa.offline = 'dev';
    return;
  }
  if (!('serviceWorker' in navigator)) {
    pwa.offline = 'unsupported';
    return;
  }
  updateServiceWorker = registerSW({
    immediate: true,
    onNeedRefresh() {
      pwa.needRefresh = true;
    },
    onOfflineReady() {
      pwa.offline = 'ready';
      pwa.showOfflineReady = true;
    },
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      if (registration.active) pwa.offline = 'ready';
      // Installierte PWAs laufen oft tagelang: regelmäßig und beim Zurückkehren nach Updates fragen.
      const check = () => {
        if (navigator.onLine) void registration.update().catch(() => undefined);
      };
      setInterval(check, UPDATE_CHECK_INTERVAL_MS);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check();
      });
    },
    onRegisterError() {
      pwa.offline = 'unsupported';
    },
  });
}

export function applyUpdate(): void {
  pwa.needRefresh = false;
  void updateServiceWorker?.(true);
}

export function dismissUpdate(): void {
  pwa.needRefresh = false;
}

export function dismissOfflineReady(): void {
  pwa.showOfflineReady = false;
}
