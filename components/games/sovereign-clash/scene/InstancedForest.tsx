"use client";

import { useMemo, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { ConeGeometry, CylinderGeometry, Object3D, Sphere, Vector3, DoubleSide, MeshStandardMaterial, type InstancedMesh } from 'three'
import { useGameStore } from '../game/store'
import { isExplored } from '../game/fog'
import { inputFlags } from '../game/input'
import { fronds } from './models/Tree'

const trunk=new CylinderGeometry(0.12,0.18,1.1,6)
const palmTrunk=new CylinderGeometry(0.1,0.19,2.1,7)
const lower=new ConeGeometry(0.7,1.1,6),upper=new ConeGeometry(0.5,0.85,6)
const bounds=new Sphere(new Vector3(0,0,0),150)
const materials=['#6b3e1a','#927149','#1f7a32','#6f9145','#2d9a42'].map(color=>new MeshStandardMaterial({color,roughness:0.85,side:DoubleSide}))

/** Thousands of trees share two or three draw calls, including picking and fog. */
export function InstancedForest({ids}:{ids:string[]}) {
  const terrain=useGameStore(s=>s.terrain)
  const selectedId=useGameStore(s=>s.selectedId)
  const trees=useMemo(()=>ids.filter(id=>useGameStore.getState().entities[id]?.kind==='tree'),[ids])
  const a=useRef<InstancedMesh>(null),b=useRef<InstancedMesh>(null),c=useRef<InstancedMesh>(null)
  const dummy=useMemo(()=>new Object3D(),[])
  const elapsed=useRef(1)
  const palm=terrain==='oasis'
  useFrame((_,dt)=>{
    elapsed.current+=dt
    if(elapsed.current<0.1)return
    elapsed.current=0
    const state=useGameStore.getState()
    const parts:[InstancedMesh|null,number,number][]=[[a.current,0,palm?1.05:0.55],[b.current,palm?0.08:0,palm?2.08:1.35],[c.current,0,1.95]]
    for(const [mesh,ox,oy] of parts) {
      if(!mesh)continue
      mesh.count=trees.length;mesh.boundingSphere=bounds
      trees.forEach((id,i)=>{
        const e=state.entities[id]
        const visible=e && isExplored(e.x,e.z)
        const scale=visible?e.scale*e.scale*(e.dying?Math.max(0,e.deathTimer/0.55):1):0
        dummy.position.set((e?.x??0)+ox*scale,oy*scale,e?.z??0)
        dummy.scale.setScalar(scale);dummy.rotation.set(0,e?.facing??0,0);dummy.updateMatrix()
        mesh.setMatrixAt(i,dummy.matrix)
      })
      mesh.instanceMatrix.needsUpdate=true
    }
  })
  const onClick=(ev:ThreeEvent<MouseEvent>)=>{
    if(ev.instanceId===undefined || inputFlags.skipClick)return
    ev.stopPropagation()
    const id=trees[ev.instanceId],s=useGameStore.getState()
    if(s.commandMode==='attackMove')s.issueEntityOrder(id);else s.select(id,ev.nativeEvent.shiftKey)
  }
  const onContext=(ev:ThreeEvent<MouseEvent>)=>{
    if(ev.instanceId===undefined)return
    ev.stopPropagation();ev.nativeEvent.preventDefault();useGameStore.getState().issueEntityOrder(trees[ev.instanceId])
  }
  const selected=selectedId?useGameStore.getState().entities[selectedId]:null
  const n=Math.max(1,trees.length)
  return <group>
    <instancedMesh ref={a} args={[palm?palmTrunk:trunk,materials[palm?1:0],n]} frustumCulled={false} castShadow onClick={onClick} onContextMenu={onContext} dispose={null}/>
    <instancedMesh ref={b} args={[palm?fronds:lower,materials[palm?3:2],n]} frustumCulled={false} castShadow onClick={onClick} onContextMenu={onContext} dispose={null}/>
    {!palm && <instancedMesh ref={c} args={[upper,materials[4],n]} frustumCulled={false} castShadow onClick={onClick} onContextMenu={onContext} dispose={null}/>}
    {selected?.kind==='tree'&&!selected.dying&&<mesh position={[selected.x,0.07,selected.z]} rotation={[-Math.PI/2,0,0]} raycast={()=>null}><ringGeometry args={[selected.radius+0.15,selected.radius+0.23,24]}/><meshBasicMaterial color="#fde68a"/></mesh>}
  </group>
}
