// Cold-Compute HUD — tiny floating chip showing thermal tier + load.
// The harder the active problem, the lower the ambient FX draw,
// and the cooler the device runs. Pure CSS, no canvases.
import { useEffect, useState } from "react";
import { subscribeThermal, type ThermalState } from "@/lib/thermal-governor";

const TIER_COLOR: Record<ThermalState["tier"], string> = {
  ambient: "text-emerald-300 border-emerald-400/30 bg-emerald-400/10",
  cool:    "text-cyan-300 border-cyan-400/30 bg-cyan-400/10",
  cold:    "text-sky-300 border-sky-400/40 bg-sky-400/10",
  cryo:    "text-indigo-200 border-indigo-300/50 bg-indigo-300/15",
};

export function ColdComputeHud() {
  const [s, setS] = useState<ThermalState | null>(null);
  useEffect(() => subscribeThermal(setS), []);
  if (!s) return null;
  const pct = Math.round(s.load * 100);
  const tempDelta = -Math.round(s.load * 12); // notional °C shed
  return (
    <div className="pointer-events-none fixed bottom-3 right-3 z-40 select-none">
      <div className={`flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] backdrop-blur-md ${TIER_COLOR[s.tier]}`}>
        <span className="size-1.5 animate-pulse-slow rounded-full bg-current" />
        <span>cold-compute · {s.tier}</span>
        <span className="opacity-60">load {pct}%</span>
        <span className="opacity-60">Δt {tempDelta}°C</span>
      </div>
    </div>
  );
}
