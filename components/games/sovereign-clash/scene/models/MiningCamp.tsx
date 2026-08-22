"use client";

export function MiningCampModel({ color = '#3b82f6' }: { color?: string }) {
  return (
    <group>
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 0.9, 2.0]} />
        <meshStandardMaterial color="#6b5a4a" roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.05, 0]} castShadow>
        <boxGeometry args={[2.5, 0.16, 2.1]} />
        <meshStandardMaterial color="#4b4036" />
      </mesh>
      <mesh position={[-0.55, 0.55, 0.3]} rotation={[0.2, 0.4, 0.1]} castShadow>
        <boxGeometry args={[0.7, 0.5, 0.55]} />
        <meshStandardMaterial color="#ca8a04" metalness={0.45} roughness={0.4} />
      </mesh>
      <mesh position={[0.5, 0.5, -0.25]} rotation={[-0.15, -0.3, 0]} castShadow>
        <boxGeometry args={[0.55, 0.4, 0.5]} />
        <meshStandardMaterial color="#eab308" metalness={0.5} roughness={0.35} />
      </mesh>
      <mesh position={[0.9, 1.35, -0.7]} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 0.7, 6]} />
        <meshStandardMaterial color="#4b5563" />
      </mesh>
      <mesh position={[1.08, 1.5, -0.7]} castShadow>
        <boxGeometry args={[0.4, 0.24, 0.05]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  )
}
