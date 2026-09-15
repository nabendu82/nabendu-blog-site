const fs=require('node:fs'),ts=require('typescript')
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,f)
const {test}=require('node:test'),assert=require('node:assert/strict')
const root='../components/games/sovereign-clash/game/'
const {useGameStore}=require(root+'store.ts'),{createBuilding,createUnit}=require(root+'mapGen.ts')
const {enemyTime}=require(root+'difficulty.ts'),{tickSimulation}=require(root+'simulation.ts')
const {terrainRoute,isDry}=require(root+'terrain.ts'),{MAP_SIZE}=require(root+'constants.ts')
const {upgradeTransport,transportCapacity}=require(root+'navy.ts')
function world(terrain='grassland',difficulty='easy'){
 useGameStore.getState().setCivilizations('british','french',terrain,difficulty)
 const tc=createBuilding('tc','townCenter','player',-110,-110),enemy=createBuilding('enemy','townCenter','enemy',110,110)
 useGameStore.setState({entities:{tc,enemy},civModalOpen:false,helpOpen:false,winner:null,enemyWood:10000,enemyGold:10000})
 return useGameStore.getState()
}
for(const difficulty of ['easy','medium','hard'])test(`${difficulty}: matching raid and age schedules; rematch preserves selection`,()=>{
 world('grassland',difficulty)
 useGameStore.setState({gameTime:enemyTime(480,difficulty)-.1});tickSimulation(.05);assert.equal(useGameStore.getState().enemyAge,0)
 tickSimulation(.1);assert.equal(useGameStore.getState().enemyAge,1)
 useGameStore.setState({gameTime:enemyTime(600,difficulty)-.02});tickSimulation(.05);assert.equal(useGameStore.getState().waveIndex,1)
 useGameStore.getState().restart();assert.equal(useGameStore.getState().difficulty,difficulty)
})
test('enlarged sea has no land route or edge bypass; water is connected',()=>{
 world('oasis');assert.equal(MAP_SIZE,320)
 for(const z of [-158,-80,0,80,158])assert.equal(isDry('oasis',0,z),false)
 assert.equal(terrainRoute('oasis',-110,-110,110,110).length,0)
 assert.ok(terrainRoute('oasis',-40,-140,40,140,true).length)
})
test('transports modernize once, preserve damage and passengers, and increase capacity',()=>{
 const ship=createUnit('s','transportShip','player',0,0),passenger=createUnit('p','tank','player',0,0)
 ship.hp/=2;ship.passengers=[passenger];upgradeTransport(ship,3);const steam=ship.speed;upgradeTransport(ship,4)
 assert.ok(ship.speed>steam);assert.equal(ship.hp/ship.maxHp,.5);assert.equal(ship.passengers[0],passenger)
 const hp=ship.maxHp,speed=ship.speed;upgradeTransport(ship,4);assert.equal(ship.maxHp,hp);assert.equal(ship.speed,speed)
 assert.equal(transportCapacity('french',4),22);assert.equal(transportCapacity('british',4),20)
})
test('enemy transports carry troops across the sea and disembark on hostile land',()=>{
 const s=world('oasis');const dock=createBuilding('dock','dock','enemy',51,0)
 const a=createUnit('a','transportShip','enemy',45,0),b=createUnit('b','transportShip','enemy',45,12)
 const soldier=createUnit('soldier','sepoy','enemy',50,0)
 Object.assign(s.entities,{dock,a,b,soldier});useGameStore.setState({enemyAge:1,waveIndex:3,waveStartTime:10000,navyTimer:-1000})
 let boarded=false,landed=false
 for(let i=0;i<2400&&!landed;i++){
  tickSimulation(.05);boarded ||= !!soldier.embarked
  landed=boarded&&!soldier.embarked&&soldier.x< -48
 }
 assert.ok(boarded,'enemy must board a real transport');assert.ok(landed,'transport must unload on western continent')
 assert.ok(isDry('oasis',soldier.x,soldier.z,soldier.radius))
})
test('Medium Modern raids get a small recovery window only after both age up',()=>{
 const {raidInterval}=require(root+'difficulty.ts')
 assert.equal(raidInterval(240,'medium',4,4),162)
 for(const [p,e] of [[3,4],[4,3],[3,3]])assert.equal(raidInterval(240,'medium',p,e),144)
 assert.equal(raidInterval(240,'easy',4,4),240)
 assert.equal(raidInterval(240,'hard',4,4),84)
 world('grassland','medium')
 useGameStore.setState({playerAge:4,enemyAge:4,waveIndex:3,waveStartTime:0,gameTime:144})
 tickSimulation(.05);assert.equal(useGameStore.getState().waveIndex,3)
 useGameStore.setState({gameTime:162});tickSimulation(.05);assert.equal(useGameStore.getState().waveIndex,4)
})
for(const team of ['player','enemy'])test(`${team}: only starting Town Center destruction ends match with expansions`,()=>{
 useGameStore.getState().setCivilizations('british','french','grassland','medium')
 let s=useGameStore.getState();useGameStore.setState({civModalOpen:false,helpOpen:false})
 const main=Object.values(s.entities).find(e=>e.team===team&&e.isMainTownCenter)
 assert.ok(main)
 const extra=createBuilding('extra','townCenter',team,0,30)
 s.entities.extra=extra;extra.dying=true;extra.deathTimer=.02
 tickSimulation(.05);assert.equal(useGameStore.getState().winner,null)
 s.entities.spare=createBuilding('spare','townCenter',team,0,-30)
 main.dying=true;main.deathTimer=.15
 tickSimulation(.05);assert.equal(useGameStore.getState().winner,null,'allow collapse animation')
 for(let i=0;i<4;i++)tickSimulation(.05)
 assert.equal(useGameStore.getState().winner,team==='player'?'enemy':'player')
 assert.ok(s.entities.spare)
 s.restart();assert.equal(useGameStore.getState().winner,null)
 assert.equal(Object.values(useGameStore.getState().entities).filter(e=>e.isMainTownCenter).length,2)
})
