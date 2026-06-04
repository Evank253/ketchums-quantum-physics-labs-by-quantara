// Performance quality presets for the 3D world.
import { create } from "zustand";

export type QualityTier = "low" | "medium" | "high" | "ultra";

export interface QualitySettings {
  dpr: [number, number];
  shadows: boolean;
  postFx: boolean;
  bloom: boolean;
  contactShadows: boolean;
  environment: boolean;
  sparkles: boolean;
  msaa: boolean;
}

export const PRESETS: Record<QualityTier, QualitySettings> = {
  low:    { dpr: [0.6, 1.0], shadows: false, postFx: false, bloom: false, contactShadows: false, environment: false, sparkles: false, msaa: false },
  medium: { dpr: [0.8, 1.5], shadows: false, postFx: true,  bloom: true,  contactShadows: false, environment: false, sparkles: true,  msaa: false },
  high:   { dpr: [1.0, 2.0], shadows: true,  postFx: true,  bloom: true,  contactShadows: true,  environment: true,  sparkles: true,  msaa: true  },
  ultra:  { dpr: [1.2, 2.5], shadows: true,  postFx: true,  bloom: true,  contactShadows: true,  environment: true,  sparkles: true,  msaa: true  },
};

const KEY = "quantara.quality";

function load(): QualityTier {
  if (typeof window === "undefined") return "high";
  return (localStorage.getItem(KEY) as QualityTier) || "high";
}

interface QState {
  tier: QualityTier;
  settings: QualitySettings;
  setTier: (t: QualityTier) => void;
}

export const useQuality = create<QState>((set) => ({
  tier: load(),
  settings: PRESETS[load()],
  setTier: (t) => {
    if (typeof window !== "undefined") localStorage.setItem(KEY, t);
    set({ tier: t, settings: PRESETS[t] });
  },
}));
