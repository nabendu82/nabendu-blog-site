"use client";

export function ChateauModel({ color = '#1d4ed8' }: { color?: string }) {
  const stone = '#e5dec9'
  const stoneDark = '#b8ad96'
  const roofSlate = '#1e3a8a'
  const roofTrim = '#3b82f6'
  const doorWood = '#5a3a22'
  const gold = '#eab308'

  return (
    <group>
      {/* Stone Foundation Terrace */}
      <mesh position={[0, 0.1, 0]} receiveShadow>
        <boxGeometry args={[3.2, 0.2, 2.8]} />
        <meshStandardMaterial color={stoneDark} roughness={0.85} />
      </mesh>

      {/* Main Corps de Logis (Central French Palace Block) */}
      <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 1.4, 1.8]} />
        <meshStandardMaterial color={stone} roughness={0.7} />
      </mesh>

      {/* High-Pitched French Mansard Roof */}
      <mesh position={[0, 2.0, 0]} castShadow>
        <boxGeometry args={[2.3, 0.8, 1.7]} />
        <meshStandardMaterial color={roofSlate} roughness={0.35} metalness={0.25} />
      </mesh>
      {/* Upper Crest Ridge */}
      <mesh position={[0, 2.45, 0]} castShadow>
        <boxGeometry args={[2.1, 0.12, 0.3]} />
        <meshStandardMaterial color={gold} roughness={0.25} metalness={0.8} />
      </mesh>

      {/* Left Flanking Round Tower */}
      <group position={[-1.3, 0, 0]}>
        <mesh position={[0, 1.15, 0]} castShadow>
          <cylinderGeometry args={[0.48, 0.52, 2.1, 14]} />
          <meshStandardMaterial color={stone} roughness={0.65} />
        </mesh>
        {/* Tower Machicolation Rim */}
        <mesh position={[0, 2.22, 0]} castShadow>
          <cylinderGeometry args={[0.56, 0.48, 0.16, 14]} />
          <meshStandardMaterial color={stoneDark} roughness={0.75} />
        </mesh>
        {/* Tower Conical Spires */}
        <mesh position={[0, 2.85, 0]} castShadow>
          <coneGeometry args={[0.58, 1.1, 14]} />
          <meshStandardMaterial color={roofSlate} roughness={0.3} metalness={0.3} />
        </mesh>
        {/* Finial */}
        <mesh position={[0, 3.45, 0]} castShadow>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshStandardMaterial color={gold} roughness={0.2} metalness={0.85} />
        </mesh>
      </group>

      {/* Right Flanking Round Tower */}
      <group position={[1.3, 0, 0]}>
        <mesh position={[0, 1.15, 0]} castShadow>
          <cylinderGeometry args={[0.48, 0.52, 2.1, 14]} />
          <meshStandardMaterial color={stone} roughness={0.65} />
        </mesh>
        {/* Tower Machicolation Rim */}
        <mesh position={[0, 2.22, 0]} castShadow>
          <cylinderGeometry args={[0.56, 0.48, 0.16, 14]} />
          <meshStandardMaterial color={stoneDark} roughness={0.75} />
        </mesh>
        {/* Tower Conical Spires */}
        <mesh position={[0, 2.85, 0]} castShadow>
          <coneGeometry args={[0.58, 1.1, 14]} />
          <meshStandardMaterial color={roofSlate} roughness={0.3} metalness={0.3} />
        </mesh>
        {/* Finial */}
        <mesh position={[0, 3.45, 0]} castShadow>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshStandardMaterial color={gold} roughness={0.2} metalness={0.85} />
        </mesh>
      </group>

      {/* Front Entrance Pavilion */}
      <mesh position={[0, 0.65, 0.95]} castShadow>
        <boxGeometry args={[0.8, 1.1, 0.2]} />
        <meshStandardMaterial color={stoneDark} roughness={0.7} />
      </mesh>
      {/* Arched Entrance Door */}
      <mesh position={[0, 0.5, 1.06]} castShadow>
        <boxGeometry args={[0.45, 0.8, 0.05]} />
        <meshStandardMaterial color={doorWood} roughness={0.8} />
      </mesh>

      {/* Dormer Windows on Mansard Roof */}
      {([-0.6, 0.6] as const).map((x) => (
        <group key={`dormer-${x}`} position={[x, 2.0, 0.88]}>
          <mesh castShadow>
            <boxGeometry args={[0.3, 0.38, 0.22]} />
            <meshStandardMaterial color={stone} roughness={0.65} />
          </mesh>
          <mesh position={[0, 0.26, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
            <boxGeometry args={[0.24, 0.24, 0.24]} />
            <meshStandardMaterial color={roofTrim} roughness={0.4} />
          </mesh>
        </group>
      ))}

      {/* French Royal Blue Banner & Flagpole */}
      <group position={[0, 2.5, 0]}>
        <mesh position={[0, 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 1.0, 8]} />
          <meshStandardMaterial color="#3f3f46" roughness={0.4} metalness={0.8} />
        </mesh>
        <mesh position={[0.22, 0.8, 0]} castShadow>
          <boxGeometry args={[0.42, 0.24, 0.02]} />
          <meshStandardMaterial color={color} roughness={0.4} />
        </mesh>
        <mesh position={[0, 1.02, 0]} castShadow>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color={gold} roughness={0.2} metalness={0.9} />
        </mesh>
      </group>
    </group>
  )
}
