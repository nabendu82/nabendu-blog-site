"use client";

export function GoldMineModel({ scale = 1 }: { scale?: number }) {
  return (
    <group scale={scale}>
      <mesh position={[0, 0.35, 0]} rotation={[0.15, 0.4, 0.1]} castShadow>
        <boxGeometry args={[1.2, 0.7, 1.0]} />
        <meshStandardMaterial color="#b8860b" metalness={0.45} roughness={0.4} />
      </mesh>
      <mesh position={[0.35, 0.55, 0.15]} rotation={[0.3, -0.5, 0.2]} castShadow>
        <boxGeometry args={[0.7, 0.55, 0.6]} />
        <meshStandardMaterial color="#eab308" metalness={0.55} roughness={0.35} />
      </mesh>
      <mesh position={[-0.3, 0.5, -0.2]} rotation={[-0.2, 0.8, 0]} castShadow>
        <boxGeometry args={[0.55, 0.5, 0.5]} />
        <meshStandardMaterial color="#ca8a04" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0.1, 0.85, 0]} castShadow>
        <boxGeometry args={[0.35, 0.35, 0.35]} />
        <meshStandardMaterial color="#fde047" metalness={0.65} roughness={0.25} />
      </mesh>
    </group>
  )
}
