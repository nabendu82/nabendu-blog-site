import { useMemo,useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Group,Mesh,PointLight } from 'three';
import { sim } from '../game/Simulation';
import { asset } from '../world/CityArena';
import { useGameStore } from '../stores/gameStore';
export function ScrapRifle(){const weaponName=useGameStore(s=>s.weapon);const scrap=useGLTF(asset('weapons/survivor-field-rifle')),thunder=useGLTF(asset('weapons/thunderstorm')),hell=useGLTF(asset('weapons/hellbreaker')),zero=useGLTF(asset('weapons/absolute-zero'));const gltf=weaponName==='THUNDERSTORM'?thunder:weaponName==='HELLBREAKER'?hell:weaponName==='ABSOLUTE ZERO'?zero:scrap;const root=useRef<Group>(null);const flash=useRef<Group>(null);const light=useRef<PointLight>(null);
  const model=useMemo(()=>{const m=gltf.scene.clone(true);m.traverse(o=>{if(o instanceof Mesh)o.castShadow=true;});return m;},[gltf]);
  useFrame(()=>{if(root.current){root.current.position.z=.12-sim.recoil*.12;root.current.rotation.x=-sim.recoil*.08;}if(flash.current)flash.current.visible=sim.recoil>.075;if(light.current){light.current.intensity=sim.recoil>.075?16:0;light.current.color.set(sim.weapon.element==='volt'?'#68dfff':sim.weapon.element==='fire'?'#ff7437':sim.weapon.element==='cryo'?'#b7f3ff':'#ffad45');}});
  // Keep the light registered: hiding it changes Three's light count and recompiles
  // every lit material on the first shot. Only animate its intensity.
  return <group ref={root} position={[.115,.04,.12]} dispose={null}><primitive object={model} scale={gltf===scrap?1:.72}/><group ref={flash} position={[0,.02,.60]}><mesh rotation={[Math.PI/2,0,0]}><coneGeometry args={[.12,.32,5]}/><meshBasicMaterial color="#fff0b0" toneMapped={false}/></mesh></group><pointLight ref={light} position={[0,.02,.60]} color="#ffad45" intensity={0} distance={4}/></group>;
}
