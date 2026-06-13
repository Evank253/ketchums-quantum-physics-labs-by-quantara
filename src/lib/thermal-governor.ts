// Cold-Compute Thermal Governor
// ------------------------------------------------------------
// Inverts the usual relationship between workload and heat.
// As "problem difficulty" rises, we *shed* ambient GPU/CPU load
// (lower canvas FPS, lower DPR, fewer particles, less blur),
// so the phone runs COOLER on harder problems.
//
// Difficulty is a number in [0, 1] aggregated from registered
// workloads (QED loops, RG steps, sweep size, etc.). Anything in
// the app can publish load via `pushLoad(id, weight)` and release
// it with `popLoad(id)`. The governor exposes derived knobs that
// FX components subscribe to.

type Listener = (s: ThermalState) => void;

export interface ThermalState {
  /** Aggregate load 0..1 (clamped). */
  load: number;
  /** Target FPS for ambient canvases. Falls as load rises. */
  fps: number;
  /** DPR multiplier (0.5..1.5). Lower under load. */
  dprScale: number;
  /** Particle/star density multiplier 0..1. */
  density: number;
  /** Blur multiplier 0..1 (affects backdrop blurs / glow). */
  blur: number;
  /** Animation amplitude 0..1 (slows aurora drift). */
  motion: number;
  /** Human-readable thermal tier. */
  tier: "ambient" | "cool" | "cold" | "cryo";
}

const loads = new Map<string, number>();
const listeners = new Set<Listener>();
let state: ThermalState = compute(0);

function compute(load: number): ThermalState {
  const L = Math.max(0, Math.min(1, load));
  // Inverse curve: more load → less ambient draw.
  const fps = Math.round(30 - 24 * L); // 30 → 6 fps
  const dprScale = 1.5 - 1.0 * L;       // 1.5 → 0.5
  const density = 1 - 0.85 * L;         // 1.0 → 0.15
  const blur = 1 - 0.9 * L;             // 1.0 → 0.10
  const motion = 1 - 0.8 * L;           // 1.0 → 0.20
  const tier: ThermalState["tier"] =
    L < 0.2 ? "ambient" : L < 0.5 ? "cool" : L < 0.8 ? "cold" : "cryo";
  return { load: L, fps, dprScale, density, blur, motion, tier };
}

function recompute() {
  let total = 0;
  for (const w of loads.values()) total += w;
  state = compute(total);
  for (const l of listeners) l(state);
  if (typeof document !== "undefined") {
    document.documentElement.style.setProperty("--thermal-load", state.load.toFixed(3));
    document.documentElement.style.setProperty("--thermal-blur", state.blur.toFixed(3));
    document.documentElement.style.setProperty("--thermal-motion", state.motion.toFixed(3));
  }
}

export function pushLoad(id: string, weight: number) {
  loads.set(id, Math.max(0, weight));
  recompute();
}
export function popLoad(id: string) {
  loads.delete(id);
  recompute();
}
export function getThermal(): ThermalState {
  return state;
}
export function subscribeThermal(fn: Listener): () => void {
  listeners.add(fn);
  fn(state);
  return () => listeners.delete(fn);
}

/** Convenience: scope a workload to an async block. */
export async function withColdCompute<T>(
  id: string,
  weight: number,
  fn: () => Promise<T> | T,
): Promise<T> {
  pushLoad(id, weight);
  try {
    return await fn();
  } finally {
    popLoad(id);
  }
}
