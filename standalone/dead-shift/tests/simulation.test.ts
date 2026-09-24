import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../src/game/Simulation';
import { CONFIG,WALKER } from '../src/game/config';
import { runShootingDiagnostics } from '../src/game/shootingDiagnostics';
function fresh(){const s=new Simulation();s.reset();for(const e of s.enemies)e.active=false;return s;}
function advance(s:Simulation,seconds:number){for(let i=0;i<seconds*60;i++)s.step(1/60);}
test('normalised diagonal speed, acceleration and release deceleration',()=>{const a=fresh(),b=fresh();a.input.x=1;b.input.x=1;b.input.z=-1;advance(a,.5);advance(b,.5);assert.ok(Math.abs(Math.hypot(a.vx,a.vz)-Math.hypot(b.vx,b.vz))<.001);a.clearInput();advance(a,.5);assert.ok(Math.abs(a.vx)<.01);});
test('turning and aiming while moving keeps fire directed at the target',()=>{
  const s=fresh(),walker=s.enemies[0];Object.assign(walker,{active:true,kind:'walker',x:0,z:4,hp:WALKER.health});
  s.input.x=1;s.input.z=-1;s.input.aiming=true;s.input.aimX=walker.x;s.input.aimZ=walker.z;s.input.fire=true;
  advance(s,.2);assert.ok(s.player.x>0&&s.player.z<2);assert.ok(s.shots>=1);assert.ok(walker.hp<WALKER.health);
  const expected=Math.atan2(s.input.aimX-s.player.x,s.input.aimZ-s.player.z);assert.ok(Math.abs(s.player.yaw-expected)<.001);
  s.input.aiming=false;s.input.fire=false;s.input.x=-1;s.input.z=0;advance(s,.4);
  assert.ok(s.vx<0);assert.ok(Math.abs(s.player.yaw-Math.atan2(s.vx,s.vz))<.001);
});
test('rifle damage, death, single kill and delayed corpse recycling',()=>{const s=fresh(),e=s.enemies[0];Object.assign(e,{active:true,x:0,z:6,hp:WALKER.health});s.player.yaw=0;for(let i=0;i<3;i++)s.fire();assert.equal(e.hp,0);assert.equal(s.kills,1);s.fire();assert.equal(s.kills,1);advance(s,1.25);assert.equal(e.active,true);advance(s,1.85);assert.equal(e.active,false);});
test('pause freezes all simulation fields and resume continues',()=>{const s=fresh();s.fire();s.pause();const frozen=JSON.stringify(s);advance(s,10);assert.equal(JSON.stringify(s),frozen);s.resume();advance(s,.1);assert.ok(s.time>.09);});
test('walkers attack on cooldown, kill player, death stops simulation',()=>{const s=fresh();Object.assign(s.enemies[0],{active:true,x:0,z:2.8,hp:WALKER.health,attack:0});advance(s,.1);assert.equal(s.player.hp,88);advance(s,.5);assert.equal(s.player.hp,88);advance(s,12);assert.equal(s.mode,'dead');assert.equal(s.player.hp,0);const t=s.time;advance(s,2);assert.equal(s.time,t);});
test('restart resets health, enemies, effects, timers, input and kills',()=>{const s=fresh();s.kills=5;s.player.hp=0;s.mode='dead';s.fire();s.reset();assert.equal(s.player.hp,100);assert.equal(s.kills,0);assert.equal(s.time,0);assert.equal(s.effects.filter(e=>e.life>0).length,0);assert.equal(s.enemies.filter(e=>e.active).length,8);assert.equal(s.mode,'playing');});
test('enemy and effect pools remain bounded under repeated usage',()=>{const s=fresh();for(let i=0;i<1000;i++){s.spawn();s.fire();}assert.equal(s.enemies.length,CONFIG.maxEnemies);assert.equal(s.effects.length,CONFIG.maxEffects);});
test('solid cars stop movement and block shots',()=>{const s=fresh();s.player.x=-7;s.player.z=-9;s.move(s.player,0,3,.48);assert.ok(Math.hypot(s.player.x+7,s.player.z+5)>=2.35+.48-.0001);Object.assign(s.enemies[0],{active:true,hp:70,x:-7,z:-1});s.player.x=-7;s.player.z=-9;s.player.yaw=0;s.fire();assert.equal(s.enemies[0].hp,70);});
test('point-blank, medium and long shots strike the first Walker body',()=>{
  const results=runShootingDiagnostics([.75,1,1.5,2,3,8,18]);
  for(const result of results){assert.equal(result.hit,true,`${result.distance}m should hit`);assert.ok(result.hitPoint[1]>=result.origin[1],`${result.distance}m impact should be ahead of the ray origin`);}
});
test('a shot whose ray begins inside a Walker still hits',()=>{
  const s=fresh(),e=s.enemies[0];Object.assign(e,{active:true,kind:'walker',x:s.player.x,z:s.player.z+.45,hp:WALKER.health});s.player.yaw=0;s.fire();assert.ok(e.hp<WALKER.health);assert.equal(s.lastRay?.hit,true);
});
test('rifle trace never starts behind the impact at point blank',()=>{
  const s=fresh(),e=s.enemies[0];Object.assign(e,{active:true,kind:'walker',x:s.player.x,z:s.player.z+.75,hp:WALKER.health});s.player.yaw=0;s.fire();const fx=s.effects.find(f=>f.life>0)!;assert.ok(fx.z<=fx.endZ+1e-6);assert.ok(fx.z>=s.player.z);
});
test('XP collection freezes at level-up and a data-driven choice resumes play',()=>{const s=fresh();s.drop(s.player.x,s.player.z,'xp',s.xpNext);advance(s,.05);assert.equal(s.level,2);assert.equal(s.mode,'levelup');assert.equal(s.upgradeChoices.length,3);const before=JSON.stringify(s.stats);s.chooseUpgrade(s.upgradeChoices[0].id);assert.equal(s.mode,'playing');assert.notEqual(JSON.stringify(s.stats),before);});
test('DNA pickups collect by proximity and all mutation branches swap weapon data',()=>{for(const id of ['volt','fire','cryo','mass'] as const){const s=fresh();s.drop(s.player.x,s.player.z,'dna',1,id);advance(s,.05);assert.equal(s.dna[id],1);}for(const id of ['thunderstorm','hellbreaker','absolute-zero']){const s=fresh();s.mode='mutation';s.chooseMutation(id);assert.equal(s.weapon.id,id);assert.equal(s.mode,'evolving');s.finishEvolution();assert.equal(s.mode,'playing');}});
test('level five opens mutation after upgrade and restart clears all progression',()=>{const s=fresh();s.level=4;s.xpNext=1;s.gainXp(1);assert.equal(s.level,5);s.chooseUpgrade(s.upgradeChoices[0].id);assert.equal(s.mode,'mutation');s.chooseMutation('thunderstorm');s.dna.volt=4;s.reset();assert.equal(s.level,1);assert.equal(s.xp,0);assert.equal(s.weapon.id,'scrap-rifle');assert.deepEqual(s.dna,{volt:0,fire:0,cryo:0,mass:0});assert.equal(s.pickups.filter(p=>p.active).length,0);});
test('level-up and mutation selections freeze simulation timers and AI',()=>{for(const mode of ['levelup','mutation','evolving'] as const){const s=fresh();s.mode=mode;const before=JSON.stringify(s);advance(s,2);assert.equal(JSON.stringify(s),before);}});
