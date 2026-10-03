import { FIRST_ROW_S, GAP_LEN, LANE_X, LOOKAHEAD, RAMP_LEN, baseSpeedAt, difficultyAt } from './constants';
import { pick, rand, randInt, weighted } from './rng';
import type { ObstacleKind, PowerKind, SpawnSpec } from './types';
import type { Collectibles } from '../world/collectibles';
import type { Obstacles } from '../world/obstacles';

const shuffled = (a: number[]): number[] => {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
};

const JUMP_KINDS: ObstacleKind[] = ['ac', 'robot', 'gap'];

/**
 * Generates obstacle "rows" ahead of the runner.
 *
 * Fairness rules (every row is passable by construction):
 *  - Every obstacle kind is individually passable in-lane (jump / slide / ramp) EXCEPT water tanks.
 *  - A row never contains tanks in all three lanes, and moving obstacles never share a lane with a tank.
 *  - Rows are spaced >= 1.4 s of travel apart (and >= 28 m), so recovery + a lane change always fits.
 *  - The first rows are single, easy obstacles with lots of lead-in.
 */
export class Spawner {
  private nextRowS = FIRST_ROW_S;
  private rowIndex = 0;
  private nextPowerS = 260;

  constructor(private obstacles: Obstacles, private collectibles: Collectibles) {}

  reset(): void {
    this.nextRowS = FIRST_ROW_S;
    this.rowIndex = 0;
    this.nextPowerS = 240 + rand(0, 60);
    // tutorial line of cells in the centre lane
    const g = this.collectibles.newGroup();
    for (let i = 0; i < 9; i++) this.collectibles.addCoin(45 + i * 1.7, 1, 0.9, g);
  }

  update(dist: number): void {
    while (this.nextRowS < dist + LOOKAHEAD) this.generate();
  }

  private pattern(d: number, idx: number): SpawnSpec[] {
    const lanes = shuffled([0, 1, 2]);
    if (idx === 0) return [{ kind: 'ac', lane: lanes[0] }];
    if (idx === 1) return [{ kind: 'sign', lane: lanes[0] }];
    if (idx === 2) return [{ kind: 'tank', lane: lanes[0] }];

    const type = weighted<string>([
      ['single', 30 - 14 * d],
      ['pair', 24 + 8 * d],
      ['wall', idx >= 5 ? 6 + 14 * d : 0],
      ['tanks', idx >= 4 ? 9 + 10 * d : 0],
      ['sweep', idx >= 3 ? 14 + 6 * d : 0],
      ['gap', idx >= 4 ? 13 : 0],
    ]);
    const simple: ObstacleKind[] = ['ac', 'sign', 'tank'];
    switch (type) {
      case 'single': {
        const kind = weighted<ObstacleKind>([
          ['ac', 3],
          ['sign', 3],
          ['tank', 2.5],
          ['robot', idx >= 3 ? 1.3 : 0],
          ['drone', idx >= 3 ? 1.3 : 0],
          ['gap', idx >= 4 ? 1.4 : 0],
        ]);
        return this.expand(kind, lanes, 0);
      }
      case 'pair':
        return [
          { kind: pick(simple), lane: lanes[0] },
          { kind: pick(['ac', 'sign', 'tank'] as ObstacleKind[]), lane: lanes[1] },
        ];
      case 'wall': {
        const kinds: ObstacleKind[] = [0, 1, 2].map(() => pick(['ac', 'sign'] as ObstacleKind[]));
        const specs = lanes.map((l, i) => ({ kind: kinds[i], lane: l }));
        if (Math.random() < 0.5) specs[0].kind = 'tank';
        return specs;
      }
      case 'tanks':
        return [
          { kind: 'tank', lane: lanes[0] },
          { kind: 'tank', lane: lanes[1] },
          ...(Math.random() < 0.4 ? [{ kind: pick(['ac', 'sign'] as ObstacleKind[]), lane: lanes[2] }] : []),
        ];
      case 'sweep': {
        const a = randInt(0, 1);
        const kind: ObstacleKind = Math.random() < 0.5 ? 'robot' : 'drone';
        const other = a === 0 ? 2 : 0;
        const specs: SpawnSpec[] = [{ kind, lane: a, laneB: a + 1 }];
        if (d > 0.25 && Math.random() < 0.35) specs.push({ kind: 'tank', lane: other });
        else if (Math.random() < 0.4) specs.push({ kind: pick(['ac', 'sign'] as ObstacleKind[]), lane: other });
        return specs;
      }
      case 'gap': {
        const two = Math.random() < 0.3;
        const specs: SpawnSpec[] = [{ kind: 'gap', lane: lanes[0] }];
        if (two) specs.push({ kind: 'gap', lane: lanes[1] });
        else if (Math.random() < 0.5) specs.push({ kind: pick(['ac', 'sign']) as ObstacleKind, lane: lanes[1] });
        return specs;
      }
    }
    return [{ kind: 'ac', lane: lanes[0] }];
  }

