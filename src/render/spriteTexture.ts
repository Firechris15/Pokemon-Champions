/**
 * Spritesheets als Three.js-Texturen: scharfe Pixel (NearestFilter), ein Bild des Sheets
 * wird über `repeat`/`offset` ausgewählt – so animiert ein Sprite ohne neue Texturen.
 */
import * as THREE from 'three';
import { SHEET_COLUMNS, type SpriteSheet } from '../sprites/sheet.ts';

export function sheetTexture(sheet: SpriteSheet): THREE.DataTexture {
  const { width, height, data } = sheet.image;
  // DataTexture-Zeile 0 liegt unten: Zeilen spiegeln.
  const flipped = new Uint8Array(data.length);
  const stride = width * 4;
  for (let y = 0; y < height; y++) {
    flipped.set(data.subarray(y * stride, (y + 1) * stride), (height - 1 - y) * stride);
  }
  const texture = new THREE.DataTexture(flipped, width, height, THREE.RGBAFormat);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.repeat.set(1 / SHEET_COLUMNS, 1 / 2);
  texture.needsUpdate = true;
  return texture;
}

/** Wählt Ansicht und Spalte (0–3 Leerlauf, 4 Angriff). */
export function setSheetFrame(
  texture: THREE.Texture,
  view: 'front' | 'back',
  column: number,
): void {
  texture.offset.set(column / SHEET_COLUMNS, view === 'front' ? 0.5 : 0);
}
