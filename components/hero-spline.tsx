'use client'

import React from "react"
import Link from "next/link"
import { SplineScene } from "@/components/ui/splite"

export function HeroSpline() {
  return (
    <div className="w-full relative flex flex-col md:flex-row items-center justify-between min-h-[480px] md:min-h-[520px] gap-8 md:gap-4 overflow-visible">
      {/* Ambient background glow behind the hero & 3D model */}
      <div 
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 md:top-1/2 right-1/2 md:right-[15%] -translate-y-1/2 translate-x-1/2 w-[300px] sm:w-[450px] md:w-[500px] h-[300px] sm:h-[450px] md:h-[500px] rounded-full bg-blue-500/10 dark:bg-blue-600/20 blur-[90px] -z-10" 
      />

      {/* Left content (Text & CTAs) */}
      <div className="w-full md:w-[54%] z-10 flex flex-col justify-center order-2 md:order-1 text-left">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
          Hello, I&apos;m Nabendu
        </h1>
        <p className="mt-4 sm:mt-5 text-muted-foreground text-sm sm:text-base md:text-lg leading-relaxed max-w-xl">
          I am a Software Engineer and Educator passionate about building immersive web experiences. Explore my collection of high-performance games, technical deep-dives, and comprehensive learning paths built with the latest technologies.
        </p>
        
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5 mt-6 sm:mt-8">
          <Link
            href="/games/escape-the-forest"
            className="h-11 px-5 rounded-lg text-sm sm:text-base font-medium shadow-sm transition-all duration-200 inline-flex items-center justify-center bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 flex-1 sm:flex-initial text-center whitespace-nowrap min-w-[130px]"
          >
            Explore Games
          </Link>
          <Link
            href="/education/physics"
            className="h-11 px-5 rounded-lg text-sm sm:text-base font-medium transition-all duration-200 inline-flex items-center justify-center border border-slate-300 dark:border-slate-800 bg-transparent text-foreground hover:bg-slate-100 dark:hover:bg-slate-800/70 flex-1 sm:flex-initial text-center whitespace-nowrap min-w-[130px]"
          >
            Start Learning
          </Link>
          <Link
            href="/blog"
            className="h-11 px-5 rounded-lg text-sm sm:text-base font-medium transition-all duration-200 inline-flex items-center justify-center border border-slate-300 dark:border-slate-800 bg-transparent text-foreground hover:bg-slate-100 dark:hover:bg-slate-800/70 w-full sm:w-auto text-center whitespace-nowrap"
          >
            Read Blog
          </Link>
        </div>
      </div>

      {/* Right content (3D Spline Robot) */}
      <div className="w-full md:w-[46%] h-[320px] sm:h-[400px] md:h-[480px] relative order-1 md:order-2 flex items-center justify-center overflow-visible">
        <SplineScene 
          scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
          className="w-full h-full absolute inset-0"
        />
      </div>
    </div>
  )
}
