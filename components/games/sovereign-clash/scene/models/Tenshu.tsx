"use client";

export function TenshuModel({ color = '#b91c1c' }: { color?: string }) {
  const stoneBase = '#57534e'
  const whiteWall = '#fafaf9'
  const darkEaves = '#292524'
  const gold = '#eab308'

  return (
    <group>
      {/* Tenshu-dai: Sloped Stone Fortress Base */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.9, 2.3, 1.0, 4]} />
        <meshStandardMaterial color={stoneBase} roughness={0.9} />
      </mesh>

      {/* Tier 1 Castle Floor */}
      <mesh position={[0, 1.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.0, 0.85, 2.0]} />
        <meshStandardMaterial color={whiteWall} roughness={0.65} />
      </mesh>
      {/* Tier 1 Flared Eaves */}
      <mesh position={[0, 1.85, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[2.2, 0.5, 4]} />
        <meshStandardMaterial color={darkEaves} roughness={0.45} />
      </mesh>

      {/* Tier 2 Castle Floor */}
      <mesh position={[0, 2.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.75, 1.5]} />
        <meshStandardMaterial color={whiteWall} roughness={0.65} />
      </mesh>
      {/* Tier 2 Flared Eaves */}
      <mesh position={[0, 2.75, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[1.7, 0.45, 4]} />
        <meshStandardMaterial color={darkEaves} roughness={0.45} />
      </mesh>

      {/* Tier 3 Top Pavilion */}
      <mesh position={[0, 3.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.05, 0.65, 1.05]} />
        <meshStandardMaterial color={whiteWall} roughness={0.65} />
      </mesh>
      {/* Top Roof Gable & Ridge */}
      <mesh position={[0, 3.6, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[1.25, 0.5, 4]} />
        <meshStandardMaterial color={darkEaves} roughness={0.4} />
      </mesh>

      {/* Shachihoko (Golden Fish/Dragon Horns on Ridge) */}
      <mesh position={[-0.45, 3.85, 0]} rotation={[0, 0, 0.4]} castShadow>
        <coneGeometry args={[0.07, 0.25, 5]} />
        <meshStandardMaterial color={gold} roughness={0.2} metalness={0.85} />
      </mesh>
      <mesh position={[0.45, 3.85, 0]} rotation={[0, 0, -0.4]} castShadow>
        <coneGeometry args={[0.07, 0.25, 5]} />
        <meshStandardMaterial color={gold} roughness={0.2} metalness={0.85} />
      </mesh>

      {/* Team Banners (Sashimono / Crest) */}
      <mesh position={[0, 2.2, 0.77]} castShadow>
        <boxGeometry args={[0.4, 0.7, 0.04]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
    </group>
  )
}
