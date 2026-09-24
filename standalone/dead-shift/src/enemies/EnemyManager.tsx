import { ActorModel } from '../player/ActorModel';
import { sim } from '../game/Simulation';
import { useGameStore } from '../stores/gameStore';
export function EnemyManager(){useGameStore(s=>s.time);return <>{sim.enemies.map((actor,i)=><ActorModel key={`${i}-${actor.kind}-${actor.generation}`} actor={actor}/>)}</>;}
