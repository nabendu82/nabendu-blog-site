const fs = require('node:fs')
const ts = require('typescript')
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText, filename)
const {test}=require('node:test')
const assert=require('node:assert/strict')
const root='../components/games/sovereign-clash/game/'
const {applyModernDoctrine,modernTraining,modernReload}=require(root+'modern.ts')
const {createUnit,createBuilding}=require(root+'mapGen.ts')
const {useGameStore}=require(root+'store.ts')
const {tickSimulation}=require(root+'simulation.ts')
const {UNIT_STATS,COSTS}=require(root+'constants.ts')
const {canAttackTarget}=require(root+'types.ts')
function setup(civ='indian'){
 useGameStore.getState().setCivilizations(civ,'british','grassland')
 useGameStore.setState({entities:{tc:createBuilding('tc','townCenter','player',-80,-80),enemy:createBuilding('enemy','townCenter','enemy',80,80)},playerAge:4,enemyAge:4,wood:10000,food:10000,gold:10000,metal:10000,petrol:10000,gameTime:0,waveStartTime:0,waveIndex:0,nextId:10000,winner:null,aging:false,civModalOpen:false,helpOpen:false})
 return useGameStore.getState()
}
test('doctrines preserve damage, wait for Modern, and never stack on either team',()=>{
 for(const [civ,kind,hp,speed,attack,range] of [
 ['indian','helicopter',.85,1,1,0],['british','destroyer',1.25,1,1,3],
 ['british','heavyArtillery',1,.8,1,0],['japanese','tank',.85,1.25,1,0],
 ['japanese','jeep',1,1.2,1,0],['french','helicopter',1,1.15,1.25,0],['french','tank',.85,1,1,0],
 ])for(const team of ['player','enemy']){
 const e=createUnit('u',kind,team,0,0),base={...e};e.hp/=2
 applyModernDoctrine(e,civ,3);assert.equal(e.maxHp,base.maxHp);assert.equal(e.modernDoctrine,undefined)
 applyModernDoctrine(e,civ,4);assert.equal(e.maxHp,Math.round(base.maxHp*hp));assert.equal(e.hp,e.maxHp/2)
 assert.equal(e.speed,base.speed*speed);assert.equal(e.attack,Math.round(base.attack*attack));assert.equal(e.attackRange,base.attackRange+range)
 const upgraded={...e};applyModernDoctrine(e,civ,4);assert.deepEqual(e,upgraded)
 }
 assert.equal(modernReload(createUnit('t','tank','player',0,0),'japanese',4),.85)
})
test('only Modern Indian factories can pay for and queue Pinaka',()=>{
 for(const civ of ['indian','british','japanese','french']){
 const s=setup(civ),b=createBuilding('b','factory','player',-60,-60);s.entities.b=b
 useGameStore.setState({selectedId:'b',selectedIds:['b'],playerAge:3});useGameStore.getState().train('pinaka');assert.equal(b.trainQueue.length,0)
 useGameStore.setState({playerAge:4});useGameStore.getState().train('pinaka')
 assert.equal(b.trainQueue.length,civ==='indian'?1:0)
 assert.equal(useGameStore.getState().metal,10000-(civ==='indian'?COSTS.pinaka.metal:0))
 assert.equal(modernTraining('factory',civ).includes('pinaka'),civ==='indian')
 assert.equal(modernTraining('barracks',civ).includes('pinaka'),false)
 }
})
function battle(){
 const s=setup(),p=createUnit('p','pinaka','player',0,0),t=createBuilding('target','townCenter','enemy',0,22)
 s.entities.p=p;s.entities.target=t;p.order={type:'attack',targetId:'target',x:0,z:22};return {s,p,t}
}
test('Pinaka fires six distinct rockets and then reloads',()=>{
 const {s,p}=battle();for(let i=0;i<22;i++)tickSimulation(.05)
 assert.equal(Object.values(s.entities).filter(e=>e.sourceId==='p').length,6)
 assert.equal(p.salvoRemaining,0);assert.ok(p.attackTimer>4)
 assert.equal(canAttackTarget(p,createUnit('h','helicopter','enemy',0,0)),false)
})
test('moving cancels unlaunched rockets without refunding cooldown',()=>{
 const {s,p}=battle();tickSimulation(.05);assert.equal(p.salvoRemaining,5)
 p.order={type:'move',x:10,z:0};tickSimulation(.05)
 assert.equal(p.salvoRemaining,0);assert.ok(p.attackTimer>5)
 assert.equal(Object.values(s.entities).filter(e=>e.sourceId==='p').length,1)
})
test('Japanese reload and British anti-air bonuses affect actual shots',()=>{
 for(const [civ,kind,targetKind,range,reload,damage] of [
 ['japanese','tank','tank',10,1.36,UNIT_STATS.tank.attack],
 ['british','destroyer','helicopter',16,1.6,UNIT_STATS.destroyer.attack*1.5],
 ]){
 const s=setup(civ),u=createUnit('u',kind,'player',0,0),target=createUnit('target',targetKind,'enemy',0,range)
 s.entities.u=u;s.entities.target=target;u.order={type:'attack',x:0,z:range,targetId:'target'}
 tickSimulation(.05)
 assert.equal(u.attackTimer,reload)
 const shot=Object.values(s.entities).find(e=>e.sourceId==='u');assert.ok(shot);assert.equal(shot.damage,damage)
 }
})
