const fs = require('node:fs')
const ts = require('typescript')
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText, filename)
const {test}=require('node:test')
const assert=require('node:assert/strict')
const root='../components/games/sovereign-clash/game/'
const {useGameStore,spend,canAfford}=require(root+'store.ts')
const {createBuilding,createUnit,createResource,generateWorld}=require(root+'mapGen.ts')
const {tickSimulation}=require(root+'simulation.ts')
const {moveTowards}=require(root+'pathfinding.ts')
const {MODERN_TRAINING,COSTS,UNIT_STATS}=require(root+'constants.ts')
const {canAttackTarget,isUnit,isShip}=require(root+'types.ts')
const {isDry}=require(root+'terrain.ts')
function world(civ='british',terrain='grassland'){
 useGameStore.getState().setCivilizations(civ,civ,terrain)
 const tc=createBuilding('tc','townCenter','player',-55,-55)
 const enemy=createBuilding('enemy','townCenter','enemy',55,55)
 useGameStore.setState({entities:{tc,enemy},selectedId:'tc',selectedIds:['tc'],playerAge:3,enemyAge:3,wood:10000,food:10000,gold:10000,petrol:0,metal:0,helpOpen:false,civModalOpen:false,winner:null,aging:false,gameTime:0,nextId:10000,waveIndex:3,waveStartTime:0})
 return useGameStore.getState()
}
for(const civ of ['indian','british','japanese','french'])test(`${civ}: advances to Modern and trains all eight roles with real supply costs`,()=>{
 let s=world(civ); s.startAgeUp();assert.equal(s.food,7000);assert.equal(s.gold,7800)
 useGameStore.setState({ageTimer:.01});tickSimulation(.05);s=useGameStore.getState();assert.equal(s.playerAge,4)
 s.startAgeUp();assert.equal(s.aging,false)
 for(const [building,kinds] of Object.entries(MODERN_TRAINING)){
  const b=createBuilding('b',building,'player',-45,-45);s.entities.b=b
  useGameStore.setState({selectedId:'b',selectedIds:['b'],petrol:0,metal:0})
  s=useGameStore.getState();s.train(kinds[0]);assert.equal(b.trainQueue.length,0)
  useGameStore.setState({petrol:10000,metal:10000});s=useGameStore.getState()
  for(const kind of kinds){const before=s.metal;s.train(kind);assert.equal(s.metal,before-COSTS[kind].metal);assert.ok(isUnit(createUnit('u',kind,'player',0,0)))}
  assert.equal(b.trainQueue.length,kinds.length)
 }
})
test('petrol and metal cannot be overspent, and workers drill and deliver both',()=>{
 let s=world();assert.equal(canAfford(COSTS.tank,10000,10000,10000),false)
 assert.equal(spend(COSTS.tank,'player'),false);assert.equal(s.gold,10000)
 for(const [kind,resource] of [['oilWell','petrol'],['metalDeposit','metal']]){
  s=world();const v=createUnit('v','villager','player',-51,-55),node=createResource('node',kind,-49,-55)
  s.entities.v=v;s.entities.node=node;useGameStore.setState({selectedId:'v',selectedIds:['v']})
  s=useGameStore.getState();s.issueEntityOrder('node');assert.equal(v.order.type,'idle')
  useGameStore.setState({playerAge:4});s=useGameStore.getState();s.issueEntityOrder('node')
  for(let i=0;i<600;i++)tickSimulation(.05)
  assert.ok(useGameStore.getState()[resource]>0);assert.ok(node.amount<12000)
 }
})
test('every terrain contains accessible reserves for both bases',()=>{
 for(const terrain of ['grassland','lake','river','oasis']){
  const ents=Object.values(generateWorld('british',terrain).entities)
  for(const kind of ['oilWell','metalDeposit'])for(const side of [-1,1]){
   const reserves=ents.filter(e=>e.kind===kind&&Math.sign(e.x)===side)
   assert.equal(reserves.length,2,`${terrain} ${kind} ${side}`)
   assert.ok(reserves.every(e=>isDry(terrain,e.x,e.z,2)))
  }
 }
})
test('helicopters fly across water while tanks stay on land; obsolete troops cannot attack aircraft',()=>{
 world('british','lake');const h=createUnit('h','helicopter','player',-35,0)
 for(let i=0;i<200;i++)moveTowards(h,35,0,.05,[],.3)
 assert.ok(h.x>34);assert.equal(h.y,5);assert.equal(isShip(h),false)
 for(const kind of ['pikeman','falconet','tank','heavyArtillery','warship'])assert.equal(canAttackTarget({kind},h),false)
 assert.equal(canAttackTarget({kind:'rocketTrooper'},h),true)
 assert.equal(canAttackTarget({kind:'destroyer'},h),true)
})
test('rockets damage helicopters and modern enemies do not revert to Industrial',()=>{
 const s=world();useGameStore.setState({playerAge:4,gameTime:2400,waveStartTime:2400})
 const r=createUnit('r','rocketTrooper','player',0,0),h=createUnit('h','helicopter','enemy',0,8)
 s.entities.r=r;s.entities.h=h;r.order={type:'attack',x:0,z:8,targetId:'h'}
 for(let i=0;i<50;i++)tickSimulation(.05)
 assert.ok(h.hp<UNIT_STATS.helicopter.hp)
 assert.equal(useGameStore.getState().enemyAge,4)
})
test('switching to drilling delivers the old cargo before collecting petrol',()=>{
 const s=world();useGameStore.setState({playerAge:4})
 const v=createUnit('v','villager','player',-51,-55),oil=createResource('oil','oilWell',-49,-55)
 v.carryResource='food';v.carryAmount=15;v.order={type:'gather',x:oil.x,z:oil.z,targetId:'oil'}
 s.entities.v=v;s.entities.oil=oil
 tickSimulation(.05);assert.equal(v.order.type,'return');assert.equal(v.carryResource,'food')
 tickSimulation(.05);assert.equal(useGameStore.getState().food,10015);assert.equal(useGameStore.getState().petrol,0)
})
