import type { World } from '../world/world';
import { audio } from './audio';
import {
  COMBO_STEP, GAP_LEN, GRAVITY, JUMP_VELOCITY, LANE_COUNT, LANE_X, MAGNET_RANGE, MAX_MULT, CELL_SCORE, MENU_SPEED, MILESTONE_M,
  OVERDRIVE_MUL, PLAYER_HD, PLAYER_HW, POWER_DURATION, RAMP_H, RAMP_LEN, RAMP_VELOCITY, SLIDE_H, SLIDE_TIME, STAND_H, baseSpeedAt,
} from './constants';
import { damp, rand } from './rng';
import { G, currentScore, resetRunState } from './state';
import { showToast, useUI } from './store';
import type { Action, Obstacle, PowerKind } from './types';
import type { CollectHandlers } from '../world/collectibles';

interface Ground {
  h: number;
  hole: boolean;
  ramp: Obstacle | null;
}

const FORGIVE_XZ = 0.12;
const FORGIVE_Y = 0.1;

/** Central game logic: input commands, physics, collisions, scoring, power-ups and phase changes. */
class Engine {
  world: World | null = null;
  private handlers: CollectHandlers;

  constructor() {
    this.handlers = {
      onCoin: (x, y, z) => this.onCoin(x, y, z),
      onPower: (k, x, y, z) => this.onPower(k, x, y, z),
      onMiss: () => {
        if (G.combo > 0) {
          G.combo = 0;
          G.mult = 1;
        }
      },
    };
  }

  attach(w: World): void {
    this.world = w;
    w.resetRun();
    resetRunState();
    G.phase = 'menu';
    G.speed = MENU_SPEED;
  }

  /** Called by the canvas once the first frames have rendered. */
  markReady(): void {
    useUI.setState({ ready: true, phase: 'menu' });
  }

  /** Ground height under the runner, used for the shadow blob. */
  groundHeightNow(): number {
    const w = this.world;
    if (!w) return 0;
    const g = this.groundAt(w, G.x, G.dist);
    return g.hole ? -5 : g.h;
  }

  detach(): void {
    this.world = null;
  }

  /* ------------------------------ commands ------------------------------ */

  command(a: Action): void {
    audio.unlock();
    const ui = useUI.getState();
    if (!ui.ready) return;
    switch (G.phase) {
      case 'menu':
        if (a === 'confirm' || a === 'jump') this.startRun();
        return;
      case 'gameover':
        if (a === 'confirm' || a === 'jump') this.startRun();
        return;
      case 'paused':
        if (a === 'pause' || a === 'confirm') this.resume();
        return;
      case 'dying':
        if ((a === 'confirm' || a === 'jump') && G.dyingT > 0.5) this.startRun();
        return;
      case 'playing':
        break;
      default:
        return;
    }
    switch (a) {
      case 'left':
        this.changeLane(-1);
        break;
      case 'right':
        this.changeLane(1);
        break;
      case 'jump':
        this.tryJump();
        break;
      case 'slide':
        this.trySlide();
        break;
      case 'pause':
        this.pause();
        break;
    }
  }

  private changeLane(d: number): void {
    const n = G.lane + d;
    if (n < 0 || n >= LANE_COUNT) {
      G.bumpT = 0.25;
      G.bumpDir = d;
      return;
    }
    G.lane = n;
    G.targetX = LANE_X[n];
    audio.lane();
  }

  private tryJump(): void {
    if (G.grounded) this.doJump(JUMP_VELOCITY);
    else G.jumpBuffer = 0.14;
  }

  private doJump(v: number): void {
    G.vy = v;
    G.grounded = false;
    G.sliding = false;
    G.slideT = 0;
    G.jumpBuffer = 0;
    G.jumpParity ^= 1;
    audio.jump();
    this.world?.dustFx.burst(G.x, G.y + 0.1, 0.2, 6, 2.2, '#d9c2a8', 0.5, 0.5);
  }

  private trySlide(): void {
    if (G.grounded) {
      if (!G.sliding) audio.slide();
      G.sliding = true;
      G.slideT = SLIDE_TIME;
    } else {
      G.vy = Math.min(G.vy, -24);
      G.slideQueued = 0.45;
    }
  }

