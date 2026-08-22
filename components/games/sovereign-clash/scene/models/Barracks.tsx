"use client";

export function BarracksModel({ color = '#3b82f6' }: { color?: string }) {
  return (
    <group>
      <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.6, 1.4, 2.4]} />
        <meshStandardMaterial color="#8d7a62" roughness={0.85} />
      </mesh>
      {[-1.5, -0.5, 0.5, 1.5].map((x) => (
        <mesh key={x} position={[x, 1.55, 1.05]} castShadow>
          <boxGeometry args={[0.45, 0.35, 0.35]} />
          <meshStandardMaterial color="#6b5844" />
        </mesh>
      ))}
      {[-1.5, -0.5, 0.5, 1.5].map((x) => (
        <mesh key={`b${x}`} position={[x, 1.55, -1.05]} castShadow>
          <boxGeometry args={[0.45, 0.35, 0.35]} />
          <meshStandardMaterial color="#6b5844" />
        </mesh>
      ))}
      <mesh position={[0, 1.55, 0]} castShadow>
        <boxGeometry args={[3.7, 0.18, 2.5]} />
        <meshStandardMaterial color="#5c4a38" />
      </mesh>
      <mesh position={[-1.5, 2.05, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 0.9, 6]} />
        <meshStandardMaterial color="#4b5563" />
      </mesh>
      <mesh position={[-1.28, 2.3, 0]} castShadow>
        <boxGeometry args={[0.45, 0.28, 0.05]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[1.2, 0.45, 1.35]} rotation={[0, 0.2, 0.4]} castShadow>
        <boxGeometry args={[0.08, 0.9, 0.08]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.6} />
      </mesh>
    </group>
  )
}
