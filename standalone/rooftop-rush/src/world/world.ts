import * as THREE from 'three';
import { Spawner } from '../game/spawner';
import { Collectibles } from './collectibles';
import { Environment } from './environment';
import { Obstacles } from './obstacles';
import { ParticleSystem } from './particles';
import { Player } from './player';
import { Track } from './track';

/** Owns every 3D system. `scroll` holds everything that lives in track space (moved by -distance). */
export class World {
  readonly root = new THREE.Group();
  readonly scroll = new THREE.Group();
  readonly track = new Track();
  readonly obstacles = new Obstacles();
  readonly collectibles = new Collectibles();
  readonly env = new Environment();
  readonly player = new Player();
  readonly glowFx = new ParticleSystem(700, true, 0, 1.2);
  readonly dustFx = new ParticleSystem(300, false, -1.5, 2.2);
  readonly spawner: Spawner;

  constructor() {
    this.spawner = new Spawner(this.obstacles, this.collectibles);
    this.scroll.add(this.track.group, this.obstacles.group, this.collectibles.group);
    this.root.add(this.env.group, this.scroll, this.player.group, this.dustFx.points, this.glowFx.points);
  }

  /** Clears everything for a fresh run (also used for the menu demo). */
  resetRun(): void {
    this.obstacles.releaseAll();
    this.collectibles.reset();
    this.track.reset();
    this.glowFx.clear();
    this.dustFx.clear();
    this.player.reset();
    this.spawner.reset();
  }

  dispose(): void {
    this.track.dispose();
    this.obstacles.dispose();
    this.collectibles.dispose();
    this.env.dispose();
    this.player.dispose();
    this.glowFx.dispose();
    this.dustFx.dispose();
    this.root.clear();
  }
}
