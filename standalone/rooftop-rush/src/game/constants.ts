/** Tunable gameplay + world constants. Units are metres / seconds. */
export const LANE_COUNT = 3;
export const LANE_WIDTH = 2.4;
export const LANE_X: readonly number[] = [-LANE_WIDTH, 0, LANE_WIDTH];
export const ROOF_HALF = 4.2;

export const SEG_LEN = 40;
export const SEG_COUNT = 9;
export const SEG_BEHIND = 50;
export const LOOKAHEAD = 250;

export const BASE_SPEED = 15;
export const MAX_SPEED = 34;
export const OVERDRIVE_MUL = 1.45;
export const MENU_SPEED = 7;

export const GRAVITY = 42;
export const JUMP_VELOCITY = 14.5;
export const RAMP_VELOCITY = 14.5;
export const SLIDE_TIME = 0.8;
export const STAND_H = 1.75;
export const SLIDE_H = 0.9;
export const PLAYER_HW = 0.4;
export const PLAYER_HD = 0.35;

export const RAMP_LEN = 3.2;
export const RAMP_H = 0.9;
export const GAP_LEN = 6.5;

export const POWER_DURATION = { magnet: 9, shield: 20, overdrive: 6.5 } as const;
export const MAGNET_RANGE = 9;

export const MILESTONE_M = 500;
export const COMBO_STEP = 8;
export const MAX_MULT = 6;
export const CELL_SCORE = 10;

export const FIRST_ROW_S = 110;

/** Base running speed for a given distance (m/s), before overdrive. */
export function baseSpeedAt(dist: number): number {
  return BASE_SPEED + (MAX_SPEED - BASE_SPEED) * (1 - Math.exp(-dist / 1100));
}
/** 0..1 difficulty for a given distance. */
export function difficultyAt(dist: number): number {
  return Math.min(1, dist / 2600);
}

export const PALETTE = {
  cyan: '#19c9e6',
  cyanGlow: '#7ffcff',
  orange: '#ff8a1f',
  magenta: '#ff3d8b',
  lime: '#b6ff3c',
  purple: '#6a3df0',
  navy: '#1c2540',
  fog: '#f4a077',
};
