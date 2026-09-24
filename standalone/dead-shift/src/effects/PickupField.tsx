import { useMemo,useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color,InstancedMesh,Object3D,PointLight } from 'three';
import { sim } from '../game/Simulation';
import { CONFIG } from '../game/config';
const colors={xp:new Color('#b8ff72'),volt:new Color('#55dfff'),fire:new Color('#ff7545'),cryo:new Color('#d5fbff'),mass:new Color('#d7a8ff')};
export function PickupField(){const mesh=useRef<InstancedMesh>(null),light=useRef<PointLight>(null);const data=useMemo(()=>({o:new Object3D(),time:0}),[]);
  useFrame((_,dt)=>{if(sim.mode==='playing')data.time+=Math.min(dt,.05);if(!mesh.current)return;let count=0;for(const p of sim.pickups){if(!p.active)continue;const bob=.22+Math.sin(data.time*4+p.age*3)*.08;data.o.position.set(p.x,bob,p.z);data.o.rotation.set(data.time*1.6,p.age*2,data.time*.8);const scale=p.kind==='dna'?.16:.11;data.o.scale.setScalar(scale);data.o.updateMatrix();mesh.current.setMatrixAt(count,data.o.matrix);mesh.current.setColorAt(count,p.kind==='xp'?colors.xp:colors[p.dna]);count++;}mesh.current.count=count;mesh.current.instanceMatrix.needsUpdate=true;if(mesh.current.instanceColor)mesh.current.instanceColor.needsUpdate=true;if(light.current){light.current.position.set(sim.player.x,.8,sim.player.z);light.current.intensity=count?1.1:0;}});
  return <><instancedMesh ref={mesh} args={[undefined,undefined,CONFIG.maxPickups]} frustumCulled={false}><octahedronGeometry args={[1,0]}/><meshStandardMaterial color="white" emissive="white" emissiveIntensity={2.1} roughness={.25} toneMapped={false}/></instancedMesh><pointLight ref={light} color="#9eff8a" intensity={0} distance={3}/></>;
}
