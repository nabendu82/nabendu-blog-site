"use client";

export function TreeModel({ scale = 1 }: { scale?: number }) {
  return (
    <group scale={scale}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.18, 1.1, 6]} />
        <meshStandardMaterial color="#6b3e1a" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.35, 0]} castShadow>
        <coneGeometry args={[0.7, 1.1, 6]} />
        <meshStandardMaterial color="#1f7a32" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.95, 0]} castShadow>
        <coneGeometry args={[0.5, 0.85, 6]} />
        <meshStandardMaterial color="#2d9a42" roughness={0.65} />
      </mesh>
    </group>
  )
}
