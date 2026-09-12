'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { useGameStore } from '../../game/store'
import type { Civilization } from '../../game/types'

const LIVERIES: Record<Civilization, string> = { indian: '#82794d', british: '#52654d', japanese: '#405c51', french: '#667562' }
function Box({p=[0,0,0],s,c='#424a43',r=[0,0,0]}:{p?:[number,number,number];s:[number,number,number];c?:string;r?:[number,number,number]}) {
  return <mesh position={p} rotation={r} castShadow receiveShadow><boxGeometry args={s}/><meshStandardMaterial color={c} roughness={0.65} metalness={0.35}/></mesh>
}
function Tube({p,s,c='#252c2b',r=[0,0,0]}:{p:[number,number,number];s:[number,number,number];c?:string;r?:[number,number,number]}) {
  return <mesh position={p} rotation={r} castShadow><cylinderGeometry args={[...s,10]}/><meshStandardMaterial color={c} roughness={0.65} metalness={0.5}/></mesh>
}

/** Low-poly silhouettes built from shared primitive types, with no texture downloads. */
export function ModernUnit({id,kind,civ,color}:{id:string;kind:string;civ:Civilization;color:string}) {
  const rotor=useRef<Group>(null), legs=useRef<Group>(null), gun=useRef<Group>(null)
  useFrame(({clock},dt)=>{
    const e=useGameStore.getState().entities[id]
    if(!e||e.dying)return
    if(rotor.current)rotor.current.rotation.y+=dt*32
    if(legs.current)legs.current.rotation.x=e.order.type==='move'||e.order.type==='attackMove'?Math.sin(clock.elapsedTime*12)*0.18:0
    if(gun.current)gun.current.position.z=e.attackTimer>0.8?-0.08:0
  })
  const armor=LIVERIES[civ]
  const infantry=['villager','rifleman','machineGunner','rocketTrooper'].includes(kind)
  if(infantry)return <group>
    <group ref={legs}><Box p={[-.14,.34,0]} s={[.21,.63,.25]} c={armor}/><Box p={[.14,.34,0]} s={[.21,.63,.25]} c={armor}/><Box p={[-.14,.06,.08]} s={[.23,.15,.4]} c="#252a27"/><Box p={[.14,.06,.08]} s={[.23,.15,.4]} c="#252a27"/></group>
    <Box p={[0,.91,0]} s={[.56,.62,.32]} c={armor}/><Box p={[0,.95,.19]} s={[.45,.38,.12]} c="#303b31"/>
    {[-.15,0,.15].map(x=><Box key={x} p={[x,.88,.28]} s={[.12,.21,.1]} c={armor}/>)}
    <Box p={[0,.96,-.25]} s={[.4,.48,.22]} c={armor}/><Box p={[-.32,1.03,.12]} s={[.18,.38,.2]} c={armor}/><Box p={[.32,1.03,.12]} s={[.18,.38,.2]} c={color}/>
    <mesh position={[0,1.42,0]}><sphereGeometry args={[.22,10,8]}/><meshStandardMaterial color="#c39b74"/></mesh>
    <mesh position={[0,1.54,-.02]}><sphereGeometry args={[.25,10,8,0,Math.PI*2,0,Math.PI*.6]}/><meshStandardMaterial color={kind==='villager'?'#e5b541':armor}/></mesh>
    <Box p={[0,1.45,.2]} s={[.32,.1,.08]} c="#202a2c"/>
    <group ref={gun}>
      {kind==='villager'?<><Box p={[.15,.74,.45]} s={[.22,.5,.22]} c="#dba63b"/><Tube p={[.15,.31,.45]} s={[.035,.035,.5]}/><Box p={[.15,1.02,.45]} s={[.55,.08,.1]} c="#2b3231"/></>:kind==='rocketTrooper'?<><Tube p={[.31,1.24,.3]} s={[.13,.13,1.1]} r={[Math.PI/2,0,0]} c={armor}/><Tube p={[.31,1.24,.92]} s={[0,.13,.3]} r={[Math.PI/2,0,0]} c="#aaa78a"/></>:<><Box p={[.15,1.06,.39]} s={[.14,.17,.58]} c="#222a29"/><Tube p={[.15,1.08,.85]} s={[.035,.035,kind==='machineGunner'?.68:.4]} r={[Math.PI/2,0,0]}/><Box p={[.15,.92,.45]} s={[kind==='machineGunner'?.28:.08,.21,.15]} c="#343c32"/></>}
    </group>
  </group>
  if(kind==='helicopter')return <group>
    <mesh scale={[.72,.68,1.65]} position={[0,.55,0]} castShadow><sphereGeometry args={[1,12,8]}/><meshStandardMaterial color={armor} metalness={.4} roughness={.5}/></mesh>
    <mesh position={[0,.72,1]} scale={[.6,.45,.6]}><sphereGeometry args={[1,10,8]}/><meshStandardMaterial color="#407585" metalness={.7} roughness={.2}/></mesh>
    <Box p={[0,.63,-2]} s={[.25,.3,2.5]} c={armor}/><Box p={[0,1,-3.1]} s={[.14,1.15,.65]} c={color}/><Box p={[0,.6,-2.9]} s={[1.3,.12,.5]} c={armor}/>
    <Tube p={[0,1.4,0]} s={[.1,.1,.6]}/><group ref={rotor} position={[0,1.72,0]}><Box s={[5,.055,.17]} c="#303737"/><Box s={[.17,.055,5]} c="#303737"/></group>
    {[-1,1].map(side=><group key={side}><Box p={[side*.9,.15,0]} s={[.08,.08,2.4]}/><Box p={[side*.65,.32,.6]} s={[.08,.5,.08]}/><Box p={[side*.65,.32,-.6]} s={[.08,.5,.08]}/><Box p={[side*1,.5,-.2]} s={[1.2,.12,.5]} c={armor}/><Tube p={[side*1.25,.35,.1]} s={[.2,.2,.9]} r={[Math.PI/2,0,0]}/></group>)}
    <Tube p={[0,0,1.3]} s={[.05,.05,.65]} r={[Math.PI/2,0,0]}/>
  </group>
  if(kind==='destroyer')return <group>
    <mesh position={[0,.3,0]} scale={[1.1,.55,3.7]} castShadow><sphereGeometry args={[1,10,6]}/><meshStandardMaterial color="#354551" metalness={.5} roughness={.5}/></mesh>
    <Box p={[0,.55,0]} s={[1.6,.22,5]} c="#73818a"/><Box p={[0,1.1,-.3]} s={[1.1,.95,1.6]} c="#929d9e"/><Box p={[0,1.63,0]} s={[.9,.2,.7]} c="#3f6877"/>
    <Tube p={[0,2.2,-.4]} s={[.05,.08,1.6]}/><Box p={[0,2.8,-.4]} s={[1.1,.08,.2]} c={color}/><Box p={[0,1.45,-1.3]} s={[.4,.7,.5]} c="#384449"/>
    {[1.7,-2].map(z=><group key={z} position={[0,.7,z]}><Tube p={[0,.2,0]} s={[.42,.5,.4]} c="#65757e"/><Tube p={[0,.35,.6]} s={[.07,.07,1.2]} r={[Math.PI/2,0,0]}/></group>)}
    <Box p={[0,.7,-.8]} s={[.8,.08,.12]} c={color}/>
  </group>
  const jeep=kind==='jeep', artillery=kind==='heavyArtillery'
  return <group>
    <Box p={[0,.57,0]} s={[jeep?1.35:1.9,.55,jeep?2.25:2.8]} c={armor}/><Box p={[0,.86,.85]} s={[jeep?1.3:1.8,.15,.7]} c={armor} r={[.12,0,0]}/>
    {[-1,1].map(side=><group key={side}>{!jeep&&<Box p={[side*.98,.35,0]} s={[.4,.55,3]} c="#262c29"/>}{(jeep?[-.72,.72]:[-1,-.5,0,.5,1]).map(z=><Tube key={z} p={[side*(jeep?.74:1.05),.35,z]} s={[.32,.32,.22]} r={[0,0,Math.PI/2]} c="#232928"/>)}</group>)}
    {jeep?<><Box p={[0,1.13,-.25]} s={[1.18,.65,1.05]} c={armor}/><Box p={[0,1.25,.3]} s={[1.08,.35,.05]} c="#537b86"/><Box p={[0,1.65,-.2]} s={[.2,.18,.6]}/><Tube p={[0,1.67,.4]} s={[.04,.04,.75]} r={[Math.PI/2,0,0]}/></>:<group ref={gun}><Box p={[0,1.04,-.15]} s={[1.22,.55,1.3]} c={armor}/><Tube p={[0,1.2,artillery?1.6:1.2]} s={[.105,.13,artillery?3.4:2.4]} r={[Math.PI/2-.12,0,0]} c={armor}/><Tube p={[0,1.39,-.25]} s={[.27,.27,.12]} c={color}/></group>}
    <Box p={[0,.65,-1.43]} s={[.55,.2,.06]} c={color}/><Tube p={[.55,1.5,-.9]} s={[.012,.012,1.4]}/>
    {[-.48,.48].map(x=><Box key={x} p={[x,.7,jeep?1.14:1.43]} s={[.2,.12,.06]} c="#eddda2"/>)}
  </group>
}

