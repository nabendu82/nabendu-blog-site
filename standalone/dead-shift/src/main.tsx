import React from 'react';
import { createRoot } from 'react-dom/client';
import { Game } from './game/Game';
import { Interface } from './ui/Interface';
import './style.css';
import './visual-polish.css';
import { CharacterInspection } from './player/CharacterInspection';
import { sim } from './game/Simulation';
function App(){
  const [inspect,setInspect]=React.useState(false);
  const previous=React.useRef(sim.mode);
  const close=()=>{sim.mode=previous.current;setInspect(false);};
  React.useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.code!=='F4'||e.repeat)return;e.preventDefault();if(inspect){sim.mode=previous.current;setInspect(false);}else{previous.current=sim.mode;sim.mode='paused';sim.clearInput();setInspect(true);}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[inspect]);
  return <div className="app">{inspect?<CharacterInspection onClose={close}/>:<><Game/><Interface/></>}</div>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
