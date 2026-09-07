"use client";

import { BufferGeometry, Float32BufferAttribute, DoubleSide } from 'three'

export const fronds = new BufferGeometry()
const vertices: number[] = []
for (let i = 0; i < 7; i++) {
  const a = i * Math.PI * 2 / 7
  const transform = (x: number,y: number,z: number) => [Math.cos(a)*x+Math.sin(a)*z,y,-Math.sin(a)*x+Math.cos(a)*z]
  const root=transform(0,0,0), left=transform(-0.24,0.13,0.56), ridge=transform(0,0.25,0.6), right=transform(0.24,0.13,0.56), tip=transform(0,-0.28,1.32)
  vertices.push(...root,...left,...ridge,...root,...ridge,...right,...left,...tip,...ridge,...ridge,...tip,...right)
}
fronds.setAttribute('position',new Float32BufferAttribute(vertices,3))
fronds.computeVertexNormals()

export function TreeModel({ scale = 1, palm = false }: { scale?: number; palm?: boolean }) {
  if (palm) return <group scale={scale}>
    <mesh position={[0, 1.05, 0]} rotation={[0,0,-0.08]} castShadow><cylinderGeometry args={[0.1,0.19,2.1,7]} /><meshStandardMaterial color="#927149" roughness={0.95} /></mesh>
    <mesh position={[0.08,2.08,0]} geometry={fronds} castShadow dispose={null}><meshStandardMaterial color="#6f9145" roughness={0.8} side={DoubleSide} /></mesh>
  </group>
  return (
    <group scale={scale}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.18, 1.1, 6]} />
        <meshStandardMaterial color="#6b3e1a" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.35, 0]} castShadow>
        <coneGeometry args={[0.7, 1.1, 6]} />
        <meshStandardMaterial color="#1f7a32" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.95, 0]} castShadow>
        <coneGeometry args={[0.5, 0.85, 6]} />
        <meshStandardMaterial color="#2d9a42" roughness={0.65} />
      </mesh>
    </group>
  )
}
