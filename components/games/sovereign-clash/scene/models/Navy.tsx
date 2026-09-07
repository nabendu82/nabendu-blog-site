"use client";

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BufferGeometry, Float32BufferAttribute, DoubleSide, type Group } from 'three'
import { useGameStore } from '../../game/store'
import { NAVIES } from '../../game/navy'
import type { Civilization } from '../../game/types'
import { Banner, Barrel, Block, Roof } from './Architecture'

const hull=new BufferGeometry(), deck=new BufferGeometry()
const rings=[[-1.7,0.05],[-1.25,0.58],[0,0.72],[1.15,0.52],[1.75,0.03]]
const points=rings.map(([z,w])=>[[-w,0.58,z],[-w*0.86,0.23,z],[-w*0.42,0,z],[w*0.42,0,z],[w*0.86,0.23,z],[w,0.58,z]])
const positions:number[]=[],top:number[]=[]
for(let r=0;r<points.length-1;r++)for(let j=0;j<5;j++)positions.push(...points[r][j],...points[r+1][j],...points[r][j+1],...points[r][j+1],...points[r+1][j],...points[r+1][j+1])
const edge=[...points.map(p=>p[0]),...points.map(p=>p[5]).reverse()]
for(let i=0;i<edge.length;i++)top.push(0,0.58,0,...edge[(i+1)%edge.length],...edge[i])
hull.setAttribute('position',new Float32BufferAttribute(positions,3));hull.computeVertexNormals()
deck.setAttribute('position',new Float32BufferAttribute(top,3));deck.computeVertexNormals()

function Sail({ civ,z=0,small=false,color }: {civ:Civilization;z?:number;small?:boolean;color:string}) {
  const g=useMemo(()=>{
    const geo=new BufferGeometry()
    const vertices=civ==='indian' ? [-0.7,1.25,0,0.7,1.25,0,0,2.95,0.12] : [-0.66,1.5,0,0.66,1.5,0,0,2.15,0.18, -0.66,1.5,0,0,2.15,0.18,-0.62,2.8,0, -0.62,2.8,0,0,2.15,0.18,0.62,2.8,0, 0.62,2.8,0,0,2.15,0.18,0.66,1.5,0]
    geo.setAttribute('position',new Float32BufferAttribute(vertices,3));geo.computeVertexNormals();return geo
  },[civ])
  return <group position={[0,0,z]} scale={small?0.7:1}>
    <Block at={[0,1.8,0]} size={[0.045,2.5,0.045]} color="#8a6943" />
    <mesh geometry={g} castShadow><meshStandardMaterial color={NAVIES[civ].sail} roughness={0.95} side={DoubleSide}/></mesh>
    <Block at={[0,2.82,0]} size={[1.42,0.035,0.035]} color="#735233" />
    {civ==='japanese' && [1.52,1.8,2.12,2.45,2.75].map(y=><Block key={y} at={[0,y,0.05]} size={[1.27,0.022,0.035]} color="#b8a784"/>)}
    <Block at={[0.17,3.07,0]} size={[0.35,0.2,0.025]} color={color}/>
    <lineSegments><bufferGeometry><bufferAttribute attach="attributes-position" args={[new Float32Array([-0.65,0.62,0,0,2.95,0,0,2.95,0,0.65,0.62,0,0,2.95,0,0,0.62,1.2,0,2.95,0,0,0.62,-1.2]),3]}/></bufferGeometry><lineBasicMaterial color="#51483b"/></lineSegments>
  </group>
}

