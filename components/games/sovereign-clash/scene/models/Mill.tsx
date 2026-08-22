"use client";

export function MillModel({ color = '#3b82f6' }: { color?: string }) {
  return (
    <group>
      <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.05, 1.15, 1.4, 8]} />
        <meshStandardMaterial color="#c4a574" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.55, 0]} rotation={[0, Math.PI / 8, 0]} castShadow>
        <coneGeometry args={[1.15, 0.9, 8]} />
        <meshStandardMaterial color="#8b3a2a" roughness={0.55} />
      </mesh>
      <mesh position={[0, 1.35, 0.2]} rotation={[0.2, 0, 0]} castShadow>
        <boxGeometry args={[1.8, 0.12, 0.18]} />
        <meshStandardMaterial color="#d6d3d1" />
      </mesh>
      <mesh position={[0, 1.35, 0.2]} rotation={[0.2, Math.PI / 2, 0]} castShadow>
        <boxGeometry args={[1.8, 0.12, 0.18]} />
        <meshStandardMaterial color="#d6d3d1" />
      </mesh>
      <mesh position={[0.55, 0.55, 1.05]} castShadow>
        <boxGeometry args={[0.32, 0.55, 0.1]} />
        <meshStandardMaterial color="#5b3a1e" />
      </mesh>
      <mesh position={[-0.7, 0.9, 0.9]} castShadow>
        <boxGeometry args={[0.22, 0.22, 0.06]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  )
}
