import { useRef, useState } from "react";
import { useColdRaf } from "@/hooks/use-cold-raf";

const STOPS = [
  ["#020314", "#0a0824", "#10182a"],
  ["#1a0e2a", "#3a103a", "#622050"],
  ["#3c1a40", "#7a2c52", "#c14064"],
  ["#5a2244", "#c14464", "#f0844a"],
  ["#86285a", "#ee7a4c", "#f7c46e"],
  ["#c44866", "#f6a45c", "#fde98e"],
];

export function HorizonDawn() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState(0);
  const tRef = useRef(0);

  useColdRaf(ref, (dt) => {
    const cvs = ref.current!; const ctx = cvs.getContext("2d")!;
    const r = cvs.getBoundingClientRect();
    cvs.width = r.width * devicePixelRatio; cvs.height = r.height * devicePixelRatio;
    const W = cvs.width, H = cvs.height;
    const s = STOPS[phase];
    const grd = ctx.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, s[0]); grd.addColorStop(0.55, s[1]); grd.addColorStop(1, s[2]);
    ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);
    tRef.current += dt * 0.6;
    const t = tRef.current;
    const sunY = H * (1 - phase / (STOPS.length - 1) * 0.55) - 30;
    const sunR = 36 * devicePixelRatio + phase * 6 * devicePixelRatio;
    const glow = ctx.createRadialGradient(W / 2, sunY, 0, W / 2, sunY, sunR * 2.5);
    glow.addColorStop(0, "rgba(255,220,180,0.9)");
    glow.addColorStop(1, "rgba(255,220,180,0)");
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(255,235,200,0.95)";
    ctx.beginPath(); ctx.arc(W / 2, sunY, sunR, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.lineWidth = 1.5 * devicePixelRatio;
    ctx.beginPath(); ctx.moveTo(0, H * 0.78); ctx.lineTo(W, H * 0.78); ctx.stroke();
    ctx.strokeStyle = `rgba(255,200,160,${0.15 + phase * 0.1})`;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(0, H * 0.78 + 6 * devicePixelRatio + i * 6 * devicePixelRatio + Math.sin(t + i) * 2);
      ctx.lineTo(W, H * 0.78 + 6 * devicePixelRatio + i * 6 * devicePixelRatio + Math.cos(t + i) * 2);
      ctx.stroke();
    }
  }, { fps: 18, deps: [phase] });

  return (
    <div className="rounded-md border border-white/10 bg-card/40 p-4">
      <div className="mb-2 flex items-baseline justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-chrome">Growth · C</div>
          <h4 className="text-lg font-black tracking-[-0.02em] text-white">Horizon Dawn</h4>
        </div>
        <div className="font-mono text-[10px] text-amber-300">phase {phase + 1}/{STOPS.length}</div>
      </div>
      <canvas ref={ref} className="block h-40 w-full rounded border border-white/5" />
      <div className="mt-2 flex gap-2">
        <button onClick={() => setPhase((p) => Math.min(p + 1, STOPS.length - 1))}
          className="flex-1 rounded border border-amber-400/40 bg-amber-400/10 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-amber-200 hover:bg-amber-400/20">Advance dawn +</button>
        <button onClick={() => setPhase(0)}
          className="rounded border border-white/15 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-white/60 hover:bg-white/5">reset</button>
      </div>
    </div>
  );
}
