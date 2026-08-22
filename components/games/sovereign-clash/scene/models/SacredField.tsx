"use client";

export function SacredFieldModel({ color = '#2f6fb8' }: { color?: string }) {
  return (
    <group>
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[2.9, 0.1, 2.9]} />
        <meshStandardMaterial color="#3f6b32" roughness={0.95} />
      </mesh>
      {[-0.8, 0, 0.8].map((z) =>
        [-0.8, 0, 0.8].map((x) => (
          <mesh key={`${x}:${z}`} position={[x, 0.18, z]} castShadow>
            <boxGeometry args={[0.7, 0.16, 0.55]} />
            <meshStandardMaterial color="#6a9a45" roughness={0.75} />
          </mesh>
        )),
      )}
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.28, 0.7, 10]} />
        <meshStandardMaterial color="#d7c09a" roughness={0.65} />
      </mesh>
      <mesh position={[0, 1.05, 0]} castShadow>
        <sphereGeometry args={[0.32, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#2a6a62" roughness={0.45} />
      </mesh>
      <mesh position={[0.7, 0.22, 0.7]} castShadow>
        <boxGeometry args={[0.16, 0.28, 0.16]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  )
}
