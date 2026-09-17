'use client';
import { litmus, separationResult, concentration } from '@/lib/education/chemistry';
export function LabDiagram({kind,a,b,run,solute,water}:{kind:string;a:number;b:number;run:boolean;solute:number;water:number}) {
 const colour=kind==='indicators'?(run?litmus(a,b)==='red'?'#e67e86':'#73a9ed':b===0?'#73a9ed':'#e67e86'):'#8cdabb';
 const separation=separationResult(a,b);
 return <svg viewBox="0 0 600 350" role="img" aria-label={`${kind} experiment illustration`} className="chem-diagram">
 <defs><filter id="chem-blur"><feGaussianBlur stdDeviation="4"/></filter><linearGradient id="chem-glass" x1="0" x2="1"><stop stopColor="#baf5df" stopOpacity=".08"/><stop offset=".5" stopColor="#baf5df" stopOpacity=".22"/><stop offset="1" stopColor="#baf5df" stopOpacity=".05"/></linearGradient><pattern id="chem-pattern" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M0 15h30M15 0v30" stroke="#b5e5cf" strokeWidth="3"/></pattern></defs>
 <ellipse cx="300" cy="299" rx="180" ry="15" fill="#000" opacity=".16"/>
 {kind==='materials'?<>
  <rect x="195" y="55" width="210" height="215" fill="url(#chem-pattern)" filter={a===1?'url(#chem-blur)':undefined} opacity={a===2?0:a===1?.55:.85}/>
  {a===1&&<rect x="195" y="55" width="210" height="215" fill="#c1e1d3" opacity=".45"/>}
  <rect x="190" y="50" width="220" height="225" rx="12" fill={a===2?'#96764f':'url(#chem-glass)'} stroke="#9cc9b7" strokeWidth="3"/>
  <text x="300" y="322">{['Clear glass · transparent','Frosted glass · translucent','Wood · opaque'][a]}</text>
 </>:kind==='metals'?<>
  <path d="M180 250H105V95H450V250H370" fill="none" stroke={run&&a!==1?'#afe7b4':'#658a7e'} strokeWidth="5"/>
  <rect x="225" y="73" width="60" height="44" rx="6" fill="#e1b271"/><text x="255" y="101" fill="#173a2e">3 V</text>
  <circle cx="450" cy="95" r="32" fill={run&&a!==1?'#f4dd95':'#324d44'} stroke="#96b3a7" strokeWidth="3"/>
  {run&&a!==1&&<circle cx="450" cy="95" r="49" fill="#f4dd95" opacity=".1"/>}
  <rect x="180" y="229" width="190" height="42" rx="8" fill={['#c58a63','#c9a6dc','#71818b'][a]}/>
  <text x="275" y="256" fill="#102b21">{['Copper','Plastic','Graphite'][a]}</text><text x="300" y="322">{!run?'Close the circuit to test':a===1?'Lamp off · insulator':'Lamp on · conductor'}</text>
 </>:kind==='changes'?<>
  <g transform={run&&a===1?'translate(-35 0)':''}><rect x="190" width={a===1?95:210} height={run&&a===0?35:140} y={run&&a===0?235:95} rx={a===0?14:2} fill={a===0?'#8dcce0':a===1?'#ede6d3':run?'#b96945':'#91a5aa'} stroke="#cce8dc" strokeWidth="2"/></g>
  {a===1&&<rect x={run?320:285} y={run?128:95} width="115" height="140" fill="#ede6d3"/>}
  {a===2&&run&&Array.from({length:16},(_,i)=><circle key={i} cx={205+i%5*40} cy={112+Math.floor(i/5)*32} r="9" fill="#734d36" opacity=".65"/>)}
  <text x="300" y="322">{run?['Liquid water · same substance','Smaller pieces · still paper','Rust · new substances'][a]:['Ice','Sheet of paper','Iron surface'][a]}</text>
 </>:<>
  <path d="M190 65V264Q190 282 210 282H390Q410 282 410 264V65" fill="url(#chem-glass)" stroke="#8eb9a8" strokeWidth="3"/>
  <path d="M194 154Q300 144 406 154V261Q406 277 389 277H211Q194 277 194 261Z" fill={kind==='separation'&&(a===2||(run&&b===1))?'transparent':'#74c8ae'} opacity=".4"/>
  {[105,140,175,210,245].map(y=><path key={y} d={`M380 ${y}h22`} stroke="#a4cdbd" strokeWidth="2"/>)}
  {kind==='indicators'?<><rect x="278" y={run?105:35} width="42" height="160" rx="3" fill={colour}/><text x="300" y="322">{run?`Litmus appears ${litmus(a,b)}`:'Choose a sample, then dip the strip'}</text></>:kind==='solutions'?<>
   {Array.from({length:Math.round(solute)},(_,i)=><circle key={i} cx={215+(i*71)%167} cy={167+(i*31)%96} r="4" fill="#f0dba6"/>)}
   <text x="300" y="120">{concentration(solute,water).toFixed(2)}% by mass</text><text x="300" y="322">{solute} g salt + {water} g water</text>
  </>:<>
   {run&&b===0&&<path d="M218 89h164l-67 47v26h-30v-26Z" fill="#e2ddc7" opacity=".9"/>}
   {Array.from({length:18},(_,i)=><circle key={i} cx={run&&b===2&&a===2&&i%2?255+(i*7)%68:210+(i*43)%180} cy={run&&b===2&&a===2&&i%2?100+(i%3)*6:run&&b===0&&a===0?95+(i%3)*7:run&&b===1?267:160+(i*29)%107} r={a===1?3:5} fill={a===2&&i%2?'#849aab':'#e5c88b'} opacity={1}/>)}
   {run&&b===2&&a===2&&<path d="M245 45v42a45 45 0 0 0 90 0V45" stroke="#d87876" strokeWidth="20" fill="none"/>}
   {run&&b===1&&<path className="chem-vapour" d="M260 115q-20-25 0-45t0-40M305 120q-20-25 0-45t0-40M350 115q-20-25 0-45t0-40" fill="none" stroke="#9edfc6" strokeWidth="3"/>}
   <text x="300" y="322">{run?separation.works?'Components separated':'Mixture not separated':['Sand + water','Salt + water','Iron filings + sand'][a]}</text>
  </>}
 </>}
 </svg>;
}