  private expand(kind: ObstacleKind, lanes: number[], i: number): SpawnSpec[] {
    if (kind === 'robot' || kind === 'drone') {
      const a = Math.min(lanes[i], 1);
      return [{ kind, lane: a, laneB: a + 1 }];
    }
    return [{ kind, lane: lanes[i] }];
  }

  private generate(): void {
    const s = this.nextRowS;
    const d = difficultyAt(s);
    const specs = this.pattern(d, this.rowIndex);
    const occupied = new Set<number>();
    let hasGap = false;
    let hasWide = false;

    for (const sp of specs) {
      const o = this.obstacles.spawn(sp.kind, sp.lane, sp.laneB, s);
      if (!o) continue;
      occupied.add(sp.lane);
      if (sp.laneB !== undefined) {
        occupied.add(sp.laneB);
        hasWide = true;
      }
      if (sp.kind === 'gap') hasGap = true;
      // reward cells: arc over jumpable obstacles
      if (JUMP_KINDS.includes(sp.kind) && Math.random() < 0.85 && sp.laneB === undefined) {
        const center = sp.kind === 'gap' ? s + RAMP_LEN + GAP_LEN / 2 : s;
        const half = sp.kind === 'gap' ? 5 : 3.6;
        const g = this.collectibles.newGroup();
        const n = 7;
        for (let k = 0; k < n; k++) {
          const t = (k / (n - 1)) * 2 - 1;
          this.collectibles.addCoin(center + t * half, sp.lane, 0.85 + 1.55 * (1 - t * t), g);
        }
      } else if (sp.kind === 'sign' && Math.random() < 0.6) {
        const g = this.collectibles.newGroup();
        for (let k = -2; k <= 2; k++) this.collectibles.addCoin(s + k * 1.5, sp.lane, 0.55, g);
      }
    }

    const speed = baseSpeedAt(s);
    const spacing = Math.max(28, speed * 1.45) + (hasGap ? 8 : 0) + (hasWide ? 4 : 0) + (this.rowIndex < 3 ? 12 : 0);

    // corridor of cells between this row and the next
    const c0 = s + 12;
    const c1 = s + spacing - 12;
    const len = c1 - c0;
    if (len >= 4) {
      const free = [0, 1, 2].filter((l) => !occupied.has(l));
      const lane = free.length ? pick(free) : randInt(0, 2);
      const n = Math.min(14, Math.floor(len / 1.7) + 1);
      const style = weighted<string>([['line', 5], ['wave', len > 14 ? 3 : 0], ['double', len > 10 ? 2 : 0]]);
      const g = this.collectibles.newGroup();
      for (let k = 0; k < n; k++) {
        const cs = c0 + (k * len) / Math.max(1, n - 1);
        if (style === 'wave') {
          const x = Math.sin((k / n) * Math.PI * 2 + lane) * 2.4;
          this.collectibles.addCoin(cs, null, 0.9, g, x);
        } else if (style === 'double') {
          const other = free.find((l) => l !== lane);
          this.collectibles.addCoin(cs, lane, 0.9, g);
          if (other !== undefined) this.collectibles.addCoin(cs, other, 0.9, this.collectibles.newGroup());
        } else {
          this.collectibles.addCoin(cs, lane, 0.9, g);
        }
      }
      if (s >= this.nextPowerS && len >= 8) {
        const kind = weighted<PowerKind>([
          ['magnet', 3],
          ['shield', 3],
          ['overdrive', s > 500 ? 1.8 : 0],
        ]);
        const pl = pick([0, 1, 2].filter((l) => l !== lane || style === 'wave'));
        this.collectibles.addPower(kind, c0 + len / 2, LANE_X[pl]);
        this.nextPowerS = s + rand(260, 420);
      }
    }

    this.nextRowS += spacing;
    this.rowIndex++;
  }
}
