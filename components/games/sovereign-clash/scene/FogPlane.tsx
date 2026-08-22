"use client";

import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { DataTexture, NearestFilter, RGBAFormat, UnsignedByteType } from 'three'
import { FOG_RES, MAP_SIZE } from '../game/constants'
import { fogExplored, fogVisible } from '../game/fog'

export function FogPlane() {
  const tex = useMemo(() => {
    const t = new DataTexture(
      new Uint8Array(FOG_RES * FOG_RES * 4),
      FOG_RES,
      FOG_RES,
      RGBAFormat,
      UnsignedByteType,
    )
    t.magFilter = NearestFilter
    t.minFilter = NearestFilter
    t.flipY = false
    t.needsUpdate = true
    return t
  }, [])
  const data = tex.image.data as Uint8Array

  useFrame(() => {
    for (let iz = 0; iz < FOG_RES; iz += 1) {
      for (let ix = 0; ix < FOG_RES; ix += 1) {
        const src = iz * FOG_RES + ix
        // PlaneGeometry uses (x, -y): UV v=1 at world -Z (iz=0). Without flipY,
        // memory row 0 is v=0, so invert Z when packing.
        const dst = ((FOG_RES - 1 - iz) * FOG_RES + ix) * 4
        if (fogVisible[src]) {
          data[dst] = 0
          data[dst + 1] = 0
          data[dst + 2] = 0
          data[dst + 3] = 0
        } else if (fogExplored[src]) {
          data[dst] = 20
          data[dst + 1] = 36
          data[dst + 2] = 18
          data[dst + 3] = 55
        } else {
          data[dst] = 8
          data[dst + 1] = 16
          data[dst + 2] = 10
          data[dst + 3] = 140
        }
      }
    }
    tex.needsUpdate = true
  })

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]} renderOrder={1}>
      <planeGeometry args={[MAP_SIZE, MAP_SIZE]} />
      <meshBasicMaterial
        map={tex}
        transparent
        depthWrite={false}
        depthTest={false}
        toneMapped={false}
        fog={false}
      />
    </mesh>
  )
}
