import React from "react";
import { Rocket, Smartphone, Box } from "lucide-react";

// Crisp custom icons matching the Stitch mockup
function ReactIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="-11.5 -10.23174 23 20.46348"
      fill="currentColor"
      {...props}
    >
      <circle cx="0" cy="0" r="2.05" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="1" fill="none">
        <ellipse rx="11" ry="4.2" />
        <ellipse rx="11" ry="4.2" transform="rotate(60)" />
        <ellipse rx="11" ry="4.2" transform="rotate(120)" />
      </g>
    </svg>
  );
}

function AngularIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2L2 5.6l1.5 12.8L12 22l8.5-3.6L22 5.6 12 2zm0 2.4l6.8 2.5-1.1 9.6L12 19.3l-5.7-2.8-1.1-9.6L12 4.4zm0 2.8L8.6 15h1.9l.7-1.8h3.6l.7 1.8h1.9L12 7.2zm0 2.8l1.2 3.2h-2.4L12 10z" />
    </svg>
  );
}

interface FocusItem {
  title: string;
  description: string;
  stats: string;
  icon: React.ComponentType<{ className?: string }>;
}

const focusItems: FocusItem[] = [
  {
    title: "React",
    description: "Component Architecture, Hooks, State Management.",
    stats: "12+ Projects.",
    icon: ReactIcon,
  },
  {
    title: "NextJS",
    description: "SSR, SSG, API Routes, Turbopack.",
    stats: "8+ Deployments.",
    icon: Rocket,
  },
  {
    title: "Three.js",
    description: "3D Graphics, WebGL, Animations.",
    stats: "5+ Interactive Demos.",
    icon: Box,
  },
  {
    title: "React Native",
    description: "Cross-platform Mobile Apps.",
    stats: "3+ Published Apps.",
    icon: Smartphone,
  },
  {
    title: "Angular",
    description: "Enterprise Apps, TypeScript, RxJS.",
    stats: "5+ Projects.",
    icon: AngularIcon,
  },
];

export function CurrentFocus() {
  return (
    <section className="w-full mt-10 sm:mt-14 mb-8">
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-6">
        Current Focus &amp; Data
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {focusItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="group relative rounded-xl border border-slate-200/90 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/40 p-4 sm:p-5 backdrop-blur-sm shadow-sm transition-all duration-200 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 flex flex-col justify-between"
            >
              <div>
                {/* Header with Icon and Title */}
                <div className="flex items-center gap-2.5">
                  <div className="text-foreground/90 group-hover:text-primary transition-colors">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-base text-foreground tracking-tight">
                    {item.title}
                  </h3>
                </div>

                {/* Description */}
                <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed mt-2.5">
                  {item.description}
                </p>
              </div>

              {/* Stats / Metric */}
              <div className="mt-4 pt-2">
                <span className="text-xs font-semibold text-foreground/80 dark:text-foreground/90">
                  {item.stats}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
