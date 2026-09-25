import { useEffect,useLayoutEffect,useMemo,useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { BufferGeometry,InstancedMesh,Material,Mesh,MeshStandardMaterial,Object3D,RepeatWrapping } from 'three';
import { sim } from '../game/Simulation';
import { props,dressing,type Prop } from './layout';
export const asset=(path:string)=>`${import.meta.env.BASE_URL}assets/${path}.glb`;
function Batch({geometry,material,placements,shadow}:{geometry:BufferGeometry;material:Material|Material[];placements:Prop[];shadow:boolean}){
  const ref=useRef<InstancedMesh>(null);
  useLayoutEffect(()=>{const mesh=ref.current;if(!mesh)return;const o=new Object3D();placements.forEach((p,i)=>{o.position.set(p.x,0,p.z);o.rotation.y=p.yaw??0;o.updateMatrix();mesh.setMatrixAt(i,o.matrix);});mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();},[placements]);
  return <instancedMesh ref={ref} args={[geometry,material,placements.length]} castShadow={shadow} receiveShadow dispose={null}/>;
}
function Kit({name,placements}:{name:string;placements:Prop[]}){
  const {scene}=useGLTF(asset(`environment/${name}`));
  const parts=useMemo(()=>{scene.updateMatrixWorld(true);const list:{geometry:BufferGeometry;material:Material|Material[]}[]=[];scene.traverse(o=>{if(o instanceof Mesh){
    const geometry=o.geometry.clone().applyMatrix4(o.matrixWorld);
    // Tile the shared microtexture at ground scale instead of stretching one
    // noise image over the whole city block.
    const materials=Array.isArray(o.material)?o.material:[o.material];
    for(const m of materials)if('map' in m&&m.map&&m.name.includes('asphalt')){m.map.wrapS=m.map.wrapT=RepeatWrapping;m.map.repeat.set(24,24);}
    list.push({geometry,material:o.material});}});return list;},[scene]);
  useEffect(()=>()=>parts.forEach(p=>p.geometry.dispose()),[parts]);
  useFrame(({clock})=>{if(sim.mode!=='playing'&&sim.mode!=='title')return;for(const part of parts)for(const material of Array.isArray(part.material)?part.material:[part.material])if(material instanceof MeshStandardMaterial&&material.name.includes('neon'))material.emissiveIntensity=Math.sin(clock.elapsedTime*2.3)>.97?.35:2;});
  const shadow=!['intersection','city-skirt','oil-stain','blood-stain','pothole'].includes(name);
  return <>{parts.map((part,i)=><Batch key={i} {...part} placements={placements} shadow={shadow}/>)}</>;
}
export function CityArena(){const groups=useMemo(()=>{const map=new Map<string,Prop[]>();for(const p of [{model:'city-skirt',x:0,z:0},{model:'intersection',x:0,z:0},...props,...dressing]){const list=map.get(p.model);if(list)list.push(p);else map.set(p.model,[p]);}return [...map.entries()];},[]);return <>{groups.map(([name,placements])=><Kit key={name} name={name} placements={placements}/>)}</>;}
