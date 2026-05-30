'use client'

import React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { siteConfig } from "@/config/site"
import { Card } from "@/components/ui/card"
import { Spotlight } from "@/components/ui/spotlight"
import { SplineScene } from "@/components/ui/splite"

export function HeroSpline() {
  return (
    <Card className="w-full min-h-[600px] md:h-[550px] relative overflow-hidden bg-slate-50/50 dark:bg-black/[0.96] border border-slate-200 dark:border-zinc-800 flex flex-col md:flex-row shadow-xl">
      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20"
        fill="var(--spotlight-color)"
      />
      
      <div className="flex flex-col md:flex-row h-full w-full">
        {/* Left content */}
        <div className="flex-1 p-6 sm:p-8 md:p-12 relative z-10 flex flex-col justify-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-neutral-900 via-neutral-800 to-neutral-500 dark:from-neutral-50 dark:to-neutral-400">
            Hello, I&apos;m Nabendu
          </h1>
          <p className="mt-4 text-neutral-600 dark:text-neutral-300 max-w-lg text-sm sm:text-base md:text-lg leading-relaxed">
            On this blog, I share my technical learnings from over a decade of experience. You will find insights on HTML, CSS, JavaScript, React, NodeJS, NextJS, and more, covering everything from fundamentals to advanced concepts. 🚀
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Link
              href="/blog"
              className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-fit text-center")}
            >
              View my blog
            </Link>
            <Link
              href={siteConfig.links.github}
              target="_blank"
              rel="noreferrer"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "w-full sm:w-fit text-center"
              )}
            >
              GitHub
            </Link>
          </div>
        </div>

        {/* Right content */}
        <div className="flex-1 relative min-h-[350px] md:min-h-0 w-full h-full">
          <SplineScene 
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="w-full h-full absolute inset-0"
          />
        </div>
      </div>
    </Card>
  )
}
