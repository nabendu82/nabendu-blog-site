"use client";

import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { inputFlags, marquee } from '../game/input'
import { useGameStore } from '../game/store'
import { isUnit } from '../game/types'

const scratch = new Vector3()

export function MarqueeSelect() {
  const { camera, gl } = useThree()

  useEffect(() => {
    const el = gl.domElement
    let down = false
    let sx = 0
    let sy = 0

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      if (useGameStore.getState().placementKind) return
      down = true
      sx = e.clientX
      sy = e.clientY
      marquee.active = false
      marquee.x0 = sx
      marquee.y0 = sy
      marquee.x1 = sx
      marquee.y1 = sy
      inputFlags.skipClick = false
    }

    const onMove = (e: PointerEvent) => {
      if (!down) return
      const dx = e.clientX - sx
      const dy = e.clientY - sy
      if (!marquee.active && Math.hypot(dx, dy) > 8) {
        marquee.active = true
      }
      if (!marquee.active) return
      marquee.x1 = e.clientX
      marquee.y1 = e.clientY
    }

    const onUp = (e: PointerEvent) => {
      if (!down) return
      down = false
      if (!marquee.active) return
      marquee.x1 = e.clientX
      marquee.y1 = e.clientY
      marquee.active = false
      inputFlags.skipClick = true

      const rect = el.getBoundingClientRect()
      const left = Math.min(marquee.x0, marquee.x1)
      const right = Math.max(marquee.x0, marquee.x1)
      const top = Math.min(marquee.y0, marquee.y1)
      const bottom = Math.max(marquee.y0, marquee.y1)
      const s = useGameStore.getState()
      const ids: string[] = []
      for (const ent of Object.values(s.entities)) {
        if (!isUnit(ent) || ent.team !== 'player' || ent.dying) continue
        scratch.set(ent.x, 0.6, ent.z).project(camera)
        const px = (scratch.x * 0.5 + 0.5) * rect.width + rect.left
        const py = (-scratch.y * 0.5 + 0.5) * rect.height + rect.top
        if (px >= left && px <= right && py >= top && py <= bottom) ids.push(ent.id)
      }
      if (ids.length > 0) s.selectMany(ids)
      else if (!e.shiftKey) s.select(null)
      window.setTimeout(() => {
        inputFlags.skipClick = false
      }, 0)
    }

    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [camera, gl])

  return null
}
