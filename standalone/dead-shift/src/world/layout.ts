export type Prop = { model: string; x: number; z: number; yaw?: number; radius?: number };
export const props: Prop[] = [
  {model:'broken-shop',x:-15,z:-18,radius:4.8},{model:'corner-ruin',x:15,z:-18,radius:4.8},
  {model:'apartment',x:-20,z:12,yaw:Math.PI/2,radius:4.8},{model:'broken-shop',x:20,z:12,yaw:-Math.PI/2,radius:4.8},
  {model:'burned-car',x:-7,z:-5,yaw:.22,radius:2.35},{model:'police-car',x:9,z:7,yaw:-.4,radius:2.35},
  {model:'ambulance',x:-13,z:13,yaw:1.8,radius:2.35},
  {model:'barrier',x:5,z:-10,radius:1.5},{model:'barrier',x:8,z:-10,radius:1.5},
  {model:'barrier',x:-4,z:12,yaw:.35,radius:1.5},
  {model:'dumpster',x:14,z:-13,radius:1.2},{model:'dumpster',x:-18,z:6,radius:1.2},
  ...[-10,10].flatMap(x=>[-11,12].map(z=>({model:'streetlight',x,z,radius:.3}))),
  ...Array.from({length:16},(_,i)=>({model:'debris',x:Math.sin(i*7.3)*19,z:Math.cos(i*4.7)*19,yaw:i*2})),
];
// Set dressing beyond the collision arena forms an uninterrupted city horizon.
export const dressing:Prop[]=[
  {model:'petrol-station',x:19,z:-8,yaw:-.3},
  ...[-38,-28,-18,18,28,38].flatMap((x,i)=>[-32,33].map(z=>({model:i%2?'apartment':'corner-ruin',x,z,yaw:z>0?Math.PI:0}))),
  ...[-36,36].flatMap(x=>[-18,-7,4,16].map(z=>({model:'apartment',x,z,yaw:x<0?Math.PI/2:-Math.PI/2}))),
  ...[-22,-15,-8,0,8,15,22].flatMap(x=>[-25,25].map(z=>({model:Math.abs(x)<10?'checkpoint':'fence',x,z,yaw:0}))),
  ...[-22,-15,-8,0,8,15,22].flatMap(z=>[-25,25].map(x=>({model:Math.abs(z)<10?'collapsed-wall':'fence',x,z,yaw:Math.PI/2}))),
  {model:'road-sign',x:6,z:-7},{model:'sandbags',x:4,z:13},{model:'sandbags',x:-5,z:-13},
  {model:'burned-car',x:2,z:-27,yaw:1.4},{model:'police-car',x:-26,z:3,yaw:.8},
  ...Array.from({length:25},(_,i)=>({model:['trash','rubble','asphalt-chunks','oil-stain','pothole'][i%5],x:Math.sin(i*7.3)*21,z:Math.cos(i*4.7)*21,yaw:i*2})),
  ...Array.from({length:14},(_,i)=>({model:i%2?'rubble':'collapsed-wall',x:Math.sin(i*2.4)*28,z:Math.cos(i*2.4)*28,yaw:i})),
  {model:'oil-stain',x:-7,z:-5},{model:'blood-stain',x:2,z:6},
];
export const spawnEntrances=[[-20,-5],[-19,6],[5,-21],[-4,-20],[20,-3],[19,4],[4,21],[-5,20]] as const;
export const obstacles = props.filter(p=>p.radius) as (Prop & {radius:number})[];
