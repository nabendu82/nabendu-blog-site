'use client';

import { Canvas, ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Html, Lightformer, Line, OrbitControls, RoundedBox } from '@react-three/drei';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Group, Mesh, Plane, Vector3 } from 'three';
import { atoms, molecules, litmus, type LabId } from '@/lib/education/chemistry';

type Props = { kind: LabId; index: number; method: number; run: boolean; solute: number; water: number; speed: number; paused: boolean };
const Studio = createContext({ move: false, labels: true, select: (_: string, _group?: Group) => {}, dragging: (_: boolean) => {} });
const metal = '#ad9580';

function Label({ children, position }: { children: ReactNode; position: [number, number, number] }) {
 const { labels } = useContext(Studio);
 return labels ? <Html position={position} center distanceFactor={5} style={{ pointerEvents: 'none' }}><span className="chem-object-label">{children}</span></Html> : null;
}

// Intersect pointer rays with a horizontal plane so moving equipment never changes its height.
function Movable({ name, position = [0, 0, 0], children }: { name: string; position?: [number, number, number]; children: ReactNode }) {
 const ref = useRef<Group>(null), active = useRef(false), offset = useRef(new Vector3()), plane = useRef(new Plane(new Vector3(0, 1, 0), -position[1]));
 const studio = useContext(Studio);
 function release(e: ThreeEvent<PointerEvent>) {
  if (!active.current) return;
  e.stopPropagation(); active.current = false; studio.dragging(false);
  (e.target as unknown as Element).releasePointerCapture?.(e.pointerId);
 }
 return <group ref={ref} position={position} onPointerDown={e => {
  e.stopPropagation(); studio.select(name, ref.current ?? undefined);
  if (!studio.move || !ref.current) return;
  plane.current.setFromNormalAndCoplanarPoint(new Vector3(0, 1, 0).transformDirection(ref.current.parent!.matrixWorld), ref.current.getWorldPosition(new Vector3()));
  const hit = e.ray.intersectPlane(plane.current, new Vector3());
  if (!hit) return;
  ref.current.parent!.worldToLocal(hit);
  offset.current.copy(hit).sub(ref.current.position); active.current = true; studio.dragging(true);
  (e.target as unknown as Element).setPointerCapture?.(e.pointerId);
 }} onPointerMove={e => {
  if (!active.current || !ref.current) return;
  e.stopPropagation(); const hit = e.ray.intersectPlane(plane.current, new Vector3());
  if (hit) { ref.current.parent!.worldToLocal(hit); hit.sub(offset.current); ref.current.position.x = Math.max(-3, Math.min(3, hit.x)); ref.current.position.z = Math.max(-2, Math.min(2, hit.z)); }
 }} onPointerUp={release} onPointerCancel={release}>
  {children}
 </group>;
}

