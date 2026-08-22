"use client";

export function ProjectileModel() {
  return (
    <mesh castShadow>
      <sphereGeometry args={[0.14, 8, 8]} />
      <meshStandardMaterial
        color="#fde047"
        emissive="#facc15"
        emissiveIntensity={0.8}
        roughness={0.3}
      />
    </mesh>
  )
}
