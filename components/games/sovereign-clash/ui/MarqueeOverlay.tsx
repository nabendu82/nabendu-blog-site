"use client";

import { useEffect, useState } from 'react'
import { marquee } from '../game/input'

export function MarqueeOverlay() {
  const [box, setBox] = useState({ show: false, x: 0, y: 0, w: 0, h: 0 })

  useEffect(() => {
    let raf = 0
    const loop = () => {
      if (marquee.active) {
        const x = Math.min(marquee.x0, marquee.x1)
        const y = Math.min(marquee.y0, marquee.y1)
        setBox({
          show: true,
          x,
          y,
          w: Math.abs(marquee.x1 - marquee.x0),
          h: Math.abs(marquee.y1 - marquee.y0),
        })
      } else {
        setBox((b) => (b.show ? { ...b, show: false } : b))
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  if (!box.show) return null

  return (
    <div
      className="pointer-events-none absolute z-30 border border-amber-200/90 bg-amber-200/15"
      style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
    />
  )
}