function Ball({ position, radius = .12, color = '#9eabd7' }: { position: [number, number, number]; radius?: number; color?: string }) {
 return <mesh position={position} castShadow><sphereGeometry args={[radius, 28, 20]} /><meshStandardMaterial color={color} roughness={.25} metalness={.12} /></mesh>;
}
function Ring({ radius, y, color = metal }: { radius: number; y: number; color?: string }) {
 return <mesh position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[radius, .025, 12, 80]} /><meshStandardMaterial color={color} metalness={.65} roughness={.22} /></mesh>;
}
function Glass({ fill = .9, color = '#8dc6bc' }: { fill?: number; color?: string }) {
 return <group>
  <mesh position={[0, 1, 0]}><cylinderGeometry args={[.73, .69, 1.95, 64, 1, true]} /><meshPhysicalMaterial color="#ecf4ee" transparent opacity={.2} roughness={.08} metalness={.12} side={2} depthWrite={false} /></mesh>
  <mesh position={[0, .045, 0]}><cylinderGeometry args={[.7, .7, .07, 64]} /><meshPhysicalMaterial color="#dce6de" transparent opacity={.45} roughness={.12} /></mesh>
  {fill > 0 && <mesh position={[0, fill / 2 + .09, 0]}><cylinderGeometry args={[.685, .67, fill, 64]} /><meshPhysicalMaterial color={color} transparent opacity={.65} roughness={.17} metalness={.05} /></mesh>}
  <Ring radius={.73} y={1.98} color="#b7c9bf" /><Ring radius={.7} y={.08} color="#b7c9bf" />
  {[.4, .7, 1, 1.3, 1.6].map((y, i) => <group key={y}><Line points={[[.37, y, .61], [.62, y, .37]]} color="#627769" lineWidth={1.5} />{i % 2 === 0 && <Label position={[.73, y, .24]}>{(i + 1) * 50}</Label>}</group>)}
 </group>;
}
function Grain({ i, floating = false, paused, y = .16 }: { i: number; floating?: boolean; paused: boolean; y?: number }) {
 const ref = useRef<Mesh>(null), time = useRef(0);
 useFrame((_, dt) => { if (!paused) time.current += Math.min(dt, .05); if (ref.current && floating) ref.current.position.y = y + Math.sin(time.current * .6 + i) * .15; });
 return <mesh ref={ref} position={[Math.sin(i * 2.4) * (.2 + i % 4 * .1), y, Math.cos(i * 2.4) * (.2 + i % 4 * .1)]} rotation={[i, i * .3, 0]} castShadow><dodecahedronGeometry args={[.055, 0]} /><meshStandardMaterial color={i % 3 ? '#d3b581' : '#8294a0'} roughness={.7} /></mesh>;
}
function Particle({ i, phase, speed, paused }: { i: number; phase: number; speed: number; paused: boolean }) {
 const ref = useRef<Mesh>(null), time = useRef(0);
 useFrame((_, dt) => { if (!paused) time.current += Math.min(dt, .05) * speed; const t = time.current, a = i * 2.399;
  if (!ref.current) return;
  if (phase === 0) ref.current.position.set((i % 4 - 1.5) * .29 + Math.sin(t * 5 + i) * .012, Math.floor(i / 16) * .29 + .32, (Math.floor(i / 4) % 4 - 1.5) * .29);
  else { const radius = .3 + i % 5 * .07; ref.current.position.set(Math.sin(a + t * .45) * radius, phase === 1 ? .5 + Math.sin(i * 1.7 + t * .4) * .3 : 1 + Math.cos(i * 1.7 + t * .8) * .78, Math.cos(a + t * .45) * radius); }
 });
 return <mesh ref={ref} castShadow><sphereGeometry args={[.07, 16, 12]} /><meshStandardMaterial color={i % 3 === 0 ? '#a789c1' : '#629eab'} roughness={.22} metalness={.15} /></mesh>;
}
function AtomModel({ index, paused }: { index: number; paused: boolean }) {
 const atom = atoms[index], spin = useRef<Group>(null);
 useFrame((_, dt) => { if (spin.current && !paused) spin.current.rotation.y += Math.min(dt, .05) * .15; });
 return <group position={[0, 1.8, 0]} ref={spin}>
  <Movable name={`${atom.name} nucleus · ${atom.protons} protons, ${atom.neutrons} neutrons`}>
   {Array.from({ length: atom.protons + atom.neutrons }, (_, i) => <Ball key={i} radius={.16} position={[Math.cos(i * 2.4) * Math.sqrt(i / 34) * .55, Math.sin(i * 1.8) * .35, Math.sin(i * 2.4) * Math.sqrt(i / 34) * .55]} color={i < atom.protons ? '#bb819c' : '#9696c0'} />)}
   <Label position={[0, .7, 0]}>{atom.symbol} · nucleus</Label>
  </Movable>
  {atom.shells.map((count, shell) => <group key={shell} rotation={[.3 + shell * .55, .3, shell * .25]}>
   <Ring radius={1 + shell * .43} y={0} color="#b7b4c9" />
   {Array.from({ length: count }, (_, i) => { const t = i / count * Math.PI * 2, r = 1 + shell * .43; return <Movable key={i} name={`Electron · shell ${shell + 1}`} position={[Math.cos(t) * r, 0, Math.sin(t) * r]}><Ball position={[0, 0, 0]} radius={.095} color="#679b8d" /></Movable>; })}
  </group>)}
 </group>;
}
function MoleculeModel({ index, exploded }: { index: number; exploded: boolean }) {
 const molecule = molecules[index], scale = exploded ? 1.55 : 1;
 return <group position={[0, 1.9, 0]}>
  {!exploded && molecule.atoms.slice(1).map((a, i) => <Line key={i} points={[molecule.atoms[0].p as [number, number, number], a.p as [number, number, number]]} color="#c3bdb2" lineWidth={14} />)}
  {molecule.atoms.map((a, i) => <Movable key={`${index}-${i}-${exploded}`} name={`${a.el === 'H' ? 'Hydrogen' : a.el === 'O' ? 'Oxygen' : 'Carbon'} atom`} position={[a.p[0] * scale, a.p[1] * scale, a.p[2] * scale]}><Ball radius={a.el === 'H' ? .36 : .56} position={[0, 0, 0]} color={a.el === 'H' ? '#e6dfc9' : a.el === 'O' ? '#c68290' : '#818fa5'} /><Label position={[0, .7, 0]}>{a.el}</Label></Movable>)}
 </group>;
}
function ChamberBase() {
 return <group position={[0, -.16, 0]}>
  <mesh castShadow><cylinderGeometry args={[1.1, 1.15, .24, 80]} /><meshStandardMaterial color="#a7b8a0" roughness={.38} metalness={.18} /></mesh>
  <Ring radius={1.08} y={.1} color="#ceb689" /><Ring radius={.9} y={.13} color="#8b9c89" />
  {Array.from({ length: 32 }, (_, i) => { const t = i / 32 * Math.PI * 2; return <mesh key={i} position={[Math.sin(t) * 1.02, .13, Math.cos(t) * 1.02]} rotation={[0, t, 0]}><boxGeometry args={[.012, .007, i % 4 === 0 ? .1 : .04]} /><meshStandardMaterial color="#61785f" /></mesh>; })}
  {[0, 2.1, 4.2].map(t => <mesh key={t} position={[Math.sin(t) * .82, -.15, Math.cos(t) * .82]}><cylinderGeometry args={[.12, .15, .13, 24]} /><meshStandardMaterial color="#66695e" roughness={.6} /></mesh>)}
 </group>;
}
function Apparatus(p: Props) {
 if (p.kind === 'states') return <Movable name="Particle chamber"><ChamberBase /><Glass fill={0} />{Array.from({ length: 48 }, (_, i) => <Particle key={i} i={i} phase={p.index} speed={p.speed} paused={p.paused} />)}<Label position={[0, 2.4, 0]}>48 particles · {['solid', 'liquid', 'gas'][p.index]}</Label></Movable>;
 if (p.kind === 'materials') return <>
  <Movable name="Pattern behind sample" position={[0, 0, -.75]}><RoundedBox args={[2.5, 2, .1]} position={[0, 1.2, 0]} radius={.08}><meshStandardMaterial color="#ded8bd" /></RoundedBox>{Array.from({ length: 16 }, (_, i) => <Ball key={i} radius={.12} position={[(i % 4 - 1.5) * .48, .5 + Math.floor(i / 4) * .47, .07]} color={i % 2 ? '#b377a2' : '#83a589'} />)}</Movable>
  <Movable name={['Clear glass sample', 'Frosted glass sample', 'Wood sample'][p.index]} position={[0, 0, .5]}><RoundedBox args={[2.6, 2.2, .12]} position={[0, 1.2, 0]} radius={.06}><meshPhysicalMaterial color={p.index === 2 ? '#a57c54' : '#dce9e0'} transparent={p.index !== 2} opacity={p.index === 0 ? .12 : p.index === 1 ? .8 : 1} roughness={p.index === 0 ? .05 : .95} /></RoundedBox><Label position={[0, 2.65, 0]}>Move the sample to reveal the pattern</Label></Movable>
 </>;
 if (p.kind === 'metals') return <Movable name="Conductivity circuit">
  <RoundedBox args={[4, .16, 2.7]} position={[0, .1, 0]} radius={.12}><meshStandardMaterial color="#d3cab4" /></RoundedBox>
  <Line points={[[-1.3, .3, .7], [-1.3, .3, -.7], [1.3, .3, -.7], [1.3, .3, .7], [.5, .3, .7]]} color={p.run && p.index !== 1 ? '#aa8653' : '#716d66'} lineWidth={5} />
  <mesh position={[-1.3, .48, -.3]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.22, .22, .9, 32]} /><meshStandardMaterial color="#849c81" metalness={.4} roughness={.3} /></mesh>
  <mesh position={[1.3, .65, -.3]}><sphereGeometry args={[.32, 32, 24]} /><meshStandardMaterial color={p.run && p.index !== 1 ? '#ffdc86' : '#d9d5bd'} emissive="#ffc65c" emissiveIntensity={p.run && p.index !== 1 ? 1 : 0} roughness={.2} /></mesh>
  <RoundedBox args={[1.2, .13, .35]} position={[0, .32, .7]} radius={.04}><meshStandardMaterial color={['#b88057', '#b79abc', '#626b78'][p.index]} metalness={p.index === 0 ? .7 : .1} roughness={.3} /></RoundedBox><Label position={[0, 1.4, 0]}>3 V · {['copper', 'plastic', 'graphite'][p.index]}</Label>
 </Movable>;
 if (p.kind === 'changes') return <Movable name={['Water sample', 'Paper sample', 'Iron sample'][p.index]}>
  <mesh position={[0, .12, 0]}><cylinderGeometry args={[1.5, 1.4, .2, 64]} /><meshStandardMaterial color="#d8d1bf" roughness={.6} /></mesh>
  {p.index === 0 ? <RoundedBox args={[p.run ? 2 : 1.2, p.run ? .12 : 1.2, p.run ? 1.7 : 1.2]} position={[0, p.run ? .29 : .85, 0]} radius={.08}><meshPhysicalMaterial color="#9ccdd3" transparent opacity={.7} roughness={.12} metalness={.08} /></RoundedBox> : p.index === 1 ? <>{[-1, 1].map(n => <RoundedBox key={n} args={[.9, .035, 1.5]} position={[n * (p.run ? .75 : .45), .27, 0]} rotation={[0, p.run ? n * .2 : 0, 0]} radius={.01}><meshStandardMaterial color="#f5efd7" /></RoundedBox>)}</> : <><RoundedBox args={[1.8, .18, .7]} position={[0, .38, 0]} radius={.06}><meshStandardMaterial color={p.run ? '#a86942' : '#8f9ca7'} metalness={p.run ? .1 : .8} roughness={p.run ? 1 : .3} /></RoundedBox>{p.run && Array.from({ length: 20 }, (_, i) => <Ball key={i} radius={.04} color="#704b34" position={[Math.sin(i * 2.4) * .8, .48, Math.cos(i * 2.4) * .28]} />)}</>}
  <Label position={[0, 1.9, 0]}>{p.run ? ['Melting · physical change', 'Tearing · physical change', 'Rusting · chemical change'][p.index] : ['Ice', 'Paper', 'Iron'][p.index]}</Label>
 </Movable>;
 const dry = p.kind === 'separation' && (p.index === 2 || (p.run && p.method === 1));
 return <>
  <Movable name="Graduated beaker" position={[-.55, 0, 0]}><Glass fill={dry ? 0 : p.kind === 'solutions' ? .35 + p.water / 200 : 1} color={p.kind === 'indicators' ? '#ccbadd' : '#8fbfb4'} />
   {p.kind !== 'indicators' && Array.from({ length: p.kind === 'solutions' ? p.solute * 2 : 24 }, (_, i) => p.kind === 'separation' && p.run && p.method === 2 && p.index === 2 && i % 3 === 0 ? null : <Grain key={i} i={i} paused={p.paused} floating={p.kind === 'solutions'} y={dry ? .15 : p.kind === 'separation' && p.run && p.method === 0 && p.index === 0 ? 2.4 : .3 + i % 5 * .13} />)}
   <Label position={[0, -.12, .9]}>{p.kind === 'solutions' ? 'Salt solution' : p.kind === 'indicators' ? ['Lemon juice', 'Soap solution', 'Neutral water'][p.index] : p.run && p.index === 0 && p.method === 0 ? 'Water · sand retained above' : p.run && p.method === 1 ? ['Sand remains', 'Salt remains', 'Dry mixture'][p.index] : p.run && p.method === 2 && p.index === 2 ? 'Sand remains' : ['Sand + water', 'Salt + water', 'Iron + sand'][p.index]}</Label>
  </Movable>
  {p.kind === 'indicators' ? <Movable name="Litmus strip" position={[p.run ? -.55 : 1.05, p.run ? .6 : 1.6, 0]}><RoundedBox args={[.25, 1.15, .025]} radius={.01}><meshStandardMaterial color={(p.run ? litmus(p.index, p.method) : p.method === 0 ? 'blue' : 'red') === 'red' ? '#c87691' : '#859ed5'} /></RoundedBox><Label position={[0, .8, 0]}>Litmus</Label></Movable> : p.kind === 'solutions' ? <Movable name="Glass stirring rod" position={[1.1, 0, 0]}><mesh position={[0, 1.1, 0]} rotation={[0, 0, -.25]}><cylinderGeometry args={[.035, .035, 2.1, 20]} /><meshPhysicalMaterial color="#adbbad" metalness={.3} roughness={.15} /></mesh><Label position={[0, 2.5, 0]}>Stirring rod</Label></Movable> : <Movable key={`${p.method}-${p.run}`} name={['Filter funnel', 'Evaporating dish', 'Bar magnet'][p.method]} position={[p.run ? -.55 : 1.25, p.run ? 2.05 : .2, 0]}>
   {p.method === 0 ? <><mesh position={[0, .22, 0]}><cylinderGeometry args={[.66, .12, .5, 48, 1, true]} /><meshStandardMaterial color="#e7d9bd" side={2} roughness={.65} /></mesh><Ring radius={.66} y={.47} color="#c5bca1" /><mesh position={[0, -.14, 0]}><cylinderGeometry args={[.09, .09, .25, 20]} /><meshStandardMaterial color="#c6cbbf" /></mesh></> : p.method === 1 ? <><mesh><cylinderGeometry args={[.7, .45, .25, 48, 1, true]} /><meshStandardMaterial color="#e0d9c8" side={2} /></mesh>{p.run && <Label position={[0, .7, 0]}>Water evaporates ↑</Label>}</> : <>{[-1, 1].map(n => <RoundedBox key={n} args={[.55, .23, .32]} position={[n * .28, 0, 0]} radius={.04}><meshStandardMaterial color={n === -1 ? '#ba7183' : '#7596b7'} metalness={.3} /></RoundedBox>)}{p.run && p.index === 2 && Array.from({ length: 8 }, (_, i) => <Ball key={i} position={[(i - 3.5) * .12, -.2, 0]} radius={.04} color="#657c87" />)}</>}
   <Label position={[0, .95, 0]}>{['Filter paper', 'Evaporation', 'Magnet'][p.method]}</Label>
  </Movable>}
  {p.kind === 'separation' && p.method === 0 && p.run && <Movable name="Retort stand" position={[-1.65, 0, -.5]}>
   <RoundedBox args={[1, .13, .75]} position={[0, -.03, 0]} radius={.08}><meshStandardMaterial color="#98a993" roughness={.45} /></RoundedBox>
   <mesh position={[0, 1.5, 0]}><cylinderGeometry args={[.035, .035, 3, 24]} /><meshStandardMaterial color="#a8a59c" metalness={.75} roughness={.2} /></mesh>
   <mesh position={[.55, 2.18, .25]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.025, .025, 1.1, 24]} /><meshStandardMaterial color="#a8a59c" metalness={.75} roughness={.2} /></mesh>
   <Ball position={[0, 2.18, .25]} radius={.09} color="#665e59" />
  </Movable>}
 </>;
}