  startRun(): void {
    const w = this.world;
    if (!w) return;
    audio.unlock();
    audio.ui();
    (document.activeElement as HTMLElement | null)?.blur?.();
    resetRunState();
    w.resetRun();
    G.phase = 'playing';
    G.invulnT = 0;
    useUI.setState({
      phase: 'playing', score: 0, dist: 0, cells: 0, combo: 0, mult: 1, comboProgress: 0, level: 1, speedNorm: 0,
      magnet: 0, shield: 0, overdrive: 0, toast: null,
    });
    showToast('GO!', 'info');
  }

  pause(): void {
    if (G.phase !== 'playing') return;
    (document.activeElement as HTMLElement | null)?.blur?.();
    G.phase = 'paused';
    useUI.setState({ phase: 'paused' });
  }

  resume(): void {
    if (G.phase !== 'paused') return;
    (document.activeElement as HTMLElement | null)?.blur?.();
    G.phase = 'playing';
    G.invulnT = Math.max(G.invulnT, 1.0);
    audio.ui();
    useUI.setState({ phase: 'playing' });
  }

  /* ------------------------------ collectible events ------------------------------ */

  private onCoin(x: number, y: number, z: number): void {
    G.cells += 1;
    G.combo += 1;
    const prev = G.mult;
    G.mult = Math.min(MAX_MULT, 1 + Math.floor(G.combo / COMBO_STEP));
    G.cellScore += CELL_SCORE * G.mult;
    audio.coin(G.combo);
    this.world?.glowFx.burst(x, y, z, 5, 3, '#c8ff5a', 0.35, 0.45);
    if (G.mult > prev) showToast(`COMBO x${G.mult}`, 'power');
  }

  private onPower(kind: PowerKind, x: number, y: number, z: number): void {
    const w = this.world;
    audio.power();
    const colors: Record<PowerKind, string> = { magnet: '#ff5a7a', shield: '#4ad8ff', overdrive: '#ffb020' };
    w?.glowFx.burst(x, y, z, 26, 6, colors[kind], 0.55, 0.8);
    if (kind === 'magnet') {
      G.magnetT = POWER_DURATION.magnet;
      showToast('MAGNET', 'power');
    } else if (kind === 'shield') {
      G.shield = true;
      G.shieldT = POWER_DURATION.shield;
      showToast('SHIELD UP', 'power');
    } else {
      G.overT = POWER_DURATION.overdrive;
      showToast('OVERDRIVE!', 'power');
    }
  }

  /* ------------------------------ frame update ------------------------------ */

  /** Returns the animation delta to use for visual systems (0 when paused). */
  update(rawDt: number): number {
    const w = this.world;
    if (!w) return 0;
    const dt = Math.min(rawDt, 1 / 20);
    G.shake = Math.max(0, G.shake - dt * 2.2);
    if (G.hitT > 0) G.hitT -= dt;
    if (G.landT > 0) G.landT -= dt;
    if (G.bumpT > 0) G.bumpT -= dt;
    if (G.shieldPopT > 0) G.shieldPopT -= dt;

    switch (G.phase) {
      case 'paused':
        return 0;
      case 'loading':
      case 'menu': {
        G.speed = MENU_SPEED;
        G.prevDist = G.dist;
        G.dist += G.speed * dt;
        G.x = 0;
        G.targetX = 0;
        this.emitTrail(dt, w, 0);
        return dt;
      }
      case 'playing':
        this.stepPlaying(dt, w);
        return dt;
      case 'dying':
        this.stepDying(dt, w);
        return dt;
      case 'gameover':
        G.speed = 0;
        return dt;
    }
    return dt;
  }

  private groundAt(w: World, x: number, s: number): Ground {
    const out: Ground = { h: 0, hole: false, ramp: null };
    for (const o of w.obstacles.active) {
      if (o.kind !== 'gap') continue;
      const dx = Math.abs(x - o.baseX);
      if (dx > 1.15) continue;
      if (s >= o.s && s <= o.s + RAMP_LEN) {
        out.h = Math.max(out.h, RAMP_H * ((s - o.s) / RAMP_LEN));
        out.ramp = o;
      } else if (dx < 1.05 && s >= o.s + RAMP_LEN + 0.35 && s <= o.s + RAMP_LEN + GAP_LEN - 0.35) {
        out.hole = true;
      }
    }
    return out;
  }

