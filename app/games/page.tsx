import { Metadata } from "next";
import Link from "next/link";
import {
  Gamepad2,
  Sparkles,
  ArrowRight,
  Compass,
  Swords,
  Volume2,
  Eye,
  Clock,
  Shield,
  Layers,
  Flame,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Interactive 3D Games | Nabendu",
  description:
    "Play high-performance 3D browser games built with Next.js, React Three Fiber, Three.js, procedural terrain, and custom synthesized audio engines.",
};

interface GameCardProps {
  title: string;
  badge: string;
  badgeColor: string;
  emoji: string;
  description: string;
  href: string;
  features: { icon: React.ReactNode; text: string }[];
  tags: string[];
  gradient: string;
  borderHover: string;
  buttonBg: string;
}

const GAMES: GameCardProps[] = [
  {
    title: "Escape the Forest",
    badge: "3D Survival Labyrinth",
    badgeColor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    emoji: "🌲",
    description:
      "Trapped in a dense Indian Monsoon Jungle with towering Sal and Teak canopies, serene lotus ponds, and ancient ruins. Navigate the forest trails and locate the Ancient Stone Gateway before nightfall claims the jungle.",
    href: "/games/escape-the-forest",
    features: [
      {
        icon: <Compass className="h-4 w-4 text-emerald-400" />,
        text: "First-Person Exploration with WASD walk, mouse look & minimap radar",
      },
      {
        icon: <Layers className="h-4 w-4 text-emerald-400" />,
        text: "Dense procedural canopy, sub-canopy layer & serene Lotus Pond",
      },
      {
        icon: <Volume2 className="h-4 w-4 text-emerald-400" />,
        text: "Procedural ambient soundscape: canopy wind, birds, chimes & footsteps",
      },
      {
        icon: <Clock className="h-4 w-4 text-emerald-400" />,
        text: "Survival countdown timer with day-to-night dynamic lighting transitions",
      },
    ],
    tags: ["Three.js", "React Three Fiber", "First-Person 3D", "Procedural Audio", "Fog & Lighting"],
    gradient:
      "from-emerald-950/40 via-slate-900/60 to-slate-950/80 border-emerald-500/20 hover:border-emerald-500/50",
    borderHover: "hover:shadow-emerald-950/40",
    buttonBg: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50",
  },
  {
    title: "Sovereign Clash",
    badge: "3D Real-Time Strategy",
    badgeColor: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    emoji: "⚔️",
    description:
      "Command historical armies inspired by the Indian subcontinent in a full-fledged 3D RTS. Harvest wood & gold, construct town centers and foundries, command Rajput warriors and Sepoy musket lines, and advance through the ages.",
    href: "/games/sovereign-clash",
    features: [
      {
        icon: <Swords className="h-4 w-4 text-amber-400" />,
        text: "Full RTS Engine with marquee multi-selection & tactical unit counters",
      },
      {
        icon: <Shield className="h-4 w-4 text-amber-400" />,
        text: "Base building: Town Centers, Barracks, Foundries, Caravanserais & Mills",
      },
      {
        icon: <Eye className="h-4 w-4 text-amber-400" />,
        text: "Dynamic Fog of War with real-time field-of-view & terrain raycasting",
      },
      {
        icon: <Volume2 className="h-4 w-4 text-amber-400" />,
        text: "Historical ambient sitar drones, cinematic war drums & unit battle SFX",
      },
    ],
    tags: ["3D RTS Engine", "Zustand State", "Fog of War", "Procedural Audio", "Age of Empires Style"],
    gradient:
      "from-amber-950/40 via-slate-900/60 to-slate-950/80 border-amber-500/20 hover:border-amber-500/50",
    borderHover: "hover:shadow-amber-950/40",
    buttonBg: "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/50",
  },
];

export default function GamesHubPage() {
  return (
    <div className="container max-w-6xl py-10 lg:py-16 space-y-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-neutral-900 via-neutral-850 to-neutral-900 dark:from-neutral-950 dark:via-slate-900 dark:to-neutral-950 p-8 md:p-12 text-white shadow-2xl border border-white/10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/20 border border-primary/30 px-3.5 py-1 text-xs font-semibold text-primary-foreground backdrop-blur-md">
            <Gamepad2 className="h-4 w-4 text-primary" />
            <span>Interactive 3D Experiences</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight">
            Games Hub 🎮
          </h1>
          <p className="text-neutral-300 text-base md:text-lg font-normal leading-relaxed">
            High-performance WebGL & Three.js 3D games running directly in your browser. Explore
            lush procedural environments, master tactical RTS mechanics, and experience custom
            synthesized audio engines with zero external downloads.
          </p>
        </div>
      </div>

      {/* Games Showcase Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {GAMES.map((game) => (
          <div
            key={game.title}
            className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-gradient-to-b ${game.gradient} p-6 sm:p-8 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${game.borderHover}`}
          >
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-semibold ${game.badgeColor}`}
                  >
                    <span>{game.badge}</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
                    <span>{game.title}</span>
                    <span className="text-2xl">{game.emoji}</span>
                  </h2>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
                {game.description}
              </p>

              {/* Key Features */}
              <div className="space-y-2.5 rounded-xl border border-white/10 bg-black/30 p-4 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                  Key Mechanics & Highlights
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {game.features.map((f, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 text-xs sm:text-sm text-foreground/90">
                      <span className="shrink-0">{f.icon}</span>
                      <span>{f.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {game.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-foreground/75"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Play Button */}
            <div className="pt-6 mt-6 border-t border-white/10">
              <Link
                href={game.href}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm sm:text-base font-semibold shadow-lg transition-all duration-200 group-hover:gap-3 ${game.buttonBg}`}
              >
                <span>Play {game.title}</span>
                <span className="text-base">{game.emoji}</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Upcoming Games Teaser */}
      <div className="rounded-2xl border border-dashed border-border bg-card/40 p-6 sm:p-8 text-center backdrop-blur-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <h3 className="mt-4 text-lg sm:text-xl font-bold text-foreground">
          More 3D Games in Development
        </h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
          We are actively developing and integrating new interactive experiences, physics-based simulations, and space strategy titles. Stay tuned for upcoming releases!
        </p>
      </div>
    </div>
  );
}
