import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../src/game/Simulation';
import { CONFIG, WALKER } from '../src/game/config';
import { runShootingDiagnostics } from '../src/game/shootingDiagnostics';
function fresh(){const s=new Simulation();s.reset();for(const e of s.enemies)e.active=false;return s;}
function advance(s:Simulation,seconds:number){for(let i=0;i<seconds*60;i++)s.step(1/60);}
test('normalised movement',()=>{const a=fresh(),b=fresh();a.input.x=1;b.input.x=1;b.input.z=-1;advance(a,.5);advance(b,.5);assert.ok(Math.abs(Math.hypot(a.vx,a.vz)-Math.hypot(b.vx,b.vz))<.001);});
test('aiming while moving fires at target',()=>{const s=fresh(),e=s.enemies[0];Object.assign(e,{active:true,kind:'walker',x:0,z:4,hp:WALKER.health});s.input.aiming=true;s.input.aimX=e.x;s.input.aimZ=e.z;s.input.fire=true;advance(s,.2);assert.ok(s.shots>=1);assert.ok(e.hp<WALKER.health);});
test('rifle kills and recycles corpse',()=>{const s=fresh(),e=s.enemies[0];Object.assign(e,{active:true,x:0,z:6,hp:WALKER.health});s.player.yaw=0;for(let i=0;i<3;i++)s.fire();assert.equal(e.hp,0);assert.equal(s.kills,1);advance(s,3.1);assert.equal(e.active,false);});
test('pause freezes and resume continues',()=>{const s=fresh();s.fire();s.pause();const frozen=JSON.stringify(s);advance(s,2);assert.equal(JSON.stringify(s),frozen);s.resume();advance(s,.1);assert.ok(s.time>.09);});
test('restart resets state and survivor weapon',()=>{const s=fresh();s.kills=5;s.player.hp=0;s.mode='dead';s.reset();assert.equal(s.player.hp,100);assert.equal(s.kills,0);assert.equal(s.weapon.id,'survivor-ak');assert.equal(s.enemies.filter(e=>e.active).length,8);});
test('pools remain bounded',()=>{const s=fresh();for(let i=0;i<1000;i++){s.spawn();s.fire();}assert.equal(s.enemies.length,CONFIG.maxEnemies);assert.equal(s.effects.length,CONFIG.maxEffects);});
test('cars block movement and shots',()=>{const s=fresh();s.player.x=-7;s.player.z=-9;s.move(s.player,0,3,.48);assert.ok(Math.hypot(s.player.x+7,s.player.z+5)>=2.35+.48-.0001);Object.assign(s.enemies[0],{active:true,hp:70,x:-7,z:-1});s.player.x=-7;s.player.z=-9;s.player.yaw=0;s.fire();assert.equal(s.enemies[0].hp,70);});
test('diagnostics strike walkers across ranges',()=>{for(const result of runShootingDiagnostics([.75,1,1.5,2,3,8,18])){assert.equal(result.hit,true);assert.ok(result.hitPoint[1]>=result.origin[1]);}});
test('point blank ray still hits',()=>{const s=fresh(),e=s.enemies[0];Object.assign(e,{active:true,x:s.player.x,z:s.player.z+.75,hp:WALKER.health});s.player.yaw=0;s.fire();assert.ok(e.hp<WALKER.health);assert.equal(s.lastRay?.hit,true);});
test('XP choice resumes play',()=>{const s=fresh();s.drop(s.player.x,s.player.z,'xp',s.xpNext);advance(s,.05);assert.equal(s.mode,'levelup');const before=JSON.stringify(s.stats);s.chooseUpgrade(s.upgradeChoices[0].id);assert.equal(s.mode,'playing');assert.notEqual(JSON.stringify(s.stats),before);});
test('DNA pickups and grounded mutations',()=>{for(const id of ['volt','fire','cryo','mass'] as const){const s=fresh();s.drop(s.player.x,s.player.z,'dna',1,id);advance(s,.05);assert.equal(s.dna[id],1);}for(const id of ['rpk','breacher','svd-hunter']){const s=fresh();s.mode='mutation';s.chooseMutation(id);assert.equal(s.weapon.id,id);s.finishEvolution();assert.equal(s.mode,'playing');}});
test('level-up, mutation and evolution freeze',()=>{for(const mode of ['levelup','mutation','evolving'] as const){const s=fresh();s.mode=mode;const before=JSON.stringify(s);advance(s,2);assert.equal(JSON.stringify(s),before);}});
