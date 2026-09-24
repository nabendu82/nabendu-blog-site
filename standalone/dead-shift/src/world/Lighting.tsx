export function Lighting(){return <>
  <color attach="background" args={['#24353e']}/><fog attach="fog" args={['#344952',22,62]}/>
  <hemisphereLight args={['#94bedb','#594434',1.65]}/>
  <directionalLight position={[-20,16,10]} color="#ffac68" intensity={3.2} castShadow shadow-mapSize={[2048,2048]} shadow-camera-left={-30} shadow-camera-right={30} shadow-camera-top={30} shadow-camera-bottom={-30} shadow-camera-far={90} shadow-normalBias={.035} shadow-bias={-.0001} shadow-radius={2}/>
  <directionalLight position={[14,10,-18]} color="#7bbcc9" intensity={1.5}/>
  <pointLight position={[-10,4,12]} color="#fca348" intensity={18} distance={9}/>
  <pointLight position={[10,4,-11]} color="#fca348" intensity={18} distance={9}/>
</>;}
