"use client";

export function HouseModel({
  color = '#2f6fb8',
  british = false,
}: {
  color?: string
  british?: boolean
}) {
  const wall = british ? '#a33b32' : '#e8d5b5'
  const roof = british ? '#4b2a1c' : '#8b3a2a'
  return (
    <group>
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 1.1, 1.6]} />
        <meshStandardMaterial color={wall} roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.4, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[1.45, 0.95, 4]} />
        <meshStandardMaterial color={roof} roughness={0.55} />
      </mesh>
      <mesh position={[0.55, 0.45, 0.82]} castShadow>
        <boxGeometry args={[0.35, 0.55, 0.08]} />
        <meshStandardMaterial color="#5b3a1e" />
      </mesh>
      <mesh position={[-0.45, 0.7, 0.82]} castShadow>
        <boxGeometry args={[0.28, 0.28, 0.06]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  )
}
