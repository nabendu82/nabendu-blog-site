import { useMemo,useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { InstancedMesh,Object3D,Vector3,Color } from 'three';
import { sim } from '../game/Simulation';
import { CONFIG } from '../game/config';
export function CombatEffects(){
  const traces=useRef<InstancedMesh>(null),sparks=useRef<InstancedMesh>(null),fire=useRef<InstancedMesh>(null);
  const d=useMemo(()=>({obj:new Object3D(),up:new Vector3(0,1,0),dir:new Vector3(),colors:{kinetic:new Color('#ffcb74'),volt:new Color('#56dfff'),fire:new Color('#ff6a32'),cryo:new Color('#c8f7ff')},hit:new Color('#b9e866')}),[]);
  useFrame(()=>{if(!traces.current||!sparks.current||!fire.current)return;let n=0;
    let particles=0;
    for(const f of sim.effects){if(f.life<=0)continue;const age=.7-f.life,dx=f.endX-f.x,dz=f.endZ-f.z,length=Math.hypot(dx,dz);d.dir.set(dx,0,dz).normalize();d.obj.position.set((f.x+f.endX)/2,f.sky?4.1:1.2,(f.z+f.endZ)/2);if(f.sky)d.obj.quaternion.identity();else d.obj.quaternion.setFromUnitVectors(d.up,d.dir);d.obj.scale.set(.035*f.size,f.sky?8*Math.max(0,1-age/.7):age<.075?length:0,.035*f.size);d.obj.updateMatrix();traces.current.setMatrixAt(n,d.obj.matrix);traces.current.setColorAt(n,d.colors[f.element]);
      for(let k=0;k<8;k++){const angle=k*2.4+n;d.obj.position.set(f.endX+Math.sin(angle)*age*2*f.size,Math.max(.05,1.2+age*(k%3)-age*age*7),f.endZ+Math.cos(angle)*age*2*f.size);d.obj.rotation.set(angle,angle,0);d.obj.scale.setScalar((f.hit?.1:.055)*f.size*Math.max(0,1-age/.7));d.obj.updateMatrix();sparks.current.setMatrixAt(particles,d.obj.matrix);sparks.current.setColorAt(particles,f.hit?d.hit:d.colors[f.element]);particles++;}n++;}
    traces.current.count=n;sparks.current.count=particles;traces.current.instanceMatrix.needsUpdate=true;sparks.current.instanceMatrix.needsUpdate=true;if(traces.current.instanceColor)traces.current.instanceColor.needsUpdate=true;if(sparks.current.instanceColor)sparks.current.instanceColor.needsUpdate=true;
    let patches=0;for(const zone of sim.groundFire){if(zone.life<=0)continue;d.obj.position.set(zone.x,.055,zone.z);d.obj.rotation.set(-Math.PI/2,0,0);d.obj.scale.setScalar(zone.radius*2*Math.min(1,zone.life));d.obj.updateMatrix();fire.current.setMatrixAt(patches++,d.obj.matrix);}fire.current.count=patches;fire.current.instanceMatrix.needsUpdate=true;
  });
  return <><instancedMesh ref={traces} args={[undefined,undefined,CONFIG.maxEffects]} frustumCulled={false}><cylinderGeometry args={[1,1,1,4]}/><meshBasicMaterial color="#ffd493" toneMapped={false}/></instancedMesh><instancedMesh ref={sparks} args={[undefined,undefined,CONFIG.maxEffects*8]} frustumCulled={false}><icosahedronGeometry args={[1,0]}/><meshBasicMaterial color="white" toneMapped={false}/></instancedMesh><instancedMesh ref={fire} args={[undefined,undefined,CONFIG.maxGroundFire]} frustumCulled={false}><circleGeometry args={[.5,16]}/><meshBasicMaterial color="#ff5d20" transparent opacity={.44} depthWrite={false} toneMapped={false}/></instancedMesh></>;
}
