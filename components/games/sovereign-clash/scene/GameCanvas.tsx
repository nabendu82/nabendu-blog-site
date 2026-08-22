"use client";

import { Canvas } from '@react-three/fiber'
import { COLORS } from '../game/constants'
import { EntityMeshes } from './EntityMeshes'
import { GameLoop } from './GameLoop'
import { FogPlane } from './FogPlane'
import { Ground } from './Ground'
import { MarqueeSelect } from './MarqueeSelect'
import { RTSCamera } from './RTSCamera'

export function GameCanvas() {
  return (
    <Canvas
      className="absolute inset-0"
      shadows
      camera={{ fov: 45, near: 0.1, far: 700, position: [8, 22, 8] }}
      onContextMenu={(e) => e.preventDefault()}
      gl={{ antialias: true, alpha: false }}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      <color attach="background" args={[COLORS.sky]} />
      <fog attach="fog" args={['#b7d4a4', 140, 340]} />
      <hemisphereLight args={['#fff6dc', '#5a8c48', 1.05]} />
      <ambientLight intensity={0.72} />
      <directionalLight
        castShadow
        position={[30, 40, 18]}
        intensity={1.55}
        shadow-bias={-0.001}
        shadow-normalBias={0.04}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={120}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
      />
      <RTSCamera />
      <MarqueeSelect />
      <GameLoop />
      <Ground />
      <FogPlane />
      <EntityMeshes />
    </Canvas>
  )
}
