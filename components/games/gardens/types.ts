import type { ComponentType } from "react";

export type GardenSceneProps = {
  interactive?: boolean;
};

export type GardenMetadata = {
  tokens: number;
  prompt: string;
  generationTime: string;
  costPer1M: number;
  latencyMs: number;
  outputFps: number;
  aesthetic: number;
};

export type GardenModel = {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  palette: "cool" | "warm";
  metadata: GardenMetadata;
};

export type GardenRegistryEntry = GardenModel & {
  load: () => Promise<{ default: ComponentType<GardenSceneProps> }>;
};
