"use client";

import type { Team } from '../../game/types'

export function TownCenterModel({
  color = '#2f6fb8',
  team = 'player',
}: {
  color?: string
  team?: Team
}) {
  if (team === 'enemy') {
    return (
      <group>
        <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.5, 1.5, 3.2]} />
          <meshStandardMaterial color="#9a3b32" roughness={0.82} />
        </mesh>
        <mesh position={[0, 1.85, 0]} castShadow>
          <boxGeometry args={[2.4, 0.85, 2.2]} />
          <meshStandardMaterial color="#7f2f28" roughness={0.78} />
        </mesh>
        <mesh position={[0, 2.55, 0]} rotation={[0, 0, 0]} castShadow>
          <boxGeometry args={[2.7, 0.18, 2.5]} />
          <meshStandardMaterial color="#4b2a1c" roughness={0.7} />
        </mesh>
        <mesh position={[0, 3.05, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[1.85, 1.05, 4]} />
          <meshStandardMaterial color="#5c241c" roughness={0.55} />
        </mesh>
        <mesh position={[1.2, 1.1, 1.65]} castShadow>
          <boxGeometry args={[0.45, 0.7, 0.1]} />
          <meshStandardMaterial color="#1f140c" />
        </mesh>
        <mesh position={[-0.7, 1.15, 1.64]} castShadow>
          <boxGeometry args={[0.32, 0.32, 0.06]} />
          <meshStandardMaterial color="#e8e0d0" />
        </mesh>
        <mesh position={[0.22, 3.65, 0]} castShadow>
          <boxGeometry args={[0.55, 0.35, 0.06]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </group>
    )
  }

  return (
    <group>
      <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.5, 1.4, 3.5]} />
        <meshStandardMaterial color="#d2b48a" roughness={0.78} />
      </mesh>
      <mesh position={[0, 1.65, 0]} castShadow>
        <cylinderGeometry args={[1.55, 1.7, 0.7, 12]} />
        <meshStandardMaterial color="#c9a66b" roughness={0.7} />
      </mesh>
      <mesh position={[0, 2.45, 0]} castShadow>
        <sphereGeometry args={[1.35, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#c4a574" roughness={0.55} metalness={0.08} />
      </mesh>
      <mesh position={[0, 3.2, 0]} castShadow>
        <sphereGeometry args={[0.22, 10, 8]} />
        <meshStandardMaterial color="#d4af37" metalness={0.45} roughness={0.35} />
      </mesh>
      {([-1.55, 1.55] as const).map((x) =>
        ([-1.55, 1.55] as const).map((z) => (
          <group key={`${x}${z}`} position={[x, 0, z]}>
            <mesh position={[0, 1.35, 0]} castShadow>
              <cylinderGeometry args={[0.18, 0.22, 2.5, 10]} />
              <meshStandardMaterial color="#c4a574" roughness={0.7} />
            </mesh>
            <mesh position={[0, 2.7, 0]} castShadow>
              <sphereGeometry args={[0.28, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color="#2a6a62" roughness={0.45} />
            </mesh>
          </group>
        )),
      )}
      <mesh position={[1.15, 1.05, 1.8]} castShadow>
        <boxGeometry args={[0.5, 0.7, 0.1]} />
        <meshStandardMaterial color="#3f2a14" />
      </mesh>
      <mesh position={[0.22, 3.45, 0]} castShadow>
        <boxGeometry args={[0.5, 0.32, 0.06]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  )
}
