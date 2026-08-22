"use client";

export function FoundryModel({ color = '#2f6fb8' }: { color?: string }) {
  return (
    <group>
      <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 1.4, 2.6]} />
        <meshStandardMaterial color="#6b5344" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.55, 0]} castShadow>
        <boxGeometry args={[3.4, 0.2, 2.8]} />
        <meshStandardMaterial color="#4b3b32" />
      </mesh>
      <mesh position={[-0.9, 2.15, -0.4]} castShadow>
        <cylinderGeometry args={[0.28, 0.34, 1.4, 10]} />
        <meshStandardMaterial color="#3f3f46" roughness={0.55} metalness={0.25} />
      </mesh>
      <mesh position={[0.8, 0.55, 1.2]} rotation={[0.2, 0.4, 0]} castShadow>
        <boxGeometry args={[0.7, 0.35, 0.45]} />
        <meshStandardMaterial color="#8a5a32" />
      </mesh>
      <mesh position={[1.2, 1.35, 1.1]} castShadow>
        <boxGeometry args={[0.4, 0.28, 0.08]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  )
}
