import { ABSOLUTE_ZERO,BASE_STATS,CONFIG,DEVELOPMENT_FAST_PROGRESSION,ENEMIES,HELLBREAKER,MUTATIONS,SCRAP_RIFLE,SHOT_RAY_START,THUNDERSTORM,UPGRADES,VISUAL_MUZZLE_DISTANCE,xpThreshold,type DnaType,type Element,type EnemyId,type PlayerStats,type UpgradeDefinition,type WeaponDefinition } from './config';
import { obstacles,spawnEntrances } from '../world/layout';
import { playCue } from '../effects/sound';
export type Mode='title'|'playing'|'paused'|'levelup'|'mutation'|'evolving'|'dead';
export type Actor={x:number;z:number;yaw:number;hp:number;hit:number;death:number;active:boolean;attack:number;generation:number;kind:EnemyId;rewardDropped:boolean;slow:number;burn:number;burnClock:number};
export type Shot={x:number;z:number;endX:number;endZ:number;life:number;hit:boolean;element:Element;size:number};
export type Pickup={x:number;z:number;active:boolean;kind:'xp'|'dna';dna:DnaType;amount:number;age:number};
export type Input={x:number;z:number;aimX:number;aimZ:number;aiming:boolean;fire:boolean};
export type ShotRay={originX:number;originZ:number;hitX:number;hitZ:number;hit:boolean;blocked:boolean};
// The simulation owns collision. Render meshes, the player, weapon and set dressing
// are never ray targets; only live enemy body circles and layout obstacles are.
function circleEntry(x:number,z:number,dx:number,dz:number,cx:number,cz:number,radius:number){
  const ox=x-cx,oz=z-cz,b=ox*dx+oz*dz,c=ox*ox+oz*oz-radius*radius;
  if(c<=0)return 0; // A muzzle-origin ray can start inside a body at point-blank range.
  const discriminant=b*b-c;
  if(discriminant<0)return Infinity;
  const entry=-b-Math.sqrt(discriminant);
  return entry>=0?entry:Infinity;
}
export const emptyDna=()=>({volt:0,fire:0,cryo:0,mass:0});
export class Simulation {
  mode:Mode='title';previousMode:Mode='playing';time=0;kills=0;shots=0;cooldown=0;spawnClock=0;recoil=0;vx=0;vz=0;pendingShot=false;lastRay:ShotRay|null=null;
  level=1;xp=0;xpNext=xpThreshold(1);pendingLevels=0;dna=emptyDna();stats:PlayerStats={...BASE_STATS};
  weapon:WeaponDefinition=SCRAP_RIFLE;upgradeChoices:UpgradeDefinition[]=[];mutationName='';evolution=0;
  player:Actor={x:0,z:2,yaw:Math.PI,hp:100,hit:0,death:0,active:true,attack:0,generation:0,kind:'walker',rewardDropped:true,slow:0,burn:0,burnClock:0};
  enemies:Actor[]=Array.from({length:CONFIG.maxEnemies},()=>({x:0,z:0,yaw:0,hp:0,hit:0,death:0,active:false,attack:0,generation:0,kind:'walker',rewardDropped:false,slow:0,burn:0,burnClock:0}));
  effects:Shot[]=Array.from({length:CONFIG.maxEffects},()=>({x:0,z:0,endX:0,endZ:0,life:0,hit:false,element:'kinetic',size:1}));
  pickups:Pickup[]=Array.from({length:CONFIG.maxPickups},()=>({x:0,z:0,active:false,kind:'xp',dna:'volt',amount:0,age:0}));
  input:Input={x:0,z:0,aimX:0,aimZ:-8,aiming:false,fire:false};
  seed=317;entrance=0;groupRemaining=0;
  get runSummary(){return {survivalTime:this.time,kills:this.kills,level:this.level,xp:this.xp,currentWeapon:this.weapon.name,damage:this.weapon.damage*this.stats.damage,dna:{...this.dna}};}
  random(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
  reset(){this.time=0;this.kills=0;this.shots=0;this.cooldown=0;this.spawnClock=0;this.recoil=0;this.vx=0;this.vz=0;this.lastRay=null;this.seed=317;this.entrance=0;this.groupRemaining=0;this.level=1;this.xp=0;this.xpNext=xpThreshold(1);this.pendingLevels=0;this.dna=emptyDna();this.stats={...BASE_STATS};this.weapon=SCRAP_RIFLE;this.upgradeChoices=[];this.mutationName='';this.evolution=0;
    Object.assign(this.player,{x:0,z:2,yaw:Math.PI,hp:100,hit:0,death:0,generation:this.player.generation+1});
    for(const e of this.enemies){e.active=false;e.death=0;e.rewardDropped=false;}for(const e of this.effects)e.life=0;for(const p of this.pickups)p.active=false;
    this.clearInput();this.mode='playing';for(let i=0;i<8;i++)this.spawn('walker');
  }
  clearInput(){this.input.x=0;this.input.z=0;this.input.fire=false;this.input.aiming=false;this.pendingShot=false;}
  pause(){if(this.mode==='playing'){this.previousMode=this.mode;this.mode='paused';this.clearInput();}}
  resume(){if(this.mode==='paused')this.mode='playing';}
  chooseEnemy():EnemyId{const r=this.random();if(this.time<120)return r<.85?'walker':'runner';if(this.time<240)return r<.45?'walker':r<.95?'runner':'hazmat';if(this.time<360)return r<.35?'walker':r<.7?'runner':r<.9?'tank':'hazmat';return r<.25?'walker':r<.55?'runner':r<.8?'hazmat':'tank';}
  spawn(kind:EnemyId=this.chooseEnemy()){const e=this.enemies.find(e=>!e.active);if(!e)return;
    if(this.groupRemaining<=0){this.entrance=Math.floor(this.random()*spawnEntrances.length);this.groupRemaining=2+Math.floor(this.random()*4);}this.groupRemaining--;const entry=spawnEntrances[this.entrance],def=ENEMIES[kind];
    Object.assign(e,{x:entry[0]+(this.random()-.5)*1.7,z:entry[1]+(this.random()-.5)*1.7,hp:def.health,active:true,death:0,hit:0,attack:.5,generation:e.generation+1,kind,rewardDropped:false,slow:0,burn:0,burnClock:0});
  }
  move(a:Actor,dx:number,dz:number,radius:number){a.x=Math.max(-CONFIG.arenaLimit,Math.min(CONFIG.arenaLimit,a.x+dx));a.z=Math.max(-CONFIG.arenaLimit,Math.min(CONFIG.arenaLimit,a.z+dz));for(const o of obstacles){let x=a.x-o.x,z=a.z-o.z;const min=radius+o.radius,d2=x*x+z*z;if(d2>=min*min)continue;if(d2<.00001){x=1;z=0;}const d=Math.hypot(x,z);a.x=o.x+x/d*min;a.z=o.z+z/d*min;}}
  drop(x:number,z:number,kind:'xp'|'dna',amount:number,dna:DnaType='volt'){const p=this.pickups.find(p=>!p.active);if(p)Object.assign(p,{x:x+(this.random()-.5)*.5,z:z+(this.random()-.5)*.5,active:true,kind,amount,dna,age:0});}
  kill(e:Actor){if(e.rewardDropped)return;e.rewardDropped=true;this.kills++;const def=ENEMIES[e.kind];this.drop(e.x,e.z,'xp',Math.round(def.xp*(DEVELOPMENT_FAST_PROGRESSION?CONFIG.devXpMultiplier:1)));if(def.dna&&this.random()<.72)this.drop(e.x,e.z,'dna',1,def.dna);if((e.kind==='tank'||e.kind==='hazmat')&&this.random()<.16)this.drop(e.x,e.z,'dna',1,'cryo');}
  gainXp(amount:number){this.xp+=amount;while(this.xp>=this.xpNext){this.xp-=this.xpNext;this.level++;this.pendingLevels++;this.xpNext=xpThreshold(this.level);}if(this.pendingLevels>0&&this.mode==='playing'){playCue('level');this.openLevelUp();}}
  openLevelUp(){this.clearInput();this.mode='levelup';const start=Math.floor(this.random()*UPGRADES.length);this.upgradeChoices=[0,1,2].map(i=>UPGRADES[(start+i*3)%UPGRADES.length]);}
  chooseUpgrade(id:string){if(this.mode!=='levelup')return;const upgrade=this.upgradeChoices.find(u=>u.id===id);if(!upgrade)return;upgrade.apply(this.stats,n=>{this.player.hp=Math.min(this.stats.maxHp,this.player.hp+n);});this.pendingLevels=Math.max(0,this.pendingLevels-1);if(this.pendingLevels>0)this.openLevelUp();else if(this.level>=CONFIG.mutationLevel&&this.weapon.evolutionStage===0){this.mode='mutation';this.clearInput();}else this.mode='playing';}
  chooseMutation(id:string){if(this.mode!=='mutation')return;const weapon=MUTATIONS.find(w=>w.id===id);if(!weapon)return;this.weapon=weapon;this.mutationName=weapon.name;this.evolution=2.1;this.mode='evolving';this.clearInput();playCue('mutation');}
  equipDebugWeapon(weapon:WeaponDefinition){this.weapon=weapon;this.cooldown=0;this.recoil=0;this.clearInput();}
  finishEvolution(){if(this.mode==='evolving'){this.evolution=0;this.mode='playing';}}
  collectPickups(dt:number){for(const p of this.pickups){if(!p.active)continue;p.age+=dt;const dx=this.player.x-p.x,dz=this.player.z-p.z,d=Math.hypot(dx,dz);if(d<this.stats.pickupRadius*2&&d>.08){const pull=(1-Math.min(1,d/(this.stats.pickupRadius*2)))*10;p.x+=dx/d*pull*dt;p.z+=dz/d*pull*dt;}if(d<this.stats.pickupRadius){p.active=false;playCue(p.kind==='xp'?'xp':'dna');if(p.kind==='xp')this.gainXp(p.amount);else this.dna[p.dna]+=p.amount;if(this.mode!=='playing')return;}}}
  step(dt:number){if(this.mode!=='playing')return;dt=Math.min(dt,1/30);this.time+=dt;const p=this.player,i=this.input,length=Math.hypot(i.x,i.z)||1,smoothing=1-Math.exp(-16*dt),moveSpeed=CONFIG.playerSpeed*this.stats.movement;
    this.vx+=(i.x/length*moveSpeed-this.vx)*smoothing;this.vz+=(i.z/length*moveSpeed-this.vz)*smoothing;this.move(p,this.vx*dt,this.vz*dt,CONFIG.playerRadius);if(i.aiming)p.yaw=Math.atan2(i.aimX-p.x,i.aimZ-p.z);else if(Math.hypot(this.vx,this.vz)>.1)p.yaw=Math.atan2(this.vx,this.vz);
    this.cooldown=Math.max(0,this.cooldown-dt);this.recoil=Math.max(0,this.recoil-dt);p.hit=Math.max(0,p.hit-dt);for(const fx of this.effects)fx.life=Math.max(0,fx.life-dt);this.collectPickups(dt);if(this.mode!=='playing')return;
    if((i.fire||this.pendingShot)&&this.cooldown===0){this.fire();this.pendingShot=false;}this.spawnClock+=dt;if(this.spawnClock>=CONFIG.spawnInterval*3){this.spawnClock=0;for(let k=0;k<3;k++)this.spawn();}
    for(let n=0;n<this.enemies.length;n++){const e=this.enemies[n];if(!e.active)continue;const def=ENEMIES[e.kind];if(e.hp<=0){if(!e.rewardDropped)this.kill(e);e.death+=dt;if(e.death<.35)this.move(e,-Math.sin(e.yaw)*dt*.9,-Math.cos(e.yaw)*dt*.9,def.radius);if(e.death>3)e.active=false;continue;}
      e.hit=Math.max(0,e.hit-dt);e.attack=Math.max(0,e.attack-dt);e.slow=Math.max(0,e.slow-dt);if(e.burn>0){e.burn-=dt;e.burnClock-=dt;if(e.burnClock<=0){e.burnClock=.35;e.hp=Math.max(0,e.hp-5);if(e.hp===0)this.kill(e);}}
      const dx=p.x-e.x,dz=p.z-e.z,d=Math.hypot(dx,dz)||1;e.yaw=Math.atan2(dx,dz);if(d>def.attackRange){let sx=dx/d,sz=dz/d;for(let k=0;k<this.enemies.length;k++){if(k===n)continue;const other=this.enemies[k];if(!other.active||other.hp<=0)continue;const ox=e.x-other.x,oz=e.z-other.z,q=ox*ox+oz*oz;if(q>0&&q<1.3){sx+=ox*(1-q/1.3);sz+=oz*(1-q/1.3);}}for(const o of obstacles){const ox=e.x-o.x,oz=e.z-o.z,dist=Math.hypot(ox,oz);if(dist<o.radius+1.3&&sx*ox+sz*oz<0){const sign=(sx*(-oz)+sz*ox)>=0?1:-1;sx+=-oz/Math.max(dist,.01)*sign*1.8;sz+=ox/Math.max(dist,.01)*sign*1.8;}}const norm=Math.hypot(sx,sz)||1,speed=def.speed*(e.hit>0?.3:1)*(e.slow>0?.48:1);this.move(e,sx/norm*speed*dt,sz/norm*speed*dt,def.radius);}else if(e.attack===0){e.attack=def.attackCooldown;if(p.hit===0){p.hp=Math.max(0,p.hp-Math.max(1,Math.round(def.damage*(1-this.stats.armor))));p.hit=.38;if(p.hp===0){this.mode='dead';this.clearInput();break;}}}}
  }
  damage(e:Actor,amount:number,dx:number,dz:number){if(!e.active||e.hp<=0)return false;const crit=this.random()<this.stats.critChance;e.hp=Math.max(0,e.hp-amount*(crit?2:1));e.hit=.24;this.move(e,dx*.25,dz*.25,ENEMIES[e.kind].radius);if(e.hp===0)this.kill(e);return true;}
  effect(x:number,z:number,endX:number,endZ:number,hit:boolean,element:Element,size=1){const fx=this.effects.find(f=>f.life===0)??this.effects[this.shots%this.effects.length];Object.assign(fx,{x,z,endX,endZ,life:.7,hit,element,size});}
  fire(){const p=this.player,w=this.weapon;this.cooldown=1/(w.fireRate*this.stats.fireRate);this.recoil=w.id==='hellbreaker'?.22:w.id==='absolute-zero'?.18:.12;this.shots++;playCue('shot',w.element);
    for(let pellet=0;pellet<w.projectileCount;pellet++){
      const yaw=p.yaw+(this.random()-.5)*w.spread,dx=Math.sin(yaw),dz=Math.cos(yaw);
      // Start inside the player's safe body radius, before any point-blank enemy.
      const x=p.x+dx*SHOT_RAY_START,z=p.z+dz*SHOT_RAY_START;
      const range=w.range*this.stats.range;
      let obstacleDistance=range;
      for(const o of obstacles)obstacleDistance=Math.min(obstacleDistance,circleEntry(x,z,dx,dz,o.x,o.z,o.radius));
      const targets:{e:Actor;t:number}[]=[];
      for(const e of this.enemies){if(!e.active||e.hp<=0)continue;
        const t=circleEntry(x,z,dx,dz,e.x,e.z,ENEMIES[e.kind].radius);
        if(t<obstacleDistance&&t<=range)targets.push({e,t});
      }
      targets.sort((a,b)=>a.t-b.t);
      let hits=0,impact=obstacleDistance;
      for(const target of targets){if(hits>=w.penetration)break;hits++;impact=target.t;
        this.damage(target.e,w.damage*this.stats.damage,dx,dz);
        if(w.burn)target.e.burn=Math.max(target.e.burn,w.burn);
        if(w.slow)target.e.slow=Math.max(target.e.slow,2.8);
        if(w.explosion)for(const other of this.enemies){if(other!==target.e&&other.active&&other.hp>0&&Math.hypot(other.x-target.e.x,other.z-target.e.z)<w.explosion)this.damage(other,w.damage*.45*this.stats.damage,dx,dz);}
      }
      if(w.chain&&hits>0){let from=targets[0].e;for(let c=0;c<w.chain;c++){let next:Actor|undefined,dist=4;for(const e of this.enemies){const q=Math.hypot(e.x-from.x,e.z-from.z);if(e!==from&&e.active&&e.hp>0&&q<dist){dist=q;next=e;}}if(!next)break;this.damage(next,w.damage*.55*this.stats.damage,0,0);this.effect(from.x,from.z,next.x,next.z,true,'volt',.7);from=next;}}
      const hitX=x+dx*impact,hitZ=z+dz*impact;
      if(pellet===0)this.lastRay={originX:x,originZ:z,hitX,hitZ,hit:hits>0,blocked:obstacleDistance<range&&hits===0};
      // The visible beam begins at the barrel, except when an enemy is closer
      // than the barrel: then only the impact spark is visible, never a backward beam.
      const muzzleDistance=Math.min(impact+SHOT_RAY_START,VISUAL_MUZZLE_DISTANCE);
      this.effect(p.x+dx*muzzleDistance,p.z+dz*muzzleDistance,hitX,hitZ,hits>0,w.element,w.id==='hellbreaker'?1.5:w.id==='absolute-zero'?1.25:1);
    }
  }
}
export {ABSOLUTE_ZERO,HELLBREAKER,THUNDERSTORM};
export const sim=new Simulation();
