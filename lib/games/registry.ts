import type { GardenModel, GardenRegistryEntry } from "@/components/games/gardens/types";

export const GARDEN_MODELS: GardenModel[] = [
  {
    id: "grok-4-5",
    name: "Monsoon Jungle Labyrinth",
    shortName: "Monsoon Jungle",
    tagline: "Dense first-person monsoon jungle escape arena",
    palette: "cool",
    metadata: {
      tokens: 128_400,
      prompt:
        "Build a first-person interactive forest escape at AAA quality: walkable world, intuitive controls, music, interactive areas, 60fps, mobile-friendly.",
      generationTime: "47m 12s",
      costPer1M: 3.2,
      latencyMs: 420,
      outputFps: 58,
      aesthetic: 8.7,
    },
  },
];

export const gardenRegistry: Record<string, GardenRegistryEntry> = {
  "grok-4-5": {
    ...GARDEN_MODELS[0],
    load: () => import("@/components/games/gardens/grok-4-5"),
  },
};

export function getGarden(id: string): GardenRegistryEntry | undefined {
  return gardenRegistry[id];
}

export function listGardens(): GardenRegistryEntry[] {
  return Object.values(gardenRegistry);
}

export const DEFAULT_MODEL = "grok-4-5";
