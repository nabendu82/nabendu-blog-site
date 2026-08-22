"use client";

export function CaravanseraiModel({ color = '#2f6fb8' }: { color?: string }) {
  return (
    <group>
      <mesh position={[0, 0.12, 0]} receiveShadow>
        <boxGeometry args={[4.2, 0.22, 4.2]} />
        <meshStandardMaterial color="#c4a574" roughness={0.85} />
      </mesh>
      {([-1.7, 1.7] as const).map((x) => (
        <mesh key={`w${x}`} position={[x, 0.85, 0]} castShadow>
          <boxGeometry args={[0.35, 1.5, 3.8]} />
          <meshStandardMaterial color="#d2b48a" roughness={0.75} />
        </mesh>
      ))}
      <mesh position={[0, 0.85, -1.7]} castShadow>
        <boxGeometry args={[3.8, 1.5, 0.35]} />
        <meshStandardMaterial color="#c9a66b" roughness={0.75} />
      </mesh>
      <mesh position={[-0.9, 0.7, 1.75]} castShadow>
        <boxGeometry args={[1.6, 1.2, 0.3]} />
        <meshStandardMaterial color="#b8955e" roughness={0.7} />
      </mesh>
      <mesh position={[0.85, 0.85, 1.75]} castShadow>
        <boxGeometry args={[1.4, 1.5, 0.3]} />
        <meshStandardMaterial color="#b8955e" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.85, 0]} castShadow>
        <sphereGeometry args={[0.7, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#2a6a62" roughness={0.5} />
      </mesh>
      <mesh position={[1.5, 1.7, 1.5]} castShadow>
        <boxGeometry args={[0.4, 0.28, 0.08]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  )
}
