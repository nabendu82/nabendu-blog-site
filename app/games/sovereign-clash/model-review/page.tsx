'use client'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useEffect, useState } from 'react'
import { SettlementModel, type SettlementKind } from '@/components/games/sovereign-clash/scene/models/Settlement'
import { AnimatedUnit } from '@/components/games/sovereign-clash/scene/units/AnimatedUnit'
import { useGameStore } from '@/components/games/sovereign-clash/game/store'
import { createUnit } from '@/components/games/sovereign-clash/game/mapGen'
import type { Civilization, UnitKind } from '@/components/games/sovereign-clash/game/types'
const roster: UnitKind[] = ['villager','sepoy','rajput','redcoat','samurai','crossbowman','gurkha','hussar']
export default function Review() {
 const [civ,setCiv] = useState<Civilization>('indian')
 const [kind,setKind] = useState<SettlementKind>('townCenter')
 const [ready,setReady] = useState(false)
 useEffect(()=>{
  const s=useGameStore.getState()
  roster.forEach((k,i)=> {s.entities['review'+i]=createUnit('review'+i,k,'player',0,0)})
  setReady(true)
  return ()=>{roster.forEach((_,i)=>{delete useGameStore.getState().entities['review'+i]})}
 },[])
 useEffect(()=>{useGameStore.setState({playerCiv:civ})},[civ])
 return <div style={{position:'fixed',inset:0,zIndex:100,background:'#b4b7aa'}}>
 <div style={{position:'absolute',left:20,top:20,zIndex:10,display:'flex',gap:12,color:'#222'}}>
 <select aria-label="Civilization" value={civ} onChange={e=>setCiv(e.target.value as Civilization)}>{['indian','british','japanese','french'].map(c=><option key={c}>{c}</option>)}</select>
 <select aria-label="Building" value={kind} onChange={e=>setKind(e.target.value as SettlementKind)}>{['townCenter','house','manor','barracks','mill','lumberCamp','miningCamp','foundry','caravanserai'].map(c=><option key={c}>{c}</option>)}</select>
 </div>
 <Canvas shadows camera={{position:[8,6,10],fov:38}}>
 <color attach="background" args={['#b4b7aa']} /><ambientLight intensity={0.8}/><hemisphereLight args={['#fff3d7','#5b6049',1.1]}/><directionalLight position={[6,10,7]} intensity={2.3} castShadow shadow-mapSize={[2048,2048]}/>
 <mesh rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[200,200]}/><meshStandardMaterial color="#898f70" roughness={1}/></mesh>
 <SettlementModel kind={kind} civ={civ}/>
 {ready && roster.map((k,i)=><group key={k} position={[(i-3.5)*0.8,0,3.5]}><AnimatedUnit id={'review'+i} kind={k}/></group>)}
 <OrbitControls target={[0,1.1,1]}/>
 </Canvas></div>
}
