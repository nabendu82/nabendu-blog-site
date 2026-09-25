import type { Mode } from '../game/Simulation';
import type { Element } from '../game/config';

export type Cue='xp'|'dna'|'level'|'mutation'|'shot';
export type AudioSettings={master:number;music:number;sfx:number};
export const DEFAULT_AUDIO_SETTINGS:AudioSettings={master:.8,music:.5,sfx:.8};
let settings={...DEFAULT_AUDIO_SETTINGS};
let context:AudioContext|undefined;
let master:GainNode|undefined,music:GainNode|undefined,sfx:GainNode|undefined;
let calm:GainNode|undefined,combat:GainNode|undefined;
let loading:Promise<void>|undefined;
let musicLoaded=false;
let currentMode:Mode='title',currentThreat=0;
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
  master?.gain.setTargetAtTime(settings.master,now,.05);
  music?.gain.setTargetAtTime(settings.music,now,.05);
  sfx?.gain.setTargetAtTime(settings.sfx,now,.05);
}
export function getAudioSettings(){return {...settings};}

async function loadMusic(ctx:AudioContext){
  const paths=['/audio/music/dead-shift-calm.mp3','/audio/music/dead-shift-combat.mp3'];
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
export function playCue(cue:Cue,element:Element='kinetic',stage=0){
  const ctx=ensureAudio();if(!ctx||!sfx||ctx.state!=='running')return;
  const now=ctx.currentTime,osc=ctx.createOscillator(),gain=ctx.createGain();
  const shot=cue==='shot';
  osc.type=shot?(stage>=3?'sawtooth':stage>=2?'square':'triangle'):cue==='mutation'?'sawtooth':'sine';
  const start=shot?(element==='cryo'?165:element==='volt'?195:element==='fire'?105:135)*(1+stage*.12):cue==='xp'?620:cue==='dna'?310:cue==='level'?440:120*(1+stage*.45);
  const end=shot?Math.max(35,start*.35):cue==='xp'?940:cue==='dna'?520:cue==='level'?880:760;
  const duration=shot?.11+stage*.018:cue==='mutation'?.55+stage*.12:.22;
  osc.frequency.setValueAtTime(start,now);osc.frequency.exponentialRampToValueAtTime(end,now+duration*.86);
  gain.gain.setValueAtTime(.0001,now);
  gain.gain.exponentialRampToValueAtTime(shot?.075+stage*.006:cue==='mutation'?.075+stage*.01:.035,now+.012);
  gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
  osc.connect(gain).connect(sfx);osc.start(now);osc.stop(now+duration+.01);
}
