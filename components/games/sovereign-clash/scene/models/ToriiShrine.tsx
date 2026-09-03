"use client";

export function ToriiShrineModel({ color = '#b91c1c' }: { color?: string }) {
  const vermilion = '#c23b22'
  const darkWood = '#3c2415'
  const stone = '#78716c'
  const gold = '#eab308'

  return (
    <group>
      {/* Stone platform base */}
      <mesh position={[0, 0.1, 0]} receiveShadow>
        <boxGeometry args={[2.2, 0.2, 2.0]} />
        <meshStandardMaterial color={stone} roughness={0.9} />
      </mesh>

      {/* Wooden Shrine Pavilion behind the Torii */}
      <mesh position={[0, 0.55, -0.45]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.8, 1.1]} />
        <meshStandardMaterial color="#d4b996" roughness={0.7} />
      </mesh>

      {/* Pavilion Curved Pagoda Roof */}
      <mesh position={[0, 1.1, -0.45]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[1.35, 0.6, 4]} />
        <meshStandardMaterial color={darkWood} roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.45, -0.45]} castShadow>
        <sphereGeometry args={[0.08, 6, 6]} />
        <meshStandardMaterial color={gold} roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Torii Gate Columns (Vermilion red) */}
      <mesh position={[-0.7, 0.85, 0.45]} rotation={[0, 0, -0.03]} castShadow>
        <cylinderGeometry args={[0.08, 0.09, 1.6, 10]} />
        <meshStandardMaterial color={vermilion} roughness={0.6} />
      </mesh>
      <mesh position={[0.7, 0.85, 0.45]} rotation={[0, 0, 0.03]} castShadow>
        <cylinderGeometry args={[0.08, 0.09, 1.6, 10]} />
        <meshStandardMaterial color={vermilion} roughness={0.6} />
      </mesh>

      {/* Torii Crossbeam (Nuki) */}
      <mesh position={[0, 1.35, 0.45]} castShadow>
        <boxGeometry args={[1.7, 0.09, 0.09]} />
        <meshStandardMaterial color={vermilion} roughness={0.6} />
      </mesh>

      {/* Torii Top Curved Bar (Kasagi) */}
      <mesh position={[0, 1.68, 0.45]} castShadow>
        <boxGeometry args={[1.95, 0.12, 0.14]} />
        <meshStandardMaterial color="#1c1917" roughness={0.4} />
      </mesh>

      {/* Team Ribbon/Banner */}
      <mesh position={[0, 0.95, 0.45]} castShadow>
        <boxGeometry args={[0.22, 0.5, 0.02]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
    </group>
  )
}
