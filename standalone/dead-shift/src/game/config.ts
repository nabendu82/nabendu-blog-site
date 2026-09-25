export type ImpactKind='ballistic'|'incendiary';
export type EnemyId='walker'|'runner'|'tank'|'hazmat';
export type DnaType='volt'|'fire'|'cryo'|'mass';
export type Branch='support'|'shotgun'|'marksman';
export type WeaponCategory='rifle'|'support'|'shotgun'|'marksman'|'antimateriel';
export type WeaponDefinition={id:string;name:string;branch:Branch|null;category:WeaponCategory;damage:number;fireRate:number;range:number;spread:number;penetration:number;projectileCount:number;impact:ImpactKind;model:string;evolutionStage:number;evolutionLevelRequired:number;specialEffect:string;stagger:number;knockback:number;recoil:number;tracerEvery:number;flashSize:number;casing:'rifle'|'shotgun'|'heavy';muzzleDistance:number;critBonus?:number;burn?:number;burnDamage?:number;burnRadius?:number};
export type EnemyDefinition={id:EnemyId;health:number;speed:number;damage:number;attackRange:number;attackCooldown:number;radius:number;xp:number;dna?:DnaType;model:string};
export type PlayerStats={damage:number;fireRate:number;movement:number;maxHp:number;pickupRadius:number;critChance:number;range:number;armor:number};
export type UpgradeDefinition={id:string;name:string;description:string;icon:string;rarity:'FIELD'|'RARE';apply:(stats:PlayerStats,heal:(amount:number)=>void)=>void};

