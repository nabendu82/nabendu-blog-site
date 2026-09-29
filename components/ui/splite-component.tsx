'use client'

import React, { forwardRef, useRef, useState, useEffect } from 'react'
import { Application } from '@splinetool/runtime'

export interface SplineProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onLoad'> {
  scene: string
  renderOnDemand?: boolean
  wasmPath?: string
  onSplineMouseDown?: (e: any) => void
  onSplineMouseUp?: (e: any) => void
  onSplineMouseHover?: (e: any) => void
  onSplineKeyDown?: (e: any) => void
  onSplineKeyUp?: (e: any) => void
  onSplineStart?: (e: any) => void
  onSplineLookAt?: (e: any) => void
  onSplineFollow?: (e: any) => void
  onSplineScroll?: (e: any) => void
  onLoad?: (app: Application) => void
}

export const Spline = forwardRef<HTMLDivElement, SplineProps>(
  (
    {
      scene,
      style,
      renderOnDemand = true,
      wasmPath,
      onSplineMouseDown,
      onSplineMouseUp,
      onSplineMouseHover,
      onSplineKeyDown,
      onSplineKeyUp,
      onSplineStart,
      onSplineLookAt,
      onSplineFollow,
      onSplineScroll,
      onLoad,
      ...props
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
      setIsLoading(true)
      let splineApp: Application | null = null
      let cancelled = false
      let loaded = false
      let visible = true
      const updatePlayback = () => {
        if (!loaded || !splineApp) return
        if (visible && !document.hidden) splineApp.play()
        else splineApp.stop()
      }
      const observer = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting
        updatePlayback()
      })
      if (canvasRef.current?.parentElement) observer.observe(canvasRef.current.parentElement)
      document.addEventListener('visibilitychange', updatePlayback)

      const events = [
        { name: 'mouseDown', cb: onSplineMouseDown },
        { name: 'mouseUp', cb: onSplineMouseUp },
        { name: 'mouseHover', cb: onSplineMouseHover },
        { name: 'keyDown', cb: onSplineKeyDown },
        { name: 'keyUp', cb: onSplineKeyUp },
        { name: 'start', cb: onSplineStart },
        { name: 'lookAt', cb: onSplineLookAt },
        { name: 'follow', cb: onSplineFollow },
        { name: 'scroll', cb: onSplineScroll },
      ]

      if (canvasRef.current) {
        splineApp = new Application(canvasRef.current, {
          renderOnDemand,
          wasmPath,
        })

        splineApp
          .load(scene)
          .then(() => {
            if (cancelled) return
            loaded = true
            updatePlayback()
            events.forEach((event) => {
              if (event.cb && splineApp) {
                splineApp.addEventListener(event.name as any, event.cb)
              }
            })
            setIsLoading(false)
            if (onLoad) {
              onLoad(splineApp!)
            }
          })
          .catch((err) => {
            console.error('Failed to load Spline scene:', err)
          })
      }

      return () => {
        cancelled = true
        observer.disconnect()
        document.removeEventListener('visibilitychange', updatePlayback)
        if (splineApp) {
          events.forEach((event) => {
            if (event.cb && splineApp) {
              splineApp.removeEventListener(event.name as any, event.cb)
            }
          })
          splineApp.dispose()
        }
      }
    }, [scene, renderOnDemand, wasmPath, onLoad, onSplineMouseDown, onSplineMouseUp, onSplineMouseHover, onSplineKeyDown, onSplineKeyUp, onSplineStart, onSplineLookAt, onSplineFollow, onSplineScroll])

    return (
      <div
        ref={ref}
        style={{ width: '100%', height: '100%', overflow: 'hidden', ...style }}
        {...props}
      >
        <canvas
          ref={canvasRef}
          style={{
            display: isLoading ? 'none' : 'block',
            width: '100%',
            height: '100%',
          }}
        />
      </div>
    )
  }
)

Spline.displayName = 'Spline'
