"use client";

import { useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { COLORS } from '../../game/constants'
import { useGameStore } from '../../game/store'
import type { Team, UnitKind } from '../../game/types'

const SKIN = '#e8c4a2'
const HAIR = '#2a1810'
const LEATHER = '#6d4328'
const BOOT = '#2b1c14'
const STEEL = '#d5dce2'
const WOOD = '#8a5a32'
const PANTS = '#3c3834'
const ROPE = '#c4a574'

type HumanKind =
  | 'villager'
  | 'sepoy'
  | 'rajput'
  | 'gurkha'
  | 'pikeman'
  | 'longbowman'
  | 'redcoat'
  | 'rider'

function teamCoat(team: Team): string {
  return team === 'enemy' ? '#c4452f' : '#2f6fb8'
}

function teamAccent(team: Team): string {
  return team === 'enemy' ? '#8f2418' : '#1e4e8c'
}

function Mat({
  color,
  roughness = 0.62,
  metalness = 0.04,
}: {
  color: string
  roughness?: number
  metalness?: number
}) {
  return <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
}

function Capsule({
  radius,
  length,
  color,
  position,
  rotation,
  roughness = 0.62,
  metalness = 0.04,
}: {
  radius: number
  length: number
  color: string
  position?: [number, number, number]
  rotation?: [number, number, number]
  roughness?: number
  metalness?: number
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow>
      <capsuleGeometry args={[radius, length, 5, 12]} />
      <Mat color={color} roughness={roughness} metalness={metalness} />
    </mesh>
  )
}

function Head({ hat, helmet }: { hat: 'straw' | 'cap' | 'turban' | 'none'; helmet: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.02, 0]} castShadow>
        <sphereGeometry args={[0.112, 16, 14]} />
        <Mat color={SKIN} roughness={0.72} />
      </mesh>
      <mesh position={[0, 0.06, -0.01]} castShadow>
        <sphereGeometry args={[0.108, 14, 12]} />
        <Mat color={HAIR} roughness={0.85} />
      </mesh>
      <mesh position={[0.028, 0.03, 0.092]}>
        <sphereGeometry args={[0.016, 8, 8]} />
        <meshBasicMaterial color="#1a1210" />
      </mesh>
      <mesh position={[-0.028, 0.03, 0.092]}>
        <sphereGeometry args={[0.016, 8, 8]} />
        <meshBasicMaterial color="#1a1210" />
      </mesh>
      <mesh position={[0, 0.008, 0.11]} rotation={[0.35, 0, 0]} castShadow>
        <sphereGeometry args={[0.02, 8, 8]} />
        <Mat color="#d9ae8d" roughness={0.7} />
      </mesh>
      {helmet ? (
        <group>
          <mesh position={[0, 0.08, 0]} castShadow>
            <sphereGeometry args={[0.122, 14, 10, 0, Math.PI * 2, 0, Math.PI / 1.7]} />
            <Mat color={STEEL} roughness={0.28} metalness={0.72} />
          </mesh>
          <mesh position={[0, 0.02, 0.11]} castShadow>
            <boxGeometry args={[0.16, 0.05, 0.04]} />
            <Mat color={STEEL} roughness={0.3} metalness={0.7} />
          </mesh>
        </group>
      ) : hat === 'straw' ? (
        <group>
          <mesh position={[0, 0.12, 0]} castShadow>
            <cylinderGeometry args={[0.13, 0.16, 0.08, 14]} />
            <Mat color="#d2b36a" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.09, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.22, 0.02, 16]} />
            <Mat color="#c4a45c" roughness={0.82} />
          </mesh>
        </group>
      ) : hat === 'turban' ? (
        <group>
          <mesh position={[0, 0.1, 0]} castShadow>
            <torusGeometry args={[0.09, 0.045, 8, 14]} />
            <Mat color="#1e4e8c" roughness={0.55} />
          </mesh>
        </group>
      ) : hat === 'cap' ? (
        <mesh position={[0, 0.1, 0.02]} castShadow>
          <sphereGeometry args={[0.12, 12, 10, 0, Math.PI * 2, 0, Math.PI / 1.8]} />
          <Mat color={LEATHER} roughness={0.7} />
        </mesh>
      ) : null}
    </group>
  )
}

