import { memo,useEffect,useMemo,useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { createPortal, useFrame } from '@react-three/fiber';
import { AnimationMixer,LoopOnce,LoopRepeat,Mesh,MeshStandardMaterial,Quaternion,type Group } from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { sim,type Actor } from '../game/Simulation';
import { asset } from '../world/CityArena';
import { ENEMIES,RUN_AUTHORED_SPEED } from '../game/config';
import { motionDebug } from './motionDebug';
const angleDelta=(from:number,to:number)=>Math.atan2(Math.sin(to-from),Math.cos(to-from));
export const ActorModel = memo(function ActorModel({actor,player=false,children}:{actor:Actor;player?:boolean;children?:React.ReactNode}){
  const gltf=useGLTF(asset(player?'characters/survivor':ENEMIES[actor.kind].model));
  const group=useRef<Group>(null);
  const index=useMemo(()=>sim.enemies.indexOf(actor),[actor]);
  const data=useMemo(()=>{const model=clone(gltf.scene);const owned:MeshStandardMaterial[]=[];const fade={value:1};const variant=player?0:sim.enemies.indexOf(actor)%4;
    model.traverse(o=>{if(o instanceof Mesh){o.castShadow=true;o.receiveShadow=true;
      const recolor=(source:MeshStandardMaterial)=>{const m=source.clone();owned.push(m);
        if(!player&&/skin|shirt|pant/.test(m.name.toLowerCase()))m.color.set(['#ffffff','#e2dfd1','#c8d1ca','#ded0bd'][variant]);
        m.onBeforeCompile=shader=>{shader.uniforms.deathFade=fade;shader.fragmentShader='uniform float deathFade;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <alphatest_fragment>','#include <alphatest_fragment>\nif(fract(sin(dot(floor(gl_FragCoord.xy),vec2(12.9898,78.233)))*43758.5453)>deathFade) discard;');};m.customProgramCacheKey=()=> 'actor-dissolve';return m;};
      o.material=Array.isArray(o.material)?o.material.map(recolor):recolor(o.material);
    }});const socket=model.getObjectByName('WeaponSocket');model.updateMatrixWorld(true);const socketCorrection=socket?socket.getWorldQuaternion(new Quaternion()).invert():new Quaternion();const mixer=new AnimationMixer(model);
    const actions=Object.fromEntries(gltf.animations.map(source=>{
      if(!player)return [source.name,mixer.clipAction(source)];
      const clip=source.clone();
      // Blender's Root translation contains a small horizontal drift. World
      // locomotion is entirely simulation-driven; keep bone rotations and legs.
      clip.tracks=clip.tracks.filter(track=>!/(^|\.)Root\.position$/.test(track.name));
      if(clip.name==='Shoot')clip.tracks=clip.tracks.filter(track=>/^(Spine|Head|UpperArm|Forearm|Hand|WeaponSocket)\./.test(track.name));
      return [clip.name,mixer.clipAction(clip)];
    }));return {model,mixer,actions,owned,fade,variant,socket,socketCorrection};},[gltf,actor,player]);
  const previous=useRef('');const generation=useRef(-1);const lastShot=useRef(0);const shotFading=useRef(false);
  useEffect(()=>()=>{data.mixer.stopAllAction();data.mixer.uncacheRoot(data.model);data.owned.forEach(m=>m.dispose());},[data]);
  useFrame(({clock},dt)=>{
    if(!group.current)return;const ambient=sim.mode==='title'&&!player;
    group.current.visible=ambient?index<8:actor.active;
    if(!group.current.visible)return;
    group.current.position.set(actor.x,0,actor.z);
    let facing=actor.yaw;
    const speed=Math.hypot(sim.vx,sim.vz);
    if(player&&speed>.3){const moveYaw=Math.atan2(sim.vx,sim.vz);
      // Keep locomotion oriented toward travel, while allowing the torso and
      // rifle to turn toward the cursor. Fire commits fully to the aim angle.
      const aimBlend=sim.input.fire||sim.recoil>0?1:sim.input.aiming?.55:0;
      facing=moveYaw+Math.max(-Math.PI/2,Math.min(Math.PI/2,angleDelta(moveYaw,actor.yaw)))*aimBlend;
    }
    if(generation.current!==actor.generation)group.current.rotation.y=facing;
    else group.current.rotation.y+=angleDelta(group.current.rotation.y,facing)*(1-Math.exp(-15*Math.min(dt,.05)));
    if(ambient){group.current.position.set((index%2?1:-1)*(6+index*.6)+Math.sin(clock.elapsedTime*.17+index)*2,0,-7-index*.7);group.current.rotation.y=Math.cos(clock.elapsedTime*.17+index)>0?Math.PI/2:-Math.PI/2;}
    data.fade.value=player?1:Math.max(0,1-Math.max(0,actor.death-1.8)/1.2);
    if(!player){const variation=(actor.kind==='tank'?1.10:1)*(1+data.variant*.018);group.current.scale.set(variation,variation,variation);}
    if(generation.current!==actor.generation){data.mixer.stopAllAction();generation.current=actor.generation;previous.current='';if(player){lastShot.current=sim.shots;shotFading.current=true;}}
    const moving=player?speed>.2:true;
    const walk=actor.kind==='runner'?'Run':actor.kind==='tank'?'Heavy Walk':'Walk';
    const attack=actor.kind==='tank'?'Heavy Attack':'Attack';
    const name=ambient?walk:actor.hp<=0?'Death':actor.hit>0?'Hit':!player&&actor.attack>.8?attack:moving?(player?'Run':walk):player&&sim.input.aiming?'Aim':'Idle';
    if(name!==previous.current){const old=data.actions[previous.current],next=data.actions[name];if(next){next.reset().setLoop(name==='Death'?LoopOnce:LoopRepeat,name==='Death'?1:Infinity);next.timeScale=actor.kind==='runner'&&name==='Run'?1.45:1;next.clampWhenFinished=name==='Death';next.fadeIn(.15).play();old?.fadeOut(.15);}previous.current=name;}
    if(player){
      const runScale=Math.max(.1,Math.min(2.25,speed/RUN_AUTHORED_SPEED));
      if(data.actions.Run)data.actions.Run.timeScale=runScale;
      // Shoot affects only the upper-body tracks; repeated fire never resets
      // the running legs or stride phase.
      if(sim.shots!==lastShot.current){lastShot.current=sim.shots;const shoot=data.actions.Shoot;if(shoot){shoot.reset().setLoop(LoopOnce,1);shoot.timeScale=2.7;shoot.clampWhenFinished=false;shoot.fadeIn(.025).play();shotFading.current=false;}}
      if(sim.recoil<.04&&!shotFading.current){data.actions.Shoot?.fadeOut(.08);shotFading.current=true;}
      motionDebug.animation=name+(sim.recoil>0?' + Shoot':'');motionDebug.playbackSpeed=name==='Run'?runScale:1;motionDebug.movementSpeed=speed;
      motionDebug.aimDirectionX=Math.sin(actor.yaw);motionDebug.aimDirectionZ=Math.cos(actor.yaw);
      motionDebug.modelForwardX=Math.sin(group.current.rotation.y);motionDebug.modelForwardZ=Math.cos(group.current.rotation.y);
    }
    if(sim.mode==='playing'||sim.mode==='title'||(sim.mode==='dead'&&player))data.mixer.update(Math.min(dt,.05));
  });
  return <group ref={group} dispose={null}><primitive object={data.model}/>{data.socket?createPortal(<group quaternion={data.socketCorrection}>{children}</group>,data.socket):children}</group>;
});
