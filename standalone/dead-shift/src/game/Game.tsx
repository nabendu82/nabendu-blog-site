import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { CityArena } from '../world/CityArena';
import { Lighting } from '../world/Lighting';
import { ActorModel } from '../player/ActorModel';
import { usePlayerController } from '../player/PlayerController';
import { GameLoop } from './GameLoop';
import { sim } from './Simulation';
import { CAMERA } from './config';
import { Firearm } from '../weapons/Firearm';
import { CombatEffects } from '../effects/CombatEffects';
import { EnemyManager } from '../enemies/EnemyManager';
import { Atmosphere,FireAndSparks } from '../world/Atmosphere';
import { PickupField } from '../effects/PickupField';
export function Game(){usePlayerController();return <Canvas shadows dpr={[1,1.5]} camera={{position:[0,CAMERA.height,CAMERA.distance],fov:CAMERA.fieldOfView,near:.1,far:120}} onPointerMove={()=>{sim.input.aiming=true;}}><Lighting/><Suspense fallback={null}><CityArena/><Atmosphere/><FireAndSparks/><PickupField/><ActorModel actor={sim.player} player><Firearm/></ActorModel><EnemyManager/><CombatEffects/><GameLoop/></Suspense></Canvas>;}