  private stepPlaying(dt: number, w: World): void {
    G.time += dt;
    // ----- speed
    const base = baseSpeedAt(G.dist) * Math.min(1, 0.72 + 0.28 * (G.time / 2.5));
    G.baseSpeed = base;
    const targetMul = G.overT > 0 ? OVERDRIVE_MUL : 1;
    G.speedMul += (targetMul - G.speedMul) * damp(3, dt);
    G.speed = base * G.speedMul;
    G.prevDist = G.dist;
    G.dist += G.speed * dt;

    // ----- lateral
    G.x += (G.targetX - G.x) * damp(17, dt);
    if (Math.abs(G.targetX - G.x) < 0.002) G.x = G.targetX;

    // ----- timers
    if (G.invulnT > 0) G.invulnT -= dt;
    if (G.jumpBuffer > 0) G.jumpBuffer -= dt;
    if (G.slideQueued > 0) G.slideQueued -= dt;
    if (G.sliding) {
      G.slideT -= dt;
      if (G.slideT <= 0) G.sliding = false;
    }
    this.tickPowerups(dt);

    // world systems that depend on the new distance
    w.spawner.update(G.dist);
    w.obstacles.update(dt, G.dist, G.time);

    // ----- vertical physics with ramps and holes
    const gr = this.groundAt(w, G.x, G.dist);
    G.onRamp = !!gr.ramp;
    if (G.grounded) {
      if (gr.hole) {
        G.grounded = false;
        G.vy = 0;
      } else {
        G.y = gr.h;
        if (gr.ramp && G.dist >= gr.ramp.s + RAMP_LEN - 0.5) {
          this.doJump(RAMP_VELOCITY);
        } else if (G.jumpBuffer > 0) {
          this.doJump(JUMP_VELOCITY);
        } else if (G.overT > 0) {
          for (const o of w.obstacles.active) {
            if (o.kind !== 'gap') continue;
            const gs = o.s + RAMP_LEN;
            if (Math.abs(G.x - o.baseX) < 1.2 && gs - G.dist > 0 && gs - G.dist < G.speed * 0.3) {
              this.doJump(RAMP_VELOCITY * 0.95);
              break;
            }
          }
        }
      }
    } else {
      G.vy -= GRAVITY * dt;
      G.y += G.vy * dt;
      if (!gr.hole && G.y <= gr.h && G.vy <= 0) {
        if (G.vy < -9) audio.land();
        G.y = gr.h;
        G.vy = 0;
        G.grounded = true;
        G.landT = 0.18;
        w.dustFx.burst(G.x, G.y + 0.1, 0.3, 8, 2.6, '#d9c2a8', 0.55, 0.55);
        if (G.slideQueued > 0) {
          G.slideQueued = 0;
          G.sliding = true;
          G.slideT = SLIDE_TIME;
          audio.slide();
        }
        if (G.jumpBuffer > 0) this.doJump(JUMP_VELOCITY);
      } else if (G.y < -1.3) {
        this.fellIntoGap();
        if (G.phase !== 'playing') return;
      }
    }

    // ----- collisions
    const ph = G.sliding ? SLIDE_H : STAND_H;
    const acts = w.obstacles.active;
    for (let i = acts.length - 1; i >= 0; i--) {
      const o = acts[i];
      if (o.kind === 'gap') continue;
      // swept along z so low frame rates can never tunnel through thin obstacles
      const zHit = G.dist + PLAYER_HD - FORGIVE_XZ > o.s - o.halfZ && G.prevDist - PLAYER_HD + FORGIVE_XZ < o.s + o.halfZ;
      if (Math.abs(G.x - o.x) < o.halfX + PLAYER_HW - FORGIVE_XZ && zHit && G.y < o.yMax - FORGIVE_Y && G.y + ph > o.yMin + FORGIVE_Y) {
        if (G.overT > 0) {
          this.smash(o);
        } else if (G.invulnT > 0) {
          continue;
        } else if (G.shield) {
          this.breakShield(o);
        } else {
          G.killer = o.kind;
          this.die('crash');
          return;
        }
      }
    }

    // ----- collectibles
    w.collectibles.update(dt, G.time, { dist: G.dist, prevDist: G.prevDist, x: G.x, y: G.y, h: ph, magnet: G.magnetT > 0, speed: G.speed }, this.handlers);

    // ----- milestones
    if (G.dist >= G.nextMilestone * MILESTONE_M) {
      const m = G.nextMilestone * MILESTONE_M;
      G.nextMilestone += 1;
      G.bonus += 50 * (G.nextMilestone - 1);
      showToast(`${m} m  •  LEVEL ${G.nextMilestone}`, 'milestone');
      audio.milestone();
      w.glowFx.burst(G.x, 1.4, -2, 40, 7, '#ffd23f', 0.5, 1.0);
      w.glowFx.burst(G.x, 1.4, -2, 26, 5, '#7ffcff', 0.4, 0.9);
    }

    this.emitTrail(dt, w, ph);
    this.syncHud(dt);
  }

