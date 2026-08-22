"use client";

export function HerdModel({ scale = 1 }: { scale?: number }) {
  return (
    <group scale={scale}>
      <mesh position={[0, 0.42, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <capsuleGeometry args={[0.16, 0.42, 5, 10]} />
        <meshStandardMaterial color="#8b6239" roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.58, 0.28]} rotation={[0.5, 0, 0]} castShadow>
        <capsuleGeometry args={[0.08, 0.18, 4, 8]} />
        <meshStandardMaterial color="#7a5530" roughness={0.7} />
      </mesh>
      <mesh position={[0.05, 0.7, 0.4]} castShadow>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#8b6239" />
      </mesh>
      {([-0.1, 0.1] as const).map((x) =>
        ([-0.14, 0.16] as const).map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.18, z]} castShadow>
            <capsuleGeometry args={[0.03, 0.16, 4, 6]} />
            <meshStandardMaterial color="#5c4030" />
          </mesh>
        )),
      )}
    </group>
  )
}
