import { useEffect, useRef, useState } from "react";

export function AuroraApex() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [bands, setBands] = useState(3);
  const [apex, setApex] = useState(0.45);

  useEffect(() => {
    const cvs = ref.current!; const ctx = cvs.getContext("2d")!;
    let raf = 0; let t = 0;
    const loop = () => {
      const r = cvs.getBoundingClientRect();
      cvs.width = r.width * devicePixelRatio; cvs.height = r.height * devicePixelRatio;
      const W = cvs.width, H = cvs.height;
      ctx.fillStyle = "rgba(2,2,12,1)"; ctx.fillRect(0, 0, W, H);
      t += 0.012;
      for (let b = 0; b < bands; b++) {
        const hue = 140 + b * 35;
        ctx.beginPath();
        for (let x = 0; x <= W; x += 4) {
          const xn = x / W;
          const base = H * (1 - apex) + Math.sin(xn * 6 + t + b) * 12 * devicePixelRatio;
          const peak = Math.exp(-((xn - 0.5) ** 2) * 14) * H * apex;
          const y = base - peak;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
        const grd = ctx.createLinearGradient(0, 0, 0, H);
        grd.addColorStop(0, `hsla(${hue},85%,60%,0.55)`);
        grd.addColorStop(1, `hsla(${hue},85%,30%,0)`);
        ctx.fillStyle = grd; ctx.fill();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [bands, apex]);

  return (
    <div className="rounded-md border border-white/10 bg-card/40 p-4">
      <div className="mb-2 flex items-baseline justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-chrome">Growth · A</div>
          <h4 className="text-lg font-black tracking-[-0.02em] text-white">Aurora Apex</h4>
        </div>
        <div className="font-mono text-[10px] text-emerald-300">{bands} bands · h={apex.toFixed(2)}</div>
      </div>
      <canvas ref={ref} className="block h-40 w-full rounded border border-white/5" />
      <div className="mt-2 flex gap-2">
        <button onClick={() => { setBands((b) => Math.min(b + 1, 9)); setApex((a) => Math.min(a + 0.05, 0.85)); }}
          className="flex-1 rounded border border-emerald-400/40 bg-emerald-400/10 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-emerald-200 hover:bg-emerald-400/20">Grow apex +</button>
        <button onClick={() => { setBands(3); setApex(0.45); }}
          className="rounded border border-white/15 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-white/60 hover:bg-white/5">reset</button>
      </div>
    </div>
  );
}
