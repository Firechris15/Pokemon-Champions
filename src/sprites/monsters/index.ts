/** Sprite-Definitionen aller Monster, nach Monster-ID. */
import type { SpriteDef } from '../model.ts';
import { WAVE_1 } from './wave1.ts';
import { WAVE_1B } from './wave1b.ts';
import { WAVE_2 } from './wave2.ts';
import { WAVE_3 } from './wave3.ts';
import { WAVE_4 } from './wave4.ts';
import { WAVE_5 } from './wave5.ts';
import { WAVE_6 } from './wave6.ts';

export const MONSTER_SPRITES: Readonly<Record<string, SpriteDef>> = {
  ...WAVE_1,
  ...WAVE_1B,
  ...WAVE_2,
  ...WAVE_3,
  ...WAVE_4,
  ...WAVE_5,
  ...WAVE_6,
};
