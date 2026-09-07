const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict'),{test}=require('node:test')
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:1,target:7}}).outputText,f)
let time=1000, effects=0, music, interval
Object.defineProperty(globalThis,'performance',{value:{now:()=>time},configurable:true})
const parameter=()=>({setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}})
const node=()=>({connect(){},frequency:parameter(),gain:parameter(),start(){effects++},stop(){}})
globalThis.window={AudioContext:class {
  state='running';currentTime=0;sampleRate=32000;destination={}
  createOscillator(){return node()} createGain(){return node()} createBiquadFilter(){return node()}
  createBufferSource(){return node()} createBuffer(_,n){return {getChannelData:()=>new Float32Array(n)}}
},setInterval(fn){interval=fn;return 1},clearInterval(){interval=undefined}}
globalThis.Audio=class {
  paused=true;volume=1;currentTime=0
  constructor(){music=this}
  play(){this.paused=false;return Promise.resolve()}
  pause(){this.paused=true}
}
const audio=require('../components/games/sovereign-clash/game/audio.ts')
test('new score loops, ducks during battle, and respects mute/unmute/stop',()=>{
  audio.startMusic()
  assert.equal(music.src,'/games/sovereign-clash/frontier-dawn.m4a')
  assert.equal(music.loop,true);assert.equal(music.paused,false)
  audio.notifyCombat();assert.equal(music.volume,0.09)
  time+=5000
  for(let i=0;i<10&&interval;i++)interval()
  assert.equal(music.volume,0.24)
  audio.setMuted(true);assert.equal(music.paused,true)
  audio.setMuted(false);assert.equal(music.paused,false)
  audio.stopMusic();assert.equal(music.paused,true);assert.equal(music.currentTime,0)
})
test('gathering, building, weapons and alerts all retain sound effects',()=>{
  for(const action of ['chop','mine','farm','build','sword','bow','musket','siege','collapse','raid','spawn','age','fanfare','defeat']) {
    time+=1000
    const before=effects
    audio.playSound(action)
    assert.ok(effects>before,`${action} is silent`)
  }
  audio.setMuted(true)
  const before=effects
  audio.playSound('musket')
  assert.equal(effects,before)
})