export function ShipModel({id,kind}:{id:string;kind:'fishingBoat'|'transportShip'|'warship'}) {
  const team=useGameStore.getState().entities[id]?.team??'player'
  const civ=useGameStore(s=>team==='player'?s.playerCiv:s.enemyCiv)
  const root=useRef<Group>(null)
  const color=team==='player'?'#315e97':'#b44934'
  const fishing=kind==='fishingBoat',war=kind==='warship',jp=civ==='japanese'
  const p=NAVIES[civ]
  useFrame(({clock})=>{
    const e=useGameStore.getState().entities[id]
    if(root.current){
      const sinking=e?.dying ? 1-Math.max(0,e.deathTimer/0.55) : 0
      root.current.rotation.z=Math.sin(clock.elapsedTime*1.2+id.length)*0.025+sinking*0.45
      root.current.position.y=0.04+Math.sin(clock.elapsedTime*1.6)*0.025-sinking*2.5
    }
  })
  return <group ref={root} scale={fishing?0.7:war?1.2:1}>
    <mesh castShadow receiveShadow><primitive object={hull} attach="geometry" dispose={null}/><meshStandardMaterial color={p.color} roughness={0.8} side={DoubleSide}/></mesh>
    <mesh receiveShadow><primitive object={deck} attach="geometry" dispose={null}/><meshStandardMaterial color="#b2915f" roughness={0.92} side={DoubleSide}/></mesh>
    {[-1,1].map(s=><group key={s}>
      <Block at={[s*0.66,0.59,-0.05]} size={[0.045,0.16,2.4]} color={color}/>
      <Block at={[s*0.67,0.7,-0.05]} size={[0.05,0.03,2.4]} color={civ==='french'?'#c3a354':'#c0a478'}/>
      {war && [-0.7,0,0.7].map(z=><group key={z} position={[s*0.64,0.55,z]}>
        <Block size={[0.08,0.18,0.22]} color="#252728"/>
        <mesh position={[s*0.15,0.02,0]} rotation={[0,0,Math.PI/2]} castShadow><cylinderGeometry args={[0.045,0.065,0.42,10]}/><meshStandardMaterial color="#3e4543" metalness={0.7} roughness={0.35}/></mesh>
      </group>)}
    </group>)}
    {!fishing && <group position={[0,0.59,-0.85]}>
      <Block at={[0,0.23,0]} size={[0.95,0.46,0.8]} color={jp?'#d7c8a2':color}/>
      {[-0.27,0,0.27].map(x=><Block key={x} at={[x,0.28,-0.41]} size={[0.13,0.17,0.025]} color="#e4c989"/>)}
      {jp?<Roof width={1.2} depth={1} y={0.52} japanese color="#383c3a"/>:<Block at={[0,0.49,0]} size={[1,0.07,0.86]} color="#b69861"/>}
    </group>}
    <Sail civ={civ} color={color} z={fishing?0:0.35}/>
    {war && !jp && <group position={[0,0.25,-0.75]}><Sail civ={civ} color={color} small/></group>}
    {fishing && <>
      <Barrel at={[-0.3,0.58,-0.9]}/>
      <mesh position={[0.55,0.39,0.15]} rotation={[0,0,-0.4]}><planeGeometry args={[0.7,1,5,6]}/><meshStandardMaterial color="#dacba6" wireframe transparent opacity={0.7} side={DoubleSide}/></mesh>
      <Block at={[-0.22,0.76,-0.3]} size={[0.14,0.35,0.13]} color={color}/>
      <mesh position={[-0.22,1,-0.3]}><sphereGeometry args={[0.09,8,6]}/><meshStandardMaterial color="#ba9471"/></mesh>
    </>}
    {!fishing && <Block at={[0,0.65,0.85]} size={[0.65,0.12,0.55]} color="#6e593b"/>}
  </group>
}

export function DockModel({color='#315e97'}:{color?:string}) {
  return <group>
    <Block at={[0,0.18,0]} size={[3.2,0.3,2.3]} color="#96754b" surface="wood"/>
    <Block at={[-0.7,0.65,-0.3]} size={[1.4,0.7,1.3]} color="#bcaa82" surface="plaster"/>
    <Roof width={1.7} depth={1.6} y={1.05} color="#62584b"/>
    {[-1,1].map(s=><group key={s}>
      <Block at={[s*1.4,0.16,2.8]} size={[0.45,0.18,4.6]} color="#a58a5b" surface="wood"/>
      {[1,2.5,4.5].map(z=><Block key={z} at={[s*1.4,0.25,z]} size={[0.15,0.9,0.15]} color="#755b3c"/>)}
    </group>)}
    <Barrel at={[0.75,0.32,0]}/><Banner at={[1.2,0.25,-0.8]} color={color}/>
  </group>
}

export function FishModel({shore=false}:{shore?:boolean}) {
  return <group position={[0,0.085,0]}>
    <mesh rotation={[-Math.PI/2,0,0]}><ringGeometry args={[0.64,0.7,24]}/><meshBasicMaterial color={shore?'#b4e6ca':'#74c8e1'} transparent opacity={0.65}/></mesh>
    {[-1,0,1].map((i)=><group key={i} position={[i*0.28,0,i%2*0.25]} rotation={[0,0.5+i*0.2,0]}>
      <mesh scale={[0.09,0.025,0.22]}><sphereGeometry args={[1,8,5]}/><meshStandardMaterial color="#b2d3cf" roughness={0.35}/></mesh>
      <mesh position={[0,0,-0.23]} rotation={[Math.PI/2,0,0]}><coneGeometry args={[0.09,0.15,3]}/><meshStandardMaterial color="#8fc5bd"/></mesh>
    </group>)}
  </group>
}
