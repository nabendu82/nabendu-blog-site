"use client";

import { siteConfig } from "@/config/site";
import { Icons } from "./icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

const GAMES = [
  { label: "Escape the Forest", href: "/games/escape-the-forest", emoji: "🌲" },
];

export function MainNav() {
  const pathname = usePathname();
  const [gamesOpen, setGamesOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setGamesOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      <Link href="/" className="mr-6 flex items-center space-x-2">
        <Icons.logo className="h-6 w-6" />
        <span className="font-bold">{siteConfig.name}</span>
      </Link>

      <Link
        href="/blog"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary hidden sm:inline-block",
          pathname === "/blog" ? "text-foreground" : "text-foreground/60"
        )}
      >
        Blog
      </Link>

      {/* Games Dropdown */}
      <div ref={dropdownRef} className="relative hidden sm:block">
        <button
          onClick={() => setGamesOpen((o) => !o)}
          className={cn(
            "flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary",
            pathname.startsWith("/games") ? "text-foreground" : "text-foreground/60"
          )}
          aria-haspopup="true"
          aria-expanded={gamesOpen}
        >
          Games
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform duration-200",
              gamesOpen && "rotate-180"
            )}
          />
        </button>

        {gamesOpen && (
          <div className="absolute left-0 top-full z-50 mt-2 w-52 rounded-xl border border-border bg-background/95 py-1.5 shadow-xl backdrop-blur-md">
            {GAMES.map((game) => (
              <Link
                key={game.href}
                href={game.href}
                onClick={() => setGamesOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-foreground/70 transition-colors hover:bg-primary/10 hover:text-foreground"
              >
                <span className="text-base">{game.emoji}</span>
                {game.label}
              </Link>
            ))}
          </div>
        )}
      </div>

      <Link
        href="/about"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary hidden sm:inline-block",
          pathname === "/about" ? "text-foreground" : "text-foreground/60"
        )}
      >
        About
      </Link>
    </nav>
  );
}
