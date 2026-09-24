import { useMemo,useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Plane,Vector3 } from 'three';
import { sim } from './Simulation';
import { CAMERA } from './config';
import { useGameStore } from '../stores/gameStore';
import { setAudioMode } from '../effects/sound';
export function GameLoop(){
  const data=useMemo(()=>({plane:new Plane(new Vector3(0,1,0),0),aim:new Vector3(),camera:new Vector3(),follow:new Vector3(),look:new Vector3(),ambient:0}),[]);
  const stats=useRef({time:0,frames:0,accumulator:0,generation:-1});
  useFrame(({camera,raycaster,pointer,gl},dt)=>{
    raycaster.setFromCamera(pointer,camera);if(raycaster.ray.intersectPlane(data.plane,data.aim)){sim.input.aimX=data.aim.x;sim.input.aimZ=data.aim.z;}
    const s=stats.current;
    if(sim.mode==='playing'){s.accumulator+=Math.min(dt,.1);while(s.accumulator>=1/60){sim.step(1/60);s.accumulator-=1/60;}}
    else s.accumulator=0;
    const p=sim.player;
    const snap=s.generation!==p.generation;
    if(sim.mode==='title')data.ambient+=Math.min(dt,.05);
    if(sim.mode==='playing'||sim.mode==='evolving'||snap||sim.mode==='title'){
      data.camera.set(p.x,0,sim.mode==='title'?CAMERA.titleOffset:p.z);
      data.follow.lerp(data.camera,snap?1:1-Math.exp(-CAMERA.damping*dt));
      const shake=sim.mode==='playing'?(sim.recoil*.24+p.hit*.19):0;
      const orbit=sim.mode==='title'?Math.sin(data.ambient*.09)*2:0;
      const scale=sim.mode==='evolving'?CAMERA.evolutionScale:1;camera.position.set(data.follow.x+orbit+Math.sin(sim.time*109)*shake,CAMERA.height*scale,data.follow.z+CAMERA.distance*scale+Math.cos(sim.time*97)*shake);
      data.look.set(data.follow.x,0,data.follow.z);camera.lookAt(data.look);
    }s.generation=p.generation;
    s.time+=dt;s.frames++;if(s.time>.25){const nearby=sim.enemies.reduce((count,e)=>count+(e.active&&e.hp>0&&Math.hypot(e.x-p.x,e.z-p.z)<10?1:0),0);setAudioMode(sim.mode,Math.min(1,nearby/7+(p.hp/sim.stats.maxHp<.3?.2:0)));useGameStore.getState().publish();useGameStore.setState({fps:Math.round(s.frames/s.time),calls:gl.info.render.calls});s.time=0;s.frames=0;}
  },-1);
  return null;
}
