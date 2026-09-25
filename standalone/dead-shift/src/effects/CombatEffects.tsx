import { useMemo,useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color,InstancedMesh,Object3D,Vector3 } from 'three';
import { sim } from '../game/Simulation';
import { CONFIG } from '../game/config';

// Fixed GPU instance pools. Tracers are brief moving streaks, never full rays.
export function CombatEffects(){
  const tracers=useRef<InstancedMesh>(null),impacts=useRef<InstancedMesh>(null),casings=useRef<InstancedMesh>(null);
  const d=useMemo(()=>({obj:new Object3D(),up:new Vector3(0,1,0),dir:new Vector3(),blood:new Color('#6d241d'),dust:new Color('#9a9285'),spark:new Color('#d8a266'),brass:new Color('#ab8345'),shell:new Color('#9a3425')}),[]);
  useFrame(()=>{
    if(!tracers.current||!impacts.current||!casings.current)return;
    let traceCount=0,impactCount=0,casingCount=0;
    for(const f of sim.effects){if(f.life<=0)continue;
      const age=.14-f.life,dx=f.endX-f.x,dz=f.endZ-f.z,length=Math.hypot(dx,dz),ux=length>0?dx/length:0,uz=length>0?dz/length:1;
      if(f.tracer&&age<.10&&length>.02){const travel=Math.min(1,age/.075),streak=Math.min(.54,length*.55)*(1-age/.10);
        d.dir.set(ux,0,uz);d.obj.position.set(f.x+dx*travel,1.17,f.z+dz*travel);d.obj.quaternion.setFromUnitVectors(d.up,d.dir);d.obj.scale.set(.010*f.size,streak,.010*f.size);d.obj.updateMatrix();tracers.current.setMatrixAt(traceCount++,d.obj.matrix);
      }
      if(f.surface==='miss'||age<.018)continue;
      const count=f.surface==='metal'?5:4,color=f.surface==='zombie'?d.blood:f.surface==='metal'?d.spark:d.dust;
      for(let k=0;k<count;k++){const a=k*2.399+f.endX*.3,r=.035+age*(f.surface==='metal'?1.9:1.1);
        d.obj.position.set(f.endX+Math.cos(a)*r,Math.max(.05,1.15+age*(k%3)-age*age*12),f.endZ+Math.sin(a)*r);
        d.obj.quaternion.identity();d.obj.scale.setScalar((f.surface==='metal'?.032:.045)*f.size*Math.max(0,1-age/.14));d.obj.updateMatrix();impacts.current.setMatrixAt(impactCount,d.obj.matrix);impacts.current.setColorAt(impactCount++,color);
      }
    }
    for(const c of sim.casings){if(c.life<=0)continue;d.obj.position.set(c.x,c.y,c.z);d.obj.rotation.set(c.life*12,c.life*18,0);const scale=c.kind==='heavy'?1.45:c.kind==='shotgun'?1.25:1;d.obj.scale.set(scale,scale,scale);d.obj.updateMatrix();casings.current.setMatrixAt(casingCount,d.obj.matrix);casings.current.setColorAt(casingCount++,c.kind==='shotgun'?d.shell:d.brass);}
    tracers.current.count=traceCount;impacts.current.count=impactCount;casings.current.count=casingCount;
    tracers.current.instanceMatrix.needsUpdate=true;impacts.current.instanceMatrix.needsUpdate=true;casings.current.instanceMatrix.needsUpdate=true;
    if(impacts.current.instanceColor)impacts.current.instanceColor.needsUpdate=true;
    if(casings.current.instanceColor)casings.current.instanceColor.needsUpdate=true;
  });
  return <>
    <instancedMesh ref={tracers} args={[undefined,undefined,CONFIG.maxEffects]} frustumCulled={false}><cylinderGeometry args={[1,1,1,4]}/><meshBasicMaterial color="#e6d2a8"/></instancedMesh>
    <instancedMesh ref={impacts} args={[undefined,undefined,CONFIG.maxEffects*5]} frustumCulled={false}><icosahedronGeometry args={[1,0]}/><meshBasicMaterial vertexColors/></instancedMesh>
    <instancedMesh ref={casings} args={[undefined,undefined,CONFIG.maxCasings]} frustumCulled={false}><boxGeometry args={[.025,.061,.025]}/><meshStandardMaterial vertexColors roughness={.42} metalness={.68}/></instancedMesh>
  </>;
}
