"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";
import { GardenLoader } from "@/components/games/gardens/GardenLoader";
import { getGarden } from "@/lib/games/registry";

type FullscreenSandboxProps = {
  modelId: string | null;
  onClose: () => void;
};

export function FullscreenSandbox({ modelId, onClose }: FullscreenSandboxProps) {
  const model = modelId ? getGarden(modelId) : undefined;

  useEffect(() => {
    if (!modelId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (document.pointerLockElement) return;
      onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [modelId, onClose]);

  return (
    <AnimatePresence>
      {modelId && model ? (
        <motion.div
          className="fixed inset-0 z-[100] bg-background"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div className="absolute inset-0">
            <GardenLoader modelId={modelId} interactive />
          </div>

          <motion.aside
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 24, opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.08 }}
            className="absolute right-4 top-4 z-10 w-[min(100%-2rem,22rem)] rounded-xl border border-border bg-background/80 p-4 shadow-lg backdrop-blur-xl"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-foreground/50">
                  Escape
                </p>
                <h2 className="text-2xl font-bold text-foreground">
                  {model.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Exit fullscreen"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-foreground/50 transition hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-4 text-xs text-foreground/50">
              Click game to look · WASD walk · Shift slow · Esc free cursor
              (again to exit)
            </p>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
