const fs=require('node:fs'),ts=require('typescript')
require.extensions['.ts']=(module,filename)=>module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,filename)
const {test}=require('node:test'),assert=require('node:assert/strict')
const root='../components/games/sovereign-clash/game/'
const {useGameStore,spawnUnit,popCounts}=require(root+'store.ts')
const {createBuilding,createUnit,createResource,generateWorld}=require(root+'mapGen.ts')
const {tickSimulation}=require(root+'simulation.ts')
const {moveTowards}=require(root+'pathfinding.ts')
const {isWater,isSailable,isDry,riverCenter,bridgeHeight,terrainRoute}=require(root+'terrain.ts')
const {NAVIES}=require(root+'navy.ts')
const {UNIT_STATS}=require(root+'constants.ts')
function world(civ='british',terrain='lake'){
  useGameStore.getState().setCivilizations(civ,'japanese',terrain)
  const tc=createBuilding('tc','townCenter','player',-55,-55,true),enemy=createBuilding('enemy','townCenter','enemy',55,55,true)
  const dock=createBuilding('dock','dock','player',-31.5,0,true)
  useGameStore.setState({entities:{tc,enemy,dock},selectedId:'dock',selectedIds:['dock'],playerAge:2,enemyAge:0,wood:10000,food:10000,gold:10000,helpOpen:false,civModalOpen:false,winner:null,gameTime:0,nextId:10000,navyTimer:0})
  return dock
}
const advance=(seconds)=>{for(let i=0;i<seconds*30;i++)tickSimulation(1/30)}
for(const civ of Object.keys(NAVIES))test(`${civ}: dock age gates and fleet bonuses`,()=>{
  const dock=world(civ)
  useGameStore.setState({playerAge:0})
  for(const kind of ['fishingBoat','transportShip','warship'])useGameStore.getState().train(kind)
  assert.deepEqual(dock.trainQueue.map(j=>j.kind),['fishingBoat'])
  useGameStore.setState({playerAge:1});useGameStore.getState().train('transportShip');useGameStore.getState().train('warship')
  assert.equal(dock.trainQueue.length,2)
  useGameStore.setState({playerAge:2});useGameStore.getState().train('warship')
  assert.equal(dock.trainQueue.length,3)
  dock.trainQueue[0].remaining=0;advance(.1)
  assert.ok(Object.values(useGameStore.getState().entities).some(e=>e.kind==='fishingBoat'))
  for(const kind of ['fishingBoat','transportShip','warship']){
    const e=spawnUnit(kind,'player',dock)
    assert.ok(isSailable('lake',e.x,e.z,e.radius))
    assert.equal(e.maxHp,civ==='japanese'?Math.round(UNIT_STATS[kind].hp*1.15):UNIT_STATS[kind].hp)
    assert.equal(e.speed,UNIT_STATS[kind].speed*(civ==='french'?1.1:1))
    if(kind==='warship')assert.equal(e.attackRange,UNIT_STATS[kind].range+(civ==='british'?2:0))
  }
})
test('water maps generate finite shore and deep fish; plains have none',()=>{
  for(const terrain of ['grassland','lake','river','oasis']){
    const fish=Object.values(generateWorld('british',terrain).entities).filter(e=>e.kind==='fish')
    if(terrain==='grassland'){assert.equal(fish.length,0);continue}
    assert.ok(fish.length>10);assert.ok(fish.some(e=>e.shoreFish))
    if(terrain!=='river')assert.ok(fish.some(e=>!e.shoreFish))
    for(const e of fish){assert.ok(isWater(terrain,e.x,e.z));assert.equal(e.resourceType,'food');assert.ok(e.amount>0)}
  }
})
test('villagers catch shore fish and deliver food without entering water',()=>{
  world();const s=useGameStore.getState()
  const fish=createResource('fish','fish',-28.3,0);fish.shoreFish=true
  const villager=createUnit('v','villager','player',-35,0)
  Object.assign(s.entities,{fish,v:villager});s.select('v');s.issueEntityOrder('fish')
  advance(20)
  assert.ok(useGameStore.getState().food>10000);assert.ok(fish.amount<900)
  assert.ok(isDry('lake',villager.x,villager.z,villager.radius))
  const deep=createResource('deep','fish',0,0);deep.shoreFish=false;s.entities.deep=deep
  villager.order.type='idle';useGameStore.getState().select('v');useGameStore.getState().issueEntityOrder('deep')
  assert.equal(villager.order.type,'idle')
})
test('fishing boats gather automatically and deliver to docks',()=>{
  const dock=world('indian'),s=useGameStore.getState(),boat=spawnUnit('fishingBoat','player',dock)
  s.entities.fish=createResource('fish','fish',-25,0)
  advance(25)
  assert.ok(useGameStore.getState().food>=10080)
  assert.ok(isSailable('lake',boat.x,boat.z,boat.radius));assert.ok(s.entities.fish.amount<900)
})
test('transports preserve passengers and population through boarding and shore unloading',()=>{
  const dock=world('french'),s=useGameStore.getState(),ship=spawnUnit('transportShip','player',dock)
  const troops=Array.from({length:13},(_,i)=>createUnit('u'+i,'sepoy','player',-31.8,i*.02))
  troops.forEach(e=>{e.hp=33;s.entities[e.id]=e})
  s.selectMany(troops.map(e=>e.id));useGameStore.getState().issueEntityOrder(ship.id);advance(.2)
  assert.equal(ship.passengers.length,12);assert.equal(popCounts(s.entities).pop,14)
  ship.x=0;ship.z=0;useGameStore.getState().select(ship.id);useGameStore.getState().unloadTransport()
  assert.equal(ship.passengers.length,12)
  ship.x=-26.8;useGameStore.getState().unloadTransport()
  assert.equal(ship.passengers.length,0);assert.equal(popCounts(s.entities).pop,14)
  for(const e of troops){assert.equal(s.entities[e.id],e);assert.equal(e.hp,33);assert.ok(isDry('lake',e.x,e.z,e.radius))}
})
test('Japanese infantry and artillery can leave the beach after transport unloading',()=>{
  world('japanese')
  const s=useGameStore.getState(),ship=createUnit('landing','transportShip','player',0,32.5)
  const troops=['flamingArrow','ashigaru','flamingArrow','samurai','flamingArrow'].map((kind,i)=>createUnit('landing-'+i,kind,'player',0,0))
  // Prime routes from the opposite bank before transport changes their position.
  for(const [i,e] of troops.entries()) {
    e.x=0;e.z=-40
    moveTowards(e,(i-2)*4,48,.1,[],.5)
  }
  ship.passengers=troops;s.entities[ship.id]=ship;s.select(ship.id);s.unloadTransport()
  assert.equal(ship.passengers.length,0)
  for(const [i,e] of troops.entries()) {
    let reached=false
    for(let frame=0;frame<700&&!reached;frame++){
      reached=moveTowards(e,(i-2)*4,48,.1,troops,.5)
      assert.ok(isDry('lake',e.x,e.z,e.radius),`${e.kind} crossed water`)
    }
    assert.ok(reached,`${e.kind} stuck at ${e.x},${e.z}`)
  }
})
test('troops already stranded on a narrow dry beach can route inland',()=>{
  world('japanese')
  for(const kind of ['ashigaru','flamingArrow']) {
    const e=createUnit('stranded-'+kind,kind,'player',0,35+UNIT_STATS[kind].radius+.21)
    let reached=false
    for(let i=0;i<500&&!reached;i++)reached=moveTowards(e,0,46,.1,[],.4)
    assert.ok(reached,`${kind} stuck at ${e.x},${e.z}`)
    assert.ok(isDry('lake',e.x,e.z,e.radius))
  }
})
test('ships navigate below both river bridges and cannot cross between oasis pools',()=>{
  world('british','river')
  const ship=createUnit('s','warship','player',riverCenter(-65),-65)
  let reached=false,belowBridge=false
  for(let i=0;i<2500&&!reached;i++){
    reached=moveTowards(ship,riverCenter(65),65,.1,[],.4)
    assert.ok(isSailable('river',ship.x,ship.z,ship.radius));assert.equal(ship.y,0)
    if(bridgeHeight('river',ship.x,ship.z)===5)belowBridge=true
  }
  assert.ok(reached);assert.ok(belowBridge)
  world('british','oasis');assert.equal(terrainRoute('oasis',-24,13,24,-13,true).length,0)
})
test('cannon ships damage hostile ships with projectiles',()=>{
  const dock=world(),s=useGameStore.getState(),ship=spawnUnit('warship','player',dock)
  const enemy=createUnit('foe','warship','enemy',ship.x+10,ship.z);s.entities.foe=enemy
  s.select(ship.id);s.issueEntityOrder(enemy.id);advance(5)
  assert.ok(enemy.hp<enemy.maxHp || enemy.dying)
})
test('enemy establishes a dock and a fishing and cannon fleet on every water map',()=>{
  for(const terrain of ['lake','river','oasis']){
    world('british',terrain);useGameStore.setState({enemyAge:2,enemyWood:10000,enemyGold:10000,enemyFood:10000})
    for(let i=0;i<4;i++){useGameStore.setState({navyTimer:25});advance(.1)}
    const enemies=Object.values(useGameStore.getState().entities).filter(e=>e.team==='enemy')
    assert.ok(enemies.some(e=>e.kind==='dock'),terrain+' dock')
    assert.equal(enemies.filter(e=>e.kind==='fishingBoat').length,2,terrain+' fishing')
    assert.ok(enemies.some(e=>e.kind==='warship'),terrain+' cannons')
  }
})
test('sinking transports remove their passengers and release population',()=>{
  const dock=world(),s=useGameStore.getState(),ship=spawnUnit('transportShip','player',dock)
  ship.passengers=[createUnit('passenger','sepoy','player',0,0)];ship.hp=1
  const foe=createUnit('foe','warship','enemy',ship.x+5,ship.z);s.entities.foe=foe
  foe.order={type:'attack',targetId:ship.id,x:ship.x,z:ship.z}
  advance(4)
  assert.equal(ship.passengers.length,0);assert.equal(popCounts(s.entities).pop,0)
})
test('large thirty-minute battlefield keeps local searches bounded',t=>{
  world('british','grassland');const s=useGameStore.getState()
  for(let i=0;i<1200;i++){const e=createResource('r'+i,'tree',-75+(i%40)*3.8,-75+Math.floor(i/40)*4.9);s.entities[e.id]=e}
  for(let i=0;i<150;i++){const e=createBuilding('b'+i,'house','player',-72+(i%15)*10,-72+Math.floor(i/15)*14,true);s.entities[e.id]=e}
  for(let i=0;i<250;i++){const e=createUnit('u'+i,'sepoy',i%2?'player':'enemy',-70+(i%25)*5.7,-65+Math.floor(i/25)*13);s.entities[e.id]=e}
  useGameStore.setState({gameTime:1800,playerAge:3,enemyAge:3})
  const {prepareSpatial,nearby}=require(root+'spatial.ts'),all=Object.values(s.entities)
  prepareSpatial(all);assert.ok(nearby(all,0,0,6).length<all.length/10)
  const samples=[]
  for(let i=0;i<120;i++){const start=performance.now();tickSimulation(1/30);samples.push(performance.now()-start)}
  samples.sort((a,b)=>a-b)
  t.diagnostic(`1,600+ entities, simulation median ${samples[60].toFixed(2)} ms; p95 ${samples[114].toFixed(2)} ms`)
  assert.ok(Object.values(s.entities).every(e=>Number.isFinite(e.x)&&Number.isFinite(e.hp)))
})
