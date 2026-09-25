export type Element='kinetic'|'volt'|'fire'|'cryo';
export type EnemyId='walker'|'runner'|'tank'|'hazmat';
export type DnaType='volt'|'fire'|'cryo'|'mass';
export type Branch='volt'|'fire'|'cryo';
export type WeaponDefinition={id:string;name:string;branch:Branch|null;damage:number;fireRate:number;range:number;spread:number;penetration:number;projectileCount:number;projectileSpeed:number;element:Element;model:string;evolutionStage:number;evolutionLevelRequired:number;specialEffect:string;chain?:number;chainReach?:number;arcBurst?:number;explosion?:number;burn?:number;burnDamage?:number;igniteRadius?:number;groundFire?:number;slow?:number;slowDuration?:number;shatterRadius?:number;skyStrike?:number;attachments:readonly string[]};
export type EnemyDefinition={id:EnemyId;health:number;speed:number;damage:number;attackRange:number;attackCooldown:number;radius:number;xp:number;dna?:DnaType;model:string};
export type PlayerStats={damage:number;fireRate:number;movement:number;maxHp:number;pickupRadius:number;critChance:number;range:number;armor:number};
export type UpgradeDefinition={id:string;name:string;description:string;icon:string;rarity:'FIELD'|'RARE';apply:(stats:PlayerStats,heal:(amount:number)=>void)=>void};

export const WEAPON_MUTATION_LEVEL_1=5,WEAPON_MUTATION_LEVEL_2=10,WEAPON_MUTATION_LEVEL_3=15;
export const EVOLUTION_LEVELS=[0,WEAPON_MUTATION_LEVEL_1,WEAPON_MUTATION_LEVEL_2,WEAPON_MUTATION_LEVEL_3] as const;
export const SCRAP_RIFLE:WeaponDefinition={id:'scrap-rifle',name:'SCRAP RIFLE',branch:null,damage:28,fireRate:6,range:32,spread:.015,penetration:1,projectileCount:1,projectileSpeed:1,element:'kinetic',model:'weapons/scrap-rifle',evolutionStage:0,evolutionLevelRequired:1,specialEffect:'Precision rifle',attachments:['BARREL','CORE','MAGAZINE','UNDERBARREL','SIDE_MODULE']};
export const THUNDERSTORM:WeaponDefinition={id:'thunderstorm',name:'THUNDERSTORM',branch:'volt',damage:20,fireRate:13,range:30,spread:.035,penetration:1,projectileCount:1,projectileSpeed:1.4,element:'volt',model:'weapons/thunderstorm',evolutionStage:1,evolutionLevelRequired:WEAPON_MUTATION_LEVEL_1,specialEffect:'Chain lightning · 2 targets',chain:2,chainReach:4,attachments:[]};
export const TEMPEST:WeaponDefinition={id:'tempest',name:'TEMPEST',branch:'volt',damage:24,fireRate:15.5,range:32,spread:.032,penetration:1,projectileCount:1,projectileSpeed:1.55,element:'volt',model:'weapons/tempest',evolutionStage:2,evolutionLevelRequired:WEAPON_MUTATION_LEVEL_2,specialEffect:'Chain lightning · 4 targets · arc burst',chain:4,chainReach:5.2,arcBurst:2.2,attachments:[]};
export const STORM_GOD:WeaponDefinition={id:'storm-god',name:'STORM GOD',branch:'volt',damage:31,fireRate:17,range:34,spread:.025,penetration:1,projectileCount:1,projectileSpeed:1.8,element:'volt',model:'weapons/storm-god',evolutionStage:3,evolutionLevelRequired:WEAPON_MUTATION_LEVEL_3,specialEffect:'Chain lightning · 6 targets · sky strike',chain:6,chainReach:6,arcBurst:3.1,skyStrike:8,attachments:[]};
export const HELLBREAKER:WeaponDefinition={id:'hellbreaker',name:'HELLBREAKER',branch:'fire',damage:34,fireRate:2.2,range:23,spread:.18,penetration:1,projectileCount:5,projectileSpeed:.82,element:'fire',model:'weapons/hellbreaker',evolutionStage:1,evolutionLevelRequired:WEAPON_MUTATION_LEVEL_1,specialEffect:'Explosive pellets · burn',explosion:1.65,burn:8,burnDamage:5,attachments:[]};
export const INFERNO_BREAKER:WeaponDefinition={id:'inferno-breaker',name:'INFERNO BREAKER',branch:'fire',damage:43,fireRate:2.55,range:25,spread:.16,penetration:1,projectileCount:6,projectileSpeed:.95,element:'fire',model:'weapons/inferno-breaker',evolutionStage:2,evolutionLevelRequired:WEAPON_MUTATION_LEVEL_2,specialEffect:'Heavy blast · contagious burn',explosion:2.2,burn:10,burnDamage:7,igniteRadius:2,attachments:[]};
export const APOCALYPSE_CORE:WeaponDefinition={id:'apocalypse-core',name:'APOCALYPSE CORE',branch:'fire',damage:53,fireRate:2.8,range:27,spread:.14,penetration:1,projectileCount:7,projectileSpeed:1.05,element:'fire',model:'weapons/apocalypse-core',evolutionStage:3,evolutionLevelRequired:WEAPON_MUTATION_LEVEL_3,specialEffect:'Infernal blast · chain explosions · ground fire',explosion:2.8,burn:12,burnDamage:9,igniteRadius:3.1,groundFire:3.8,attachments:[]};
export const ABSOLUTE_ZERO:WeaponDefinition={id:'absolute-zero',name:'ABSOLUTE ZERO',branch:'cryo',damage:74,fireRate:1.35,range:38,spread:.003,penetration:4,projectileCount:1,projectileSpeed:1.8,element:'cryo',model:'weapons/absolute-zero',evolutionStage:1,evolutionLevelRequired:WEAPON_MUTATION_LEVEL_1,specialEffect:'Piercing rail · freeze',slow:.52,slowDuration:2.8,attachments:[]};
export const PERMAFROST:WeaponDefinition={id:'permafrost',name:'PERMAFROST',branch:'cryo',damage:91,fireRate:1.55,range:42,spread:.002,penetration:6,projectileCount:1,projectileSpeed:2,element:'cryo',model:'weapons/permafrost',evolutionStage:2,evolutionLevelRequired:WEAPON_MUTATION_LEVEL_2,specialEffect:'Piercing freeze · shatter',slow:.38,slowDuration:3.8,shatterRadius:2.2,attachments:[]};
export const ZERO_POINT:WeaponDefinition={id:'zero-point',name:'ZERO POINT',branch:'cryo',damage:116,fireRate:1.8,range:46,spread:.001,penetration:9,projectileCount:1,projectileSpeed:2.3,element:'cryo',model:'weapons/zero-point',evolutionStage:3,evolutionLevelRequired:WEAPON_MUTATION_LEVEL_3,specialEffect:'Absolute rail · deep freeze · shatter wave',slow:.25,slowDuration:5,shatterRadius:3.4,attachments:[]};
export const MUTATIONS=[THUNDERSTORM,HELLBREAKER,ABSOLUTE_ZERO] as const;
export const WEAPON_EVOLUTIONS={volt:[THUNDERSTORM,TEMPEST,STORM_GOD],fire:[HELLBREAKER,INFERNO_BREAKER,APOCALYPSE_CORE],cryo:[ABSOLUTE_ZERO,PERMAFROST,ZERO_POINT]} as const;
export const DEBUG_WEAPONS=[SCRAP_RIFLE,THUNDERSTORM,TEMPEST,STORM_GOD,HELLBREAKER,INFERNO_BREAKER,APOCALYPSE_CORE,ABSOLUTE_ZERO,PERMAFROST,ZERO_POINT] as const;

