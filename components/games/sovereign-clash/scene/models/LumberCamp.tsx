"use client";

export function LumberCampModel({ color = '#3b82f6' }: { color?: string }) {
  return (
    <group>
      <mesh position={[0, 0.18, 0]} receiveShadow>
        <boxGeometry args={[2.6, 0.22, 2.2]} />
        <meshStandardMaterial color="#7a5a38" roughness={0.9} />
      </mesh>
      <mesh position={[-0.7, 0.85, 0]} castShadow>
        <boxGeometry args={[0.18, 1.5, 0.18]} />
        <meshStandardMaterial color="#5c4030" />
      </mesh>
      <mesh position={[0.7, 0.85, 0]} castShadow>
        <boxGeometry args={[0.18, 1.5, 0.18]} />
        <meshStandardMaterial color="#5c4030" />
      </mesh>
      <mesh position={[0, 1.55, 0]} rotation={[0, 0, 0.15]} castShadow>
        <boxGeometry args={[2.2, 0.16, 1.6]} />
        <meshStandardMaterial color="#8B5A2B" roughness={0.8} />
      </mesh>
      {[-0.45, 0, 0.45].map((x) => (
        <mesh key={x} position={[x, 0.42, 0.7]} rotation={[0.2, 0.4, 0.1]} castShadow>
          <cylinderGeometry args={[0.16, 0.16, 1.1, 6]} />
          <meshStandardMaterial color="#6b4226" />
        </mesh>
      ))}
      <mesh position={[0.9, 0.55, -0.7]} castShadow>
        <boxGeometry args={[0.28, 0.35, 0.08]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  )
}
