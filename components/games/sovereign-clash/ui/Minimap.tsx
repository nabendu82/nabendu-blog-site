"use client";

import { useEffect, useRef, type MouseEvent } from 'react'
import { FOG_RES, MAP_SIZE } from '../game/constants'
import { fogExplored, fogVisible } from '../game/fog'
import { useGameStore, view } from '../game/store'
import { isResource, isUnit, type Entity } from '../game/types'
import { isWater, isCrossing, TERRAINS } from '../game/terrain'

const SIZE = 220

function worldToMini(x: number, z: number): { x: number; y: number } {
  return {
    x: ((x + MAP_SIZE / 2) / MAP_SIZE) * SIZE,
    y: ((z + MAP_SIZE / 2) / MAP_SIZE) * SIZE,
  }
}

function colorFor(e: Entity): string {
  if (e.kind === 'projectile' || e.dying) return ''
  if (e.team === 'player') return '#22d3ee'
  if (e.team === 'enemy') return '#f87171'
  if (e.kind === 'goldMine') return '#eab308'
  if (e.kind === 'sacredField') return '#86efac'
  if (e.kind === 'tree') return '#166534'
  if (e.kind === 'berryBush' || e.kind === 'herd') return '#4ade80'
  return '#a3a3a3'
}

export function Minimap() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const terrain = useGameStore(s => s.terrain)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let raf = 0
    const background = document.createElement('canvas')
    background.width = SIZE; background.height = SIZE
    const bg = background.getContext('2d')!
    for (let x = 0; x < SIZE; x++) for (let y = 0; y < SIZE; y++) {
      const wx = x / SIZE * MAP_SIZE - MAP_SIZE / 2, wz = y / SIZE * MAP_SIZE - MAP_SIZE / 2
      bg.fillStyle = isWater(terrain,wx,wz) ? TERRAINS[terrain].water : isCrossing(terrain,wx,wz) ? '#c4b99e' : TERRAINS[terrain].land
      bg.fillRect(x,y,1,1)
    }

    const draw = () => {
      ctx.drawImage(background,0,0)

      const scale = SIZE / FOG_RES
      for (let i = 0; i < FOG_RES * FOG_RES; i += 1) {
        const ix = i % FOG_RES
        const iz = Math.floor(i / FOG_RES)
        if (fogVisible[i]) continue
        ctx.fillStyle = fogExplored[i] ? 'rgba(0,0,0,0.45)' : '#05070a'
        ctx.fillRect(ix * scale, iz * scale, scale + 0.5, scale + 0.5)
      }

      ctx.strokeStyle = '#854d0e'
      ctx.lineWidth = 2
      ctx.strokeRect(1, 1, SIZE - 2, SIZE - 2)

      const { entities } = useGameStore.getState()
      for (const e of Object.values(entities)) {
        const c = colorFor(e)
        if (!c) continue
        const fi = Math.floor(((e.z + MAP_SIZE / 2) / MAP_SIZE) * FOG_RES) * FOG_RES +
          Math.floor(((e.x + MAP_SIZE / 2) / MAP_SIZE) * FOG_RES)
        const vis = fogVisible[fi]
        const exp = fogExplored[fi]
        if (e.team === 'enemy' && isUnit(e) && !vis) continue
        if (e.team === 'enemy' && !exp) continue
        if (e.team === 'neutral' && !exp) continue
        const p = worldToMini(e.x, e.z)
        ctx.fillStyle = c
        const r = isUnit(e) ? 2.4 : isResource(e) ? 1.6 : 3.4
        ctx.beginPath()
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
        ctx.fill()
      }

      const cam = worldToMini(view.targetX, view.targetZ)
      ctx.strokeStyle = '#fde68a'
      ctx.lineWidth = 1
      ctx.strokeRect(cam.x - 14, cam.y - 10, 28, 20)

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [terrain])

  const onClick = (ev: MouseEvent<HTMLCanvasElement>) => {
    const rect = ev.currentTarget.getBoundingClientRect()
    const mx = ((ev.clientX - rect.left) / rect.width) * SIZE
    const my = ((ev.clientY - rect.top) / rect.height) * SIZE
    view.targetX = (mx / SIZE) * MAP_SIZE - MAP_SIZE / 2
    view.targetZ = (my / SIZE) * MAP_SIZE - MAP_SIZE / 2
  }

  return (
    <div className="pointer-events-auto overflow-hidden rounded-sm border border-amber-700/70 bg-black/40 shadow-xl">
      <canvas
        ref={canvasRef}
        width={SIZE}
        height={SIZE}
        onClick={onClick}
        className="block cursor-pointer"
      />
    </div>
  )
}