function Humanoid({
  kind,
  team,
  hips,
  torso,
  head,
  armL,
  armR,
  elbowL,
  elbowR,
  legL,
  legR,
  kneeL,
  kneeR,
  sack,
}: {
  kind: HumanKind
  team: Team
  hips: RefObject<Group>
  torso: RefObject<Group>
  head: RefObject<Group>
  armL: RefObject<Group>
  armR: RefObject<Group>
  elbowL: RefObject<Group>
  elbowR: RefObject<Group>
  legL: RefObject<Group>
  legR: RefObject<Group>
  kneeL: RefObject<Group>
  kneeR: RefObject<Group>
  sack: RefObject<Group>
}) {
  const coat = teamCoat(team)
  const accent = teamAccent(team)
  const rider = kind === 'rider'
  const armored = kind === 'pikeman' || kind === 'rajput'
  const bow = kind === 'longbowman' || kind === 'gurkha'
  const musket = kind === 'sepoy' || kind === 'redcoat'
  const villager = kind === 'villager'
  const shirt = armored ? STEEL : coat
  const pants = villager ? '#5a4638' : PANTS
  const hat =
    villager && team === 'player'
      ? 'turban'
      : villager
        ? 'straw'
        : kind === 'sepoy' || kind === 'rajput'
          ? 'turban'
          : bow || rider
            ? 'cap'
            : 'none'

  return (
    <group position={[0, rider ? 0.02 : 0, 0]}>
      <group ref={hips} position={[0, rider ? 0.72 : 0.92, rider ? -0.04 : 0]}>
        <mesh position={[0, -0.02, 0]} castShadow>
          <sphereGeometry args={[0.13, 12, 10]} />
          <Mat color={pants} roughness={0.7} />
        </mesh>
        <group ref={torso} position={[0, 0.06, 0]}>
          <Capsule
            radius={0.13}
            length={0.28}
            color={shirt}
            position={[0, 0.2, 0]}
            roughness={armored ? 0.32 : 0.58}
            metalness={armored ? 0.55 : 0.05}
          />
          <mesh position={[0, 0.05, 0.02]} castShadow>
            <boxGeometry args={[0.22, 0.06, 0.18]} />
            <Mat color={LEATHER} roughness={0.75} />
          </mesh>
          <mesh position={[0, 0.34, 0]} castShadow>
            <cylinderGeometry args={[0.09, 0.11, 0.08, 10]} />
            <Mat color={SKIN} roughness={0.7} />
          </mesh>
          {armored ? (
            <mesh position={[0, 0.22, 0.12]} castShadow>
              <boxGeometry args={[0.2, 0.22, 0.05]} />
              <Mat color={accent} roughness={0.45} metalness={0.15} />
            </mesh>
          ) : (
            <mesh position={[0, 0.28, 0.08]} castShadow>
              <boxGeometry args={[0.16, 0.08, 0.04]} />
              <Mat color={accent} />
            </mesh>
          )}
          <group ref={head} position={[0, 0.46, 0]}>
            <Head hat={hat} helmet={kind === 'pikeman'} />
          </group>
          <group ref={armL} position={[-0.18, 0.3, 0]}>
            <Capsule radius={0.045} length={0.2} color={shirt} position={[0, -0.14, 0]} />
            <group ref={elbowL} position={[0, -0.28, 0]}>
              <Capsule radius={0.04} length={0.18} color={SKIN} position={[0, -0.12, 0]} />
              <mesh position={[0, -0.24, 0]} castShadow>
                <sphereGeometry args={[0.042, 10, 8]} />
                <Mat color={SKIN} />
              </mesh>
              {bow ? (
                <group position={[-0.02, -0.12, 0.08]} rotation={[0, 0, Math.PI / 2]}>
                  <mesh castShadow>
                    <torusGeometry args={[0.2, 0.018, 8, 18]} />
                    <Mat color={WOOD} roughness={0.55} />
                  </mesh>
                </group>
              ) : armored ? (
                <mesh position={[-0.08, -0.08, 0.04]} rotation={[1.2, 0, 0.4]} castShadow>
                  <cylinderGeometry args={[0.12, 0.12, 0.04, 14]} />
                  <Mat color={STEEL} roughness={0.3} metalness={0.65} />
                </mesh>
              ) : null}
            </group>
          </group>
          <group ref={armR} position={[0.18, 0.3, 0]}>
            <Capsule radius={0.045} length={0.2} color={shirt} position={[0, -0.14, 0]} />
            <group ref={elbowR} position={[0, -0.28, 0]}>
              <Capsule radius={0.04} length={0.18} color={SKIN} position={[0, -0.12, 0]} />
              <mesh position={[0, -0.24, 0]} castShadow>
                <sphereGeometry args={[0.042, 10, 8]} />
                <Mat color={SKIN} />
              </mesh>
              {villager ? (
                <group position={[0.02, -0.2, 0.04]} rotation={[0.2, 0, 0.15]}>
                  <mesh position={[0, 0.08, 0]} castShadow>
                    <cylinderGeometry args={[0.018, 0.022, 0.28, 8]} />
                    <Mat color={WOOD} />
                  </mesh>
                  <mesh position={[0.04, -0.08, 0]} rotation={[0, 0, 1.15]} castShadow>
                    <boxGeometry args={[0.14, 0.08, 0.03]} />
                    <Mat color={STEEL} roughness={0.35} metalness={0.55} />
                  </mesh>
                </group>
              ) : musket ? (
                <group position={[0.02, -0.18, 0.12]} rotation={[1.15, 0, 0.1]}>
                  <mesh position={[0, 0.12, 0]} castShadow>
                    <cylinderGeometry args={[0.018, 0.022, 0.55, 8]} />
                    <Mat color="#2a241c" roughness={0.45} metalness={0.2} />
                  </mesh>
                  <mesh position={[0, 0.38, 0]} castShadow>
                    <cylinderGeometry args={[0.03, 0.03, 0.08, 8]} />
                    <Mat color={STEEL} roughness={0.3} metalness={0.6} />
                  </mesh>
                </group>
              ) : armored || rider ? (
                <group position={[0.02, -0.18, 0.05]} rotation={[0.15, 0, 0.1]}>
                  <mesh position={[0, 0.1, 0]} castShadow>
                    <cylinderGeometry args={[0.016, 0.016, 0.12, 8]} />
                    <Mat color={LEATHER} />
                  </mesh>
                  <mesh position={[0, -0.12, 0]} castShadow>
                    <boxGeometry args={[0.05, 0.42, 0.016]} />
                    <Mat color={STEEL} roughness={0.22} metalness={0.8} />
                  </mesh>
                </group>
              ) : (
                <mesh position={[0.02, -0.16, 0.08]} rotation={[0.4, 0, 0]} castShadow>
                  <cylinderGeometry args={[0.01, 0.01, 0.34, 6]} />
                  <Mat color={ROPE} />
                </mesh>
              )}
            </group>
          </group>
          <group ref={sack} position={[0, 0.12, -0.16]} visible={false}>
            <mesh rotation={[0.3, 0, 0]} castShadow>
              <sphereGeometry args={[0.11, 10, 8]} />
              <Mat color="#c9a227" roughness={0.7} />
            </mesh>
          </group>
          {bow ? (
            <group position={[0.12, 0.18, -0.12]}>
              {[-0.04, 0, 0.04].map((x) => (
                <mesh key={x} position={[x, 0.08, 0]} rotation={[0.2, 0, 0]} castShadow>
                  <cylinderGeometry args={[0.012, 0.012, 0.28, 6]} />
                  <Mat color={WOOD} />
                </mesh>
              ))}
            </group>
          ) : null}
        </group>
        <group ref={legL} position={[-0.075, -0.02, 0]}>
          <Capsule radius={0.055} length={0.28} color={pants} position={[0, -0.2, 0]} />
          <group ref={kneeL} position={[0, -0.38, 0]}>
            <Capsule radius={0.048} length={0.26} color={pants} position={[0, -0.16, 0]} />
            <mesh position={[0, -0.34, 0.04]} castShadow>
              <boxGeometry args={[0.1, 0.08, 0.16]} />
              <Mat color={BOOT} roughness={0.8} />
            </mesh>
          </group>
        </group>
        <group ref={legR} position={[0.075, -0.02, 0]}>
          <Capsule radius={0.055} length={0.28} color={pants} position={[0, -0.2, 0]} />
          <group ref={kneeR} position={[0, -0.38, 0]}>
            <Capsule radius={0.048} length={0.26} color={pants} position={[0, -0.16, 0]} />
            <mesh position={[0, -0.34, 0.04]} castShadow>
              <boxGeometry args={[0.1, 0.08, 0.16]} />
              <Mat color={BOOT} roughness={0.8} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  )
}