export function DrillingSite({metal=false}:{metal?:boolean}) {
  const pump=useRef<Group>(null)
  useFrame(({clock})=>{if(pump.current)pump.current.rotation.z=Math.sin(clock.elapsedTime*2)*.18})
  return <group>
    <Tube p={[0,.08,0]} s={[1.3,1.4,.16]} c={metal?'#626a68':'#302e27'}/>
    {[-.65,.65].map(x=><Box key={x} p={[x,1,0]} s={[.14,2,.14]} c="#bd934b" r={[0,0,x>0?.16:-.16]}/>)}
    <Box p={[0,1.8,0]} s={[1.4,.15,.3]} c="#e2a947"/>
    <group ref={pump} position={[0,1.95,0]}><Box s={[1.9,.19,.25]} c={metal?'#718895':'#d5a03d'}/><Box p={[.8,-.3,0]} s={[.12,.7,.12]} c="#c9c6a8"/></group>
    <Tube p={[0,.7,0]} s={[.08,.08,1.4]}/><Box p={[-.75,.3,-.5]} s={[.65,.5,.65]} c="#4f6065"/>
    <Tube p={[.85,.35,-.5]} s={[.32,.32,.65]} c={metal?'#919ca4':'#aa6330'}/>
  </group>
}
export function Helipad({color}:{color:string}) {
  return <group><Box p={[0,.08,0]} s={[4.8,.16,4.8]} c="#525e60"/><Tube p={[0,.17,0]} s={[1.8,1.8,.03]} c="#aebbc0"/><Tube p={[0,.19,0]} s={[1.65,1.65,.03]} c="#3c484a"/>{[-.5,.5].map(x=><Box key={x} p={[x,.22,0]} s={[.2,.03,1.8]} c="#e5d9a2"/>)}<Box p={[0,.22,0]} s={[1,.03,.2]} c="#e5d9a2"/><Box p={[0,.8,-2]} s={[2.8,1.5,.65]} c={color}/><Box p={[0,1,-1.66]} s={[2,.45,.04]} c="#7ba9b4"/>{[-2,2].flatMap(x=>[-2,2].map(z=><Tube key={`${x},${z}`} p={[x,.24,z]} s={[.09,.09,.15]} c="#efcf6e"/>))}</group>
}

