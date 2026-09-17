'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Component, useEffect, useState, type ReactNode } from 'react';
import { ArrowRight, Atom, BookOpen, Check, ChevronRight, FlaskConical, Pause, Play, RotateCcw, Search, Sparkles, NotebookPen, ExternalLink } from 'lucide-react';
import { atoms, concentration, labs, litmus, molecules, separationResult, type LabId } from '@/lib/education/chemistry';
const ParticleScene=dynamic(()=>import('./ParticleScene'),{ssr:false,loading:()=> <div className="chem-loading">Preparing your molecular world…</div>});
class ModelBoundary extends Component<{children:ReactNode},{failed:boolean}> {
 state={failed:false}; static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed?<div className="chem-loading">3D is unavailable on this device. All controls, observations and learning notes still work.</div>:this.props.children;}
}
function Choice({label,options,value,onChange}:{label:string;options:string[];value:number;onChange:(n:number)=>void}) {
 return <fieldset className="chem-choice"><legend>{label}</legend><div>{options.map((option,i)=><button key={option} type="button" aria-pressed={value===i} onClick={()=>onChange(i)}>{option}</button>)}</div></fieldset>;
}
function Range({label,value,min,max,onChange,unit=''}:{label:string;value:number;min:number;max:number;onChange:(n:number)=>void;unit?:string}) {
 return <label className="chem-range"><span>{label}<strong>{value}{unit}</strong></span><input type="range" min={min} max={max} value={value} onChange={e=>onChange(Number(e.target.value))}/><small>{min}{unit}<span>{max}{unit}</span></small></label>;
}
const STORAGE='nabendu-chemistry-v1';
type Notebook={completed:string[];notes:Partial<Record<LabId,string>>};
export function ChemistryLab() {
 const [id,setId]=useState<LabId>('states'),[grade,setGrade]=useState(0),[search,setSearch]=useState('');
 const [a,setA]=useState(1),[b,setB]=useState(0),[run,setRun]=useState(false),[paused,setPaused]=useState(false),[speed,setSpeed]=useState(2),[solute,setSolute]=useState(10),[water,setWater]=useState(100);
 const [sceneVersion,setSceneVersion]=useState(0);
 const [answer,setAnswer]=useState<number|null>(null),[book,setBook]=useState<Notebook>({completed:[],notes:{}}),[loaded,setLoaded]=useState(false),[storageMessage,setStorageMessage]=useState('Saved on this device'),[motionPreference,setMotionPreference]=useState(false);
 const lab=labs.find(l=>l.id===id)!;
 useEffect(()=>{
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');const update=()=>{setMotionPreference(media.matches);setPaused(media.matches)};update();media.addEventListener('change',update);
  try { const raw=localStorage.getItem(STORAGE);if(raw){const parsed=JSON.parse(raw);setBook({completed:Array.isArray(parsed.completed)?parsed.completed.filter((v:unknown)=>typeof v==='string'&&labs.some(l=>l.id===v)):[],notes:parsed.notes&&typeof parsed.notes==='object'?Object.fromEntries(Object.entries(parsed.notes).filter(([key,value])=>labs.some(l=>l.id===key)&&typeof value==='string').map(([key,value])=>[key,(value as string).slice(0,2000)])):{}})}}catch{setStorageMessage('Progress is available for this visit only')}
  setLoaded(true);return()=>media.removeEventListener('change',update);
 },[]);
 useEffect(()=>{if(!loaded)return;try{localStorage.setItem(STORAGE,JSON.stringify(book))}catch{setStorageMessage('Progress is available for this visit only')}},[book,loaded]);
 function reset(next:LabId=id){setSceneVersion(v=>v+1);setA(next==='states'?1:0);setB(0);setRun(false);setPaused(motionPreference);setSpeed(2);setSolute(10);setWater(100);setAnswer(null)}
 function select(next:LabId){setId(next);reset(next)}
 function changeGrade(next:number){setGrade(next);setSearch('');const first=labs.find(l=>next===0||l.grades.includes(next));if(first&&!lab.grades.includes(next)&&next!==0)select(first.id)}
 const filtered=labs.filter(l=>(!grade||l.grades.includes(grade))&&`${l.title} ${l.tag} ${l.concept}`.toLowerCase().includes(search.toLowerCase()));
 const result=id==='states'?['Particles vibrate around fixed positions. Shape and volume stay fixed.','Particles remain close but move past each other. A liquid takes the shape of its container.','Particles spread through the container. A gas has neither fixed shape nor fixed volume.'][a]
  :id==='materials'?['The pattern is clearly visible through the glass.','Light passes through, but details are blurred.','The wooden sample blocks your view.'][a]
  :id==='separation'?(run?separationResult(a,b).result:'Make a prediction, choose a separation method, then run the experiment.')
  :id==='indicators'?(run?`${['Lemon juice is acidic','Soap solution is basic','Neutral water is neutral'][a]}. The strip ${litmus(a,b)===(b===0?'blue':'red')?'stays':'turns'} ${litmus(a,b)}.`:'Choose red or blue litmus. What colour do you predict after dipping it?')
  :id==='changes'?(run?['Melting changes the state, not the substance: a physical change.','Tearing changes size and shape, not the substance: a physical change.','Rust forms new substances: a chemical change. Oxygen and water are needed.'][a]:'Observe the starting material, then apply the change.')
  :id==='metals'?(run?a===1?'Plastic does not complete a conducting path. The lamp stays off.':`${a===0?'Copper is a metal':'Graphite is a non-metal'}, and conducts electricity. The lamp lights up.`:'Select a material and close the circuit.')
  :id==='solutions'?`${solute} ÷ (${solute} + ${water}) × 100 = ${concentration(solute,water).toFixed(2)}% by mass. Total solution mass: ${solute+water} g.`
  :id==='atoms'?`${atoms[a].name}: ${atoms[a].protons} protons, ${atoms[a].neutrons} neutrons and ${atoms[a].protons} electrons. Electron distribution: ${atoms[a].shells.join(', ')}.`
  :`${molecules[a].composition}. ${molecules[a].expression} = ${molecules[a].mass} u. A molecule of ${molecules[a].compound?'a compound':'an element'}.`;
 function answerQuiz(i:number){setAnswer(i);if(i===lab.quiz.answer)setBook(prev=>({...prev,completed:Array.from(new Set([...prev.completed,id]))}))}
 return <main className="chem-root">
  <header className="chem-header"><Link href="/education/chemistry" className="chem-brand"><span><FlaskConical size={23}/></span><div>Elementa<span>THE CHEMISTRY LAB</span></div></Link><nav aria-label="Lab navigation"><a href="#chem-library">Experiment library</a><a href="#chem-notebook">My notebook <span>{book.completed.length}/9</span></a><Link href="/education/physics">Physics lab <ArrowRight size={15}/></Link></nav><span className="chem-school">CBSE · CLASSES 6–9</span></header>
  <section className="chem-hero"><div><p className="chem-eyebrow"><span/> THE INTERACTIVE SCIENCE STUDIO</p><h1>Chemistry, <em>within reach.</em></h1><p>Turn it around. Take it apart. Make a discovery.</p></div><span className="chem-studio-badge">09 experiments · All in 3D</span></section>
  <div className="chem-gradebar"><span>YOUR LEARNING LEVEL</span><div>{[0,6,7,8,9].map(g=><button key={g} aria-pressed={grade===g} onClick={()=>changeGrade(g)}>{g?`Class ${g}`:'All classes'}</button>)}</div><small>Explore at your own pace</small></div>
  <div className="chem-layout" id="chem-workbench">
   <aside className="chem-library" id="chem-library"><div className="chem-section-label"><BookOpen size={15}/> EXPERIMENT LIBRARY <span>{filtered.length.toString().padStart(2,'0')}</span></div><label className="chem-search"><Search size={16}/><input aria-label="Search experiments" placeholder="Find a little wonder…" value={search} onChange={e=>setSearch(e.target.value)}/></label><div className="chem-lab-list">{filtered.map(l=><button key={l.id} aria-current={id===l.id?'true':undefined} onClick={()=>select(l.id)}><span className="chem-lab-icon">{book.completed.includes(l.id)?<Check size={19}/>:l.id==='atoms'||l.id==='molecules'?<Atom size={20}/>:<FlaskConical size={19}/>}</span><span><strong>{l.title}</strong><small>CLASS {l.grades.join(' · ')} · {l.tag}</small></span><ChevronRight size={14}/></button>)}{filtered.length===0&&<p className="chem-empty">No experiments found. Try “water” or choose another class.<button onClick={()=>setSearch('')}>Clear search</button></p>}</div><div className="chem-library-note"><Sparkles size={19}/><strong>No lab coat required.</strong><p>Every experiment here is virtual. Try an idea, reset, and try again.</p></div></aside>
   <section className="chem-main" aria-label="Selected experiment">
    <div className="chem-lab-heading"><div><p className="chem-eyebrow">LAB {String(labs.indexOf(lab)+1).padStart(2,'0')} <span className="chem-divider">/</span> {lab.tag.toUpperCase()}</p><h2>{lab.title}</h2><p>{lab.subtitle}</p></div><button className="chem-reset" onClick={()=>reset()}><RotateCcw size={15}/> Reset lab</button></div>
    <div className="chem-bench"><div className="chem-view"><div className="chem-view-top"><span><span className="chem-live-dot"/>LIVE 3D WORKBENCH</span><span>CLASS {lab.grades.join(' / ')}</span></div><div className="chem-model"><ModelBoundary key={id}><ParticleScene key={`${id}-${sceneVersion}`} kind={id} index={a} method={b} run={run} solute={solute} water={water} speed={speed} paused={paused}/></ModelBoundary></div><div className="chem-view-bottom"><span>Virtual models · Select Move objects to rearrange your lab</span><button aria-pressed={paused} onClick={()=>setPaused(!paused)}>{paused?<Play size={13}/>:<Pause size={13}/>} {paused?'Play motion':'Pause motion'}</button></div></div>
     <div className="chem-controls"><div className="chem-section-label">YOUR EXPERIMENT</div><h3>What if you change…</h3>
      {id==='states'&&<><Choice label="State of matter" options={['Solid','Liquid','Gas']} value={a} onChange={setA}/><Range label="Motion speed" value={speed} min={1} max={5} onChange={setSpeed} unit="×"/><p className="chem-hint">The same 48 model particles are shown in every state.</p></>}
      {id==='materials'&&<Choice label="Material sample" options={['Clear glass','Frosted glass','Wood']} value={a} onChange={setA}/>}
      {id==='separation'&&<><Choice label="Mixture" options={['Sand + water','Salt + water','Iron + sand']} value={a} onChange={v=>{setA(v);setRun(false)}}/><Choice label="Method" options={['Filtration','Evaporation','Magnet']} value={b} onChange={v=>{setB(v);setRun(false)}}/></>}
      {id==='indicators'&&<><Choice label="Sample solution" options={['Lemon juice','Soap solution','Neutral water']} value={a} onChange={v=>{setA(v);setRun(false)}}/><Choice label="Litmus strip" options={['Blue litmus','Red litmus']} value={b} onChange={v=>{setB(v);setRun(false)}}/></>}
      {id==='changes'&&<Choice label="Change to investigate" options={['Melt ice','Tear paper','Rust iron']} value={a} onChange={v=>{setA(v);setRun(false)}}/>}
      {id==='metals'&&<Choice label="Circuit sample" options={['Copper','Plastic','Graphite']} value={a} onChange={v=>{setA(v);setRun(false)}}/>}
      {id==='solutions'&&<><Range label="Dissolved salt" min={0} max={15} value={solute} onChange={setSolute} unit=" g"/><Range label="Water" min={50} max={200} value={water} onChange={setWater} unit=" g"/><div className="chem-formula">solute mass / solution mass × 100</div></>}
      {id==='atoms'&&<><Choice label="Neutral atom" options={atoms.map(v=>v.name)} value={a} onChange={setA}/><div className="chem-metrics"><div><small>ATOMIC NUMBER</small><strong>{atoms[a].protons}</strong></div><div><small>MASS NUMBER</small><strong>{atoms[a].protons+atoms[a].neutrons}</strong></div></div></>}
      {id==='molecules'&&<><Choice label="Molecule" options={molecules.map(m=>m.formula)} value={a} onChange={setA}/><div className="chem-metrics"><div><small>MOLECULAR MASS</small><strong>{molecules[a].mass} <small>u</small></strong></div></div><p className="chem-hint">Approximate atomic masses: H = 1 u, C = 12 u, O = 16 u.</p></>}
      {['separation','indicators','changes','metals'].includes(id)&&<button className="chem-run" onClick={()=>setRun(!run)}>{run?<RotateCcw size={16}/>:<Play size={16}/>} {run?'Reset experiment':id==='indicators'?'Dip the litmus':id==='metals'?'Close the circuit':'Run experiment'}</button>}
      <div className="chem-prediction"><span>BEFORE YOU TRY</span><p>{lab.question}</p></div>
     </div>
    </div>
    <div className="chem-observation" role="status" aria-live="polite"><span><Sparkles size={19}/></span><div><strong>Look closely</strong><p>{result}</p></div></div>
    <div className="chem-learning"><article><p className="chem-eyebrow">01 / UNDERSTAND</p><h3>The science behind it</h3><p>{lab.concept}</p><div className="chem-everyday"><strong>Out in the real world</strong><p>{lab.everyday}</p></div><details><summary>About this model</summary><p>{lab.limitation}</p></details></article><article className="chem-quiz"><p className="chem-eyebrow">02 / CHECK YOUR THINKING</p><h3>{lab.quiz.prompt}</h3><div className="chem-answers">{lab.quiz.options.map((option,i)=><button key={option} aria-pressed={answer===i} className={answer===i?(i===lab.quiz.answer?'correct':'incorrect'):''} onClick={()=>answerQuiz(i)}><span>{String.fromCharCode(65+i)}</span>{option}{answer===i&&i===lab.quiz.answer&&<Check size={17}/>}</button>)}</div>{answer!==null&&<p className="chem-feedback" role="status"><strong>{answer===lab.quiz.answer?'You’ve got it.':'Not quite — try again.'}</strong> {lab.quiz.explanation}</p>}</article></div>
    <section className="chem-notebook" id="chem-notebook"><div><p className="chem-eyebrow"><NotebookPen size={15}/> 03 / YOUR LAB NOTEBOOK</p><h3>Make the discovery yours.</h3><p>{lab.tryIt}</p><small>{storageMessage} · {book.completed.length} of {labs.length} quick checks completed</small></div><label><span>What did you notice?</span><textarea maxLength={2000} value={book.notes[id]??''} onChange={e=>setBook(prev=>({...prev,notes:{...prev.notes,[id]:e.target.value}}))} placeholder="I predicted… I changed… I observed…"/><small>Notes save automatically. No account needed.</small></label></section>
   </section>
  </div>
  <footer className="chem-footer"><div><FlaskConical size={19}/><strong>Elementa</strong><span>A Nabendu learning lab</span></div><p>Suggested levels for CBSE Classes 6–9. A concept companion, not a complete syllabus or an official NCERT product. Chapter order varies by textbook edition.</p><div><a href="https://ncert.nic.in/textbook.php" target="_blank" rel="noreferrer">NCERT textbooks <ExternalLink size={12}/></a><a href="https://cbseacademic.nic.in/web_material/CurriculumMain27/SecPart1/ScienceSt_SecP1_2026-27.pdf" target="_blank" rel="noreferrer">CBSE Class 9 · 2026–27 <ExternalLink size={12}/></a><Link href="/education/physics">Explore Mechanica Lab <ArrowRight size={13}/></Link></div></footer>
 </main>;
}
