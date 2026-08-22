"use client";

export function ManorModel({ color = '#c4452f' }: { color?: string }) {
  return (
    <group>
      <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.8, 1.4, 2.2]} />
        <meshStandardMaterial color="#a33b32" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.65, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[1.9, 1.05, 4]} />
        <meshStandardMaterial color="#4b2a1c" roughness={0.6} />
      </mesh>
      <mesh position={[1.1, 0.85, 0.4]} castShadow>
        <boxGeometry args={[0.9, 1.1, 1.3]} />
        <meshStandardMaterial color="#8f332c" roughness={0.78} />
      </mesh>
      <mesh position={[-0.45, 0.85, 1.12]} castShadow>
        <boxGeometry args={[0.35, 0.4, 0.06]} />
        <meshStandardMaterial color="#e8e0d0" />
      </mesh>
      <mesh position={[0.4, 1.15, 1.12]} castShadow>
        <boxGeometry args={[0.28, 0.28, 0.06]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  )
}
