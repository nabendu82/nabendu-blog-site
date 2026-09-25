import type { Mode } from '../game/Simulation';
import type { WeaponDefinition } from '../game/config';

export type Cue='xp'|'dna'|'level'|'mutation'|'shot';
export type AudioSettings={master:number;music:number;sfx:number};
export const DEFAULT_AUDIO_SETTINGS:AudioSettings={master:.8,music:.5,sfx:.8};
let settings={...DEFAULT_AUDIO_SETTINGS};
let context:AudioContext|undefined;
let master:GainNode|undefined,music:GainNode|undefined,sfx:GainNode|undefined;
let calm:GainNode|undefined,combat:GainNode|undefined;
let loading:Promise<void>|undefined;
let musicLoaded=false;
let noiseBuffer:AudioBuffer|undefined;
let currentMode:Mode='title',currentThreat=0;
let muted=false;
const clamp=(n:number)=>Math.max(0,Math.min(1,n));

function ensureAudio(){
  if(typeof window==='undefined'||!window.AudioContext)return;
  if(context)return context;
  context=new AudioContext();
  master=context.createGain();music=context.createGain();sfx=context.createGain();
  calm=context.createGain();combat=context.createGain();
  calm.connect(music);combat.connect(music);music.connect(master);sfx.connect(master);master.connect(context.destination);
  setAudioSettings(settings);
  return context;
}
export function setAudioSettings(next:AudioSettings){
  settings={master:clamp(next.master),music:clamp(next.music),sfx:clamp(next.sfx)};
  if(!context)return;
  const now=context.currentTime;
  master?.gain.setTargetAtTime(muted?0:settings.master,now,.05);
  music?.gain.setTargetAtTime(settings.music,now,.05);
  sfx?.gain.setTargetAtTime(settings.sfx,now,.05);
}
export function getAudioSettings(){return {...settings};}
export function setAudioMuted(next:boolean){muted=next;setAudioSettings(settings);}

async function loadMusic(ctx:AudioContext){
  const paths=['dead-shift-calm.mp3','dead-shift-combat.mp3'].map(name=>`${import.meta.env.BASE_URL}audio/music/${name}`);
  const buffers=await Promise.all(paths.map(async path=>{
    const response=await fetch(path);
    if(!response.ok)throw new Error(`Music ${path}: ${response.status}`);
    return ctx.decodeAudioData(await response.arrayBuffer());
  }));
  // Both stems start at the same audio-clock time and keep looping together.
  const startAt=ctx.currentTime+.05;
  for(let index=0;index<buffers.length;index++){
    const source=ctx.createBufferSource();source.buffer=buffers[index];source.loop=true;
    source.loopStart=0;source.loopEnd=Math.min(32,buffers[index].duration);
    source.connect(index===0?calm!:combat!);source.start(startAt);
  }
  musicLoaded=true;
  setAudioMode(currentMode,currentThreat);
}
export function getAudioDebug(){return {state:context?.state??'uninitialized',musicLoaded,threat:currentThreat,master:settings.master,music:settings.music,sfx:settings.sfx};}
export function startGameAudio(){
  const ctx=ensureAudio();if(!ctx)return;
  void ctx.resume();
  if(!loading)loading=loadMusic(ctx).catch(error=>{loading=undefined;console.warn('DEAD//SHIFT music unavailable',error);});
  setAudioMode('playing',0);
}
export function setAudioMode(mode:Mode,threat=0){
  currentMode=mode;currentThreat=clamp(threat);
  if(!context)return;
  if(mode==='paused'||mode==='dead'||mode==='title'){if(context.state==='running')void context.suspend();return;}
  if(context.state==='suspended')void context.resume();
  const quiet=mode==='levelup'||mode==='mutation'||mode==='evolving';
  const level=quiet ? .16 : currentThreat;
  const now=context.currentTime;
  calm?.gain.setTargetAtTime((quiet ? .30 : 1)*(1-.62*level),now,.7);
  combat?.gain.setTargetAtTime((quiet ? .12 : 1)*.86*level,now,.7);
}
function firearmReport(ctx:AudioContext,weapon:WeaponDefinition,now:number){
  if(!sfx)return;
  if(!noiseBuffer){noiseBuffer=ctx.createBuffer(1,Math.round(ctx.sampleRate*.6),ctx.sampleRate);const samples=noiseBuffer.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;}
  const heavy=weapon.category==='shotgun'||weapon.category==='antimateriel';
  const length=weapon.category==='antimateriel'?.31:heavy?.22:weapon.category==='support'?.115:.14;
  const src=ctx.createBufferSource();src.buffer=noiseBuffer;
  const high=ctx.createBiquadFilter();high.type='highpass';high.frequency.value=heavy?80:170;
  const low=ctx.createBiquadFilter();low.type='lowpass';low.frequency.value=weapon.category==='antimateriel'?2400:weapon.category==='shotgun'?3200:weapon.category==='support'?4800:5400;
  const gain=ctx.createGain();gain.gain.setValueAtTime(.0001,now);gain.gain.linearRampToValueAtTime(heavy?.19:.12,now+.003);gain.gain.exponentialRampToValueAtTime(.0001,now+length);
  src.connect(high).connect(low).connect(gain).connect(sfx);src.start(now);src.stop(now+length+.01);
  const thump=ctx.createOscillator(),bass=ctx.createGain();thump.type='triangle';
  thump.frequency.setValueAtTime(heavy?118:175,now);thump.frequency.exponentialRampToValueAtTime(heavy?45:75,now+length*.75);
  bass.gain.setValueAtTime(heavy?.105:.035,now);bass.gain.exponentialRampToValueAtTime(.0001,now+length);
  thump.connect(bass).connect(sfx);thump.start(now);thump.stop(now+length+.01);
}
export function playCue(cue:Cue,weapon?:WeaponDefinition){
  const ctx=ensureAudio();if(!ctx||!sfx||ctx.state!=='running')return;
  const now=ctx.currentTime;
  if(cue==='shot'){if(weapon)firearmReport(ctx,weapon,now);return;}
  const osc=ctx.createOscillator(),gain=ctx.createGain();
  osc.type=cue==='mutation'?'triangle':'sine';
  const start=cue==='xp'?620:cue==='dna'?310:cue==='level'?440:weapon?.evolutionStage===3?540:480;
  const end=cue==='xp'?940:cue==='dna'?520:cue==='level'?880:240;
  const duration=cue==='mutation'?.38:.22;
  osc.frequency.setValueAtTime(start,now);osc.frequency.exponentialRampToValueAtTime(end,now+duration*.86);
  gain.gain.setValueAtTime(.0001,now);
  gain.gain.exponentialRampToValueAtTime(cue==='mutation'?.07:.035,now+.012);
  gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
  osc.connect(gain).connect(sfx);osc.start(now);osc.stop(now+duration+.01);
}
