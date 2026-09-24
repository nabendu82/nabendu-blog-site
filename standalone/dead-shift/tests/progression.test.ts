import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../src/game/Simulation';
import { ABSOLUTE_ZERO,CONFIG,HELLBREAKER,SCRAP_RIFLE,THUNDERSTORM,UPGRADES,WALKER,xpThreshold } from '../src/game/config';

function fresh(){const s=new Simulation();s.reset();for(const e of s.enemies)e.active=false;s.stats.critChance=0;return s;}
function advance(s:Simulation,seconds:number){for(let n=0;n<seconds*60;n++)s.step(1/60);}
function upgrade(s:Simulation,id:string){const card=UPGRADES.find(u=>u.id===id)!;card.apply(s.stats,amount=>{s.player.hp=Math.min(s.stats.maxHp,s.player.hp+amount);});}

test('level thresholds rise by the documented formula',()=>{
  assert.deepEqual([1,2,3,4,5].map(level=>xpThreshold(level)),[36,54,72,90,108]);
});
test('enemy death through XP pickup opens exactly one paused upgrade and resumes',()=>{
  const s=fresh();s.player.yaw=0;
  for(let n=0;n<3;n++)Object.assign(s.enemies[n],{active:true,kind:'walker',x:0,z:2.8+n*.35,hp:SCRAP_RIFLE.damage,rewardDropped:false});
  for(let n=0;n<3;n++)s.fire();
  assert.equal(s.kills,3);assert.equal(s.pickups.filter(p=>p.active&&p.kind==='xp').length,3);
  advance(s,.05);assert.equal(s.level,2);assert.equal(s.xp,0);assert.equal(s.xpNext,54);assert.equal(s.pendingLevels,1);assert.equal(s.mode,'levelup');assert.equal(s.upgradeChoices.length,3);
  const frozenTime=s.time,frozenShots=s.shots,frozenHp=s.player.hp;
  s.input.fire=true;advance(s,2);assert.equal(s.time,frozenTime);assert.equal(s.shots,frozenShots);assert.equal(s.player.hp,frozenHp);
  const before=JSON.stringify(s.stats);s.chooseUpgrade(s.upgradeChoices[0].id);
  assert.notEqual(JSON.stringify(s.stats),before);assert.equal(s.pendingLevels,0);assert.equal(s.mode,'playing');
  s.gainXp(54);assert.equal(s.level,3);assert.equal(s.xpNext,72);assert.equal(s.pendingLevels,1);assert.equal(s.mode,'levelup');
});
test('all eight upgrade cards modify their advertised stat',()=>{
  const fields={damage:'damage','fire-rate':'fireRate',movement:'movement','max-hp':'maxHp',pickup:'pickupRadius',crit:'critChance',range:'range',armor:'armor'} as const;
  assert.equal(UPGRADES.length,Object.keys(fields).length);
  for(const [id,field] of Object.entries(fields)){
    const s=fresh(),old=s.stats[field as keyof typeof s.stats];s.player.hp=60;upgrade(s,id);
    assert.ok(s.stats[field as keyof typeof s.stats]>old,`${id} must change ${field}`);
    if(id==='max-hp')assert.equal(s.player.hp,80);
  }
});
test('damage, critical chance, fire rate, range and movement change combat behavior',()=>{
  const shot=(cards:string[])=>{const s=fresh();for(const id of cards)upgrade(s,id);Object.assign(s.enemies[0],{active:true,kind:'walker',x:0,z:5,hp:100});s.player.yaw=0;s.fire();return s;};
  assert.ok(shot(['damage']).enemies[0].hp<shot([]).enemies[0].hp);
  const forced=fresh();forced.stats.critChance=1;Object.assign(forced.enemies[0],{active:true,kind:'walker',x:0,z:5,hp:100});forced.player.yaw=0;forced.fire();assert.equal(forced.enemies[0].hp,44);
  assert.ok(shot(['fire-rate']).cooldown<shot([]).cooldown);
  const out=fresh();out.weapon={...SCRAP_RIFLE,range:2};Object.assign(out.enemies[0],{active:true,kind:'walker',x:0,z:5,hp:100});out.player.yaw=0;out.fire();assert.equal(out.enemies[0].hp,100);
  const farther=fresh();farther.weapon={...SCRAP_RIFLE,range:2};upgrade(farther,'range');Object.assign(farther.enemies[0],{active:true,kind:'walker',x:0,z:5,hp:100});farther.player.yaw=0;farther.fire();assert.ok(farther.enemies[0].hp<100);
  const base=fresh(),fast=fresh();base.input.x=1;fast.input.x=1;upgrade(fast,'movement');advance(base,.5);advance(fast,.5);assert.ok(fast.player.x>base.player.x);
});
test('pickup radius and armor affect collection and incoming damage',()=>{
  const normal=fresh(),magnet=fresh();normal.drop(2.6,normal.player.z,'xp',5);magnet.drop(2.6,magnet.player.z,'xp',5);upgrade(magnet,'pickup');normal.step(1/60);magnet.step(1/60);assert.equal(normal.xp,0);assert.equal(magnet.xp,5);
  const naked=fresh(),armored=fresh();upgrade(armored,'armor');for(const s of [naked,armored])Object.assign(s.enemies[0],{active:true,kind:'walker',x:0,z:2.8,hp:WALKER.health,attack:0});naked.step(1/60);armored.step(1/60);assert.ok(armored.player.hp>naked.player.hp);
});
test('level five offers exactly three weapons, freezes simulation, and keeps summary data',()=>{
  const s=fresh();s.gainXp(36+54+72+90);assert.equal(s.level,5);assert.equal(s.pendingLevels,4);
  for(let n=0;n<4;n++){assert.equal(s.mode,'levelup');s.chooseUpgrade(s.upgradeChoices[0].id);}
  assert.equal(s.mode,'mutation');assert.equal(s.weapon.id,'scrap-rifle');const frozen=s.time;advance(s,3);assert.equal(s.time,frozen);
  s.chooseMutation('thunderstorm');assert.equal(s.mode,'evolving');assert.equal(s.weapon.id,'thunderstorm');assert.equal(s.runSummary.currentWeapon,'THUNDERSTORM');
  assert.deepEqual(Object.keys(s.runSummary).sort(),['currentWeapon','damage','dna','kills','level','survivalTime','xp']);
  s.finishEvolution();assert.equal(s.mode,'playing');
});
test('evolved weapons have distinct damage behaviors',()=>{
  const lightning=fresh();lightning.weapon=THUNDERSTORM;for(let n=0;n<3;n++)Object.assign(lightning.enemies[n],{active:true,kind:'tank',x:n*.6,z:5+n*.2,hp:500});lightning.player.yaw=0;lightning.fire();assert.ok(lightning.enemies[0].hp<500);assert.ok(lightning.enemies[1].hp<500);assert.ok(lightning.effects.some(f=>f.life>0&&f.element==='volt'));
  const fire=fresh();fire.weapon=HELLBREAKER;Object.assign(fire.enemies[0],{active:true,kind:'tank',x:0,z:5,hp:500});Object.assign(fire.enemies[1],{active:true,kind:'tank',x:1,z:5,hp:500});fire.player.yaw=0;fire.fire();assert.ok(fire.enemies[0].hp<500);assert.ok(fire.enemies[1].hp<500);assert.ok(fire.enemies[0].burn>0);
  const ice=fresh();ice.weapon=ABSOLUTE_ZERO;for(let n=0;n<2;n++)Object.assign(ice.enemies[n],{active:true,kind:'tank',x:0,z:5+n*3,hp:500});ice.player.yaw=0;ice.fire();assert.ok(ice.enemies.every((e,n)=>n>=2||e.hp<500&&e.slow>0));
  assert.ok(THUNDERSTORM.fireRate>SCRAP_RIFLE.fireRate);assert.ok(HELLBREAKER.projectileCount>1);assert.ok(ABSOLUTE_ZERO.penetration>1);assert.equal(CONFIG.mutationLevel,5);
});
