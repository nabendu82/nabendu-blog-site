"use client";

export function AgraFortModel({ color = '#2f6fb8' }: { color?: string }) {
  return (
    <group>
      <mesh position={[0, 1.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 2.1, 3.2]} />
        <meshStandardMaterial color="#b85c3a" roughness={0.72} />
      </mesh>
      {([-1.35, 1.35] as const).map((x) =>
        ([-1.35, 1.35] as const).map((z) => (
          <group key={`${x}${z}`} position={[x, 0, z]}>
            <mesh position={[0, 1.35, 0]} castShadow>
              <cylinderGeometry args={[0.42, 0.48, 2.7, 10]} />
              <meshStandardMaterial color="#a24e32" roughness={0.7} />
            </mesh>
            <mesh position={[0, 2.8, 0]} castShadow>
              <cylinderGeometry args={[0.5, 0.42, 0.28, 10]} />
              <meshStandardMaterial color="#8d3f28" />
            </mesh>
          </group>
        )),
      )}
      <mesh position={[0, 2.25, 0]} castShadow>
        <boxGeometry args={[2.2, 0.35, 2.2]} />
        <meshStandardMaterial color="#9a4a30" />
      </mesh>
      <mesh position={[0, 1.15, 1.65]} castShadow>
        <boxGeometry args={[0.7, 1.1, 0.12]} />
        <meshStandardMaterial color="#3f2a14" />
      </mesh>
      <mesh position={[0.4, 2.55, 0]} castShadow>
        <boxGeometry args={[0.5, 0.28, 0.08]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  )
}
