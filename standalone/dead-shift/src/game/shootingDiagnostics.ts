import { ENEMIES } from './config';
import { Simulation } from './Simulation';

export type ShootingDiagnostic={distance:number;hit:boolean;origin:[number,number];hitPoint:[number,number]};
// Dev-only, isolated simulation: F5 never changes the active run or its enemies.
export function runShootingDiagnostics(distances=[.75,1,1.5,2,3]):ShootingDiagnostic[]{
  return distances.map(distance=>{
    const test=new Simulation();test.reset();for(const enemy of test.enemies)enemy.active=false;
    const walker=test.enemies[0];Object.assign(walker,{active:true,kind:'walker',x:test.player.x,z:test.player.z+distance,hp:ENEMIES.walker.health});
    test.player.yaw=0;test.input.aiming=true;test.input.aimX=walker.x;test.input.aimZ=walker.z;test.fire();
    const ray=test.lastRay!;
    return {distance,hit:ray.hit&&walker.hp<ENEMIES.walker.health,origin:[ray.originX,ray.originZ],hitPoint:[ray.hitX,ray.hitZ]};
  });
}