  private tickPowerups(dt: number): void {
    if (G.magnetT > 0) {
      G.magnetT -= dt;
      if (G.magnetT <= 0) {
        G.magnetT = 0;
        showToast('MAGNET OFF', 'warn');
        audio.powerEnd();
      }
    }
    if (G.shield) {
      G.shieldT -= dt;
      if (G.shieldT <= 0) {
        G.shield = false;
        G.shieldPopT = 0.35;
        showToast('SHIELD FADED', 'warn');
        audio.powerEnd();
      }
    }
    if (G.overT > 0) {
      G.overT -= dt;
      if (G.overT <= 0) {
        G.overT = 0;
        G.invulnT = Math.max(G.invulnT, 1.0);
        showToast('OVERDRIVE OVER', 'warn');
        audio.powerEnd();
      }
    }
  }

  private smash(o: Obstacle): void {
    const w = this.world!;
    w.glowFx.burst(o.x, Math.max(0.6, (o.yMin + o.yMax) / 2), -(o.s - G.dist), 22, 7, '#ffb060', 0.5, 0.7);
    w.dustFx.burst(o.x, 0.6, -(o.s - G.dist), 10, 4, '#cfc0d8', 0.7, 0.7);
    w.obstacles.release(o);
    audio.smash();
    G.shake = Math.max(G.shake, 0.25);
  }

  private breakShield(o: Obstacle): void {
    G.shield = false;
    G.shieldPopT = 0.35;
    G.invulnT = 1.1;
    G.hitT = 0.35;
    G.shake = 0.7;
    audio.shieldBreak();
    this.world!.glowFx.burst(G.x, 1, 0, 34, 6, '#4ad8ff', 0.5, 0.7);
    this.smash(o);
    showToast('SHIELD BROKEN', 'warn');
  }

  private fellIntoGap(): void {
    if (G.overT > 0 || G.invulnT > 0 || G.shield) {
      if (G.shield && G.overT <= 0 && G.invulnT <= 0) {
        G.shield = false;
        G.shieldPopT = 0.35;
        audio.shieldBreak();
        showToast('SHIELD SAVED YOU', 'power');
      }
      G.y = 0.3;
      G.vy = RAMP_VELOCITY;
      G.invulnT = Math.max(G.invulnT, 1.2);
      return;
    }
    G.killer = 'gap';
    this.die('fall');
  }

  private die(kind: 'crash' | 'fall'): void {
    G.phase = 'dying';
    G.deathKind = kind;
    G.dyingT = 0;
    G.hitT = 0.5;
    G.shake = kind === 'crash' ? 1 : 0.4;
    G.combo = 0;
    G.mult = 1;
    G.sliding = false;
    audio.hit();
    const w = this.world!;
    if (kind === 'crash') {
      w.glowFx.burst(G.x, 1, -0.4, 36, 7, '#ffb060', 0.5, 0.8);
      w.dustFx.burst(G.x, 0.8, -0.4, 16, 4, '#cfc0d8', 0.8, 0.8);
      G.grounded = false;
      G.vy = 6;
    }
    // persist high score immediately so it survives a reload mid game-over
    const score = currentScore();
    const newHigh = useUI.getState().commitHigh(score);
    useUI.setState({
      summary: { score, dist: Math.floor(G.dist), cells: G.cells, newHigh },
      score, dist: Math.floor(G.dist), cells: G.cells, combo: 0, mult: 1, comboProgress: 0,
      magnet: 0, shield: 0, overdrive: 0,
    });
    G.magnetT = 0;
    G.shield = false;
    G.overT = 0;
    G.shieldPopT = 0;
  }