function Zoom({ value }: { value: number }) {
 const camera = useThree(state => state.camera);
 const size = useThree(state => state.size);
 useEffect(() => { camera.zoom = value * Math.min(1, size.width / size.height / 1.05); camera.updateProjectionMatrix(); }, [camera, value, size.width, size.height]);
 return null;
}
export default function ParticleScene(props: Props) {
 const [move, setMove] = useState(false), [labels, setLabels] = useState(true), [dragging, setDragging] = useState(false), [selected, setSelected] = useState('Select an object to inspect'), [version, setVersion] = useState(0), [expanded, setExpanded] = useState(false), [exploded, setExploded] = useState(false);
 const [zoom, setZoom] = useState(1), selectedObject = useRef<Group>();
 useEffect(() => { selectedObject.current = undefined; setDragging(false); setSelected('Select an object to inspect'); }, [props.index, props.method, props.run]);
 useEffect(() => {
  if (!expanded) return;
  const previous = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setExpanded(false); };
  window.addEventListener('keydown', close);
  return () => { document.body.style.overflow = previous; window.removeEventListener('keydown', close); };
 }, [expanded]);
 return <div className={`chem-studio${expanded ? ' is-expanded' : ''}`} tabIndex={0} aria-label="3D studio. Select Move objects, select a model, then drag or use the arrow keys." onKeyDown={event => {
  if (!move || !selectedObject.current || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
  event.preventDefault(); const position = selectedObject.current.position;
  position.x = Math.max(-3, Math.min(3, position.x + (event.key === 'ArrowLeft' ? -.15 : event.key === 'ArrowRight' ? .15 : 0)));
  position.z = Math.max(-2, Math.min(2, position.z + (event.key === 'ArrowUp' ? -.15 : event.key === 'ArrowDown' ? .15 : 0)));
 }}>
  <div className="chem-studio-tools" aria-label="3D view controls">
   <button aria-pressed={!move} onClick={() => { setMove(false); setDragging(false); }}>↻ Orbit</button><button aria-pressed={move} onClick={() => { setMove(true); setDragging(false); }}>✥ Move objects</button>
   <button aria-pressed={labels} onClick={() => setLabels(!labels)}>Labels</button>
   {props.kind === 'molecules' && <button aria-pressed={exploded} onClick={() => setExploded(!exploded)}>{exploded ? 'Assemble' : 'Separate atoms'}</button>}
   <button aria-label="Zoom in" onClick={() => setZoom(v => Math.min(1.8, v + .2))}>+</button><button aria-label="Zoom out" onClick={() => setZoom(v => Math.max(.6, v - .2))}>−</button>
   <button onClick={() => { setVersion(v => v + 1); setZoom(1); selectedObject.current = undefined; setDragging(false); setSelected('View and object positions reset'); }}>Reset view</button><button aria-pressed={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? 'Close studio' : 'Expand'}</button>
  </div>
  <Canvas key={`${props.kind}-${version}`} shadows dpr={[1, 1.5]} camera={{ position: props.kind === 'states' ? [3.2, 2.8, 4.4] : [4.6, 3.8, 6], fov: 34 }} gl={{ antialias: true }} aria-label="Chemistry 3D workbench">
   <color attach="background" args={['#f4f0e5']} /><ambientLight intensity={.75} /><directionalLight castShadow position={[3, 7, 5]} intensity={2.6} shadow-mapSize={[1024, 1024]} shadow-normalBias={.04} />
   <Environment resolution={128}><Lightformer position={[0, 5, -3]} scale={[8, 8, 1]} intensity={2} /><Lightformer position={[-4, 2, 2]} rotation={[0, Math.PI / 2, 0]} scale={[5, 5, 1]} intensity={2} /></Environment>
   <Zoom value={zoom} />
   <Studio.Provider value={{ move, labels, select: (name, group) => { setSelected(name); selectedObject.current = group; }, dragging: setDragging }}>
    <group key={`${props.kind}-${props.index}-${props.method}-${props.run}-${version}`}>
     {props.kind === 'atoms' ? <AtomModel index={props.index} paused={props.paused || move} /> : props.kind === 'molecules' ? <MoleculeModel index={props.index} exploded={exploded || move} /> : <Apparatus {...props} />}
    </group>
   </Studio.Provider>
   <ContactShadows position={[0, -.4, 0]} opacity={.34} scale={14} blur={2.5} far={5} />
   <OrbitControls makeDefault enabled={!move && !dragging} target={[0, props.kind === 'atoms' ? 1.8 : props.kind === 'molecules' ? 1.7 : 1.15, 0]} minDistance={3.5} maxDistance={13} maxPolarAngle={Math.PI / 2.05} enableDamping dampingFactor={.08} />
  </Canvas>
  <div className="chem-studio-caption"><span>{move ? 'Drag a model across the workbench' : 'Drag to orbit · Scroll to zoom · Right-drag to pan'}</span><strong role="status">{selected}</strong></div>
 </div>;
}
