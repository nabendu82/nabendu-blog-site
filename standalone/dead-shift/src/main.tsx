import React from 'react';
import { createRoot } from 'react-dom/client';
import { Game } from './game/Game';
import { Interface } from './ui/Interface';
import './style.css';
import './visual-polish.css';
import { CharacterInspection } from './player/CharacterInspection';
import { sim } from './game/Simulation';
import { setAudioMuted } from './effects/sound';
function App(){
  const [inspect,setInspect]=React.useState(false);
  const previous=React.useRef(sim.mode);
  const close=()=>{sim.mode=previous.current;setInspect(false);};
  React.useEffect(()=>{if(!import.meta.env.DEV)return;const key=(e:KeyboardEvent)=>{if(e.code!=='F4'||e.repeat)return;e.preventDefault();if(inspect){sim.mode=previous.current;setInspect(false);}else{previous.current=sim.mode;sim.mode='paused';sim.clearInput();setInspect(true);}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[inspect]);
  React.useEffect(()=>{const receive=(event:MessageEvent)=>{if(event.source!==window.parent||event.origin!==window.location.origin)return;if(event.data?.type==='dead-shift:set-muted'&&typeof event.data.muted==='boolean')setAudioMuted(event.data.muted);};window.addEventListener('message',receive);return()=>window.removeEventListener('message',receive);},[]);
  return <div className="app">{inspect?<CharacterInspection onClose={close}/>:<><Game/><Interface/></>}</div>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
