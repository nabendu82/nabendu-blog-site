"use client";

export function RallyFlag({ color = '#fde68a' }: { color?: string }) {
  return (
    <group>
      <mesh position={[0, 0.7, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.05, 1.4, 6]} />
        <meshStandardMaterial color="#4b5563" />
      </mesh>
      <mesh position={[0.22, 1.15, 0]} castShadow>
        <boxGeometry args={[0.45, 0.28, 0.05]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  )
}
