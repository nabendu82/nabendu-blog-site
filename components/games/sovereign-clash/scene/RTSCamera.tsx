"use client";

import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { CAMERA, MAP_HALF } from '../game/constants'
import { useGameStore, view } from '../game/store'
import { isUnit } from '../game/types'

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

export function RTSCamera() {
  const { camera, gl } = useThree()
  const keys = useRef(new Set<string>())
  const dragging = useRef(false)
  const pending = useRef<{ x: number; y: number } | null>(null)
  const last = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      const s = useGameStore.getState()
      if (s.helpOpen) {
        if (key === 'escape' || key === 'enter') {
          e.preventDefault()
          s.closeHelp()
        }
        return
      }
      if (key === 'escape') {
        if (s.commandMode !== 'none') s.setCommandMode('none')
        else if (s.placementKind) s.setPlacement(null)
        else s.select(null)
        return
      }
      if (e.repeat) {
        keys.current.add(key)
        return
      }
      if (key === 'f') {
        const s = useGameStore.getState()
        const hasUnits = s.selectedIds.some((id) => {
          const ent = s.entities[id]
          return ent && (isUnit(ent) && ent.team === 'player')
        })
        if (hasUnits) {
          e.preventDefault()
          s.setCommandMode(s.commandMode === 'attackMove' ? 'none' : 'attackMove')
          return
        }
      }
      if (key === '.' || key === '>') {
        e.preventDefault()
        useGameStore.getState().selectIdleVillager()
        return
      }
      const digit = key >= '1' && key <= '9' ? Number(key) : -1
      if (digit >= 1) {
        e.preventDefault()
        if (e.ctrlKey || e.metaKey) useGameStore.getState().setControlGroup(digit)
        else useGameStore.getState().recallControlGroup(digit)
        return
      }
      keys.current.add(key)
    }
    const up = (e: KeyboardEvent) => {
      keys.current.delete(e.key.toLowerCase())
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  useEffect(() => {
    const el = gl.domElement

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      view.distance = clamp(
        view.distance + e.deltaY * 0.03,
        CAMERA.minDistance,
        CAMERA.maxDistance,
      )
    }

    const onDown = (e: PointerEvent) => {
      if (e.button === 1) {
        dragging.current = true
        pending.current = { x: e.clientX, y: e.clientY }
        last.current = { x: e.clientX, y: e.clientY }
      }
    }
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return
      const dx = e.clientX - last.current.x
      const dy = e.clientY - last.current.y
      last.current = { x: e.clientX, y: e.clientY }
      const pan = view.distance * 0.0022
      const fx = -1
      const fz = -1
      const rx = -1
      const rz = 1
      view.targetX -= (rx * dx + fx * dy) * pan
      view.targetZ -= (rz * dx + fz * dy) * pan
    }
    const onUp = () => {
      dragging.current = false
      pending.current = null
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [gl])

  useFrame((_, dt) => {
    const speed = view.distance * 0.85
    const k = keys.current
    let mx = 0
    let mz = 0
    const fx = -1
    const fz = -1
    const rx = -1
    const rz = 1
    if (k.has('w') || k.has('arrowup')) {
      mx += fx
      mz += fz
    }
    if (k.has('s') || k.has('arrowdown')) {
      mx -= fx
      mz -= fz
    }
    if (k.has('a') || k.has('arrowleft')) {
      mx -= rx
      mz -= rz
    }
    if (k.has('d') || k.has('arrowright')) {
      mx += rx
      mz += rz
    }
    const mag = Math.hypot(mx, mz)
    if (mag > 0) {
      view.targetX += (mx / mag) * speed * dt
      view.targetZ += (mz / mag) * speed * dt
    }

    const limit = MAP_HALF - 4
    view.targetX = clamp(view.targetX, -limit, limit)
    view.targetZ = clamp(view.targetZ, -limit, limit)

    const d = view.distance
    camera.position.set(
      view.targetX + d,
      d * CAMERA.heightFactor,
      view.targetZ + d,
    )
    camera.lookAt(view.targetX, 0, view.targetZ)
  })

  return null
}