  private stepDying(dt: number, w: World): void {
    G.dyingT += dt;
    G.time += dt;
    G.speed *= Math.exp(-(G.deathKind === 'crash' ? 5 : 2.5) * dt);
    G.prevDist = G.dist;
    G.dist += G.speed * dt;
    w.obstacles.update(dt, G.dist, G.time);
    if (G.deathKind === 'fall') {
      G.vy -= GRAVITY * dt;
      G.y += G.vy * dt;
    } else if (!G.grounded) {
      G.vy -= GRAVITY * dt;
      G.y += G.vy * dt;
      if (G.y <= 0) {
        G.y = 0;
        G.grounded = true;
        G.vy = 0;
        w.dustFx.burst(G.x, 0.1, 0.3, 10, 3, '#d9c2a8', 0.6, 0.6);
      }
    }
    if (G.dyingT > 0.45 && !this.gameOverSounded) {
      this.gameOverSounded = true;
      audio.gameOver();
    }
    if (G.dyingT > 1.25) {
      this.gameOverSounded = false;
      G.phase = 'gameover';
      useUI.setState({ phase: 'gameover' });
    }
  }
  private gameOverSounded = false;

  private emitTrail(dt: number, w: World, ph: number): void {
    const running = G.phase === 'playing' || G.phase === 'menu' || G.phase === 'loading';
    if (!running) return;
    G.dustTimer -= dt;
    if (G.dustTimer > 0) return;
    G.dustTimer = G.overT > 0 ? 0.012 : 0.04;
    const gy = G.grounded ? G.y : G.y - 0.1;
    if (G.grounded) {
      w.dustFx.emit(G.x + rand(-0.25, 0.25), gy + 0.08, 0.35, rand(-0.6, 0.6), rand(0.4, 1.2), rand(0.5, 1.5), rand(0.35, 0.6), rand(0.35, 0.6), '#d8c4ac', 1.2);
      if (G.sliding) w.glowFx.emit(G.x + rand(-0.2, 0.2), gy + 0.1, -0.2, rand(-1, 1), rand(1, 2.5), rand(1, 4), rand(0.25, 0.5), 0.22, '#ffb060', -0.3);
    }
    w.glowFx.emit(G.x + rand(-0.3, 0.3), gy + ph * 0.5 + 0.3, 0.6, rand(-0.5, 0.5), rand(-0.2, 0.6), rand(0.5, 2), rand(0.35, 0.7), 0.22, G.overT > 0 ? '#ffa030' : '#5ff0ff', -0.5);
    if (G.overT > 0) {
      for (let i = 0; i < 2; i++) w.glowFx.emit(G.x + rand(-0.5, 0.5), gy + rand(0.2, 1.6), 0.8, rand(-0.5, 0.5), rand(-0.3, 0.5), rand(1, 3), rand(0.3, 0.6), 0.34, i ? '#ffd23f' : '#ff7a20', -0.4);
    }
    if (G.magnetT > 0 && Math.random() < 0.4) {
      const a = rand(0, Math.PI * 2);
      w.glowFx.emit(G.x + Math.cos(a) * MAGNET_RANGE * 0.12, gy + 1 + Math.sin(a), 0, -Math.cos(a) * 1.5, -Math.sin(a) * 1.5, 0, 0.4, 0.2, '#ff7a94', -0.5);
    }
  }

  private hudAcc = 0;
  private syncHud(dt: number): void {
    this.hudAcc += dt;
    if (this.hudAcc < 0.09) return;
    this.hudAcc = 0;
    const speedNorm = Math.min(1, G.speed / (34 * OVERDRIVE_MUL));
    useUI.setState({
      score: currentScore(),
      dist: Math.floor(G.dist),
      cells: G.cells,
      combo: G.combo,
      mult: G.mult,
      comboProgress: G.mult >= MAX_MULT ? 1 : (G.combo % COMBO_STEP) / COMBO_STEP,
      level: G.nextMilestone,
      speedNorm,
      speedMps: G.speed,
      magnet: G.magnetT > 0 ? G.magnetT / POWER_DURATION.magnet : 0,
      shield: G.shield ? G.shieldT / POWER_DURATION.shield : 0,
      overdrive: G.overT > 0 ? G.overT / POWER_DURATION.overdrive : 0,
    });
  }
}

export const engine = new Engine();
