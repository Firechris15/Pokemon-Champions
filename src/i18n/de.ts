/**
 * Deutsche UI-Texte (Referenzsprache). Neue Schlüssel immer zuerst hier anlegen;
 * `en.ts` muss dieselbe Struktur haben (vom Typsystem und von Tests geprüft).
 * Platzhalter: `{name}` wird von `t()` ersetzt.
 */
export const de = {
  app: {
    name: 'ARENA',
    tagline: 'Monster-Doppelkampf',
  },
  title: {
    tapToStart: 'Tippen zum Starten',
    pressToStart: 'Klicken oder Enter zum Starten',
    phase: 'Phase {phase} · Grundgerüst',
  },
  system: {
    heading: 'Systemcheck',
    intro: 'Diese Seite zeigt, ob dein Gerät alles kann, was ARENA braucht.',
    version: 'Version',
    build: 'Build',
    builtAt: 'Gebaut am',
    display: 'Anzeige',
    displayValue: '{width} × {height} px · Pixeldichte {dpr}',
    orientation: 'Ausrichtung',
    landscape: 'Querformat',
    portrait: 'Hochformat',
    input: 'Eingabe',
    touch: 'Touch',
    mouse: 'Maus/Trackpad',
    webgl: 'WebGL 2',
    webglMissing: 'nicht verfügbar',
    fps: 'Bildrate',
    fpsValue: '{fps} FPS',
    appMode: 'App-Modus',
    installed: 'Installiert (Homescreen)',
    browser: 'Im Browser',
    offline: 'Offline-Modus',
    offlineReady: 'Bereit – funktioniert ohne Internet',
    offlinePending: 'Wird vorbereitet …',
    offlineDev: 'Im Entwicklungsmodus deaktiviert',
    offlineUnsupported: 'Nicht unterstützt',
    storage: 'Speicher',
    storagePersistent: 'Dauerhaft',
    storageBestEffort: 'Kann vom Browser geleert werden',
    language: 'Sprache',
    back: 'Zurück',
    installHint:
      'Installieren auf dem iPad: In Safari auf „Teilen“ tippen, dann „Zum Home-Bildschirm“.',
  },
  update: {
    available: 'Neue Version verfügbar.',
    reload: 'Aktualisieren',
    later: 'Später',
    offlineReady: 'ARENA ist jetzt offline spielbar.',
  },
  rotate: {
    hint: 'Bitte das Gerät ins Querformat drehen.',
  },
  common: {
    ok: 'OK',
    yes: 'Ja',
    no: 'Nein',
  },
};