export const ENEMIES:Record<EnemyId,EnemyDefinition>={
  walker:{id:'walker',health:70,speed:1.45,damage:12,attackRange:1.15,attackCooldown:1.2,radius:.48,xp:12,model:'zombies/walker'},
  runner:{id:'runner',health:48,speed:2.55,damage:9,attackRange:1.05,attackCooldown:.82,radius:.40,xp:15,dna:'volt',model:'zombies/runner'},
  tank:{id:'tank',health:240,speed:.82,damage:24,attackRange:1.45,attackCooldown:1.65,radius:.72,xp:34,dna:'mass',model:'zombies/tank'},
  hazmat:{id:'hazmat',health:105,speed:1.18,damage:15,attackRange:1.2,attackCooldown:1.3,radius:.52,xp:22,dna:'fire',model:'zombies/hazmat'},
};
export const WALKER=ENEMIES.walker;
export const BASE_STATS:PlayerStats={damage:1,fireRate:1,movement:1,maxHp:100,pickupRadius:2.15,critChance:.05,range:1,armor:0};
export const UPGRADES:UpgradeDefinition[]=[
  {id:'damage',name:'HOLLOW POINT',description:'+20% weapon damage',icon:'◆',rarity:'FIELD',apply:s=>{s.damage*=1.2;}},
  {id:'fire-rate',name:'OVERCRANK',description:'+18% fire rate',icon:'≋',rarity:'FIELD',apply:s=>{s.fireRate*=1.18;}},
  {id:'movement',name:'ADRENAL SERVO',description:'+12% movement speed',icon:'»',rarity:'FIELD',apply:s=>{s.movement*=1.12;}},
  {id:'max-hp',name:'GRAFTED PLATE',description:'+20 max HP and heal 20',icon:'✚',rarity:'RARE',apply:(s,heal)=>{s.maxHp+=20;heal(20);}},
  {id:'pickup',name:'BIO-MAGNET',description:'+35% pickup radius',icon:'◎',rarity:'FIELD',apply:s=>{s.pickupRadius*=1.35;}},
  {id:'crit',name:'PREDATOR LENS',description:'+8% critical chance',icon:'⌖',rarity:'RARE',apply:s=>{s.critChance=Math.min(.6,s.critChance+.08);}},
  {id:'range',name:'COIL PRESSURE',description:'+25% effective shot range',icon:'➤',rarity:'FIELD',apply:s=>{s.range*=1.25;}},
  {id:'armor',name:'IMPACT WEAVE',description:'+8% damage reduction',icon:'⬡',rarity:'RARE',apply:s=>{s.armor=Math.min(.55,s.armor+.08);}},
];
export const xpThreshold=(level:number)=>18+level*18;
export const DEVELOPMENT_FAST_PROGRESSION=import.meta.env?.DEV??false;
export const CONFIG={arenaLimit:22,playerSpeed:5.8,playerRadius:.48,maxEnemies:36,maxEffects:64,maxPickups:96,maxGroundFire:12,spawnInterval:1.4,mutationLevel:WEAPON_MUTATION_LEVEL_1,devXpMultiplier:1.5};
// Angled 47-degree follow camera. The Canvas and follow loop share these values.
export const CAMERA={height:8.6,distance:8,fieldOfView:42,damping:7,titleOffset:-9,evolutionScale:.8} as const;
// The authored 0.4 s Run cycle covers about 1.45 m, or 3.6 m/s at 1x.
export const RUN_AUTHORED_SPEED=3.6;
export const SHOT_RAY_START=.12;
export const VISUAL_MUZZLE_DISTANCE=.70;
