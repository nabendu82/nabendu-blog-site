"use client";

export function PalisadeModel({ color = '#3b82f6' }: { color?: string }) {
  return (
    <group>
      {[-0.32, 0, 0.32].map((x) => (
        <mesh key={x} position={[x, 0.7, 0]} castShadow>
          <cylinderGeometry args={[0.16, 0.18, 1.4, 6]} />
          <meshStandardMaterial color="#6b4226" roughness={0.85} />
        </mesh>
      ))}
      {[-0.32, 0, 0.32].map((x) => (
        <mesh key={`t${x}`} position={[x, 1.48, 0]} castShadow>
          <coneGeometry args={[0.16, 0.28, 6]} />
          <meshStandardMaterial color="#5c3a22" />
        </mesh>
      ))}
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[0.85, 0.12, 0.12]} />
        <meshStandardMaterial color="#4b2e1a" />
      </mesh>
      <mesh position={[0.4, 0.95, 0.12]} castShadow>
        <boxGeometry args={[0.1, 0.18, 0.04]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  )
}
