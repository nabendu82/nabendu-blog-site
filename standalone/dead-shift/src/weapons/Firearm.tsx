import { useMemo,useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Group,Mesh,MeshBasicMaterial,PointLight,Vector3 } from 'three';
import { sim } from '../game/Simulation';
import { DEBUG_WEAPONS } from '../game/config';
import { asset } from '../world/CityArena';
import { useGameStore } from '../stores/gameStore';

for(const weapon of DEBUG_WEAPONS)useGLTF.preload(asset(weapon.model));

export function Firearm(){
  useGameStore(s=>s.weapon);
  const gltf=useGLTF(asset(sim.weapon.model));
  const root=useRef<Group>(null),flash=useRef<Group>(null),smoke=useRef<Mesh>(null),light=useRef<PointLight>(null);
  const lastShot=useRef(sim.shots),smokeTime=useRef(0),shellWorld=useMemo(()=>new Vector3(),[]);
  const data=useMemo(()=>{
    const model=gltf.scene.clone(true);model.traverse(o=>{if(o instanceof Mesh)o.castShadow=true;});model.updateMatrixWorld(true);
    const find=(name:string)=>{let found:Group|undefined;model.traverse(o=>{if(!found&&o.name.startsWith(name))found=o as Group;});return found;};
    const muzzle=find('Muzzle'),shell=find('Shell_Eject');
    const muzzlePoint=muzzle?muzzle.getWorldPosition(new Vector3()):new Vector3(0,0,.82);
    return {model,muzzlePoint,shell};
  },[gltf]);
  useFrame((_,dt)=>{
    if(root.current){root.current.position.z=.12-sim.recoil*.12;root.current.rotation.x=-sim.recoil*.08;}
    if(flash.current){flash.current.visible=sim.flash>0;flash.current.scale.setScalar((.6+sim.weapon.flashSize*4)*Math.min(1,sim.flash/.03));}
    if(light.current)light.current.intensity=sim.flash>0?7:0;
    if(sim.shots!==lastShot.current){const missed=Math.min(3,sim.shots-lastShot.current);lastShot.current=sim.shots;smokeTime.current=.24;
      if(data.shell){data.shell.updateWorldMatrix(true,false);data.shell.getWorldPosition(shellWorld);for(let i=0;i<missed;i++)sim.spawnCasing(shellWorld.x,shellWorld.y,shellWorld.z,sim.weapon.casing,sim.player.yaw);}
    }
    smokeTime.current=Math.max(0,smokeTime.current-dt);
    if(smoke.current){smoke.current.visible=smokeTime.current>0;smoke.current.scale.setScalar(1+(1-smokeTime.current/.24)*1.7);(smoke.current.material as MeshBasicMaterial).opacity=.12*smokeTime.current/.24;}
  });
  return <group ref={root} position={[.115,.04,.12]} dispose={null}>
    <primitive object={data.model}/>
    <group ref={flash} position={data.muzzlePoint} visible={false}>
      <mesh rotation={[Math.PI/2,0,0]}><coneGeometry args={[.11,.23,5]}/><meshBasicMaterial color="#ffd69b" toneMapped={false}/></mesh>
      <mesh rotation={[Math.PI/2,0,Math.PI/4]}><coneGeometry args={[.08,.17,5]}/><meshBasicMaterial color="#fff1c4" toneMapped={false}/></mesh>
    </group>
    <mesh ref={smoke} position={data.muzzlePoint} visible={false}><sphereGeometry args={[.09,6,4]}/><meshBasicMaterial color="#9d9c91" transparent depthWrite={false} opacity={0}/></mesh>
    <pointLight ref={light} position={data.muzzlePoint} color="#ffcf87" intensity={0} distance={2.5}/>
  </group>;
}
