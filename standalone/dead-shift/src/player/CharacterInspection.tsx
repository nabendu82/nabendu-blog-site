import { useEffect, useMemo, useState } from 'react';
import { Canvas, createPortal, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { AnimationMixer, Mesh, LoopOnce, LoopRepeat, Quaternion } from 'three';
import { Firearm } from '../weapons/Firearm';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { Suspense } from 'react';
import { motionDebug } from './motionDebug';
import { DEBUG_WEAPONS } from '../game/config';
import { sim } from '../game/Simulation';
import { useGameStore } from '../stores/gameStore';

type Kind='survivor'|'walker'|'runner'|'tank'|'hazmat';
const kinds:Kind[]=['survivor','walker','runner','tank','hazmat'];
const clipsByKind:Record<Kind,string[]>={survivor:['Idle','Run','Aim','Shoot','Hit','Death'],walker:['Idle','Walk','Attack','Hit','Death'],runner:['Idle','Run','Attack','Hit','Death'],tank:['Idle','Heavy Walk','Heavy Attack','Hit','Death'],hazmat:['Idle','Walk','Attack','Hit','Death']};
function InspectionModel({kind,clip}:{kind:Kind;clip:string}){
  const gltf=useGLTF(`/assets/${kind==='survivor'?'characters': 'zombies'}/${kind}.glb`);
  const model=useMemo(()=>{const o=clone(gltf.scene);o.traverse(c=>{if(c instanceof Mesh){c.castShadow=true;c.receiveShadow=true;}});return o;},[gltf]);
  const mixer=useMemo(()=>new AnimationMixer(model),[model]);
  useEffect(()=>{const c=gltf.animations.find(a=>a.name===clip);if(!c)return;const action=mixer.clipAction(c);action.reset().setLoop(clip==='Death'?LoopOnce:LoopRepeat,clip==='Death'?1:Infinity);action.timeScale=kind==='survivor'&&clip==='Run'?1.6:kind==='runner'&&clip==='Run'?1.45:1;action.clampWhenFinished=true;action.play();return()=>{mixer.stopAllAction();};},[clip,gltf,kind,mixer]);
  useEffect(()=>()=>mixer.uncacheRoot(model),[mixer,model]);
  useFrame((_,dt)=>mixer.update(Math.min(dt,.05)));
  const socket=model.getObjectByName('WeaponSocket');
  const correction=useMemo(()=>{model.updateMatrixWorld(true);return socket?socket.getWorldQuaternion(new Quaternion()).invert():new Quaternion();},[model,socket]);
  return <><primitive object={model}/>{socket&&createPortal(<group quaternion={correction}><Firearm/></group>,socket)}</>;
}
type View='orbit'|'front'|'side'|'gameplay';
function CameraOrbit({view}:{view:View}){useFrame(({camera,clock})=>{const a=clock.elapsedTime*.13;const position=view==='front'?[0,1.45,3.3]:view==='side'?[3.3,1.45,0]:view==='gameplay'?[0,3.2,3.7]:[Math.sin(a)*3.4,1.6,Math.cos(a)*3.4];camera.position.set(position[0],position[1],position[2]);camera.lookAt(0,.96,0);});return null;}
export function CharacterInspection({onClose}:{onClose:()=>void}){
  const [kind,setKind]=useState<Kind>('survivor');const [clip,setClip]=useState(()=>motionDebug.animation.split(' ')[0]);
  const [view,setView]=useState<View>('orbit');const [weaponId,setWeaponId]=useState(sim.weapon.id);const originalWeapon=useMemo(()=>sim.weapon,[]);
  useEffect(()=>()=>{sim.equipDebugWeapon(originalWeapon);useGameStore.getState().publish();},[originalWeapon]);
  const [telemetry]=useState(()=>({...motionDebug}));
  const clips=clipsByKind[kind];
  return <div style={{position:'fixed',inset:0,zIndex:100,background:'#18232c'}}>
    <Canvas shadows camera={{position:[0,1.6,3.4],fov:36}}><color attach="background" args={['#18232c']}/><ambientLight intensity={1.5}/><directionalLight position={[3,5,4]} intensity={3} castShadow/><directionalLight position={[-3,3,-2]} intensity={2} color="#93bed0"/><mesh rotation={[-Math.PI/2,0,0]} position={[0,-.015,0]} receiveShadow><planeGeometry args={[8,8]}/><meshStandardMaterial color="#273138" roughness={1}/></mesh><Suspense fallback={null}><InspectionModel key={kind} kind={kind} clip={clip}/></Suspense><CameraOrbit view={view}/></Canvas>
    <div style={{position:'absolute',left:24,top:24,color:'#eef0e9',fontFamily:'sans-serif'}}><h2>Character inspection · {kind}</h2><p>Gameplay paused · F4 to return</p><label>Character <select aria-label="Character" value={kind} onChange={e=>{setKind(e.target.value as Kind);setClip('Idle');}}>{kinds.map(k=><option key={k} value={k}>{k}</option>)}</select></label> <label>Animation <select aria-label="Animation" value={clip} onChange={e=>setClip(e.target.value)}>{clips.map(c=><option key={c}>{c}</option>)}</select></label> {kind==='survivor'&&<><label>Weapon <select aria-label="Weapon" value={weaponId} onChange={e=>{const weapon=DEBUG_WEAPONS.find(w=>w.id===e.target.value);if(weapon){sim.equipDebugWeapon(weapon);useGameStore.getState().publish();setWeaponId(weapon.id);}}}>{DEBUG_WEAPONS.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select></label> <label>View <select aria-label="View" value={view} onChange={e=>setView(e.target.value as View)}><option value="orbit">Orbit</option><option value="front">Front</option><option value="side">Side</option><option value="gameplay">Gameplay</option></select></label></>} <button onClick={onClose}>Return to game</button>{kind==='survivor'&&<div style={{marginTop:18,padding:12,background:'#0b1419cc',fontFamily:'monospace',fontSize:13,lineHeight:1.65}}><b>Gameplay motion at F4</b><br/>Animation: {telemetry.animation}<br/>Playback: {telemetry.playbackSpeed.toFixed(2)}×<br/>Movement: {telemetry.movementSpeed.toFixed(2)} m/s<br/>Aim: ({telemetry.aimDirectionX.toFixed(2)}, {telemetry.aimDirectionZ.toFixed(2)})<br/>Model forward: ({telemetry.modelForwardX.toFixed(2)}, {telemetry.modelForwardZ.toFixed(2)})</div>}</div>
  </div>;
}
