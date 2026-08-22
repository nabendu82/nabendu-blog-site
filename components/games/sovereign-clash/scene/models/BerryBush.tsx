"use client";

export function BerryBushModel({ scale = 1 }: { scale?: number }) {
  return (
    <group scale={scale}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <sphereGeometry args={[0.45, 8, 8]} />
        <meshStandardMaterial color="#2f6b2a" roughness={0.8} />
      </mesh>
      <mesh position={[0.28, 0.4, 0.12]} castShadow>
        <sphereGeometry args={[0.28, 7, 7]} />
        <meshStandardMaterial color="#3a8032" />
      </mesh>
      <mesh position={[-0.22, 0.38, -0.16]} castShadow>
        <sphereGeometry args={[0.25, 7, 7]} />
        <meshStandardMaterial color="#276324" />
      </mesh>
      {[
        [0.15, 0.55, 0.2],
        [-0.18, 0.52, 0.1],
        [0.05, 0.62, -0.18],
        [0.32, 0.48, -0.05],
      ].map(([x, y, z]) => (
        <mesh key={`${x}${z}`} position={[x, y, z]} castShadow>
          <sphereGeometry args={[0.07, 6, 6]} />
          <meshStandardMaterial color="#c026d3" />
        </mesh>
      ))}
    </group>
  )
}
