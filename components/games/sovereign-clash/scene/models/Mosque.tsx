"use client";

export function MosqueModel({ color = '#047857' }: { color?: string }) {
  const marble = '#f3f4f6'
  const domeTeal = '#0d9488'
  const gold = '#eab308'
  const archStone = '#9ca3af'

  return (
    <group>
      {/* Foundation Platform */}
      <mesh position={[0, 0.1, 0]} receiveShadow>
        <boxGeometry args={[2.8, 0.2, 2.6]} />
        <meshStandardMaterial color={archStone} roughness={0.8} />
      </mesh>

      {/* Main Prayer Hall (Marble Block) */}
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 1.2, 2.0]} />
        <meshStandardMaterial color={marble} roughness={0.65} />
      </mesh>

      {/* Grand Central Dome */}
      <mesh position={[0, 1.45, 0]} castShadow>
        <sphereGeometry args={[0.92, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshStandardMaterial color={domeTeal} roughness={0.35} metalness={0.2} />
      </mesh>
      {/* Dome Golden Finial */}
      <mesh position={[0, 2.35, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.04, 0.35, 6]} />
        <meshStandardMaterial color={gold} roughness={0.2} metalness={0.85} />
      </mesh>
      <mesh position={[0, 2.55, 0]} castShadow>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color={gold} roughness={0.2} metalness={0.85} />
      </mesh>

      {/* 4 Corner Half Domes */}
      {([-0.75, 0.75] as const).map((x) =>
        ([-0.7, 0.7] as const).map((z) => (
          <mesh key={`${x}${z}`} position={[x, 1.35, z]} castShadow>
            <sphereGeometry args={[0.32, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
            <meshStandardMaterial color={domeTeal} roughness={0.35} metalness={0.2} />
          </mesh>
        )),
      )}

      {/* Slender Ottoman Minaret Tower */}
      <group position={[1.2, 0, 1.0]}>
        <mesh position={[0, 1.4, 0]} castShadow>
          <cylinderGeometry args={[0.16, 0.22, 2.6, 12]} />
          <meshStandardMaterial color={marble} roughness={0.6} />
        </mesh>
        {/* Balcony (Sherefe) */}
        <mesh position={[0, 2.3, 0]} castShadow>
          <cylinderGeometry args={[0.26, 0.2, 0.16, 10]} />
          <meshStandardMaterial color={archStone} roughness={0.5} />
        </mesh>
        {/* Conical Cap */}
        <mesh position={[0, 2.85, 0]} castShadow>
          <coneGeometry args={[0.2, 0.75, 12]} />
          <meshStandardMaterial color={domeTeal} roughness={0.35} />
        </mesh>
        {/* Minaret Crescent Spire */}
        <mesh position={[0, 3.3, 0]} castShadow>
          <sphereGeometry args={[0.05, 6, 6]} />
          <meshStandardMaterial color={gold} roughness={0.2} metalness={0.85} />
        </mesh>
      </group>

      {/* Arched Entrance Portal with Team Color */}
      <mesh position={[0, 0.6, 1.02]} castShadow>
        <boxGeometry args={[0.55, 0.85, 0.06]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.15, 1.03]} castShadow>
        <boxGeometry args={[0.7, 0.15, 0.05]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
    </group>
  )
}
