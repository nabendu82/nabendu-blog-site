"use client";

import dynamic from "next/dynamic";
import { Suspense, type ComponentType } from "react";
import type { GardenSceneProps } from "@/components/games/gardens/types";
import { getGarden } from "@/lib/games/registry";

const loaders: Record<string, ComponentType<GardenSceneProps>> = {
  "grok-4-5": dynamic(() => import("@/components/games/gardens/grok-4-5"), {
    ssr: false,
    loading: () => <GardenFallback label="Monsoon Jungle" />,
  }),
};

function GardenFallback({ label }: { label: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-background text-sm text-foreground/60">
      Entering {label} forest…
    </div>
  );
}

type GardenLoaderProps = GardenSceneProps & {
  modelId: string;
  className?: string;
};

export function GardenLoader({
  modelId,
  interactive = true,
  className = "",
}: GardenLoaderProps) {
  const entry = getGarden(modelId);
  const Scene = loaders[modelId];

  if (!entry || !Scene) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center bg-background text-sm text-red-500 ${className}`}
      >
        Unknown arena: {modelId}
      </div>
    );
  }

  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`}>
      <Suspense fallback={<GardenFallback label={entry.name} />}>
        <Scene interactive={interactive} />
      </Suspense>
    </div>
  );
}
