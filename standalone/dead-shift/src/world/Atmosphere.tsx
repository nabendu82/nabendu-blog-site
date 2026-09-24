import { useEffect,useMemo,useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CanvasTexture,Color,InstancedMesh,Object3D,PointLight } from 'three';
import { sim } from '../game/Simulation';
const sources=[[-7,-5],[2,-27],[19,-8]];
export function FireAndSparks(){
  const fire=useRef<InstancedMesh>(null),sparks=useRef<InstancedMesh>(null),lamp=useRef<PointLight>(null);
  const data=useMemo(()=>({object:new Object3D(),time:0}),[]);
  useFrame((_,dt)=>{if(sim.mode==='playing'||sim.mode==='title')data.time+=Math.min(dt,.05);const t=data.time,o=data.object;
    if(fire.current){for(let i=0;i<9;i++){const source=sources[i%3],height=.35+Math.abs(Math.sin(t*9+i*2))*.65;o.position.set(source[0]+Math.sin(i*8)*.28,.8+height*.3,source[1]+Math.cos(i*8)*.3);o.rotation.set(.1*Math.sin(t*6+i),0,.12*Math.cos(t*8+i));o.scale.set(.16,height,.16);o.updateMatrix();fire.current.setMatrixAt(i,o.matrix);}fire.current.instanceMatrix.needsUpdate=true;}
    if(sparks.current){for(let i=0;i<8;i++){const age=(t*1.7+i*.11)%1;o.position.set(10+Math.sin(i*13)*age,3.7-age*2.6,-11+Math.cos(i*9)*age*.5);o.rotation.set(0,0,age*4);o.scale.setScalar(Math.sin(t*3)>0?.025*(1-age):0);o.updateMatrix();sparks.current.setMatrixAt(i,o.matrix);}sparks.current.instanceMatrix.needsUpdate=true;}
    if(lamp.current)lamp.current.intensity=Math.sin(t*23)>.65?2:14;
  });
  return <><instancedMesh ref={fire} args={[undefined,undefined,9]} frustumCulled={false}><coneGeometry args={[1,1,5]}/><meshBasicMaterial color="#ffb04c" toneMapped={false}/></instancedMesh><instancedMesh ref={sparks} args={[undefined,undefined,8]} frustumCulled={false}><icosahedronGeometry args={[1,0]}/><meshBasicMaterial color="#b2efff" toneMapped={false}/></instancedMesh><pointLight ref={lamp} position={[10,3.7,-11]} color="#9ee3ff" distance={6}/></>;
}
export function Atmosphere(){
  const smoke=useRef<InstancedMesh>(null),embers=useRef<InstancedMesh>(null),paper=useRef<InstancedMesh>(null),light=useRef<PointLight>(null);
  const data=useMemo(()=>{const canvas=document.createElement('canvas');canvas.width=canvas.height=64;const c=canvas.getContext('2d')!;const g=c.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(160,170,175,.24)');g.addColorStop(.45,'rgba(145,160,175,.13)');g.addColorStop(1,'rgba(140,160,180,0)');c.fillStyle=g;c.fillRect(0,0,64,64);return {texture:new CanvasTexture(canvas),dummy:new Object3D(),time:0,colors:[new Color('#ffc375'),new Color('#e95724')]};},[]);
  useEffect(()=>()=>data.texture.dispose(),[data]);
  useFrame(({camera},dt)=>{if(sim.mode==='playing'||sim.mode==='title')data.time+=Math.min(dt,.05);const t=data.time,o=data.dummy;
    if(smoke.current){for(let i=0;i<36;i++){const s=sources[i%3],age=(t*.16+i*.29)%1;o.position.set(s[0]+Math.sin(i*7)*.5+age*2,1+age*6,s[1]+Math.cos(i*3)*.6);o.quaternion.copy(camera.quaternion);o.scale.setScalar(.8+age*2.4);o.updateMatrix();smoke.current.setMatrixAt(i,o.matrix);}smoke.current.instanceMatrix.needsUpdate=true;}
    if(embers.current){for(let i=0;i<32;i++){const s=sources[i%3],age=(t*.65+i*.27)%1;o.position.set(s[0]+Math.sin(i)*age,.45+age*2.8,s[1]+Math.cos(i*2)*age);o.rotation.set(t+i,0,t*.3);o.scale.setScalar(.018+(1-age)*.035);o.updateMatrix();embers.current.setMatrixAt(i,o.matrix);embers.current.setColorAt(i,data.colors[i%2]);}embers.current.instanceMatrix.needsUpdate=true;if(embers.current.instanceColor)embers.current.instanceColor.needsUpdate=true;}
    if(paper.current){for(let i=0;i<12;i++){o.position.set(Math.sin(i*7)*17+Math.sin(t*.7+i)*.6,.06+Math.max(0,Math.sin(t+i))* .2,Math.cos(i*3)*17);o.rotation.set(-Math.PI/2+Math.sin(t+i)*.2,0,i+t*.05);o.scale.set(.18,.25,1);o.updateMatrix();paper.current.setMatrixAt(i,o.matrix);}paper.current.instanceMatrix.needsUpdate=true;}
    if(light.current)light.current.intensity=13+Math.sin(t*17)*2+Math.sin(t*31);
  });
  return <><instancedMesh ref={smoke} args={[undefined,undefined,36]} frustumCulled={false}><planeGeometry/><meshBasicMaterial map={data.texture} transparent depthWrite={false} color="#809299"/></instancedMesh><instancedMesh ref={embers} args={[undefined,undefined,32]} frustumCulled={false}><icosahedronGeometry args={[1,0]}/><meshBasicMaterial color="white" toneMapped={false}/></instancedMesh><instancedMesh ref={paper} args={[undefined,undefined,12]} frustumCulled={false}><planeGeometry/><meshStandardMaterial color="#bcbba3" roughness={1} side={2}/></instancedMesh><pointLight ref={light} position={[-7,1.5,-5]} color="#ff742d" intensity={14} distance={7}/></>;
}