export const WEAPON_MUTATION_LEVEL_1=5,WEAPON_MUTATION_LEVEL_2=10,WEAPON_MUTATION_LEVEL_3=15;
export const EVOLUTION_LEVELS=[0,WEAPON_MUTATION_LEVEL_1,WEAPON_MUTATION_LEVEL_2,WEAPON_MUTATION_LEVEL_3] as const;
export const SURVIVOR_AK:WeaponDefinition={id:'survivor-ak',name:'SURVIVOR AK',branch:null,category:'rifle',damage:28,fireRate:6,range:32,spread:.016,penetration:1,projectileCount:1,impact:'ballistic',model:'weapons/survivor-ak',evolutionStage:0,evolutionLevelRequired:1,specialEffect:'Reliable automatic rifle',stagger:.20,knockback:.18,recoil:.12,tracerEvery:3,flashSize:.10,casing:'rifle',muzzleDistance:.66};
export const RPK:WeaponDefinition={id:'rpk',name:'RPK',branch:'support',category:'support',damage:24,fireRate:9.5,range:33,spread:.027,penetration:1,projectileCount:1,impact:'ballistic',model:'weapons/rpk',evolutionStage:1,evolutionLevelRequired:WEAPON_MUTATION_LEVEL_1,specialEffect:'Sustained automatic fire · stagger',stagger:.28,knockback:.20,recoil:.13,tracerEvery:2,flashSize:.13,casing:'rifle',muzzleDistance:.81};
export const M249_SUPPORT:WeaponDefinition={id:'m249-support',name:'M249 SUPPORT',branch:'support',category:'support',damage:28,fireRate:12.5,range:34,spread:.03,penetration:2,projectileCount:1,impact:'ballistic',model:'weapons/m249-support',evolutionStage:2,evolutionLevelRequired:WEAPON_MUTATION_LEVEL_2,specialEffect:'Belt-fed fire · two-target penetration',stagger:.32,knockback:.22,recoil:.14,tracerEvery:2,flashSize:.16,casing:'rifle',muzzleDistance:.75};
export const HEAVY_GUNNER:WeaponDefinition={id:'heavy-gunner',name:'HEAVY GUNNER',branch:'support',category:'support',damage:35,fireRate:13.5,range:36,spread:.026,penetration:3,projectileCount:1,impact:'ballistic',model:'weapons/heavy-gunner',evolutionStage:3,evolutionLevelRequired:WEAPON_MUTATION_LEVEL_3,specialEffect:'Heavy sustained fire · three-target penetration',stagger:.40,knockback:.30,recoil:.17,tracerEvery:1,flashSize:.19,casing:'heavy',muzzleDistance:.90};
export const BREACHER:WeaponDefinition={id:'breacher',name:'BREACHER',branch:'shotgun',category:'shotgun',damage:28,fireRate:1.9,range:15,spread:.24,penetration:1,projectileCount:6,impact:'ballistic',model:'weapons/breacher',evolutionStage:1,evolutionLevelRequired:WEAPON_MUTATION_LEVEL_1,specialEffect:'Six-pellet blast · heavy knockback',stagger:.50,knockback:.62,recoil:.22,tracerEvery:0,flashSize:.20,casing:'shotgun',muzzleDistance:.56};
export const SAIGA_12:WeaponDefinition={id:'saiga-12',name:'SAIGA-12',branch:'shotgun',category:'shotgun',damage:32,fireRate:2.8,range:17,spread:.21,penetration:1,projectileCount:7,impact:'incendiary',model:'weapons/saiga-12',evolutionStage:2,evolutionLevelRequired:WEAPON_MUTATION_LEVEL_2,specialEffect:'Seven-pellet semi-auto · incendiary shells',stagger:.53,knockback:.68,recoil:.23,tracerEvery:0,flashSize:.23,casing:'shotgun',muzzleDistance:.65,burn:2.2,burnDamage:3};
export const HELLMAKER:WeaponDefinition={id:'hellmaker',name:'HELLMAKER',branch:'shotgun',category:'shotgun',damage:39,fireRate:3.6,range:18,spread:.19,penetration:1,projectileCount:8,impact:'incendiary',model:'weapons/hellmaker',evolutionStage:3,evolutionLevelRequired:WEAPON_MUTATION_LEVEL_3,specialEffect:'Eight-pellet automatic · incendiary spread',stagger:.58,knockback:.76,recoil:.25,tracerEvery:0,flashSize:.27,casing:'shotgun',muzzleDistance:.73,burn:3,burnDamage:5,burnRadius:1.1};
export const SVD_HUNTER:WeaponDefinition={id:'svd-hunter',name:'SVD HUNTER',branch:'marksman',category:'marksman',damage:78,fireRate:1.4,range:42,spread:.003,penetration:3,projectileCount:1,impact:'ballistic',model:'weapons/svd-hunter',evolutionStage:1,evolutionLevelRequired:WEAPON_MUTATION_LEVEL_1,specialEffect:'Precision shot · three-target penetration',stagger:.45,knockback:.36,recoil:.19,tracerEvery:1,flashSize:.14,casing:'rifle',muzzleDistance:.85,critBonus:.08};
export const BATTLE_DMR:WeaponDefinition={id:'battle-dmr',name:'BATTLE DMR',branch:'marksman',category:'marksman',damage:92,fireRate:1.9,range:44,spread:.002,penetration:4,projectileCount:1,impact:'ballistic',model:'weapons/battle-dmr',evolutionStage:2,evolutionLevelRequired:WEAPON_MUTATION_LEVEL_2,specialEffect:'Fast follow-up · four-target penetration',stagger:.50,knockback:.42,recoil:.21,tracerEvery:1,flashSize:.16,casing:'rifle',muzzleDistance:.83,critBonus:.13};
export const ANTI_MATERIEL:WeaponDefinition={id:'anti-materiel',name:'ANTI-MATERIEL',branch:'marksman',category:'antimateriel',damage:145,fireRate:.95,range:48,spread:.001,penetration:7,projectileCount:1,impact:'ballistic',model:'weapons/anti-materiel',evolutionStage:3,evolutionLevelRequired:WEAPON_MUTATION_LEVEL_3,specialEffect:'Heavy precision shot · seven-target penetration',stagger:.68,knockback:.58,recoil:.29,tracerEvery:1,flashSize:.24,casing:'heavy',muzzleDistance:.98,critBonus:.20};
export const MUTATIONS=[RPK,BREACHER,SVD_HUNTER] as const;
export const WEAPON_EVOLUTIONS={support:[RPK,M249_SUPPORT,HEAVY_GUNNER],shotgun:[BREACHER,SAIGA_12,HELLMAKER],marksman:[SVD_HUNTER,BATTLE_DMR,ANTI_MATERIEL]} as const;
export const DEBUG_WEAPONS=[SURVIVOR_AK,RPK,M249_SUPPORT,HEAVY_GUNNER,BREACHER,SAIGA_12,HELLMAKER,SVD_HUNTER,BATTLE_DMR,ANTI_MATERIEL] as const;

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
export const CONFIG={arenaLimit:22,playerSpeed:5.8,playerRadius:.48,maxEnemies:36,maxEffects:64,maxCasings:64,maxPickups:96,spawnInterval:1.4,mutationLevel:WEAPON_MUTATION_LEVEL_1,devXpMultiplier:1.5};
// Angled 47-degree follow camera. The Canvas and follow loop share these values.
export const CAMERA={height:8.6,distance:8,fieldOfView:42,damping:7,titleOffset:-9,evolutionScale:.8} as const;
// The authored 0.4 s Run cycle covers about 1.45 m, or 3.6 m/s at 1x.
export const RUN_AUTHORED_SPEED=3.6;
export const SHOT_RAY_START=.12;
export const VISUAL_MUZZLE_DISTANCE=.70;
