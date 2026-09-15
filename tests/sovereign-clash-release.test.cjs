const fs = require('node:fs')
const ts = require('typescript')
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText, filename)
const {test}=require('node:test')
const assert=require('node:assert/strict')
const root='../components/games/sovereign-clash/game/'
const {createUnit,createBuilding}=require(root+'mapGen.ts')
const {useGameStore}=require(root+'store.ts')
const {tickSimulation}=require(root+'simulation.ts')
function setup(civ='indian'){
 useGameStore.getState().setCivilizations(civ,'british','grassland')
 useGameStore.setState({entities:{tc:createBuilding('tc','townCenter','player',-80,-80),enemy:createBuilding('enemy','townCenter','enemy',80,80)},playerAge:4,enemyAge:4,wood:10000,food:10000,gold:10000,metal:10000,petrol:10000,gameTime:0,waveStartTime:0,waveIndex:0,nextId:10000,winner:null,aging:false,civModalOpen:false,helpOpen:false})
 return useGameStore.getState()
}
test('repeated attack orders cannot bypass a weapon reload',()=>{
 const s=setup(),u=createUnit('u','pinaka','player',0,0),target=createBuilding('target','townCenter','enemy',0,22)
 Object.assign(s.entities,{u,target});useGameStore.setState({selectedId:'u',selectedIds:['u']})
 u.attackTimer=5
 for(let i=0;i<20;i++)useGameStore.getState().issueEntityOrder('target')
 assert.equal(u.attackTimer,5)
 tickSimulation(.05);assert.equal(Object.values(s.entities).filter(e=>e.sourceId==='u').length,0)
})
test('elephant trample damages ground troops but never aircraft',()=>{
 const s=setup(),u=createUnit('u','mahout','player',0,0),h=createUnit('h','helicopter','enemy',0,0),v=createUnit('v','villager','enemy',0,0)
 Object.assign(s.entities,{u,h,v});u.order={type:'move',x:10,z:0}
 useGameStore.setState({playerAge:2,enemyAge:2})
 const hp=h.hp,vhp=v.hp;tickSimulation(.05)
 assert.equal(h.hp,hp);assert.ok(v.hp<vhp)
})
test('defensive towers skip untargetable aircraft and fire at ground enemies',()=>{
 const s=setup(),tower=createBuilding('tower','agraFort','player',0,0),h=createUnit('h','helicopter','enemy',0,2),v=createUnit('v','villager','enemy',0,5)
 Object.assign(s.entities,{tower,h,v});tickSimulation(.05)
 const shot=Object.values(s.entities).find(e=>e.sourceId==='tower')
 assert.ok(shot);assert.equal(shot.targetId,'v')
})
test('anti-air explosions stay airborne after their target is removed',()=>{
 const s=setup(),r=createUnit('r','rocketTrooper','player',0,0),h=createUnit('h','helicopter','enemy',0,8),v=createUnit('v','villager','enemy',0,8)
 Object.assign(s.entities,{r,h,v});r.order={type:'attack',x:0,z:8,targetId:'h'}
 tickSimulation(.05)
 const shot=Object.values(s.entities).find(e=>e.sourceId==='r');assert.ok(shot)
 delete s.entities.h;delete s.entities.r
 v.speed=0;const hp=v.hp
 for(let i=0;i<40;i++)tickSimulation(.05)
 assert.equal(v.hp,hp)
})
test('late-game smoke: all terrains and civilizations retain finite state under mixed armies',()=>{
 const civs=['indian','british','japanese','french'],terrains=['grassland','lake','river','oasis']
 const kinds=['rifleman','machineGunner','rocketTrooper','tank','heavyArtillery','jeep','helicopter']
 for(let c=0;c<4;c++){
 useGameStore.getState().setCivilizations(civs[c],civs[(c+1)%4],terrains[c],'medium')
 const s=useGameStore.getState()
 useGameStore.setState({playerAge:4,enemyAge:4,gameTime:10800,waveStartTime:10800,waveIndex:40,civModalOpen:false,helpOpen:false})
 for(const team of ['player','enemy'])for(let i=0;i<35;i++){
 const sign=team==='player'?-1:1,u=createUnit(`${team}-${i}`,kinds[i%kinds.length],team,sign*(100+i%5*3),sign*(100+Math.floor(i/5)*3))
 u.order={type:'attackMove',x:-sign*110,z:-sign*110};s.entities[u.id]=u
 }
 for(let i=0;i<300;i++)tickSimulation(.1)
 for(const e of Object.values(s.entities))for(const field of ['x','y','z','hp','maxHp','speed'])assert.ok(Number.isFinite(e[field]),`${terrains[c]} ${e.kind} ${field}`)
 for(const resource of ['wood','food','gold','petrol','metal','enemyWood','enemyFood','enemyGold','enemyPetrol','enemyMetal'])assert.ok(Number.isFinite(s[resource])&&s[resource]>=0,resource)
 assert.equal(s.winner,null)
 }
})
