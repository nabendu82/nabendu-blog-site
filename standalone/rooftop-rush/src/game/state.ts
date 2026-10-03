import { BASE_SPEED } from './constants';
import type { Phase } from './types';

/** Mutable per-frame game state. Kept outside React so the render loop never re-renders components. */
export const G = {
  phase: 'loading' as Phase,
  time: 0,
  dist: 0,
  prevDist: 0,
  baseSpeed: BASE_SPEED,
  speed: 0,
  speedMul: 1,

  lane: 1,
  x: 0,
  targetX: 0,
  y: 0,
  vy: 0,
  grounded: true,
  sliding: false,
  slideT: 0,
  slideQueued: 0,
  jumpBuffer: 0,
  landT: 0,
  jumpParity: 0,
  onRamp: false,

  hitT: 0,
  dyingT: 0,
  deathKind: 'crash' as 'crash' | 'fall',
  invulnT: 0,
  shake: 0,
  bumpT: 0,
  bumpDir: 0,

  cellScore: 0,
  bonus: 0,
  cells: 0,
  combo: 0,
  mult: 1,

  magnetT: 0,
  shield: false,
  shieldT: 0,
  overT: 0,
  shieldPopT: 0,

  nextMilestone: 1,
  hudTimer: 0,
  dustTimer: 0,
  runId: 0,
  killer: '',
};

export function resetRunState(): void {
  G.time = 0;
  G.dist = 0;
  G.prevDist = 0;
  G.baseSpeed = BASE_SPEED;
  G.speed = 0;
  G.speedMul = 1;
  G.lane = 1;
  G.x = 0;
  G.targetX = 0;
  G.y = 0;
  G.vy = 0;
  G.grounded = true;
  G.sliding = false;
  G.slideT = 0;
  G.slideQueued = 0;
  G.jumpBuffer = 0;
  G.landT = 0;
  G.onRamp = false;
  G.hitT = 0;
  G.dyingT = 0;
  G.deathKind = 'crash';
  G.invulnT = 0;
  G.shake = 0;
  G.bumpT = 0;
  G.cellScore = 0;
  G.bonus = 0;
  G.cells = 0;
  G.combo = 0;
  G.mult = 1;
  G.magnetT = 0;
  G.shield = false;
  G.shieldT = 0;
  G.overT = 0;
  G.shieldPopT = 0;
  G.nextMilestone = 1;
  G.hudTimer = 0;
  G.dustTimer = 0;
  G.runId += 1;
}

export const currentScore = (): number => Math.floor(G.dist) + G.cellScore + G.bonus;
