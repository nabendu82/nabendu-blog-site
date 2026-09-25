import { useEffect } from 'react';
import { sim } from '../game/Simulation';
import { useGameStore } from '../stores/gameStore';
export function usePlayerController(){useEffect(()=>{
  const keys=new Set<string>();
  const releaseTimers=new Map<string,ReturnType<typeof setTimeout>>();
  const update=()=>{sim.input.x=Number(keys.has('KeyD'))-Number(keys.has('KeyA'));sim.input.z=Number(keys.has('KeyS'))-Number(keys.has('KeyW'));};
  const clear=()=>{for(const timer of releaseTimers.values())clearTimeout(timer);releaseTimers.clear();keys.clear();sim.clearInput();};
  const keydown=(e:KeyboardEvent)=>{if(['KeyW','KeyA','KeyS','KeyD','Escape'].includes(e.code)||(import.meta.env.DEV&&['F3','F5','F6','F7'].includes(e.code)))e.preventDefault();
    if(e.code==='Escape'&&!e.repeat){clear();if(window.parent!==window)window.parent.postMessage({type:'dead-shift:escape'},window.location.origin);const s=useGameStore.getState();if(sim.mode==='playing')s.pause();else if(sim.mode==='paused')s.resume();}
    if(e.code==='F3'&&!e.repeat&&import.meta.env.DEV)useGameStore.getState().toggleDebug();
    if(e.code==='F5'&&!e.repeat&&import.meta.env.DEV)useGameStore.getState().toggleShootingDebug();
    if(e.code==='F6'&&!e.repeat&&import.meta.env.DEV)useGameStore.getState().toggleProgressionDebug();
    if(e.code==='F7'&&!e.repeat&&import.meta.env.DEV)useGameStore.getState().toggleWeaponDebug();
    if(import.meta.env.DEV&&useGameStore.getState().weaponDebug&&/^Digit[0-9]$/.test(e.code)){e.preventDefault();if(!e.repeat)useGameStore.getState().setDebugWeapon(e.code==='Digit0'?9:Number(e.code.slice(-1))-1);}
    if(sim.mode==='playing'){clearTimeout(releaseTimers.get(e.code));keys.add(e.code);update();}};
  // Preserve very short taps through at least one simulation tick. Normal release
  // still blends down; no key events are lost between display frames.
  const keyup=(e:KeyboardEvent)=>{clearTimeout(releaseTimers.get(e.code));releaseTimers.set(e.code,setTimeout(()=>{keys.delete(e.code);releaseTimers.delete(e.code);update();},40));};
  const down=(e:PointerEvent)=>{if(e.button===0&&e.target instanceof HTMLCanvasElement&&sim.mode==='playing'){sim.input.fire=true;sim.input.aiming=true;sim.pendingShot=true;}};
  const up=()=>{sim.input.fire=false;};
  const blur=()=>{clear();};
  const visibility=()=>{if(document.hidden){clear();useGameStore.getState().pause();}};
  window.addEventListener('keydown',keydown);window.addEventListener('keyup',keyup);window.addEventListener('pointerdown',down);window.addEventListener('pointerup',up);window.addEventListener('blur',blur);document.addEventListener('visibilitychange',visibility);
  return()=>{clear();window.removeEventListener('keydown',keydown);window.removeEventListener('keyup',keyup);window.removeEventListener('pointerdown',down);window.removeEventListener('pointerup',up);window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',visibility);};
},[]);}