export function ModernBuilding({kind,color,civ}:{kind:string;color:string;civ:Civilization}) {
  const factory=kind==='factory', hq=kind==='townCenter'
  const width=factory?4.4:hq?4.2:3.4, height=hq?2.5:1.6
  return <group>
    <Box p={[0,.1,0]} s={[width+.5,.2,3.8]} c="#777f7b"/>
    <Box p={[0,height/2+.2,0]} s={[width,height,3]} c={LIVERIES[civ]}/>
    <Box p={[0,height+.25,0]} s={[width+.2,.16,3.2]} c="#afb5aa"/>
    <Box p={[0,.9,1.51]} s={[factory?2.4:1,1.45,.08]} c="#3b4749"/>
    {[-1,1].map(side=><group key={side}><Box p={[side*(width/2-.45),height*.7,1.56]} s={[.6,.4,.08]} c="#6894a1"/><Box p={[side*(width/2-.45),.8,-1.52]} s={[.6,.4,.08]} c="#6894a1"/></group>)}
    <Box p={[0,height-.15,1.57]} s={[width*.75,.2,.06]} c={color}/>
    <Box p={[width/2-.6,height+.48,-.4]} s={[.7,.45,.8]} c="#59676b"/>
    <Tube p={[-width/2+.4,height+.9,-.7]} s={[.025,.025,1.6]}/><Box p={[-width/2+.7,height+1.45,-.7]} s={[.6,.35,.03]} c={color}/>
    {hq&&<><Tube p={[.7,height+.65,0]} s={[.06,.06,.7]}/><mesh position={[.7,height+1,.1]} rotation={[.5,0,0]}><sphereGeometry args={[.6,12,8,0,Math.PI*2,0,Math.PI*.45]}/><meshStandardMaterial color="#d0d6d1" side={2}/></mesh></>}
    {factory&&<><Box p={[-1,.45,2]} s={[1,.7,.65]} c="#637260"/><Tube p={[1,.45,2]} s={[.3,.3,.8]} c="#ac713d"/></>}
  </group>
}
