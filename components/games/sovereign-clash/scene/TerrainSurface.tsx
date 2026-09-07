"use client";

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BufferGeometry, Float32BufferAttribute, ShaderMaterial, Color, DataTexture, RGBAFormat, SRGBColorSpace, LinearFilter } from 'three'
import { isWater, riverCenter, CROSSINGS, TERRAINS, type TerrainKind } from '../game/terrain'
import { Block } from './models/Architecture'

export function useTerrainTexture(kind: TerrainKind) {
  const texture = useMemo(() => {
    const size = 256, data = new Uint8Array(size * size * 4)
    const base = new Color(TERRAINS[kind].land).convertLinearToSRGB()
    const shore = new Color(kind === 'oasis' ? '#d9c591' : '#b1ae7c').convertLinearToSRGB()
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const wx = x / size * 160 - 80, wz = 80 - y / size * 160
      const nearWater = [[-2,0],[2,0],[0,-2],[0,2]].some(([dx,dz]) => isWater(kind, wx + dx, wz + dz))
      const c = nearWater ? shore : base
      const noise = 0.94 + (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453 % 1) * 0.025
      const dune = kind === 'oasis' ? Math.sin(wx * 0.18 + Math.sin(wz * 0.08) * 2) * 0.055 : 0
      const i = (y * size + x) * 4
      data[i] = c.r * 255 * (noise + dune); data[i+1] = c.g * 255 * (noise + dune); data[i+2] = c.b * 255 * (noise + dune); data[i+3] = 255
    }
    const t = new DataTexture(data,size,size,RGBAFormat)
    t.colorSpace = SRGBColorSpace; t.magFilter = LinearFilter; t.needsUpdate = true
    return t
  }, [kind])
  useEffect(() => () => texture.dispose(), [texture])
  return texture
}

export function TerrainSurface({ kind }: { kind: TerrainKind }) {
  const material = useRef<ShaderMaterial>(null)
  const geometry = useMemo(() => {
    const vertices: number[] = []
    const ellipse = (cx: number,cz: number,rx: number,rz: number) => {
      for (let i=0;i<192;i++) {
        const a=i*Math.PI/96,b=(i+1)*Math.PI/96
        vertices.push(cx,0.05,cz,cx+Math.cos(b)*rx,0.05,cz+Math.sin(b)*rz,cx+Math.cos(a)*rx,0.05,cz+Math.sin(a)*rz)
      }
    }
    if (kind === 'lake') ellipse(0,0,29,35)
    if (kind === 'oasis') { ellipse(-24,13,16,22); ellipse(24,-13,16,22) }
    if (kind === 'river') for (let z=-80;z<80;z+=0.5) {
      if (CROSSINGS.some(c=>Math.abs(z+0.25-c)<=5)) continue
      const a=riverCenter(z),b=riverCenter(z+0.5)
      vertices.push(a-7,0.05,z,b-7,0.05,z+0.5,a+7,0.05,z,a+7,0.05,z,b-7,0.05,z+0.5,b+7,0.05,z+0.5)
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute(vertices,3))
    g.computeVertexNormals()
    return g
  }, [kind])
  const uniforms = useMemo(() => ({ time: { value: 0 }, tint: { value: new Color(TERRAINS[kind].water) } }), [kind])
  useEffect(() => () => geometry.dispose(), [geometry])
  useFrame(({ clock }) => { if (material.current) material.current.uniforms.time.value = clock.elapsedTime })
  return <group>
    <mesh geometry={geometry} raycast={() => null}>
      <shaderMaterial ref={material} uniforms={uniforms}
        vertexShader="varying vec2 world; void main(){world=position.xz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}"
        fragmentShader={'uniform float time; uniform vec3 tint; varying vec2 world; void main(){float ripple=sin(world.x*1.4+world.y*0.7+time*0.9+sin(world.y*0.31))*sin(world.y*1.7-time*0.65); float gleam=pow(max(0.0,ripple),16.0)*0.055; gl_FragColor=vec4(tint*(0.91+ripple*0.045)+vec3(gleam),1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'} />
    </mesh>
    {kind === 'river' && CROSSINGS.map(z => <group key={z} position={[riverCenter(z), 0, z]}>
      <Block at={[0, 0.025, 0]} size={[20, 0.05, 9.8]} color="#b4aa8c" surface="stone" />
      {[-1,1].map(s => <group key={s}>
        <Block at={[0, 0.12, s * 4.7]} size={[20, 0.24, 0.28]} color="#8a806c" surface="stone" />
        {[-9,9].map(x => <Block key={x} at={[x, 0.45, s * 4.7]} size={[0.55, 0.9, 0.55]} color="#c4b99e" surface="stone" />)}
      </group>)}
    </group>)}
  </group>
}