function HorseBody({
  team,
  body,
  legFL,
  legFR,
  legBL,
  legBR,
  neck,
  camel = false,
}: {
  team: Team
  body: RefObject<Group>
  legFL: RefObject<Group>
  legFR: RefObject<Group>
  legBL: RefObject<Group>
  legBR: RefObject<Group>
  neck: RefObject<Group>
  camel?: boolean
}) {
  const hide = camel ? '#c4a574' : '#4a3426'
  const coat = camel ? '#d2b48a' : '#7a5336'
  return (
    <group ref={body}>
      <mesh position={[0, 0.52, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <capsuleGeometry args={[0.22, 0.62, 6, 12]} />
        <Mat color={coat} roughness={0.7} />
      </mesh>
      {camel ? (
        <mesh position={[0, 0.82, -0.05]} castShadow>
          <sphereGeometry args={[0.22, 10, 8]} />
          <Mat color={coat} roughness={0.72} />
        </mesh>
      ) : null}
      <mesh position={[0, 0.68, 0]} castShadow>
        <boxGeometry args={[0.28, 0.08, 0.32]} />
        <Mat color={teamCoat(team)} />
      </mesh>
      <group ref={neck} position={[0, 0.68, 0.32]}>
        <mesh rotation={[0.55, 0, 0]} position={[0, 0.12, 0.08]} castShadow>
          <capsuleGeometry args={[0.09, 0.28, 5, 10]} />
          <Mat color={coat} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.28, 0.28]} castShadow>
          <capsuleGeometry args={[0.08, 0.16, 5, 10]} />
          <Mat color={coat} roughness={0.68} />
        </mesh>
        <mesh position={[0.07, 0.34, 0.36]}>
          <sphereGeometry args={[0.018, 8, 8]} />
          <meshBasicMaterial color="#111" />
        </mesh>
        <mesh position={[-0.07, 0.34, 0.36]}>
          <sphereGeometry args={[0.018, 8, 8]} />
          <meshBasicMaterial color="#111" />
        </mesh>
        <mesh position={[0, 0.42, 0.12]} rotation={[0.2, 0, 0]} castShadow>
          <boxGeometry args={[0.04, 0.16, 0.22]} />
          <Mat color={HAIR} roughness={0.9} />
        </mesh>
      </group>
      <mesh position={[0, 0.58, -0.42]} rotation={[0.6, 0, 0]} castShadow>
        <capsuleGeometry args={[0.03, 0.28, 4, 8]} />
        <Mat color={HAIR} roughness={0.9} />
      </mesh>
      {(
        [
          [legFL, -0.12, 0.28],
          [legFR, 0.12, 0.28],
          [legBL, -0.12, -0.24],
          [legBR, 0.12, -0.24],
        ] as const
      ).map(([ref, x, z]) => (
        <group key={`${x}:${z}`} ref={ref} position={[x, 0.42, z]}>
          <Capsule radius={0.04} length={0.28} color={hide} position={[0, -0.2, 0]} />
          <mesh position={[0, -0.38, 0.03]} castShadow>
            <boxGeometry args={[0.07, 0.07, 0.11]} />
            <Mat color={BOOT} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function animateHuman(
  e: { order: { type: string }; dying: boolean; carryAmount: number; attackTimer: number },
  t: number,
  rider: boolean,
  refs: {
    root: Group
    hips: Group
    torso: Group
    head: Group
    armL: Group
    armR: Group
    elbowL: Group
    elbowR: Group
    legL: Group
    legR: Group
    kneeL: Group
    kneeR: Group
    sack: Group
  },
) {
  const moving =
    e.order.type === 'move' ||
    e.order.type === 'attackMove' ||
    e.order.type === 'return' ||
    e.order.type === 'gather' ||
    e.order.type === 'build'
  const attack = e.order.type === 'attack'
  const gather = e.order.type === 'gather' || e.order.type === 'build'
  const die = e.dying

  refs.sack.visible = e.carryAmount > 0 && !rider

  if (die) {
    refs.root.rotation.x = Math.min(1.25, refs.root.rotation.x + 0.08)
    refs.root.position.y = Math.max(-0.15, refs.root.position.y - 0.02)
    return
  }
  refs.root.rotation.x = 0
  refs.root.position.y = 0

  const walk = moving && !gather ? Math.sin(t * (rider ? 10 : 8)) : 0
  const idle = Math.sin(t * 2.2) * 0.015

  refs.hips.position.y = (rider ? 0.72 : 0.92) + (moving ? Math.abs(walk) * 0.03 : idle)
  refs.torso.rotation.x = gather ? 0.55 + Math.sin(t * 9) * 0.12 : moving ? 0.08 : idle * 2
  refs.head.rotation.x = gather ? -0.25 : idle * -1.5
  refs.head.rotation.y = idle * 4

  const armSwing = rider ? walk * 0.18 : walk * 0.7
  refs.armL.rotation.x = gather ? 0.4 : attack ? 0.35 : armSwing
  refs.armR.rotation.x = gather
    ? -0.2 + Math.sin(t * 9) * 1.1
    : attack
      ? -0.9 + (1 - Math.min(1, e.attackTimer)) * 1.8
      : -armSwing
  refs.elbowL.rotation.x = rider ? 0.7 : gather ? 0.4 : 0.18
  refs.elbowR.rotation.x = gather ? 0.6 : attack ? 0.35 : rider ? 0.55 : 0.2

  if (rider) {
    refs.legL.rotation.x = 1.05 + walk * 0.08
    refs.legR.rotation.x = 1.05 - walk * 0.08
    refs.kneeL.rotation.x = -1.15
    refs.kneeR.rotation.x = -1.15
  } else {
    refs.legL.rotation.x = gather ? 0.15 : walk * 0.85
    refs.legR.rotation.x = gather ? 0.15 : -walk * 0.85
    refs.kneeL.rotation.x = moving ? Math.max(0, -walk) * 0.7 : 0.08
    refs.kneeR.rotation.x = moving ? Math.max(0, walk) * 0.7 : 0.08
  }
}

function AnimatedHuman({
  id,
  kind,
}: {
  id: string
  kind: Exclude<HumanKind, 'rider'>
}) {
  const root = useRef<Group>(null)
  const hips = useRef<Group>(null)
  const torso = useRef<Group>(null)
  const head = useRef<Group>(null)
  const armL = useRef<Group>(null)
  const armR = useRef<Group>(null)
  const elbowL = useRef<Group>(null)
  const elbowR = useRef<Group>(null)
  const legL = useRef<Group>(null)
  const legR = useRef<Group>(null)
  const kneeL = useRef<Group>(null)
  const kneeR = useRef<Group>(null)
  const sack = useRef<Group>(null)
  const smoke = useRef<Group>(null)
  const lastAtk = useRef(0)
  const t = useRef(0)
  const team = useGameStore.getState().entities[id]?.team ?? 'player'

  useFrame((_, dt) => {
    const e = useGameStore.getState().entities[id]
    if (
      !e ||
      !root.current ||
      !hips.current ||
      !torso.current ||
      !head.current ||
      !armL.current ||
      !armR.current ||
      !elbowL.current ||
      !elbowR.current ||
      !legL.current ||
      !legR.current ||
      !kneeL.current ||
      !kneeR.current ||
      !sack.current
    ) {
      return
    }
    t.current += dt
    if (e.attackTimer > lastAtk.current + 0.45 && smoke.current) {
      smoke.current.visible = true
      smoke.current.scale.setScalar(0.6)
    }
    lastAtk.current = e.attackTimer
    if (smoke.current?.visible) {
      smoke.current.scale.multiplyScalar(1 + dt * 3)
      if (smoke.current.scale.x > 2.4) smoke.current.visible = false
    }
    animateHuman(e, t.current, false, {
      root: root.current,
      hips: hips.current,
      torso: torso.current,
      head: head.current,
      armL: armL.current,
      armR: armR.current,
      elbowL: elbowL.current,
      elbowR: elbowR.current,
      legL: legL.current,
      legR: legR.current,
      kneeL: kneeL.current,
      kneeR: kneeR.current,
      sack: sack.current,
    })
  })

  return (
    <group ref={root}>
      <Humanoid
        kind={kind}
        team={team === 'enemy' ? 'enemy' : 'player'}
        hips={hips}
        torso={torso}
        head={head}
        armL={armL}
        armR={armR}
        elbowL={elbowL}
        elbowR={elbowR}
        legL={legL}
        legR={legR}
        kneeL={kneeL}
        kneeR={kneeR}
        sack={sack}
      />
      <group ref={smoke} position={[0.22, 1.15, 0.45]} visible={false}>
        <mesh>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshBasicMaterial color="#f8fafc" transparent opacity={0.55} depthWrite={false} />
        </mesh>
      </group>
    </group>
  )
}

function AnimatedScout({ id, camel = false }: { id: string; camel?: boolean }) {
  const root = useRef<Group>(null)
  const body = useRef<Group>(null)
  const neck = useRef<Group>(null)
  const legFL = useRef<Group>(null)
  const legFR = useRef<Group>(null)
  const legBL = useRef<Group>(null)
  const legBR = useRef<Group>(null)
  const hips = useRef<Group>(null)
  const torso = useRef<Group>(null)
  const head = useRef<Group>(null)
  const armL = useRef<Group>(null)
  const armR = useRef<Group>(null)
  const elbowL = useRef<Group>(null)
  const elbowR = useRef<Group>(null)
  const legL = useRef<Group>(null)
  const legR = useRef<Group>(null)
  const kneeL = useRef<Group>(null)
  const kneeR = useRef<Group>(null)
  const sack = useRef<Group>(null)
  const t = useRef(0)
  const team = useGameStore.getState().entities[id]?.team ?? 'player'

  useFrame((_, dt) => {
    const e = useGameStore.getState().entities[id]
    if (
      !e ||
      !root.current ||
      !body.current ||
      !neck.current ||
      !legFL.current ||
      !legFR.current ||
      !legBL.current ||
      !legBR.current ||
      !hips.current ||
      !torso.current ||
      !head.current ||
      !armL.current ||
      !armR.current ||
      !elbowL.current ||
      !elbowR.current ||
      !legL.current ||
      !legR.current ||
      !kneeL.current ||
      !kneeR.current ||
      !sack.current
    ) {
      return
    }
    t.current += dt
    const moving = e.order.type === 'move' || e.order.type === 'attackMove' || e.order.type === 'attack'
    if (e.dying) {
      root.current.rotation.z = Math.min(1.1, root.current.rotation.z + 0.06)
      return
    }
    root.current.rotation.z = 0
    const g = moving ? Math.sin(t.current * 11) : 0
    body.current.position.y = moving ? Math.abs(g) * 0.04 : 0
    neck.current.rotation.x = moving ? g * 0.08 : Math.sin(t.current * 1.6) * 0.04
    legFL.current.rotation.x = g * 0.7
    legBR.current.rotation.x = g * 0.7
    legFR.current.rotation.x = -g * 0.7
    legBL.current.rotation.x = -g * 0.7
    animateHuman(e, t.current, true, {
      root: root.current,
      hips: hips.current,
      torso: torso.current,
      head: head.current,
      armL: armL.current,
      armR: armR.current,
      elbowL: elbowL.current,
      elbowR: elbowR.current,
      legL: legL.current,
      legR: legR.current,
      kneeL: kneeL.current,
      kneeR: kneeR.current,
      sack: sack.current,
    })
  })

  return (
    <group ref={root}>
      <HorseBody
        team={team === 'enemy' ? 'enemy' : 'player'}
        camel={camel}
        body={body}
        neck={neck}
        legFL={legFL}
        legFR={legFR}
        legBL={legBL}
        legBR={legBR}
      />
      <group scale={0.86} position={[0, -0.02, -0.06]}>
        <Humanoid
          kind="rider"
          team={team === 'enemy' ? 'enemy' : 'player'}
          hips={hips}
          torso={torso}
          head={head}
          armL={armL}
          armR={armR}
          elbowL={elbowL}
          elbowR={elbowR}
          legL={legL}
          legR={legR}
          kneeL={kneeL}
          kneeR={kneeR}
          sack={sack}
        />
      </group>
    </group>
  )
}

function AnimatedMangonel({ id }: { id: string }) {
  const root = useRef<Group>(null)
  const arm = useRef<Group>(null)
  const t = useRef(0)
  const team = useGameStore.getState().entities[id]?.team ?? 'player'
  const color = team === 'enemy' ? COLORS.enemy : COLORS.player

  useFrame((_, dt) => {
    const e = useGameStore.getState().entities[id]
    const a = arm.current
    const r = root.current
    if (!e || !a || !r) return
    t.current += dt
    if (e.dying) {
      r.rotation.z = Math.min(0.9, r.rotation.z + 0.05)
      return
    }
    r.rotation.z = 0
    const moving = e.order.type === 'move' || e.order.type === 'attackMove'
    r.position.y = moving ? Math.sin(t.current * 14) * 0.015 : 0
    if (e.order.type === 'attack') {
      const phase = 1 - Math.min(1, e.attackTimer / 1.6)
      a.rotation.x = phase < 0.7 ? -0.95 + phase * 0.2 : -0.8 + (phase - 0.7) * 6
    } else {
      a.rotation.x = -0.85
    }
  })

  return (
    <group ref={root}>
      <mesh position={[0, 0.22, 0]} castShadow>
        <boxGeometry args={[0.7, 0.16, 1.15]} />
        <Mat color={WOOD} roughness={0.75} />
      </mesh>
      {([-0.32, 0.32] as const).map((x) =>
        ([-0.42, 0.42] as const).map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.16, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.15, 0.15, 0.08, 12]} />
            <Mat color="#3f3f46" roughness={0.5} metalness={0.3} />
          </mesh>
        )),
      )}
      <mesh position={[-0.18, 0.55, -0.1]} castShadow>
        <boxGeometry args={[0.08, 0.7, 0.08]} />
        <Mat color={WOOD} />
      </mesh>
      <mesh position={[0.18, 0.55, -0.1]} castShadow>
        <boxGeometry args={[0.08, 0.7, 0.08]} />
        <Mat color={WOOD} />
      </mesh>
      <mesh position={[0, 0.88, -0.1]} castShadow>
        <boxGeometry args={[0.48, 0.08, 0.08]} />
        <Mat color={WOOD} />
      </mesh>
      <mesh position={[0, 0.18, 0.55]} castShadow>
        <boxGeometry args={[0.22, 0.12, 0.08]} />
        <Mat color={color} />
      </mesh>
      <group ref={arm} position={[0, 0.42, -0.08]}>
        <mesh position={[0, 0.02, 0.38]} rotation={[0.1, 0, 0]} castShadow>
          <boxGeometry args={[0.07, 0.07, 0.95]} />
          <Mat color="#6b4423" />
        </mesh>
        <mesh position={[0, 0.08, 0.82]} castShadow>
          <sphereGeometry args={[0.12, 10, 8]} />
          <Mat color="#6b7280" roughness={0.55} />
        </mesh>
      </group>
    </group>
  )
}

function AnimatedElephant({ id, siege }: { id: string; siege: boolean }) {
  const root = useRef<Group>(null)
  const t = useRef(0)
  const team = useGameStore.getState().entities[id]?.team ?? 'player'

  useFrame((_, dt) => {
    const e = useGameStore.getState().entities[id]
    const r = root.current
    if (!e || !r) return
    t.current += dt
    if (e.dying) {
      r.rotation.z = Math.min(0.9, r.rotation.z + 0.04)
      return
    }
    r.rotation.z = 0
    const moving = e.order.type === 'move' || e.order.type === 'attack' || e.order.type === 'attackMove'
    r.position.y = moving ? Math.abs(Math.sin(t.current * 5)) * 0.05 : 0
  })

  const hide = '#6b6b70'
  return (
    <group ref={root}>
      <mesh position={[0, 0.85, 0.05]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <capsuleGeometry args={[0.42, 0.85, 6, 12]} />
        <Mat color={hide} roughness={0.75} />
      </mesh>
      <mesh position={[0, 1.05, 0.55]} rotation={[0.7, 0, 0]} castShadow>
        <capsuleGeometry args={[0.22, 0.35, 5, 10]} />
        <Mat color={hide} roughness={0.72} />
      </mesh>
      <mesh position={[0, 0.72, 0.85]} rotation={[1.1, 0, 0]} castShadow>
        <capsuleGeometry args={[0.09, 0.55, 5, 8]} />
        <Mat color={hide} roughness={0.7} />
      </mesh>
      <mesh position={[0.16, 0.95, 0.72]} rotation={[0.4, 0.5, 0]} castShadow>
        <capsuleGeometry args={[0.03, 0.28, 4, 6]} />
        <Mat color="#e8e0d0" roughness={0.4} />
      </mesh>
      <mesh position={[-0.16, 0.95, 0.72]} rotation={[0.4, -0.5, 0]} castShadow>
        <capsuleGeometry args={[0.03, 0.28, 4, 6]} />
        <Mat color="#e8e0d0" roughness={0.4} />
      </mesh>
      <mesh position={[0.32, 1.05, 0.4]} rotation={[0, 0, 0.4]} castShadow>
        <sphereGeometry args={[0.18, 8, 6]} />
        <Mat color="#5c5c62" roughness={0.85} />
      </mesh>
      <mesh position={[-0.32, 1.05, 0.4]} rotation={[0, 0, -0.4]} castShadow>
        <sphereGeometry args={[0.18, 8, 6]} />
        <Mat color="#5c5c62" roughness={0.85} />
      </mesh>
      {([-0.22, 0.22] as const).map((x) =>
        ([-0.28, 0.32] as const).map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.4, z]} castShadow>
            <capsuleGeometry args={[0.08, 0.42, 4, 8]} />
            <Mat color="#4a4a50" />
          </mesh>
        )),
      )}
      <mesh position={[0, 1.28, -0.05]} castShadow>
        <boxGeometry args={[0.55, 0.18, 0.45]} />
        <Mat color={teamCoat(team === 'enemy' ? 'enemy' : 'player')} />
      </mesh>
      <mesh position={[0, 1.55, -0.08]} castShadow>
        <capsuleGeometry args={[0.09, 0.16, 4, 8]} />
        <Mat color={teamCoat(team === 'enemy' ? 'enemy' : 'player')} />
      </mesh>
      <mesh position={[0, 1.78, -0.08]} castShadow>
        <sphereGeometry args={[0.1, 8, 8]} />
        <Mat color={SKIN} />
      </mesh>
      {siege ? (
        <mesh position={[0, 1.45, 0.35]} rotation={[0.4, 0, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.08, 0.7, 8]} />
          <Mat color="#3f3f46" roughness={0.4} metalness={0.35} />
        </mesh>
      ) : (
        <mesh position={[0.28, 1.35, 0.2]} rotation={[0.2, 0, -0.4]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 0.7, 6]} />
          <Mat color={WOOD} />
        </mesh>
      )}
    </group>
  )
}

export function AnimatedUnit({ id, kind }: { id: string; kind: UnitKind }) {
  if (kind === 'falconet') return <AnimatedMangonel id={id} />
  if (kind === 'hussar' || kind === 'dragoon') return <AnimatedScout id={id} />
  if (kind === 'sowar') return <AnimatedScout id={id} camel />
  if (kind === 'mahout' || kind === 'siegeElephant') {
    return <AnimatedElephant id={id} siege={kind === 'siegeElephant'} />
  }
  return <AnimatedHuman id={id} kind={kind} />
}
