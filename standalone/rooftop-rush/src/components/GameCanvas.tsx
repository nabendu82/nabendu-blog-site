import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { PALETTE } from '../game/constants';
import { updateCamera } from '../game/camera';
import { engine } from '../game/engine';
import { G } from '../game/state';
import { disposeSharedAssets } from '../world/materials';
import { disposeProps } from '../world/props';
import { World } from '../world/world';

const READY_FRAMES = 24;
const READY_MIN_MS = 650;

function Scene() {
  const world = useMemo(() => new World(), []);
  const frames = useRef(0);
  const t0 = useRef(performance.now());
  const ready = useRef(false);

  useEffect(() => {
    engine.attach(world);
    (window as unknown as { __rooftopRush: unknown }).__rooftopRush = { G, engine, world };
    return () => {
      engine.detach();
      world.dispose();
      disposeProps();
      disposeSharedAssets();
    };
  }, [world]);

  useFrame(({ camera, size, gl }, delta) => {
    const cam = camera as THREE.PerspectiveCamera;
    const vdt = engine.update(delta);
    world.scroll.position.z = G.dist;
    world.track.update(G.dist);
    const running = G.phase === 'playing' || G.phase === 'menu' || G.phase === 'loading';
    world.player.update(vdt, engine.groundHeightNow(), running);
    world.env.update(vdt, G.dist, G.speed, cam.position.x, cam.position.y, cam.position.z);
    const scale = (size.height * gl.getPixelRatio()) / (2 * Math.tan((cam.fov * Math.PI) / 360));
    world.glowFx.setScale(scale);
    world.dustFx.setScale(scale);
    if (vdt > 0) {
      world.glowFx.update(vdt, G.speed * vdt);
      world.dustFx.update(vdt, G.speed * vdt);
    }
    updateCamera(delta, cam);

    frames.current++;
    if (!ready.current && world.player.modelSettled && frames.current >= READY_FRAMES && performance.now() - t0.current > READY_MIN_MS) {
      ready.current = true;
      engine.markReady();
    }
  });

  return <primitive object={world.root} />;
}

const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

export function GameCanvas() {
  return (
    <Canvas
      className="game-canvas"
      shadows
      flat
      dpr={[1, isMobile ? 1.5 : 1.75]}
      camera={{ fov: 58, near: 0.5, far: 760, position: [0, 4.2, 8.4] }}
      gl={{ antialias: !isMobile, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
      }}
    >
      <color attach="background" args={[PALETTE.fog]} />
      <fog attach="fog" args={[PALETTE.fog, 75, 330]} />
      <Scene />
    </Canvas>
  );
}
